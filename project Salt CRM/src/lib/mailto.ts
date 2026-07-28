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
//   3. L'effectif est cité en ordre de grandeur, jamais au chiffre près —
//      beaucoup viennent de tranches d'import, pas d'un comptage réel.

import type { EntrepriseAvecContacts } from './database.types'

type Contact = EntrepriseAvecContacts['contacts'][number]

// `null` par défaut : le bouton « Écrire à X » ouvre le client SANS corps, donc
// la vraie signature Salt — avec les badges et le logo — s'insère normalement,
// et le texte se colle par-dessus. Y remettre la version texte ci-dessous
// seulement si le client n'ajoute rien, pour ne pas partir sans signature.
export const SIGNATURE: string | null = null

export const SIGNATURE_TEXTE = `Alexis Duret
Account Manager

+41 78 787 46 68
alexis.duret@salt.ch
Salt Mobile SA, Avenue de Malley 2, CH-1008 Prilly, Switzerland`

export function objetEmail(e: EntrepriseAvecContacts): string {
  return `Salt Business - ${e.nom}`
}

/**
 * « Bonjour Monsieur Cresson, » quand la civilité est connue.
 * Sinon prénom + nom : une civilité fausse coûte plus cher qu'une formule
 * un peu neutre, et on ne devine pas le genre à partir d'un prénom.
 */
function salutation(contact: Contact | null): string {
  const nom = contact?.nom?.trim()
  const civ = contact?.civilite?.trim()
  if (civ && nom) return `Bonjour ${civ} ${nom},`
  const complet = [contact?.prenom, contact?.nom].filter(Boolean).join(' ').trim()
  return complet ? `Bonjour ${complet},` : 'Madame, Monsieur,'
}

/**
 * Beaucoup d'effectifs viennent de tranches d'import, pas d'un comptage réel —
 * l'audit a par exemple trouvé Somatra à 60 dans la base pour une vingtaine de
 * personnes en vrai. On ancre donc sur le plancher de la tranche, avec un
 * « plus de » qui reste vrai même si l'estimation est un peu haute.
 */
function effectifApprox(n: number | null): string | null {
  if (n == null || n < 20) return null // trop petit pour que la formule sonne juste
  if (n < 50) return "plus d'une vingtaine de collaborateurs"
  if (n < 100) return "plus d'une cinquantaine de collaborateurs"
  if (n < 250) return "plus d'une centaine de collaborateurs"
  return 'plusieurs centaines de collaborateurs'
}

/** « de Serbeco » mais « d'Amstein + Walthert ». Le h est exclu : on ne sait
 *  pas s'il est muet ou aspiré, et « de » n'est jamais fautif devant un nom
 *  propre. */
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
  const taille = effectifApprox(e.taille_employes)
  const accroche = taille
    ? `Avec ${taille}, une comparaison avec le contrat actuel ${de(e.nom)} vaut probablement le détour.`
    : `Une comparaison avec le contrat actuel ${de(e.nom)} vaut probablement le détour.`

  return `${salutation(contact)}

Je me permets de vous écrire car nous venons de lancer une nouvelle offre de téléphonie mobile pour les entreprises. ${accroche}

Êtes-vous la bonne personne pour en parler, ou dois-je m'adresser à quelqu'un d'autre ?

Avec mes meilleures salutations,
${SIGNATURE ? `\n${SIGNATURE}` : ''}`
}

/**
 * Lien `mailto:` avec destinataire et objet, mais SANS corps.
 *
 * C'est le paramètre `body` qui fait sauter la signature automatique : le
 * client considère alors le message déjà composé et n'insère rien. En le
 * laissant de côté, la vraie signature — avec les badges et le logo — arrive
 * normalement, et le corps se colle par-dessus (cf. `ecrireA`).
 */
export function lienMailto(e: EntrepriseAvecContacts, contact: Contact | null): string | null {
  const to = contact?.email?.trim()
  if (!to) return null
  const params = new URLSearchParams({ subject: objetEmail(e) })
  return `mailto:${encodeURIComponent(to)}?${params.toString().replace(/\+/g, '%20')}`
}

/**
 * Copie le corps du message puis ouvre le client mail. Deux temps volontaires :
 * le presse-papier porte le texte, le mailto porte le destinataire et l'objet
 * sans écraser la signature. Il reste un Ctrl+V à faire, en échange d'une
 * signature complète.
 */
export async function ecrireA(
  e: EntrepriseAvecContacts,
  contact: Contact | null
): Promise<boolean> {
  const lien = lienMailto(e, contact)
  if (!lien) return false
  try {
    await navigator.clipboard.writeText(corpsEmail(e, contact))
  } catch {
    // Presse-papier refusé (permission, contexte non sécurisé) : on ouvre
    // quand même le client, l'aperçu de la fiche reste copiable à la main.
  }
  window.location.href = lien
  return true
}
