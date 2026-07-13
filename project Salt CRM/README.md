# Salt CRM — Alexis Duret

CRM personnel ultra-premium pour la prospection B2B (Salt Business, Genève + La Côte).
Remplace la gestion par fichiers Excel et le CRM interne Pamela.

Inspirations design : Linear / Attio / Folk.

## Stack

- **Vite 8 + React 19 + TypeScript 6**
- **Tailwind CSS v4** + **shadcn/ui** (new-york, base neutral)
- **Supabase** (PostgreSQL 17, Auth, RLS) — région EU (eu-west-1, conforme LPD/RGPD)
- **TanStack Query** (cache + invalidations)
- **@dnd-kit** (Kanban drag & drop) · **recharts** (stats) · **SheetJS/xlsx** (import/export)

## Fonctionnalités (V1)

- 🔐 Auth email/password Supabase, sessions persistées, route protégée
- 📋 3 vues typologie (Mobile / Blue / Clients) — liste triable/filtrable + recherche
- 🎨 Code couleur natif : ⚪ blanc · 🟡 jaune · 🔴 rouge · 🟢 vert
- 🗂️ Vue Kanban drag & drop (change la couleur + logue une interaction)
- 📄 Fiche détail (panneau latéral) : vue d'ensemble, contacts, historique, vagues, relance — édition inline
- 🔍 Recherche universelle **Cmd+K** + raccourcis clavier (N, /, ?, G+D/M/B/C)
- 📅 Vue **Aujourd'hui** : relances en retard + du jour, actions Fait/Reporter, badge sidebar, notifications navigateur
- 📥 Import Excel/CSV (mapping colonnes auto + détection doublons) · 📤 Export .xlsx
- 📊 Statistiques : KPIs, camembert couleurs, funnel Blue, top secteurs
- 🌙 Dark mode (shell + dashboard + settings) · 📱 responsive mobile (sidebar drawer)

## Développement local

```bash
npm install
npm run dev          # http://localhost:5173
```

Variables d'environnement — créer `.env.local` (voir `.env.local.example`) :

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
# Scripts uniquement (jamais exposé au frontend)
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_USER_ID=<ton user uid>
```

> ⚠️ `.env.local` et `.mcp.json` sont gitignored — ne jamais les commiter.

## Scripts

```bash
npm run dev            # serveur de dev
npm run build          # build production (dist/)
npm run preview        # prévisualise le build
npm run lint           # eslint
npm run import         # importe donnees_consolidees.json (idempotent)
npm run import:force   # purge + ré-importe
```

## Base de données

Schéma complet et reproductible : **[`supabase/schema.sql`](supabase/schema.sql)**
(capture fidèle de la base live, SQL idempotent — disaster recovery / repro sur
un projet vierge). Le projet n'utilise pas `supabase/migrations` ; ce fichier
fait foi.

Contenu : **6 tables** (`entreprises`, `contacts`, `interactions`, `vagues`,
`entreprise_vagues`, `recommandations`) + **3 vues** (dont `entreprise_liens`,
croisement inter-pipeline) + RLS par `user_id` sur toutes les tables + **6
fonctions** (`norm_nom`, `trigger_set_timestamp`, `rls_auto_enable`,
`compute_priorites`, `stats_secteurs`, `stats_typologie_couleur`). `nom_norm`
est une colonne générée ; `ensure_rls` est un event trigger qui active la RLS
sur toute nouvelle table.

## Déploiement

Le projet est prêt pour **Netlify** (`netlify.toml`) ou **Vercel** (`vercel.json`),
avec fallback SPA configuré.

### Netlify

1. Pousser le repo sur GitHub (privé)
2. Netlify → "Add new site" → "Import an existing project" → choisir le repo
3. Build command `npm run build`, publish directory `dist` (déjà dans `netlify.toml`)
4. **Environment variables** : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
5. Deploy → URL type `salt-crm.netlify.app`

### Vercel

1. Pousser sur GitHub
2. Vercel → "Add New" → "Project" → importer le repo (framework détecté : Vite)
3. Ajouter les 2 variables d'environnement `VITE_SUPABASE_*`
4. Deploy

> Sécurité : RLS étant activé, l'app est sûre même publique. L'anon key seule ne
> donne aucun accès sans authentification.

## Sécurité & confidentialité

- Hébergement EU · Row Level Security (chaque user ne voit que ses données)
- Pas de données financières clients (ARPU/CA exclus du dataset)
- Outil personnel d'organisation, distinct du CRM officiel Salt
- Backup JSON complet téléchargeable depuis Paramètres (à faire chaque semaine)

## Roadmap (post-V1)

- Dark mode complet sur les vues denses (liste/kanban/fiche/stats)
- Templates email par typologie + intégration Outlook/Gmail
- PWA installable · synchro temps réel Supabase Realtime
- Bulk actions sur sélection multiple
