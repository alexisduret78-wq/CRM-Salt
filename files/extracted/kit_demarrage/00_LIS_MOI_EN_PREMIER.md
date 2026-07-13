# 🚀 COMMENT DÉMARRER — Alexis, lis-moi en premier

Salut Alexis,

Ce dossier contient **tout ce qu'il faut** pour que Claude Code construise ton CRM ultra-premium. Suis ces étapes dans l'ordre.

## 📦 Ce que contient ce kit

| Fichier | À quoi ça sert |
|---|---|
| `00_LIS_MOI_EN_PREMIER.md` | Ce fichier — instructions de démarrage |
| `README.md` | Vue d'ensemble du projet (Claude Code lira) |
| `SPECS.md` | Spécifications détaillées des fonctionnalités |
| `SETUP.md` | Guide de configuration Supabase étape par étape |
| `PROMPT_DEMARRAGE.md` | Le prompt à copier-coller dans Claude Code |
| `schema_supabase.sql` | Script SQL pour créer les tables (déjà prêt) |
| `donnees_consolidees.json` | 1801 entreprises consolidées à importer |
| `Rapport_consolidation.xlsx` | Rapport humain de la consolidation (pour ta validation) |

## 🎯 Étapes à suivre (dans l'ordre)

### Étape 1 — Ouvre le Rapport_consolidation.xlsx (5 min)

**Pourquoi** : valider que la consolidation des 5 fichiers est OK avant d'aller plus loin.

**À regarder** :
- Onglet "Vue d'ensemble" : les chiffres correspondent à ta réalité ?
- Onglet "Doublons fusionnés" : aucune fusion suspecte (deux vraies entreprises différentes fusionnées par erreur) ?
- Onglet "Statuts Pamela" : les mappings de couleur te conviennent ?

**Si OK** → passer à l'étape 2.
**Si problème** → reviens me voir dans Claude.ai pour qu'on corrige avant l'import.

### Étape 2 — Installe Claude Code (10-15 min)

Tu as deux options :

#### Option A — Terminal (recommandé)
1. Aller sur https://docs.claude.com/en/docs/claude-code/quickstart
2. Suivre les instructions d'installation pour ton OS (Mac/Windows/Linux)
3. Lancer `claude` dans un terminal pour vérifier que ça marche

#### Option B — Extension VS Code
1. Installer VS Code si tu ne l'as pas : https://code.visualstudio.com
2. Installer l'extension Claude Code dans VS Code
3. Se connecter avec ton compte Anthropic

### Étape 3 — Crée ton dossier projet (2 min)

```bash
# Dans ton terminal
mkdir salt-crm
cd salt-crm
```

**Copie tous les fichiers de ce kit** dans le dossier `salt-crm` (drag & drop depuis le Finder/Explorer).

### Étape 4 — Termine la config Supabase (10 min)

Ouvre `SETUP.md` et suis les **étapes 1 à 4** :
- Récupérer tes clés API
- Exécuter le SQL dans Supabase
- Créer ton compte utilisateur dans Authentication
- Créer le fichier `.env.local` avec tes clés

⚠️ **Note ton User UID** quand tu créeras ton compte — Claude Code en aura besoin pour l'import.

### Étape 5 — Lance Claude Code dans le dossier (1 min)

```bash
# Toujours dans le dossier salt-crm
claude
```

### Étape 6 — Copie-colle le prompt de démarrage (1 min)

Ouvre `PROMPT_DEMARRAGE.md`, copie le bloc entre les "---" et colle-le dans Claude Code.

### Étape 7 — Laisse Claude Code travailler

Claude Code va :
1. Lire les 3 fichiers MD
2. Te confirmer qu'il a tout compris
3. Vérifier ton environnement (Node, npm, git)
4. Te proposer la première action

À partir de là, **suis le fil avec lui**. Il te posera des questions, tu lui répondras. À chaque étape, vérifie dans ton navigateur que ça marche.

## ⚡ Points d'attention

### 💰 Coût Claude Code
Si tu as Claude Pro/Max, Claude Code est inclus mais utilise des credits. Pour développer cette app complète, prévois **2-4h de session** réparties. Ça reste très rentable vs un développeur freelance.

### 🔒 Sécurité tes données
- **Ne commit jamais** ton fichier `.env.local` sur Git
- **Ne partage jamais** ta `service_role_key` (donne accès admin total à ta base)
- Ton compte Supabase a un mot de passe : utilise un gestionnaire de mots de passe

### 🐛 Si ça coince
- Claude Code peut faire des erreurs. Pas grave, dis-lui "ça ne marche pas, voici l'erreur : [coller le message d'erreur]"
- Si tu es perdu, demande-lui : "Explique-moi ce que tu viens de faire et où on en est"
- Si une décision technique te dépasse, demande : "Quelle est l'option la plus simple ?"

### 🔄 Sauvegardes
- Claude Code initialisera un repo Git → tu auras des versions à chaque étape
- Tes données sont sur Supabase cloud → backup auto Supabase
- Tu peux exporter en Excel à tout moment depuis l'app une fois finie

## 🆘 En cas de blocage

Si tu es bloqué et que Claude Code n'arrive pas à t'aider :

1. **Reviens dans Claude.ai** (la conversation où on est)
2. Décris le problème + colle les erreurs
3. Je t'aiderai à le résoudre ou je te donnerai un prompt précis à donner à Claude Code

## ✅ Comment savoir si tout est bien fini

À la fin de la dernière session Claude Code, tu dois avoir :

- [ ] Une app accessible via `http://localhost:5173` (ou un lien public si déployée)
- [ ] Tu peux te connecter avec ton email/mot de passe
- [ ] Tu vois tes 1801 entreprises (consolidées des 5 fichiers + V2)
- [ ] Les 3 vues séparées fonctionnent (Mobile / Blue / Clients)
- [ ] Le code couleur est respecté (Blanc/Jaune/Rouge/Vert)
- [ ] La fiche détaillée s'ouvre, tu peux modifier
- [ ] Le Kanban marche avec drag & drop
- [ ] La recherche Cmd+K fonctionne
- [ ] Les relances s'affichent et notifient
- [ ] L'export Excel marche

---

## 📝 Pense à...

- **Demander à ton manager Salt** si l'usage d'un outil de productivité personnel (type Notion/Airtable) est OK avec la politique IT/LPD. Tu auras ainsi la conscience tranquille.
- **Faire des exports Excel hebdomadaires** comme backup (oui Supabase a déjà du backup mais zéro confiance excessive)
- **Garder l'app simple au début** — ne demande pas 50 features. Une fois utilisée 2 semaines, tu sauras ce qui te manque vraiment.

---

Bonne chance Alexis ! Ce projet va vraiment changer ta productivité commerciale. 🚀
