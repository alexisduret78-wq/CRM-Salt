// =====================================================
// Sièges légaux hors Suisse romande (lecture stricte RC)
// =====================================================
// Lecture STRICTE du registre du commerce : on regarde uniquement le SIÈGE
// LÉGAL de l'entité (ou, pour une succursale, l'établissement principal).
// On NE tient PAS compte des holdings / maisons-mères : une société
// immatriculée en GE/VD reste romande même si son groupe est ailleurs.
// Vérifié via zefix / moneyhouse (juillet 2026). Clé = business_uid.

export const SIEGE_HORS_ROMANDIE: Record<string, string> = {
  'CHE-430.311.292': 'Succursale · siège légal Ittigen BE (Axians)',
  'CHE-177.099.873': 'Succursale · siège légal Rotkreuz ZG (Bechtle)',
  'CHE-221.403.244': 'Succursale · siège légal Zurich (Bouygues/Equans)',
  'CHE-105.839.536': 'Siège légal Zurich (Magazine zum Globus AG)',
  'CHE-103.612.849': 'Siège légal Hünenberg ZG (Goldbach Neo)',
  'CHE-317.735.749': 'Succursale · siège légal Dietikon ZH (Planzer)',
  'CHE-248.068.730': 'Succursale · siège légal Muri BE (Senevita)',
  'CHE-356.549.498': 'Succursale · siège légal Zurich (Vebego)',
  'CHE-317.931.925': 'Succursale · siège légal Cadempino TI (Bracco)',
  'CHE-398.161.059': 'Siège légal Zurich (BDO SA)',
  'CHE-153.284.948': 'Succursale · siège légal Zurich (Grant Thornton)',
}

export function siegeHorsRomandie(uid: string | null): boolean {
  return !!uid && uid in SIEGE_HORS_ROMANDIE
}

export function raisonSiege(uid: string | null): string | null {
  return uid && uid in SIEGE_HORS_ROMANDIE ? SIEGE_HORS_ROMANDIE[uid] : null
}
