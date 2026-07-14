import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Message explicite en dev/déploiement si les variables manquent.
  console.error(
    'Variables Supabase manquantes : définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ' +
      '(dans .env.local en local, ou dans les variables d’environnement Vercel/Netlify).'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const supabaseConfigured = Boolean(url && anonKey)
