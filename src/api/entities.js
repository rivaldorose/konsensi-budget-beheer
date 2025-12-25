// This file provides backward compatibility for entity imports
// All entities should be migrated to use supabaseService directly

import { supabaseService } from '@/services/supabaseService'

// Entity wrappers that mimic base44.entities API
const createEntityWrapper = (tableName) => ({
  list: (orderBy = 'created_at', ascending = false) => 
    supabaseService.list(tableName, orderBy.replace('-', ''), !orderBy.startsWith('-')),
  
  filter: (filters) => supabaseService.filter(tableName, filters),
  
  get: (id) => supabaseService.getById(tableName, id),
  
  create: (data) => supabaseService.create(tableName, data),
  
  update: (id, data) => supabaseService.update(tableName, id, data),
  
  delete: (id) => supabaseService.delete(tableName, id),
})

// Export entity wrappers
export const Income = createEntityWrapper('income')
export const Expense = createEntityWrapper('expenses')
export const Debt = createEntityWrapper('debts')
export const Goal = createEntityWrapper('goals')
export const DebtPayment = createEntityWrapper('debt_payments')
export const MonthlyCost = createEntityWrapper('monthly_costs')
export const PaymentPlan = createEntityWrapper('payment_plans')
export const WindfallEvent = createEntityWrapper('windfall_events')
export const Transaction = createEntityWrapper('transactions')
export const MonthlyReport = createEntityWrapper('monthly_reports')
export const VTLBCalculation = createEntityWrapper('vtbl_calculations')
export const PaymentAgreement = createEntityWrapper('payment_agreements')
export const PrivacySettings = createEntityWrapper('privacy_settings')
export const NotificationPreferences = createEntityWrapper('notification_preferences')
export const SecuritySettings = createEntityWrapper('security_settings')
export const PaymentSettings = createEntityWrapper('payment_settings')
export const HelpRequest = createEntityWrapper('help_requests')
export const FAQ = createEntityWrapper('faqs')
export const Notification = createEntityWrapper('notifications')
export const Creditor = createEntityWrapper('creditors')
export const Translation = createEntityWrapper('translations')
export const BankConnection = createEntityWrapper('bank_connections')
export const BankTransaction = createEntityWrapper('bank_transactions')
export const Pot = createEntityWrapper('pots')
export const MonthlyCheck = createEntityWrapper('monthly_checks')
export const PaymentStatus = createEntityWrapper('payment_statuses')
export const Loan = createEntityWrapper('loans')
export const ArrangementProgress = createEntityWrapper('arrangement_progress')
export const VtblSetting = createEntityWrapper('vtbl_settings')
export const PaymentPlanProposal = createEntityWrapper('payment_plan_proposals')
export const AdempauzeAction = createEntityWrapper('adempauze_actions')
export const DebtCorrespondence = createEntityWrapper('debt_correspondences')
export const DebtStatusHistory = createEntityWrapper('debt_status_history')
export const PaymentDocument = createEntityWrapper('payment_documents')
export const DebtStrategy = createEntityWrapper('debt_strategies')
export const DebtPayoffSchedule = createEntityWrapper('debt_payoff_schedules')
export const SupportMessage = createEntityWrapper('support_messages')
export const ResearchQuestion = createEntityWrapper('research_questions')
export const UserResponse = createEntityWrapper('user_responses')
export const Achievement = createEntityWrapper('achievements')
export const UserProgress = createEntityWrapper('user_progress')
export const Challenge = createEntityWrapper('challenges')
export const WorkDay = createEntityWrapper('work_days')
export const WishlistItem = createEntityWrapper('wishlist_items')
export const Payslip = createEntityWrapper('payslips')
export const VariableIncomeEntry = createEntityWrapper('variable_income_entries')
export const NotificationRule = createEntityWrapper('notification_rules')

// Auth wrapper - use supabase.auth directly
export const User = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    return { ...user, ...profile }
  },
  updateMe: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return await supabaseService.update('users', user.id, data)
  }
}

import { supabase } from '@/lib/supabase'
