import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  
  // Show user-friendly error in production
  if (import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F8F8F8; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 500px; text-align: center;">
          <h1 style="color: #3D6456; font-size: 1.5rem; margin-bottom: 1rem;">⚠️ Configuratie Fout</h1>
          <p style="color: #666; margin-bottom: 1.5rem;">
            De Supabase environment variables ontbreken. Neem contact op met de beheerder.
          </p>
          <p style="color: #999; font-size: 0.875rem;">
            VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}<br>
            VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}
          </p>
        </div>
      </div>
    `
  }
  
  // Still throw in development for better debugging
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

