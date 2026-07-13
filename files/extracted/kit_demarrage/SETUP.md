# SETUP — Configuration Supabase et environnement

## ✅ Ce qui est déjà fait (par Alexis)

- [x] Compte Supabase créé
- [x] Projet `salt-crm` créé
- [x] Région : **Frankfurt (eu-central-1)** — conforme LPD/RGPD
- [x] Pricing : Free
- [x] Mot de passe DB noté en sécurité

## 🔴 Ce qu'il reste à faire

### Étape 1 — Récupérer les clés API Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner le projet `salt-crm`
3. Sidebar gauche → **Settings** (icône engrenage en bas)
4. Cliquer sur **API**
5. Récupérer :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon / public key** : `eyJhbGc...` (longue chaîne)
   - **service_role key** : `eyJhbGc...` (longue chaîne — pour admin uniquement, NE PAS exposer en frontend)

→ **Coller dans `.env.local`** (voir étape 4)

### Étape 2 — Exécuter le schéma SQL

1. Sidebar Supabase → **SQL Editor**
2. Cliquer **+ New query**
3. Ouvrir le fichier `schema_supabase.sql` du kit
4. Copier-coller **tout le contenu** dans l'éditeur SQL
5. Cliquer **Run** (ou Ctrl+Enter)
6. Vérifier le message "Success. No rows returned"

**Vérification** :
- Sidebar → **Table Editor**
- Tu dois voir 5 tables : `entreprises`, `contacts`, `interactions`, `vagues`, `entreprise_vagues`
- Plus 2 vues : `entreprises_enrichies`, `relances_du_jour`

### Étape 3 — Créer le compte utilisateur Alexis

1. Sidebar → **Authentication** → **Users**
2. Cliquer **Add user** → **Create new user**
3. Email : `alexis.duret@...` (utiliser ton email perso, pas pro)
4. Mot de passe : robuste, à mémoriser
5. **Auto Confirm User** : ✅ (sinon confirmer manuellement)
6. Cliquer **Create user**
7. Noter le **User UID** affiché (format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

→ **Ce UID sera utilisé par le script d'import**

### Étape 4 — Créer le fichier .env.local

Dans le dossier du projet, créer un fichier `.env.local` (ou `.env`) :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Pour le script d'import seulement (NE PAS commiter)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Ajouter `.env.local` à `.gitignore`** :
```
.env
.env.local
*.json.bak
```

### Étape 5 — Importer les données

Deux options selon le choix de stack :

#### Option A — Import via script Node.js (recommandé)

Claude Code créera un script `scripts/import.js` qui :
1. Lit `donnees_consolidees.json`
2. Se connecte à Supabase avec la `service_role_key`
3. Insère les données en assignant `user_id` au UID d'Alexis
4. Affiche un compteur de progression

```bash
node scripts/import.js
```

#### Option B — Import via app (au premier lancement)

L'app détecte que la base est vide pour l'utilisateur et propose un bouton "Importer mes données" qui upload le JSON.

→ **Décision avec Claude Code au début**

### Étape 6 — Vérifier l'import

Dans Supabase → Table Editor → `entreprises` :
- Tu dois voir ~1801 lignes
- La colonne `user_id` doit correspondre à ton UID
- Filtre par `typologie` pour vérifier les 3 catégories

## 🚀 Lancement de l'app

### Stack HTML monofichier (simple)
```bash
# Servir avec n'importe quel serveur statique
npx serve .
# ou
python -m http.server 8000
```
Ouvrir http://localhost:8000

### Stack Vite/React (pro)
```bash
npm install
npm run dev
```
Ouvrir http://localhost:5173

## 🔧 Outils nécessaires

- **Node.js 20+** — pour le dev/build
- **Git** — versioning (optionnel mais recommandé)
- **VS Code** ou autre éditeur
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)

## 🌐 Hosting (après V1)

Si tu veux accéder à l'app depuis ton mobile sans servir en local :

### Option gratuite : Netlify ou Vercel
1. Push le code sur GitHub (repo privé)
2. Connecter Netlify/Vercel au repo
3. Configurer les variables d'environnement (URL Supabase, anon key)
4. Deploy automatique à chaque push
5. URL personnalisée : `salt-crm.netlify.app` ou personnalisée

### Sécurité
- Comme RLS est activé, l'app est sûre même publique sur le web
- L'utilisateur doit se logger pour voir quoi que ce soit
- L'anon key seule ne donne aucun accès sans auth

## 🆘 Troubleshooting

### "RLS policy violation"
- Vérifier que `auth.uid()` est bien défini après login
- Vérifier que `user_id` est inséré sur chaque ligne

### "Cannot connect to Supabase"
- Vérifier l'URL et l'anon key dans `.env.local`
- Vérifier qu'on est en https (Supabase n'accepte que https en prod)

### Import lent
- Normal pour 1800 lignes (compter ~30s à 1min)
- Si > 5min : utiliser des batchs de 500 lignes

### Données dupliquées après import
- Le script doit faire un check par `nom + business_uid` avant d'insérer
- Ou : `TRUNCATE entreprises CASCADE` avant ré-import (attention : supprime tout)

## ✅ Checklist finale avant de coder l'app

- [ ] Compte Supabase créé en région Frankfurt
- [ ] Schéma SQL exécuté avec succès
- [ ] Utilisateur Alexis créé dans Authentication
- [ ] Clés API récupérées et collées dans `.env.local`
- [ ] `.env.local` ajouté à `.gitignore`
- [ ] Test de connexion : `npx supabase status` ou test JS minimal
- [ ] Données importées (script ou manuel)
- [ ] Vérification dans Table Editor : ~1801 lignes
