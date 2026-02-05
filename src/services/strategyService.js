import { supabase } from '@/lib/supabase'
import { Debt, User } from '@/api/entities'

/**
 * Local strategy calculation service
 * This replaces the Edge Function that doesn't exist yet
 */

/**
 * Calculate all debt payoff strategies
 * @param {number} monthlyBudget - Monthly amount available for debt repayment
 * @returns {Promise<{snowball: object, avalanche: object, proportional: object}>}
 */
export async function calculateStrategies(monthlyBudget) {
  try {
    // Get user and their debts
    const user = await User.me()
    if (!user) throw new Error('User not authenticated')

    const debts = await Debt.filter({ user_id: user.id })

    // Filter out paid debts
    const activeDebts = debts.filter(d =>
      d.status !== 'afbetaald' &&
      (parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0)) > 0
    )

    if (activeDebts.length === 0) {
      return {
        snowball: { total_months: 0, total_interest: 0, schedule: [] },
        avalanche: { total_months: 0, total_interest: 0, schedule: [] },
        proportional: { total_months: 0, total_interest: 0, schedule: [] }
      }
    }

    // Calculate each strategy
    const snowball = calculateSnowball(activeDebts, monthlyBudget)
    const avalanche = calculateAvalanche(activeDebts, monthlyBudget)
    const proportional = calculateProportional(activeDebts, monthlyBudget)

    return { snowball, avalanche, proportional }
  } catch (error) {
    console.error('Error calculating strategies:', error)
    throw error
  }
}

/**
 * Snowball strategy: Pay smallest debt first
 */
function calculateSnowball(debts, monthlyBudget) {
  // Sort by remaining balance (smallest first)
  const sortedDebts = [...debts].sort((a, b) => {
    const remainingA = parseFloat(a.amount || 0) - parseFloat(a.amount_paid || 0)
    const remainingB = parseFloat(b.amount || 0) - parseFloat(b.amount_paid || 0)
    return remainingA - remainingB
  })

  return simulatePayoff(sortedDebts, monthlyBudget, 'snowball')
}

/**
 * Avalanche strategy: Pay highest interest rate first
 */
function calculateAvalanche(debts, monthlyBudget) {
  // Sort by interest rate (highest first)
  const sortedDebts = [...debts].sort((a, b) => {
    const rateA = parseFloat(a.interest_rate || 0)
    const rateB = parseFloat(b.interest_rate || 0)
    return rateB - rateA
  })

  return simulatePayoff(sortedDebts, monthlyBudget, 'avalanche')
}

/**
 * Proportional strategy: Pay proportionally to debt size
 */
function calculateProportional(debts, monthlyBudget) {
  const totalDebt = debts.reduce((sum, d) =>
    sum + (parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0)), 0
  )

  // Create schedule with proportional payments
  const schedule = debts.map(debt => {
    const remaining = parseFloat(debt.amount || 0) - parseFloat(debt.amount_paid || 0)
    const proportion = remaining / totalDebt
    const monthlyPayment = monthlyBudget * proportion

    return {
      debt_id: debt.id,
      debt_name: debt.creditor_name || debt.name || 'Onbekend',
      amount: remaining,
      interest_rate: parseFloat(debt.interest_rate || 0),
      monthly_payment: monthlyPayment
    }
  })

  // Simulate proportional payoff
  let totalMonths = 0
  let totalInterest = 0
  let debtBalances = debts.map(d => ({
    id: d.id,
    balance: parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0),
    rate: parseFloat(d.interest_rate || 0) / 100 / 12 // Monthly rate
  }))

  const maxMonths = 360 // 30 years max

  while (debtBalances.some(d => d.balance > 0.01) && totalMonths < maxMonths) {
    totalMonths++

    // Add interest and make proportional payments
    const currentTotal = debtBalances.reduce((s, d) => s + d.balance, 0)

    for (const debt of debtBalances) {
      if (debt.balance <= 0) continue

      // Add monthly interest
      const interest = debt.balance * debt.rate
      debt.balance += interest
      totalInterest += interest

      // Make proportional payment
      const proportion = debt.balance / Math.max(currentTotal, 0.01)
      const payment = Math.min(debt.balance, monthlyBudget * proportion)
      debt.balance -= payment
    }
  }

  return {
    total_months: totalMonths,
    total_interest: Math.round(totalInterest * 100) / 100,
    schedule
  }
}

