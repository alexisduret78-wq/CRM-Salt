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

/** URL effective du projet — sert au diagnostic affiché sur l'écran de connexion. */
export const supabaseUrl = safeUrl

/**
 * Le serveur d'auth répond-il ? N'importe quelle réponse HTTP suffit, même un
 * 401 : ce qu'on teste, c'est qu'il y a quelqu'un au bout du fil. Seule une
 * erreur réseau — DNS mort, projet supprimé — fait échouer le `fetch`.
 */
export async function serveurJoignable(timeoutMs = 6000): Promise<boolean> {
  if (!supabaseConfigured) return false
  const stop = new AbortController()
  const t = setTimeout(() => stop.abort(), timeoutMs)
  try {
    await fetch(`${safeUrl}/auth/v1/health`, { signal: stop.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
