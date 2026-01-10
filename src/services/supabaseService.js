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
 */

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

  async filter(table, filters = {}) {
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

    const { data, error } = await query

    if (error) throw error
    return data || []
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
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) throw error
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
