// =====================================================
// Sièges hors Suisse romande (vérifié au registre du commerce)
// =====================================================
// Découvertes dont le SIÈGE légal OU le centre de décision (maison-mère) est
// en Suisse alémanique ou à l'étranger → la décision télécom est souvent
// centralisée hors GE/VD. Vérifié via zefix / moneyhouse (juillet 2026).
// Clé = business_uid (CHE-…). Valeur = raison courte (tooltip).

export const SIEGE_HORS_ROMANDIE: Record<string, string> = {
  'CHE-103.572.747': 'Holding Amstein+Walthert à Zurich',
  'CHE-430.311.292': 'Succursale · siège Ittigen BE (groupe VINCI)',
  'CHE-177.099.873': 'Succursale · siège Rotkreuz ZG (Bechtle, DE)',
  'CHE-221.403.244': 'Succursale · siège Zurich (Bouygues/Equans, FR)',
  'CHE-248.948.364': 'Groupe Colas / Bouygues (France)',
  'CHE-108.487.149': 'Maison-mère Galliker à Altishofen LU',
  'CHE-105.991.440': 'Holding CH à Adliswil ZH (Generali, Italie)',
  'CHE-104.823.975': 'Georg Fischer, Schaffhouse SH',
  'CHE-105.839.536': 'Siège Zurich (Globus / Central Group)',
  'CHE-103.612.849': 'Siège Hünenberg ZG (TX Group)',
  'CHE-116.173.397': 'Groupe Hirslanden, Opfikon ZH',
  'CHE-101.433.081': 'Groupe Hirslanden, Opfikon ZH',
  'CHE-317.735.749': 'Succursale · siège Dietikon ZH (Planzer)',
  'CHE-248.068.730': 'Siège Muri BE (groupe emeis, FR)',
  'CHE-430.232.729': 'Groupe Sword (Luxembourg)',
  'CHE-356.549.498': 'Siège Zurich (Vebego, NL)',
  'CHE-317.931.925': 'Succursale · siège Cadempino TI (Bracco, Milan)',
  'CHE-398.161.059': 'Siège CH à Zurich (BDO)',
  'CHE-153.284.948': 'Succursale · siège Zurich (Grant Thornton)',
  'CHE-106.576.084': 'Groupe PROMAN (France)',
  'CHE-261.918.282': 'Groupe CRIT (France)',
  'CHE-106.034.966': 'TX Group, Zurich (Tamedia)',
}

export function siegeHorsRomandie(uid: string | null): boolean {
  return !!uid && uid in SIEGE_HORS_ROMANDIE
}

export function raisonSiege(uid: string | null): string | null {
  return uid && uid in SIEGE_HORS_ROMANDIE ? SIEGE_HORS_ROMANDIE[uid] : null
}
