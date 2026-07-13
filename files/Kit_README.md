# Salt CRM Personnel — Projet Alexis

## 🎯 Objectif

Web app CRM personnelle **ultra-premium**, à hauteur des meilleurs outils du marché (Pipedrive, Attio, Folk, Linear). Backend Supabase (Frankfurt, conforme LPD/RGPD). Stockage cloud, multi-appareils, authentification.

Cet outil remplace la gestion par fichiers Excel dispersés. Il sert exclusivement à l'usage personnel d'Alexis Duret, Account Manager B2B chez **Salt Business** (opérateur télécom suisse, zone Genève + La Côte jusqu'à Morges).

## 👤 Utilisateur

- **Alexis Duret** — Account Manager B2B Salt Business
- **Zone commerciale** : Genève + périphérie + La Côte jusqu'à Morges
- **Cible** : entreprises 20-500+ collaborateurs
- **Offre Salt actuelle** : mobile, internet fibre, téléphonie fixe (Trunk SIP) — depuis peu offre complète
- **CRM Salt interne** : Pamela (obsolète, raison de ce projet perso)

## 🧱 Architecture technique

### Backend
- **Supabase** (Frankfurt, EU)
- PostgreSQL + Row Level Security
- Authentification email/password
- Données chiffrées en transit (HTTPS)

### Frontend
- **Web app HTML/JS/CSS unique** (fichier `index.html` standalone ou structure Vite/React au choix)
- **Tailwind CSS** pour le design
- **Supabase JS client** pour la communication backend
- Responsive desktop + mobile
- Hosting : local dans un dossier, ou Netlify/Vercel gratuit pour accès web

### Stack recommandée
- **Option simple (recommandée)** : HTML monofichier + Tailwind CDN + Supabase JS via CDN
- **Option pro** : Vite + React + TypeScript + Tailwind + Supabase JS (npm)

→ **Décision à prendre avec Alexis au début de la session Claude Code**

## 📊 Données

### Sources d'origine (5 fichiers Excel consolidés)
1. `Prospection.xlsx` — Prospection mobile par vagues (Wave 1-5)
2. `Prospection_SALT.xlsx` — Prospection mobile structurée (8 onglets par taille)
3. `Pipe_Blue.xlsx` — Pipeline Internet/Fixe actif (40 entreprises)
4. `Nouveaux_Clients.xlsx` — Clients récemment signés (~40)
5. `Portfolio_clients_Alexis.xlsx` — Portefeuille actuel (14 clients)

### Volumes consolidés
- **1801 entreprises uniques** (après dédoublonnage)
- **1159 contacts**
- **24 interactions** (RDV historiques)
- **5 vagues** d'emailing
- **200 doublons fusionnés** automatiquement

### Répartition par typologie
- Prospect Mobile : 1627
- Prospect Blue (Internet/Fixe) : 40
- Client existant : 134

### Répartition par couleur (système Alexis)
- 🟡 Jaune (en cours) : 1388
- ⚪ Blanc (pas contacté) : 154
- 🟢 Vert (positif/client) : 151
- 🔴 Rouge (non) : 108

## 🎨 Système de couleurs (CRITIQUE)

C'est le code mental qu'Alexis utilise déjà. **À respecter strictement** :

| Couleur | Prospects | Clients existants | Sens |
|---|---|---|---|
| ⚪ **Blanc** | Pas encore contacté | Pas encore contacté | À traiter |
| 🟡 **Jaune** | Contacté, pas de réponse | Contacté, pas de réponse | En attente |
| 🔴 **Rouge** | A dit non | A dit non au renouvellement | Refus |
| 🟢 **Vert** | Réponse positive / RDV | Renouvellement accepté | Opportunité |

Variantes possibles à terme :
- Vert foncé : Signé / Closé
- Jaune foncé : Multiples relances
- Gris : Pas joignable / numéro mort

## 📋 Typologies = 3 VUES SÉPARÉES

Alexis veut 3 sections distinctes dans la navigation :

1. **📱 Prospection Mobile** — cibles froides, pitch "challenger Swisscom/Sunrise"
2. **🌐 Prospection Blue** — Internet/Fibre/Trunk, pitch infra
3. **🤝 Clients existants** — fidélisation, renouvellement, upsell pack complet

Chaque vue doit avoir :
- Sa liste filtrable (par couleur, secteur, ville, taille...)
- Sa vue Kanban (drag & drop par statut)
- Ses KPIs dédiés
- Ses templates email adaptés (pitch différent par typologie)

## 🔐 Confidentialité & LPD

- **Pas de données financières** des clients existants (ARPU, chiffre d'affaires) → exclues du dataset
- **Hébergement EU** (Frankfurt) → conforme LPD/RGPD
- **Row Level Security** Supabase → chaque utilisateur ne voit que ses données
- **Outil personnel** d'organisation, pas un duplicata du CRM Salt
- Alexis peut/doit avoir une discussion transparente avec son manager sur cet outil

## 🎯 Fonctionnalités V1 ("ultra-premium")

### Cœur CRM
- [ ] Authentification email/password Supabase
- [ ] Liste entreprises avec tri/filtre multi-critères
- [ ] Recherche universelle Cmd+K (style Linear/Notion)
- [ ] Édition inline (clic = édition)
- [ ] Vue Kanban drag & drop par statut/couleur
- [ ] Fiche entreprise détaillée (panneau latéral)
- [ ] Historique des interactions horodaté
- [ ] Notes Markdown
- [ ] Tagging
- [ ] Champs spécifiques par typologie

### Code couleur
- [ ] Pastille colorée en début de ligne
- [ ] Bordure gauche colorée sur fiche détail
- [ ] Filtre rapide par couleur (1 clic)
- [ ] Compteurs par couleur dans dashboard

### Productivité
- [ ] Raccourcis clavier (N = nouveau, / = recherche, J/K = navigation)
- [ ] Sélection multiple + bulk edit
- [ ] Templates email (différents par typologie)
- [ ] Génération email depuis fiche → ouvre client mail

### Rappels
- [ ] Date de relance par fiche
- [ ] Vue "Aujourd'hui" avec relances du jour
- [ ] Notifications navigateur
- [ ] Badge sur onglet (nb relances)

### Import/Export
- [ ] Import du fichier `donnees_consolidees.json` au premier lancement
- [ ] Import Excel additionnel (drag & drop)
- [ ] Mapping colonnes assisté
- [ ] Export Excel/CSV
- [ ] Backup JSON automatique

### Multi-appareils
- [ ] Synchro temps réel via Supabase Realtime
- [ ] Responsive mobile
- [ ] PWA installable (option)

## 🎨 Design

**Inspiration** : Linear, Attio, Folk — sobre, dense, lisible, fluide.

### Typographie
- **Inter** (ou similaire système : SF Pro, Segoe UI)
- Hiérarchie claire (heading XL/L/M/S, body, caption)

### Couleurs
- **Fond** : `#FAFAFA` (clair) / `#0A0A0A` (dark mode optionnel)
- **Surface** : `#FFFFFF` / `#171717`
- **Texte primaire** : `#171717` / `#FAFAFA`
- **Texte secondaire** : `#737373`
- **Accent Salt** : `#C8102E` (rouge corporate) — usage parcimonieux
- **Status colors** :
  - Blanc : `#F5F5F5` (background) + bordure `#D4D4D4`
  - Jaune : `#FEF3C7` + `#F59E0B`
  - Rouge : `#FEE2E2` + `#DC2626`
  - Vert : `#D1FAE5` + `#10B981`

### Densité
- Espacement : 4/8/12/16/24/32/48px
- Tailles cliquables : minimum 32px
- Padding cellules tableau : 8-12px

## 📁 Fichiers du kit de démarrage

1. **`README.md`** (ce fichier) — contexte global
2. **`SPECS.md`** — spécifications détaillées des fonctionnalités
3. **`SETUP.md`** — étapes Supabase déjà faites et à faire
4. **`PROMPT_DEMARRAGE.md`** — premier message à donner à Claude Code
5. **`schema_supabase.sql`** — script SQL prêt à exécuter
6. **`donnees_consolidees.json`** — toutes les données à importer (1801 entreprises)
7. **`Rapport_consolidation.xlsx`** — rapport humain de la consolidation

## ⚡ Démarrage rapide

```bash
# 1. Cloner ou créer le dossier
mkdir salt-crm && cd salt-crm

# 2. Copier tous les fichiers du kit dedans

# 3. Lancer Claude Code dans ce dossier
claude

# 4. Donner le prompt initial (voir PROMPT_DEMARRAGE.md)

# 5. Suivre les étapes proposées par Claude Code
```

## 🚀 Roadmap après V1

- **V1.1** : templates email automatiques par typologie + intégration Outlook/Gmail
- **V1.2** : statistiques avancées + dashboards par période
- **V1.3** : tracking ouverture emails (via service tiers ou Mailgun)
- **V2** : si validé par Salt, refonte pour devenir l'outil officiel équipe commerciale

## 🔗 Liens utiles

- Supabase dashboard : https://supabase.com/dashboard
- Documentation Supabase JS : https://supabase.com/docs/reference/javascript
- Tailwind CSS : https://tailwindcss.com
- Claude Code : https://docs.claude.com/en/docs/claude-code

---

**Dernière mise à jour** : phase 1 de consolidation terminée. Phase 2 = développement web app.
