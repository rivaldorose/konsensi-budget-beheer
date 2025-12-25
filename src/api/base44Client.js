// DEPRECATED: This file is kept for backward compatibility during migration
// All code should be migrated to use Supabase directly
// See MIGRATION_GUIDE.md for details

import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/services/supabaseService'
import { functions } from './functions'

// Backward compatibility wrapper for base44
// This allows existing code to work while migration is in progress
export const base44 = {
  // Auth wrapper
  auth: {
    isAuthenticated: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    },
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
    },
    redirectToLogin: (redirectUrl) => {
      console.warn('base44.auth.redirectToLogin is deprecated. Use window.location.href instead.')
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`
    }
  },
  
  // Entities - use the backward-compatible wrappers
  entities: {
    // These are imported from entities.js which provides backward compatibility
    // Import entities directly: import { Income, Expense } from '@/api/entities'
  },
  
  // Functions wrapper
  functions: functions,
  
  // Integrations wrapper
  integrations: {
    Core: {
      UploadFile: async ({ file, bucket = 'attachments', path }) => {
        const fileName = path || `${Date.now()}-${file.name}`
        return await supabaseService.uploadFile(bucket, fileName, file)
      },
      InvokeLLM: async (params) => {
        // This should be migrated to a Supabase Edge Function
        console.warn('base44.integrations.Core.InvokeLLM is deprecated. Migrate to Supabase Edge Function.')
        throw new Error('InvokeLLM needs to be migrated to a Supabase Edge Function')
      },
      SendEmail: async (params) => {
        console.warn('base44.integrations.Core.SendEmail is deprecated. Migrate to Supabase Edge Function.')
        throw new Error('SendEmail needs to be migrated to a Supabase Edge Function')
      },
      GenerateImage: async (params) => {
        console.warn('base44.integrations.Core.GenerateImage is deprecated. Migrate to Supabase Edge Function.')
        throw new Error('GenerateImage needs to be migrated to a Supabase Edge Function')
      },
      ExtractDataFromUploadedFile: async (params) => {
        console.warn('base44.integrations.Core.ExtractDataFromUploadedFile is deprecated. Migrate to Supabase Edge Function.')
        throw new Error('ExtractDataFromUploadedFile needs to be migrated to a Supabase Edge Function')
      },
      CreateFileSignedUrl: async (params) => {
        const { bucket, path, expiresIn = 3600 } = params
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn)
        if (error) throw error
        return { signed_url: data.signedUrl }
      },
      UploadPrivateFile: async ({ file, bucket = 'private', path }) => {
        const fileName = path || `${Date.now()}-${file.name}`
        return await supabaseService.uploadFile(bucket, fileName, file)
      }
    }
  }
}

// Log deprecation warning
if (typeof window !== 'undefined') {
  console.warn(
    '%c⚠️ DEPRECATED: base44Client.js',
    'color: orange; font-weight: bold; font-size: 14px;',
    '\nThis file is kept for backward compatibility only.\n',
    'Please migrate to Supabase. See MIGRATION_GUIDE.md for details.'
  )
}
