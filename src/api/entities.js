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
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'entities.js:73',message:'User.me() called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      // First try getSession (faster, uses local storage)
      const { data: { session: sessionData } } = await supabase.auth.getSession()
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'entities.js:78',message:'getSession result',data:{hasSession:!!sessionData,hasUser:!!sessionData?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      // If we have a session, use it directly
      if (sessionData?.user) {
        const user = sessionData.user
        
        // Try to get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        // If profile doesn't exist, create it
        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            })
            .select()
            .single()
          
          if (createError) {
            console.error('Error creating user profile:', createError)
            // Return user without profile if creation fails
            return { ...user, email: user.email, id: user.id }
          }
          
          return { ...user, ...newProfile }
        }
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          // Return user without profile if fetch fails
          return { ...user, email: user.email, id: user.id }
        }
        
        return { ...user, ...profile, email: user.email || profile?.email }
      }
      
      // Fallback to getUser (slower, validates with server)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'entities.js:120',message:'getUser result',data:{hasUser:!!user,hasError:!!authError,errorMessage:authError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      if (authError || !user) {
        console.log('No authenticated user:', authError?.message || 'User not found')
        return null
      }
      
      // Try to get user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating user profile:', createError)
          // Return user without profile if creation fails
          return { ...user, email: user.email, id: user.id }
        }
        
        return { ...user, ...newProfile }
      }
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        // Return user without profile if fetch fails
        return { ...user, email: user.email, id: user.id }
      }
      
      return { ...user, ...profile, email: user.email || profile?.email }
    } catch (error) {
      console.error('Error in User.me():', error)
      return null
    }
  },
  updateMe: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return await supabaseService.update('users', user.id, data)
  },
  updateStreak: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user profile with streak data
      const { data: profile } = await supabase
        .from('users')
        .select('login_streak, last_login_date')
        .eq('id', user.id)
        .single()

      // Get today's date as a string (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0]

      let loginStreak = profile?.login_streak || 0
      const lastLoginDate = profile?.last_login_date

      // If this is the first time or no last login date
      if (!lastLoginDate) {
        loginStreak = 1
      }
      // If already logged in today, return current streak
      else if (lastLoginDate === today) {
        return loginStreak
      }
      // Calculate days difference
      else {
        const lastDate = new Date(lastLoginDate)
        const currentDate = new Date(today)
        const daysDifference = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24))

        // If logged in yesterday, increment streak
        if (daysDifference === 1) {
          loginStreak += 1
        }
        // If more than 1 day gap, reset streak to 1
        else if (daysDifference > 1) {
          loginStreak = 1
        }
      }

      // Cap at 365 days
      loginStreak = Math.max(0, Math.min(loginStreak, 365))

      // Update database
      await supabaseService.update('users', user.id, {
        login_streak: loginStreak,
        last_login_date: today
      })

      return loginStreak
    } catch (error) {
      console.error('Error updating streak:', error)
      return 0
    }
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  }
}

import { supabase } from '@/lib/supabase'
