import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contact, Entreprise, EntrepriseAvecContacts } from '@/lib/database.types'

// PostgREST plafonne chaque requête à 1000 lignes. Le dataset dépasse ce seuil
// (≈1800 fichiers + découvertes) → on pagine pour TOUT récupérer.
const PAGE = 1000

async function fetchAll<T>(table: 'entreprises' | 'contacts'): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < PAGE) break
  }
  return rows
}

async function fetchEntreprisesAvecContacts(): Promise<EntrepriseAvecContacts[]> {
  const [entreprises, contacts] = await Promise.all([
    fetchAll<Entreprise>('entreprises'),
    fetchAll<Contact>('contacts'),
  ])

  const contactsParEntreprise = new Map<string, Contact[]>()
  for (const c of contacts) {
    const list = contactsParEntreprise.get(c.entreprise_id) ?? []
    list.push(c)
    contactsParEntreprise.set(c.entreprise_id, list)
  }

  return entreprises.map((e) => ({
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

type PatchEntreprise = Partial<
  Pick<
    Entreprise,
    | 'pamela_valide'
    | 'date_dernier_contact'
    | 'date_prochaine_relance'
    | 'couleur'
    | 'priorite'
    | 'notes_consolidees'
  >
>

// Mutation générique : met à jour une entreprise avec MAJ optimiste (UI instantanée).
export function useUpdateEntreprise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchEntreprise }) => {
      const { error } = await supabase.from('entreprises').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['entreprises'] })
      const prev = qc.getQueryData<EntrepriseAvecContacts[]>(['entreprises'])
      qc.setQueryData<EntrepriseAvecContacts[]>(['entreprises'], (old) =>
        (old ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['entreprises'], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['entreprises'] })
    },
  })
}

// Raccourci historique : bascule le statut Pamela (validé / non validé).
export function useTogglePamela() {
  const update = useUpdateEntreprise()
  return {
    ...update,
    mutate: ({ id, valide }: { id: string; valide: boolean }) =>
      update.mutate({ id, patch: { pamela_valide: valide } }),
  }
}
