import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contact, Entreprise, EntrepriseAvecContacts } from '@/lib/database.types'

async function fetchEntreprisesAvecContacts(): Promise<EntrepriseAvecContacts[]> {
  // On récupère tout (dataset ~1800 lignes) et on joint en mémoire.
  const [entRes, contactRes] = await Promise.all([
    supabase.from('entreprises').select('*'),
    supabase.from('contacts').select('*'),
  ])

  if (entRes.error) throw entRes.error
  if (contactRes.error) throw contactRes.error

  const contactsParEntreprise = new Map<string, Contact[]>()
  for (const c of (contactRes.data ?? []) as Contact[]) {
    const list = contactsParEntreprise.get(c.entreprise_id) ?? []
    list.push(c)
    contactsParEntreprise.set(c.entreprise_id, list)
  }

  return ((entRes.data ?? []) as Entreprise[]).map((e) => ({
    ...e,
    contacts: contactsParEntreprise.get(e.id) ?? [],
  }))
}

export function useEntreprises() {
  return useQuery({
    queryKey: ['entreprises'],
    queryFn: fetchEntreprisesAvecContacts,
  })
}

// Bascule le statut Pamela (validé / non validé) d'une entreprise.
export function useTogglePamela() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, valide }: { id: string; valide: boolean }) => {
      const { error } = await supabase
        .from('entreprises')
        .update({ pamela_valide: valide })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entreprises'] })
    },
  })
}
