// This file provides backward compatibility for function calls
// All functions should be migrated to use Supabase Edge Functions

import { supabase } from '@/lib/supabase'

/**
 * Wrapper function to call Supabase Edge Functions
 * Mimics base44.functions API
 */
export const invokeFunction = async (functionName, params = {}) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params
  })
  
  if (error) throw error
  return data
}

// Export function wrappers for backward compatibility
// These will need to be implemented as Supabase Edge Functions
export const generateReport = (params) => invokeFunction('generateReport', params)
export const calculateStrategies = (params) => invokeFunction('calculateStrategies', params)
export const activateStrategy = (params) => invokeFunction('activateStrategy', params)
export const generateMonthlyReports = (params) => invokeFunction('generateMonthlyReports', params)
export const sendSupportEmail = (params) => invokeFunction('sendSupportEmail', params)
export const generateMonthlyReport = (params) => invokeFunction('generateMonthlyReport', params)
export const checkAchievements = (params) => invokeFunction('checkAchievements', params)
export const categorizeTransaction = (params) => invokeFunction('categorizeTransaction', params)
export const supabaseSync = (params) => invokeFunction('supabaseSync', params)
export const supabaseQuery = (params) => invokeFunction('supabaseQuery', params)
export const generateNotifications = (params) => invokeFunction('generateNotifications', params)

// For backward compatibility with base44.functions pattern
export const functions = {
  generateReport,
  calculateStrategies,
  activateStrategy,
  generateMonthlyReports,
  sendSupportEmail,
  generateMonthlyReport,
  checkAchievements,
  categorizeTransaction,
  supabaseSync,
  supabaseQuery,
  generateNotifications,
  api: invokeFunction, // Generic API caller
}
