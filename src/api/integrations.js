import { supabaseService } from '@/services/supabaseService'
import { supabase } from '@/lib/supabase'

// Integrations wrapper for backward compatibility
export const Core = {
  UploadFile: async ({ file, bucket = 'attachments', path }) => {
    const fileName = path || `${Date.now()}-${file.name}`
    return await supabaseService.uploadFile(bucket, fileName, file)
  },
  
  InvokeLLM: async (params) => {
    console.warn('Core.InvokeLLM is deprecated. Migrate to Supabase Edge Function.')
    const { data, error } = await supabase.functions.invoke('invoke-llm', {
      body: params
    })
    if (error) throw error
    return data
  },
  
  SendEmail: async (params) => {
    console.warn('Core.SendEmail is deprecated. Migrate to Supabase Edge Function.')
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params
    })
    if (error) throw error
    return data
  },
  
  GenerateImage: async (params) => {
    console.warn('Core.GenerateImage is deprecated. Migrate to Supabase Edge Function.')
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: params
    })
    if (error) throw error
    return data
  },
  
  ExtractDataFromUploadedFile: async (params) => {
    console.warn('Core.ExtractDataFromUploadedFile is deprecated. Migrate to Supabase Edge Function.')
    const { data, error } = await supabase.functions.invoke('extract-data', {
      body: params
    })
    if (error) throw error
    return data
  },
  
  CreateFileSignedUrl: async ({ bucket, path, expiresIn = 3600 }) => {
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

// Export individual functions for backward compatibility
export const InvokeLLM = Core.InvokeLLM
export const SendEmail = Core.SendEmail
export const UploadFile = Core.UploadFile
export const GenerateImage = Core.GenerateImage
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile
export const CreateFileSignedUrl = Core.CreateFileSignedUrl
export const UploadPrivateFile = Core.UploadPrivateFile
