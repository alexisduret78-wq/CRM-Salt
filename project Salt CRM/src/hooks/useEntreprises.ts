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

type PatchEntreprise = Partial<
  Pick<
    Entreprise,
    'pamela_valide' | 'date_dernier_contact' | 'couleur' | 'priorite' | 'notes_consolidees'
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
