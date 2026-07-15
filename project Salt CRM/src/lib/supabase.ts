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

export const supabaseConfigured = Boolean(url && anonKey)

// IMPORTANT : createClient() lève une exception si l'URL est vide ou invalide.
// Sans variables d'env, on utilise des valeurs placeholder pour NE PAS crasher
// l'app (écran blanc). L'UI affiche alors un message « Supabase non configuré ».
const safeUrl = supabaseConfigured ? (url as string) : 'https://placeholder.supabase.co'
const safeKey = supabaseConfigured ? (anonKey as string) : 'placeholder-anon-key'

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
