// Types de la base Supabase (Salt CRM).
// Reflètent le schéma `supabase/schema.sql`. Mis à jour manuellement ;
// régénérables via `supabase gen types` si besoin.

export type Typologie = 'prospect_mobile' | 'prospect_blue' | 'client_existant'
export type Couleur = 'blanc' | 'jaune' | 'rouge' | 'vert'

export interface Entreprise {
  id: string
  user_id: string | null
  nom: string
  business_uid: string | null
  secteur: string | null
  ville: string | null
  code_postal: string | null
  adresse: string | null
  canton: string | null
  taille_employes: number | null
  site_web: string | null
  linkedin_url: string | null
  typologie: Typologie
  couleur: Couleur
  statut_pamela_origine: string | null
  pamela_valide: boolean | null
  assignation: string | null
  score_salt: number | null
  priorite: string | null
  pourquoi_cible: string | null
  echeance_contrat: string | null
  produits_actuels: string[] | null
  produits_a_vendre: string[] | null
  date_dernier_contact: string | null
  date_prochaine_relance: string | null
  notes_consolidees: string | null
  source_fichier: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  user_id: string | null
  entreprise_id: string
  prenom: string | null
  nom: string | null
  fonction: string | null
  email: string | null
  telephone: string | null
  linkedin: string | null
  est_decideur: boolean | null
  source_fichier: string | null
  created_at: string
  updated_at: string
}

// Entreprise + ses contacts (jointure côté app)
export interface EntrepriseAvecContacts extends Entreprise {
  contacts: Contact[]
}
