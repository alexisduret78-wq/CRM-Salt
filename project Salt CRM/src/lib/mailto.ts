// =====================================================
// Email de prise de contact — Salt Business
// =====================================================
// Ton : professionnel, direct, concis. Usages de Suisse romande
// (« Avec mes meilleures salutations », pas « Cordialement »).
//
// Trois partis pris :
//   1. Aucun superlatif ni promesse chiffrée. On propose une comparaison,
//      on ne promet pas d'économie qu'on ne peut pas prouver par mail.
//   2. On demande si l'interlocuteur est le bon plutôt qu'un rendez-vous.
//      Un « non, voyez avec X » est un gain : c'est une recommandation
//      interne, et le mail suivant n'est plus un mail à froid.
//   3. L'effectif n'est cité que si le chiffre est fiable — se tromper
//      dessus décrédibilise tout le reste du message.

import type { EntrepriseAvecContacts } from './database.types'

type Contact = EntrepriseAvecContacts['contacts'][number]

export const SIGNATURE = `Alexis Duret
Salt Business
alexis.duret@salt.ch`

export function objetEmail(e: EntrepriseAvecContacts): string {
  return `Flotte mobile ${e.nom} — proposition de rendez-vous`
}

/**
 * Un effectif rond (50, 100, 200…) vient presque toujours d'une tranche
 * d'import, pas d'un comptage réel. On ne cite le chiffre que s'il porte la
 * marque d'un vrai décompte — mieux vaut ne rien dire que dire faux.
 */
function effectifFiable(n: number | null): boolean {
  if (n == null || n <= 0) return false
  return n % 10 !== 0
}

export function corpsEmail(e: EntrepriseAvecContacts, contact: Contact | null): string {
  const nom = [contact?.prenom, contact?.nom].filter(Boolean).join(' ').trim()
  const salutation = nom ? `Bonjour ${nom},` : 'Madame, Monsieur,'

  const accroche = effectifFiable(e.taille_employes)
    ? `Avec vos ${e.taille_employes} collaborateurs, une comparaison avec le contrat actuel de ${e.nom} vaut probablement le détour.`
    : `Une comparaison avec le contrat actuel de ${e.nom} vaut probablement le détour.`

  return `${salutation}

Conseiller Business chez Salt, je vous écris car nous venons de lancer une nouvelle offre mobile pour les entreprises. ${accroche}

Êtes-vous la bonne personne pour en parler, ou dois-je m'adresser à quelqu'un d'autre ?

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
