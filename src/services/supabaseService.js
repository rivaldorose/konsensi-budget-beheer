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

export const supabaseService = {
  // Generic CRUD operations
  async list(table, orderBy = 'created_at', ascending = false) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending })

    if (error) throw error
    return data || []
  },

  async filter(table, filters = {}, orderBy = null) {
    console.log(`[SupabaseService] Filtering table: ${table}`, filters, orderBy)

    let query = supabase.from(table).select('*')

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

    // Apply ordering if provided
    if (orderBy) {
      const ascending = !orderBy.startsWith('-')
      const field = orderBy.replace('-', '')
      query = query.order(field, { ascending })
    }

    const { data, error } = await query

    if (error) {
      console.error(`[SupabaseService] Error filtering ${table}:`, error)
      throw error
    }

    console.log(`[SupabaseService] Success! Got ${data?.length || 0} rows from ${table}`)
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
    const page = Math.max(1, options.page || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options.pageSize || DEFAULT_PAGE_SIZE))
    const offset = (page - 1) * pageSize

    console.log(`[SupabaseService] Paginating table: ${table}`, { filters, page, pageSize })

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

    if (error) {
      console.error(`[SupabaseService] Error paginating ${table}:`, error)
      throw error
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    console.log(`[SupabaseService] Paginated ${table}: page ${page}/${totalPages}, ${count} total items`)

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

    if (error) {
      console.error(`[SupabaseService] Error counting ${table}:`, error)
      throw error
    }

    return count || 0
  },

  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(table, data) {
    console.log(`[SupabaseService] Creating in table: ${table}`, data)

    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error(`[SupabaseService] Error creating in ${table}:`, error)
      console.error('Error details:', { message: error.message, hint: error.hint, details: error.details, code: error.code })
      throw error
    }

    console.log(`[SupabaseService] Created successfully in ${table}:`, result)
    return result
  },

  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result
  },

  async delete(table, id) {
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
