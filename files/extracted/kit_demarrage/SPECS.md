# SPECS — Salt CRM Personnel

Spécifications détaillées des fonctionnalités V1.

## 🔐 Authentification

### Login screen
- **Design** : pleine page, centré, sobre, fond uni avec logo discret
- Email + mot de passe
- "Se souvenir de moi" (option)
- Lien "Mot de passe oublié" (Supabase Auth gère)
- Redirection vers dashboard après login réussi
- Message d'erreur clair en cas d'échec

### Première connexion
- Compte créé manuellement par Alexis dans Supabase dashboard
- Au premier login : déclenchement automatique de l'import du fichier `donnees_consolidees.json` si la table `entreprises` est vide pour cet `user_id`
- Écran de chargement pendant l'import ("Import de 1801 entreprises... [progress bar]")
- Une fois terminé, redirection vers dashboard

## 🏠 Dashboard (vue d'accueil)

### Header
- Nom de l'utilisateur (Alexis Duret)
- Date du jour
- Bouton "Nouvelle entreprise" (icône +)
- Recherche universelle (Cmd+K) toujours visible
- Avatar / menu profil (déconnexion)

### Sidebar gauche (navigation)
- 🏠 **Dashboard**
- 📱 **Prospection Mobile** (avec badge compteur)
- 🌐 **Prospection Blue** (avec badge compteur)
- 🤝 **Clients existants** (avec badge compteur)
- 📅 **Aujourd'hui** (relances du jour, badge si > 0)
- 📊 **Statistiques**
- ⚙️ **Paramètres**

### Contenu central
**Section 1 : "Aujourd'hui"**
- Cards en haut : "X relances aujourd'hui" | "Y RDV cette semaine" | "Z entreprises à recontacter"
- Liste des relances du jour avec actions rapides (Reporter, Faire, Annuler)

**Section 2 : "Pipeline"**
- 4 grandes cards (Blanc / Jaune / Vert / Rouge) avec compteurs et %
- Cliquables → filtrent la vue principale

**Section 3 : "Récemment"**
- Dernières entreprises modifiées (5)
- Dernières interactions ajoutées (5)

**Section 4 : "Vagues d'emailing"**
- Tableau Wave 1 à Wave 5 avec dates et taux de réponse

## 📋 Vue Liste (par typologie)

### Header de section
- Titre de la typologie (ex: "Prospection Mobile")
- Compteur total + filtres actifs
- Bouton "+ Nouveau prospect"
- Bouton "Importer" (drag & drop Excel)
- Bouton "Exporter" (Excel/CSV)

### Filtres rapides (chips horizontaux)
- Tous | ⚪ Blanc | 🟡 Jaune | 🔴 Rouge | 🟢 Vert
- + filtre par secteur (dropdown)
- + filtre par ville (dropdown)
- + filtre par taille (slider)
- + filtre par échéance contrat (clients)
- + recherche texte locale

### Tableau principal
**Colonnes (configurables, par défaut)** :
1. ⬜ Checkbox sélection
2. 🔘 Couleur (pastille cliquable pour changer)
3. Nom entreprise (gras)
4. Secteur
5. Ville
6. Taille (collabs)
7. Contact principal
8. Statut Pamela (badge)
9. Date dernière interaction
10. Date prochaine relance (avec alerte si dépassée)
11. ⋯ Menu actions

**Interactions** :
- Tri par colonne (clic header)
- Édition inline : double-clic sur une cellule = mode édition (sauf nom qui est en lecture seule depuis la liste)
- Sélection multiple (Shift+clic, Cmd+clic)
- Clic sur une ligne → ouvre panneau latéral détail (slide depuis la droite, pas un nouveau page)
- Bulk actions sur sélection (changer couleur, secteur, supprimer, exporter sélection)

### Pagination
- 50 lignes par page par défaut
- Pagination en bas + sélecteur "Lignes par page" (25/50/100/Tout)
- "Page X/Y" + flèches précédent/suivant

## 📊 Vue Kanban (par typologie)

### Layout
- 4 colonnes verticales : ⚪ Blanc | 🟡 Jaune | 🔴 Rouge | 🟢 Vert
- Compteur par colonne en header
- Cards entreprise empilées dans chaque colonne

### Card entreprise (Kanban)
- Nom (gras)
- Secteur + ville (petit)
- Contact principal + fonction (si dispo)
- Date prochaine relance (si dispo, avec alerte rouge si dépassée)
- Badge statut Pamela en bas
- Icône menu actions ⋯

