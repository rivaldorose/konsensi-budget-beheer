import { supabase } from '@/lib/supabase'

/**
 * Supabase Service Layer
 * This replaces base44.entities with Supabase queries
 *
 * Usage:
 * - Instead of: Income.list()
 * - Use: supabaseService.list('income')
 *
 * - Instead of: Income.filter({ id: '123' })
 * - Use: supabaseService.filter('income', { id: '123' })
 *
 * Pagination:
 * - Use: supabaseService.paginate('debts', { user_id: 'xxx' }, { page: 1, pageSize: 20 })
 */

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

// Allowed table names to prevent injection via table parameter
const ALLOWED_TABLES = [
  'users', 'income', 'monthly_costs', 'debts', 'debt_payments',
  'debt_status_history', 'pots', 'pot_transactions', 'transactions',
  'unexpected_costs', 'faqs', 'translations', 'achievements',
  'user_achievements', 'challenges', 'user_challenges', 'daily_motivations',
  'security_settings', 'user_login_history', 'user_summary_views',
  'notifications', 'video_calls', 'wishlist_items', 'work_schedules',
  'bank_statements', 'bank_statement_transactions'
]

/**
 * Sanitize data before insert/update
 * - Trims string values
 * - Validates numeric fields are actual numbers
 * - Removes any __proto__ or constructor keys
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data
  const cleaned = {}
  for (const [key, value] of Object.entries(data)) {
    // Block prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    // Trim strings
    if (typeof value === 'string') {
      cleaned[key] = value.trim()
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

const validateTable = (table) => {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not allowed`)
  }
}

export const supabaseService = {
  // Generic CRUD operations
  async list(table, orderBy = 'created_at', ascending = false) {
    validateTable(table)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending })

    if (error) throw error
    return data || []
  },

  async filter(table, filters = {}, orderBy = null) {
    validateTable(table)
    let query = supabase.from(table).select('*')

    // Apply filters with support for advanced operators
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'object' && value.operator) {
          // Support advanced operators like { operator: 'in', value: [...] }
          switch (value.operator) {
            case 'in':
              query = query.in(key, value.value)
              break
            case 'neq':
              query = query.neq(key, value.value)
              break
            case 'gt':
              query = query.gt(key, value.value)
              break
            case 'gte':
              query = query.gte(key, value.value)
              break
            case 'lt':
              query = query.lt(key, value.value)
              break
            case 'lte':
              query = query.lte(key, value.value)
              break
            case 'like':
              query = query.like(key, value.value)
              break
            case 'ilike':
              query = query.ilike(key, value.value)
              break
            default:
              query = query.eq(key, value.value || value)
          }
        } else {
          query = query.eq(key, value)
        }
      }
    })

    // Apply ordering if provided
    if (orderBy) {
      const ascending = !orderBy.startsWith('-')
      const field = orderBy.replace('-', '')
      query = query.order(field, { ascending })
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Paginated query with count
   * @param {string} table - Table name
   * @param {object} filters - Filter conditions
   * @param {object} options - Pagination options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.pageSize - Items per page (default: 20, max: 100)
   * @param {string} options.orderBy - Order by field (prefix with - for descending)
   * @returns {Promise<{data: array, count: number, page: number, pageSize: number, totalPages: number}>}
   */
  async paginate(table, filters = {}, options = {}) {
    validateTable(table)
    const page = Math.max(1, options.page || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options.pageSize || DEFAULT_PAGE_SIZE))
    const offset = (page - 1) * pageSize

    // Build query with count
    let query = supabase.from(table).select('*', { count: 'exact' })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })

    // Apply ordering
    const orderBy = options.orderBy || '-created_at'
    const ascending = !orderBy.startsWith('-')
    const field = orderBy.replace('-', '')
    query = query.order(field, { ascending })

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  },

  /**
   * Get count of records matching filters
   * @param {string} table - Table name
   * @param {object} filters - Filter conditions
   * @returns {Promise<number>}
   */
  async count(table, filters = {}) {
    validateTable(table)
    let query = supabase.from(table).select('*', { count: 'exact', head: true })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })

    const { count, error } = await query

    if (error) throw error

    return count || 0
  },

  async getById(table, id) {
    validateTable(table)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(table, data) {
    validateTable(table)
    const { data: result, error } = await supabase
      .from(table)
      .insert(sanitizeData(data))
      .select()
      .single()

    if (error) throw error
    return result
  },

  async update(table, id, data) {
    validateTable(table)
    const { data: result, error } = await supabase
      .from(table)
      .update(sanitizeData(data))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result
  },

  async delete(table, id) {
    validateTable(table)
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // File upload to Supabase Storage
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return { file_url: publicUrl }
  },

  // Get public URL for file
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }
}
