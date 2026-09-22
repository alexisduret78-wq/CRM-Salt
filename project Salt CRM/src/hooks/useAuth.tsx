import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, serveurJoignable } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  /** Vrai quand on arrive depuis un lien « mot de passe oublié » : il faut
   *  alors saisir un nouveau mot de passe AVANT d'entrer dans l'app. */
  recovery: boolean
  /** État du serveur Supabase, testé au chargement. `null` = test en cours. */
  serveur: 'ok' | 'injoignable' | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  /** Envoie le lien de réinitialisation à l'adresse indiquée. */
  demanderReset: (email: string) => Promise<{ error: string | null }>
  /** Fixe le nouveau mot de passe une fois le lien ouvert. */
  changerMotDePasse: (motDePasse: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Traduit les messages de Supabase Auth, qui arrivent en anglais et sans
 * nuance. La distinction qui compte vraiment est la dernière : un « Failed to
 * fetch » n'est PAS un mauvais mot de passe, c'est le serveur qu'on n'atteint
 * pas — inutile de s'acharner sur le clavier dans ce cas.
 */
function messageFr(brut: string): string {
  const m = brut.toLowerCase()
  if (m.includes('invalid login credentials')) {
    return 'Adresse email ou mot de passe incorrect.'
  }
  if (m.includes('email not confirmed')) {
    return "Cette adresse n'a jamais été confirmée : ouvre le lien reçu par email à l'inscription."
  }
  if (m.includes('user not found')) {
    return "Aucun compte avec cette adresse."
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) {
    return 'Trop de tentatives — patiente quelques minutes avant de réessayer.'
  }
  if (m.includes('password should be') || m.includes('at least')) {
    return 'Mot de passe trop court : 6 caractères minimum.'
  }
  if (
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    m.includes('fetch failed')
  ) {
    return "Serveur injoignable : ce n'est pas le mot de passe. La base Supabase du CRM ne répond pas (projet en pause, supprimé, ou adresse changée)."
  }
  return brut
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Détecté dès le premier rendu : supabase-js consomme le hash de l'URL très
  // vite, donc on lit le marqueur avant qu'il ne disparaisse.
  const [recovery, setRecovery] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  )
  const [serveur, setServeur] = useState<'ok' | 'injoignable' | null>(null)

  useEffect(() => {
    let vivant = true

    // `getSession()` ne se contente pas de lire le stockage local : si le jeton
    // qui s'y trouve est périmé, supabase-js part le rafraîchir par le réseau.
    // Serveur injoignable = on attendrait le timeout du navigateur devant un
    // écran « Chargement… ». On borne donc l'attente : au pire on affiche
    // l'écran de connexion, ce qui est de toute façon la bonne destination.
    const secours = setTimeout(() => {
      if (vivant) setLoading(false)
    }, 2500)

    supabase.auth.getSession().then(({ data }) => {
      if (!vivant) return
      clearTimeout(secours)
      setSession(data.session)
      setLoading(false)
    })

    // Diagnostic affiché sur l'écran de connexion, en parallèle.
    serveurJoignable().then((ok) => {
      if (vivant) setServeur(ok ? 'ok' : 'injoignable')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
    })

    return () => {
      vivant = false
      clearTimeout(secours)
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? messageFr(error.message) : null }
  }

  async function demanderReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error: error ? messageFr(error.message) : null }
  }

  async function changerMotDePasse(motDePasse: string) {
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    if (!error) setRecovery(false)
    return { error: error ? messageFr(error.message) : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        recovery,
        serveur,
        signIn,
        demanderReset,
        changerMotDePasse,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
