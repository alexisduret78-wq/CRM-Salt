# PROMPT DE DÉMARRAGE — Claude Code

## Premier message à coller à Claude Code

Copie-colle ce bloc tel quel dans ta première interaction avec Claude Code (après l'avoir lancé dans le dossier projet) :

---

Salut Claude, je suis Alexis Duret, Account Manager B2B chez Salt Business (opérateur télécom suisse, zone Genève + La Côte). Je veux développer une **web app CRM personnelle ultra-premium** pour gérer ma prospection commerciale et mon portefeuille clients.

## Contexte essentiel

Le projet est entièrement préparé. Avant toute chose, **lis dans cet ordre** :

1. `README.md` — contexte global, architecture, code couleur
2. `SPECS.md` — spécifications détaillées des fonctionnalités V1
3. `SETUP.md` — étapes de configuration Supabase (certaines faites, d'autres non)

Tu trouveras aussi :
- `schema_supabase.sql` — script SQL prêt à exécuter
- `donnees_consolidees.json` — 1801 entreprises consolidées, prêtes à importer
- `Rapport_consolidation.xlsx` — rapport humain de la consolidation (pour info)

## Stack technique

J'aimerais qu'on parte sur la stack suivante :

- **Frontend** : Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Supabase (déjà configuré en Frankfurt)
- **Hosting** : local en dev, Netlify/Vercel plus tard

Si tu as une recommandation différente après avoir lu les specs (par exemple HTML monofichier plus simple), n'hésite pas à me la proposer **avec arguments**. Je suis ouvert.

## Plan de travail proposé

Voici comment j'aimerais qu'on procède, étape par étape (valide avec moi avant chaque grosse étape) :

### Phase 1 — Setup environnement (30 min)
1. Vérifier mon environnement (Node, npm, git installés)
2. Initialiser le projet Vite + React + TS
3. Installer Tailwind, shadcn/ui, supabase-js
4. Créer `.env.local` (je te donnerai mes clés Supabase)
5. Tester la connexion Supabase

### Phase 2 — Database (15 min)
6. Exécuter le `schema_supabase.sql` dans Supabase (via API ou je le fais manuellement)
7. Vérifier que les 5 tables existent
8. Créer un script `scripts/import.ts` pour importer `donnees_consolidees.json`
9. Lancer l'import et vérifier les ~1801 lignes

### Phase 3 — Authentification (30 min)
10. Login screen
11. Route protégée
12. Persistance session
13. Logout

### Phase 4 — Vue Liste + Fiche détail (2h)
14. Layout général (sidebar + header + main)
15. Vue liste des entreprises (tri/filtre/recherche)
16. Panneau latéral fiche détail
17. Édition inline
18. CRUD complet

### Phase 5 — Vue Kanban (1h)
19. Composant Kanban drag & drop
20. Bascule liste/Kanban
21. Mise à jour couleur au drop

### Phase 6 — Recherche universelle + raccourcis clavier (45 min)
22. Modal Cmd+K
23. Raccourcis globaux
24. Help screen "?"

### Phase 7 — Système de relances (1h)
25. Champ relance sur fiche
26. Vue "Aujourd'hui"
27. Notifications navigateur
28. Badge sidebar

### Phase 8 — Import/Export Excel (45 min)
29. Drag & drop fichier
30. Mapping colonnes
31. Détection doublons
32. Export Excel

### Phase 9 — Dashboard + Stats (45 min)
33. KPIs principaux
34. Graphiques
35. Vue activité

### Phase 10 — Polish + Deploy (1h)
36. Responsive mobile
37. Dark mode
38. Animations
39. Build production
40. Deploy Netlify ou Vercel

**Total estimé** : 8-10h de dev réparties sur plusieurs sessions.

## Règles de collaboration

1. **Pas de over-engineering** — V1 doit être fonctionnelle, pas parfaite. On itère.
2. **Design ultra-premium** — j'attends le niveau Linear/Attio/Folk, pas un truc moche fonctionnel. Si tu hésites entre simple et beau, va vers beau.
3. **Tests au fur et à mesure** — chaque feature doit fonctionner avant de passer à la suivante.
4. **Commits Git réguliers** — initialise un repo et commit chaque étape validée.
5. **Pose-moi des questions** quand un choix de design ou d'architecture peut aller dans plusieurs directions.
6. **Logs verbeux** — affiche ce que tu fais pour que je suive.
7. **Ne touche jamais à mes données Pamela sensibles** — pas d'ARPU, pas de chiffres financiers (déjà exclus du JSON, mais double-check).

## Mon code couleur (CRITIQUE)

Ce code est dans ma tête depuis toujours. **Tu ne dois jamais le modifier ni le re-mapper** :

- ⚪ **Blanc** = pas encore contacté ou pas de réponse
- 🟡 **Jaune** = contacté, en attente
- 🔴 **Rouge** = a dit non
- 🟢 **Vert** = positif / RDV / client

Toute interaction de l'app doit respecter ces 4 états.

## Mes 3 typologies = 3 vues séparées

- 📱 Prospection Mobile (1627 entrées)
- 🌐 Prospection Blue / Internet-Fixe (40 entrées)
- 🤝 Clients existants (134 entrées)

Pas mélangés.

## Pour démarrer maintenant

**Tu peux commencer par** :

1. Vérifier le contenu du dossier (`ls`)
2. Lire les 3 fichiers MD dans l'ordre
3. Me confirmer que tu as bien compris le contexte
4. Vérifier mon environnement (`node --version`, `npm --version`, `git --version`)
5. Me proposer la première action concrète

Vas-y, je suis prêt.

---

## 📝 Note pour Alexis

Une fois que tu as collé ce prompt et que Claude Code a confirmé qu'il a tout lu, tu pourras :

1. **Lui donner tes clés Supabase** (URL + anon key + service_role key + user UID)
2. **Suivre les étapes** qu'il propose
3. **Tester au fur et à mesure** dans ton navigateur

Si à un moment Claude Code se trompe ou propose quelque chose qui ne te convient pas, tu peux :
- Lui dire "Non, je préfère X parce que Y"
- Lui demander d'expliquer son choix
- Lui demander une alternative
- Reverter avec git si besoin

Bonne chance ! 🚀