### Interactions Kanban
- **Drag & drop** entre colonnes = changement de couleur automatique + log dans interactions
- **Clic sur card** = ouvre panneau latéral détail (idem vue liste)
- **+ en haut de colonne** = créer une nouvelle entreprise directement dans cet état

## 📄 Fiche entreprise (panneau latéral)

### Layout
- Slide depuis la droite (occupe ~40% de l'écran sur desktop, plein écran sur mobile)
- Bordure gauche colorée selon couleur de l'entreprise
- Bouton X pour fermer, ESC aussi
- Si modif non sauvegardée : confirmation avant fermeture

### Header de la fiche
- Nom entreprise (éditable inline)
- Couleur (pastille cliquable → menu 4 couleurs)
- Typologie (badge cliquable → menu 3 typologies)
- Score Salt 1-5 (si dispo) — étoiles
- Bouton "..." → Supprimer / Archiver / Dupliquer

### Sections (tabs)

**Tab 1 — Vue d'ensemble (par défaut)**
- Infos générales : Secteur, Ville, Taille, IDE, Site web, LinkedIn
- Statut Pamela (lecture seule, badge)
- Assignation (lecture seule)
- Priorité (A/B/C éditable)
- Pourquoi cette cible (texte multi-lignes)
- Échéance contrat (date, pour clients)
- Notes (Markdown ou rich text simple)

**Tab 2 — Contacts**
- Liste des contacts de cette entreprise
- Bouton "+ Ajouter contact"
- Pour chaque : Prénom Nom, Fonction, Email (cliquable mailto:), Téléphone (cliquable tel:), LinkedIn (cliquable)
- Badge "Décideur" si applicable
- Édition inline ou modal

**Tab 3 — Historique**
- Timeline chronologique inverse (plus récent en haut)
- Pour chaque interaction : icône type (email/appel/RDV), date, direction (sortant/entrant), résumé, prochaine action
- Bouton "+ Ajouter une interaction" en haut

**Tab 4 — Vagues d'emailing**
- Tableau : Vague, Date envoi 1, Date envoi 2, Date envoi 3
- Lecture seule pour les vagues historiques importées

**Tab 5 — Relance / Tâches**
- Date prochaine relance (date picker)
- Description de la tâche
- Bouton "Marquer comme fait"
- Historique des relances passées

### Actions rapides (footer fiche)
- Bouton "📧 Envoyer email" → ouvre client mail avec template selon typologie
- Bouton "📞 Appeler" → tel: si numéro
- Bouton "💼 LinkedIn" → ouvre LinkedIn entreprise
- Bouton "+ Interaction" → ouvre formulaire rapide

## 🔍 Recherche universelle (Cmd+K)

### Activation
- **Cmd+K** (Mac) / **Ctrl+K** (Windows)
- Modal centré qui s'ouvre
- Focus automatique sur input

### Behavior
- Recherche en temps réel (debounce 150ms)
- Recherche dans : nom entreprise, secteur, ville, nom contact, email, notes
- Résultats groupés : "Entreprises (X)" puis "Contacts (Y)"
- Navigation clavier : ↑↓ pour sélectionner, Enter pour ouvrir, Esc pour fermer
- Surlignage des termes correspondants

### Résultats
- Pour entreprise : nom + couleur + typologie + secteur/ville
- Pour contact : nom + fonction + entreprise

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|---|---|
| `Cmd/Ctrl + K` | Recherche universelle |
| `N` | Nouvelle entreprise |
| `J` | Élément suivant (dans liste) |
| `K` | Élément précédent |
| `Enter` | Ouvrir fiche élément sélectionné |
| `Esc` | Fermer modal / panneau |
| `Cmd/Ctrl + S` | Sauvegarder fiche en cours |
| `?` | Afficher tous les raccourcis |
| `1` `2` `3` `4` | Changer couleur (sur fiche ou liste sélectionnée) |
| `G + M` | Aller à Prospection Mobile |
| `G + B` | Aller à Prospection Blue |
| `G + C` | Aller à Clients existants |
| `G + D` | Aller au Dashboard |

## 📅 Système de relances

### Création
- Sur une fiche : sélectionner "Date prochaine relance"
- Optionnel : ajouter une note de relance
- Sauvegarde automatique

### Affichage
- Badge sur sidebar "Aujourd'hui (X)" mis à jour en temps réel
- Vue "Aujourd'hui" liste toutes les relances du jour + en retard
- Sur fiche : alerte rouge si date dépassée

### Notifications
- À l'ouverture de l'app : notification navigateur "Vous avez X relances aujourd'hui"
- Demande de permission navigateur au premier usage
- Click sur notification → ouvre l'app sur la vue "Aujourd'hui"

### Actions
- "Faire" → ouvre la fiche
- "Reporter" → demande nouvelle date
- "Annuler" → supprime la relance

## 📥 Import Excel

### UI
- Bouton "Importer" dans header de chaque vue typologie
- Drag & drop zone OU sélection de fichier
- Détection automatique du type (mobile/blue/client) basée sur les colonnes
- Modal de mapping : "Cette colonne du fichier = quel champ ?" si auto-détection floue

### Process
1. Upload fichier
2. Détection structure
3. Preview 5 premières lignes + mapping colonnes
4. Validation utilisateur
5. Détection des doublons (par nom + IDE)
6. Modal : "X nouvelles entreprises | Y doublons trouvés. Que faire des doublons ?"
   - Options : Ignorer / Mettre à jour / Créer quand même
7. Import + barre de progression
8. Résumé : "X entreprises importées, Y mises à jour, Z ignorées"

## 📤 Export Excel

- Bouton "Exporter" dans header
- Options : Tous / Sélection actuelle / Filtres actifs
- Format : .xlsx avec mise en forme (couleurs, freeze panes)
- Téléchargement automatique
- Backup JSON automatique 1x/semaine (téléchargement local)

## 📊 Statistiques

### KPIs globaux
- Total entreprises par typologie
- Répartition par couleur (camembert)
- Taux de conversion (vert / total)
- Évolution temporelle (graphique sur 12 mois)

### Pipeline Blue (spécifique)
- Funnel : Prospects → Contactés → RDV → Offre envoyée → Signé
- Valeur potentielle (si renseignée)

### Activité commerciale
- Nombre d'emails envoyés / mois
- Nombre d'appels / mois
- Nombre de RDV / mois
- Top 10 secteurs

## ⚙️ Paramètres

- Profil : email, mot de passe (changement)
- Préférences : dark mode, langue (FR par défaut)
- Notifications : on/off par type
- Templates email : édition des templates par typologie
- Données : export complet (JSON), suppression compte
- À propos : version, contact support

## 📱 Responsive mobile

### < 768px
- Sidebar devient menu burger
- Liste : moins de colonnes visibles (priorité : couleur, nom, ville)
- Kanban : scroll horizontal entre colonnes
- Fiche : plein écran (pas de panneau latéral)
- Actions : icônes uniquement, pas de texte
- Recherche : bouton dédié dans header

### Tablettes (768-1024px)
- Sidebar visible mais compacte
- Liste : toutes colonnes essentielles
- Fiche : 60% de l'écran

## 🌙 Dark mode (V1.1+)

- Toggle dans paramètres
- Persistant par utilisateur
- Charte couleurs adaptée (voir README design)

## 🎨 Détails UI premium

### Micro-interactions
- Hover sur ligne : surbrillance subtile + ombre
- Click sur bouton : feedback visuel (scale + ripple)
- Transitions : 150-200ms ease-out
- Skeleton loaders pendant chargement (pas de spinner basique)

### Empty states
- Pas de prospects → illustration sympa + "Importer vos données" CTA
- Filtres trop restrictifs → "Aucun résultat" + "Réinitialiser les filtres"

### Erreurs
- Toast notifications en bas à droite (success vert, erreur rouge, info bleu)
- Auto-dismiss après 5s
- Bouton X pour fermer manuellement

### Auto-save
- Sauvegarde automatique avec debounce 500ms
- Indicateur "Enregistré" en bas
- En cas d'erreur réseau : queue locale + retry

---

## ✅ Définition de "fini" pour la V1

L'app est V1-complete quand :
1. ✅ Login fonctionnel + données sécurisées par RLS
2. ✅ Les 1801 entreprises sont importées et navigables
3. ✅ Les 3 vues typologies fonctionnent avec liste + Kanban
4. ✅ Le code couleur est partout (création, édition, filtres)
5. ✅ Fiche détaillée avec édition complète
6. ✅ Historique des interactions ajoutable
7. ✅ Recherche universelle Cmd+K opérationnelle
8. ✅ Système de relances avec notifications
9. ✅ Import Excel additionnel fonctionnel
10. ✅ Export Excel fonctionnel
11. ✅ Responsive mobile correct
12. ✅ Multi-appareils via Supabase Realtime
13. ✅ Performance fluide < 200ms par action
14. ✅ Design "ultra-premium" assumé (Inter, espacements, animations)
