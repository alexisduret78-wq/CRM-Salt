// =====================================================
// Email de prise de rendez-vous — Salt Business
// =====================================================
// Ton : professionnel, direct, concis. Usages de Suisse romande
// (« Avec mes meilleures salutations », pas « Cordialement »).
// On n'annonce aucun chiffre d'économie : on propose une comparaison.

import type { EntrepriseAvecContacts } from './database.types'

type Contact = EntrepriseAvecContacts['contacts'][number]

export const SIGNATURE = `Alexis Duret
Salt Business — Genève & La Côte
alexis.duret@salt.ch`

export function objetEmail(e: EntrepriseAvecContacts): string {
  return `Flotte mobile ${e.nom} — proposition de rendez-vous`
}

export function corpsEmail(e: EntrepriseAvecContacts, contact: Contact | null): string {
  const nom = [contact?.prenom, contact?.nom].filter(Boolean).join(' ').trim()
  const salutation = nom ? `Bonjour ${nom},` : 'Madame, Monsieur,'

  const taille =
    e.taille_employes != null
      ? `Avec vos ${e.taille_employes} collaborateurs, la comparaison avec votre contrat actuel mérite un coup d'œil.`
      : `La comparaison avec votre contrat actuel mérite un coup d'œil.`

  const lieu = e.ville ? `dans vos locaux à ${e.ville}` : 'dans vos locaux'

  return `${salutation}

Alexis Duret, conseiller Business chez Salt à Genève.

Salt vient de lancer sa nouvelle offre mobile pour les entreprises romandes. ${taille}

Auriez-vous 20 minutes ces prochaines semaines ? Je me déplace volontiers ${lieu}.

Avec mes meilleures salutations,

${SIGNATURE}`
}

/**
 * Construit le lien `mailto:` qui ouvre le client mail de l'utilisateur avec
 * l'objet et le corps déjà remplis. Retourne null si le contact n'a pas
 * d'adresse — inutile de proposer un bouton qui n'enverrait nulle part.
 */
export function lienMailto(e: EntrepriseAvecContacts, contact: Contact | null): string | null {
  const to = contact?.email?.trim()
  if (!to) return null
  const params = new URLSearchParams({
    subject: objetEmail(e),
    body: corpsEmail(e, contact),
  })
  // URLSearchParams encode l'espace en « + », que les clients mail
  // interprètent littéralement dans un corps de message.
  return `mailto:${encodeURIComponent(to)}?${params.toString().replace(/\+/g, '%20')}`
}
