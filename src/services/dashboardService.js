import { Income, Debt, DebtPayment, MonthlyCost, Pot, Transaction } from "@/api/entities";

export const dashboardService = {
  async getDashboardData(userId) {
    try {
      const userFilter = { user_id: userId };

      // Load all data in parallel
      const [incomes, monthlyCosts, debts, payments, pots, transactions] = await Promise.all([
        Income.filter(userFilter).catch(() => []),
        MonthlyCost.filter(userFilter).catch(() => []),
        Debt.filter(userFilter).catch(() => []),
        DebtPayment.filter(userFilter).catch(() => []),
        Pot.filter(userFilter).catch(() => []),
        Transaction.filter(userFilter).catch(() => []),
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Calculate totals
      const totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      const totalExpenses = monthlyCosts
        .filter((c) => c.is_active)
        .reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

      const paidThisMonth = payments
        .filter((p) => {
          const pDate = new Date(p.payment_date || p.created_at);
          return pDate >= monthStart && pDate <= monthEnd;
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const remainingDebt = debts
        .filter((d) => d.status !== "afbetaald")
        .reduce((sum, d) => sum + (Number(d.amount) || 0) - (Number(d.amount_paid) || 0), 0);

      const totalPaidAllTime = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalOriginalDebt = debts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const progressPercentage = totalOriginalDebt > 0 ? (totalPaidAllTime / totalOriginalDebt) * 100 : 0;

      return {
        totalIncome,
        totalExpenses,
        totalPaidThisMonth,
        remainingDebt,
        totalPaidAllTime,
        progressPercentage,
        incomes,
        monthlyCosts,
        debts,
        payments,
        pots,
        transactions,
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      throw error;
    }
  },

  async getDebtJourneyData(userId, period = "month") {
    try {
      const payments = await DebtPayment.filter({ user_id: userId }).catch(() => []);

      const now = new Date();
      const months = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const monthPayments = payments.filter((p) => {
          const pDate = new Date(p.payment_date || p.created_at);
          return pDate >= monthDate && pDate <= monthEnd;
        });

        const monthTotal = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        months.push({
          month: new Intl.DateTimeFormat("nl-NL", { month: "short" }).format(monthDate),
          amount: monthTotal,
        });
      }

      return months;
    } catch (error) {
      console.error("Error getting debt journey data:", error);
      return [];
    }
  },

  async getFinancialBreakdown(userId) {
    try {
      const userFilter = { user_id: userId };

      const [incomes, monthlyCosts, debts, pots] = await Promise.all([
        Income.filter(userFilter).catch(() => []),
        MonthlyCost.filter(userFilter).catch(() => []),
        Debt.filter(userFilter).catch(() => []),
        Pot.filter(userFilter).catch(() => []),
      ]);

      // Calculate fixed income
      const fixedIncome = incomes
        .filter((inc) => inc.type === "vast" || inc.is_fixed)
        .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

      // Calculate fixed costs
      const fixedCosts = monthlyCosts
        .filter((c) => c.is_active)
        .reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

      // Calculate active payment plans
      const activeDebts = debts.filter((d) => d.status === "betalingsregeling" && d.is_active);
      const paymentPlans = activeDebts.reduce((sum, debt) => {
        const monthlyPayment = Number(debt.monthly_payment) || 0;
        return sum + monthlyPayment;
      }, 0);

      // Calculate pots budget
      const potsBudget = pots.reduce((sum, pot) => sum + (Number(pot.monthly_budget) || 0), 0);

      return {
        totalIncome: fixedIncome,
        fixedCosts,
        paymentPlans,
        pots: potsBudget,
      };
    } catch (error) {
      console.error("Error getting financial breakdown:", error);
      return {
        totalIncome: 0,
        fixedCosts: 0,
        paymentPlans: 0,
        pots: 0,
      };
    }
  },

  async getUpcomingPayments(userId) {
    try {
      const userFilter = { user_id: userId };

      const [monthlyCosts, debts] = await Promise.all([
        MonthlyCost.filter(userFilter).catch(() => []),
        Debt.filter(userFilter).catch(() => []),
      ]);

      const now = new Date();
      const upcoming = [];

      // Get next monthly cost
      const activeCosts = monthlyCosts.filter((c) => c.is_active);
      for (const cost of activeCosts) {
        if (cost.payment_date) {
          const paymentDay = Number(cost.payment_date);
          let nextDate = new Date(now.getFullYear(), now.getMonth(), paymentDay);

          if (nextDate < now) {
            nextDate = new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
          }

          upcoming.push({
            type: "fixed_cost",
            name: cost.name,
            amount: Number(cost.amount) || 0,
            date: nextDate.toISOString(),
          });
        }
      }

      // Get next debt payment
      const activeDebts = debts.filter((d) => d.status === "betalingsregeling" && d.is_active);
      for (const debt of activeDebts) {
        if (debt.payment_plan_date) {
          const paymentDate = new Date(debt.payment_plan_date);
          if (paymentDate >= now) {
            upcoming.push({
              type: "debt",
              name: debt.creditor || "Schuld",
              amount: Number(debt.monthly_payment) || 0,
              date: paymentDate.toISOString(),
            });
          }
        }
      }

      // Sort by date
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

      return upcoming.slice(0, 3);
    } catch (error) {
      console.error("Error getting upcoming payments:", error);
      return [];
    }
  },
};

