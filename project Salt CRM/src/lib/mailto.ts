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

// Un lien `mailto:` ne transporte que du texte brut : les logos et les badges
// « connect » / « Best Wi-Fi Performance » ne peuvent pas y passer. Si ton
// client mail ajoute déjà sa propre signature (avec les images), passe cette
// constante à `null` pour éviter de l'avoir en double.
export const SIGNATURE: string | null = `Alexis Duret
Account Manager

+41 78 787 46 68
alexis.duret@salt.ch
Salt Mobile SA, Avenue de Malley 2, CH-1008 Prilly, Switzerland`

export function objetEmail(e: EntrepriseAvecContacts): string {
  return `Flotte mobile ${e.nom} — proposition de rendez-vous`
}

/**
 * Beaucoup d'effectifs viennent de tranches d'import, pas d'un comptage réel —
 * l'audit a par exemple trouvé Somatra à 60 dans la base pour une vingtaine de
 * personnes en vrai. On ne cite donc jamais le chiffre exact : on l'ancre sur
 * le plancher de sa tranche, avec un « plus de » qui reste vrai même si
 * l'estimation est un peu haute.
 */
function effectifApprox(n: number | null): string | null {
  if (n == null || n < 20) return null // trop petit pour que la formule sonne juste
  if (n < 50) return "plus d'une vingtaine de collaborateurs"
  if (n < 100) return "plus d'une cinquantaine de collaborateurs"
  if (n < 250) return "plus d'une centaine de collaborateurs"
  return 'plusieurs centaines de collaborateurs'
}

/**
 * « de Serbeco » mais « d'Amstein + Walthert ».
 * Le h est volontairement exclu : on ne sait pas s'il est muet ou aspiré
 * (« d'Helvetia » mais « de Hammel »), et « de » n'est jamais fautif devant
 * un nom propre.
 */
function de(nom: string): string {
  const p = nom
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .charAt(0)
  return 'aeiouy'.includes(p) ? `d'${nom}` : `de ${nom}`
}

export function corpsEmail(e: EntrepriseAvecContacts, contact: Contact | null): string {
  const nom = [contact?.prenom, contact?.nom].filter(Boolean).join(' ').trim()
  const salutation = nom ? `Bonjour ${nom},` : 'Madame, Monsieur,'

  const taille = effectifApprox(e.taille_employes)
  const accroche = taille
    ? `Avec ${taille}, une comparaison avec le contrat actuel ${de(e.nom)} vaut probablement le détour.`
    : `Une comparaison avec le contrat actuel ${de(e.nom)} vaut probablement le détour.`

  return `${salutation}

Account Manager chez Salt Business, je vous écris car nous venons de lancer une nouvelle offre mobile pour les entreprises. ${accroche}

Êtes-vous la bonne personne pour en parler, ou dois-je m'adresser à quelqu'un d'autre ?

Avec mes meilleures salutations,
${SIGNATURE ? `\n${SIGNATURE}` : ''}`
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