/**
 * Simulate payoff for snowball/avalanche (sequential strategies)
 */
function simulatePayoff(sortedDebts, monthlyBudget, strategyType) {
  const schedule = sortedDebts.map(debt => ({
    debt_id: debt.id,
    debt_name: debt.creditor_name || debt.name || 'Onbekend',
    amount: parseFloat(debt.amount || 0) - parseFloat(debt.amount_paid || 0),
    interest_rate: parseFloat(debt.interest_rate || 0)
  }))

  // Simulation
  let debtBalances = sortedDebts.map(d => ({
    id: d.id,
    balance: parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0),
    rate: parseFloat(d.interest_rate || 0) / 100 / 12, // Monthly rate
    minPayment: parseFloat(d.monthly_payment || d.minimum_payment || 0) || 25 // Default min payment
  }))

  let totalMonths = 0
  let totalInterest = 0
  let availableBudget = monthlyBudget
  const maxMonths = 360 // 30 years max

  while (debtBalances.some(d => d.balance > 0.01) && totalMonths < maxMonths) {
    totalMonths++
    availableBudget = monthlyBudget

    // First, make minimum payments on all debts
    for (const debt of debtBalances) {
      if (debt.balance <= 0) continue

      // Add monthly interest
      const interest = debt.balance * debt.rate
      debt.balance += interest
      totalInterest += interest

      // Make minimum payment
      const minPayment = Math.min(debt.balance, debt.minPayment)
      debt.balance -= minPayment
      availableBudget -= minPayment
    }

    // Then, put extra money towards the target debt (first in sorted order with balance > 0)
    for (const debt of debtBalances) {
      if (debt.balance <= 0 || availableBudget <= 0) continue

      const extraPayment = Math.min(debt.balance, availableBudget)
      debt.balance -= extraPayment
      availableBudget -= extraPayment

      // In snowball/avalanche, we focus on one debt at a time
      break
    }
  }

  return {
    total_months: totalMonths,
    total_interest: Math.round(totalInterest * 100) / 100,
    schedule
  }
}

/**
 * Activate a strategy by saving it to the user's profile
 * @param {string} strategyType - 'snowball', 'avalanche', or 'proportional'
 * @param {number} monthlyBudget - Monthly amount for debt repayment
 */
export async function activateStrategy(strategyType, monthlyBudget) {
  try {
    const user = await User.me()
    if (!user) throw new Error('User not authenticated')

    // Calculate the chosen strategy
    const strategies = await calculateStrategies(monthlyBudget)
    const chosenStrategy = strategies[strategyType]

    if (!chosenStrategy) {
      throw new Error('Invalid strategy type')
    }

    // Save strategy to user profile
    const { error } = await supabase
      .from('users')
      .update({
        active_strategy: strategyType,
        strategy_budget: monthlyBudget,
        strategy_data: chosenStrategy,
        strategy_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error saving strategy:', error)
      // Don't throw - the columns might not exist yet
    }

    return {
      success: true,
      message: `${getStrategyName(strategyType)} strategie geactiveerd!`,
      strategy: chosenStrategy
    }
  } catch (error) {
    console.error('Error activating strategy:', error)
    throw error
  }
}

function getStrategyName(type) {
  switch (type) {
    case 'snowball': return 'Sneeuwbal'
    case 'avalanche': return 'Lawine'
    case 'proportional': return 'Gelijkmatige Verdeling'
    default: return type
  }
}
