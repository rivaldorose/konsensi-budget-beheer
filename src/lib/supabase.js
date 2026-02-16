import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Show user-friendly error in production (using safe DOM methods, no innerHTML)
  if (import.meta.env.PROD) {
    const root = document.getElementById('root')
    if (root) {
      while (root.firstChild) root.removeChild(root.firstChild)
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F8F8F8;font-family:system-ui,-apple-system,sans-serif;'
      const card = document.createElement('div')
      card.style.cssText = 'background:white;padding:2rem;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:500px;text-align:center;'
      const h1 = document.createElement('h1')
      h1.style.cssText = 'color:#3D6456;font-size:1.5rem;margin-bottom:1rem;'
      h1.textContent = 'Configuratie Fout'
      const p = document.createElement('p')
      p.style.cssText = 'color:#666;margin-bottom:1.5rem;'
      p.textContent = 'De applicatie kon niet worden geladen. Neem contact op met de beheerder.'
      card.appendChild(h1)
      card.appendChild(p)
      wrapper.appendChild(card)
      root.appendChild(wrapper)
    }
  }

  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

