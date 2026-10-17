# NEXUSLAB — Guide de référence de la plateforme

Ce document décrit le rôle de chaque fichier du projet pour vous aider à trouver rapidement ce que vous souhaitez modifier ou améliorer.

---

## 1. Configuration et infrastructure

| Fichier | Rôle |
|---|---|
| `package.json` | Liste des dépendances (React, Supabase, Tailwind, icônes Lucide) et scripts (build, lint, typecheck). |
| `vite.config.ts` | Configuration du moteur de construction (Vite) et du raccourci `@/` vers `src/`. |
| `tailwind.config.js` | Configuration du système de design Tailwind (couleurs, polices, animations). |
| `postcss.config.js` | Traitement CSS (autoprefixes + Tailwind). |
| `tsconfig.app.json` / `tsconfig.json` / `tsconfig.node.json` | Configuration TypeScript. |
| `eslint.config.js` | Règles de qualité de code. |
| `index.html` | Point d'entrée HTML du site. |
| `.env` | Clés de connexion à la base de données Supabase (déjà configurées). |

---

## 2. Cœur de l'application

| Fichier | Rôle |
|---|---|
| `src/main.tsx` | Démarrage de l'application React. |
| `src/App.tsx` | **Aiguilleur principal.** Associe chaque URL (route) à la page correspondante. C'est ici que les pages sont branchées. |
| `src/index.css` | Styles globaux (couleurs, polices, utilitaires Tailwind personnalisés). |

---

## 3. Bibliothèques partagées (`src/lib/`)

| Fichier | Rôle |
|---|---|
| `src/lib/router.tsx` | **Système de navigation.** Définit toutes les routes (URL) du site et la fonction `parseRoute` qui transforme une URL en page. Pour ajouter une nouvelle page, il faut ajouter sa route ici. |
| `src/lib/auth.tsx` | **Gestion de la connexion.** Fournit la connexion, l'inscription, la déconnexion et les infos de l'utilisateur connecté (rôle admin/éditeur/utilisateur). |
| `src/lib/supabase.ts` | Connexion à la base de données Supabase. |
| `src/lib/types.ts` | **Toutes les définitions de données.** Types, statuts, libellés et couleurs pour les opportunités, vidéos, clubs, projets, activités, galerie, etc. |
| `src/lib/utils.ts` | **Fonctions utilitaires.** Conversion de texte (slugify), extraction d'ID YouTube, formatage de dates, calcul de dates limites, et **algorithme de recommandation** (`computeRecommendation`) qui fait correspondre les opportunités au profil de l'utilisateur. |

---

## 4. Composants réutilisables (`src/components/`)

| Fichier | Rôle |
|---|---|
| `src/components/Layout.tsx` | **En-tête et pied de page du site.** Le menu de navigation principal, le logo, le menu utilisateur (connexion, profil, admin) et le footer. |
| `src/components/UI.tsx` | Petites pièces d'interface réutilisables : indicateur de chargement, état vide, badges. |
| `src/components/OpportunityCard.tsx` | **Carte d'opportunité.** Affiche une opportunité dans le catalogue et les recommandations, avec bouton favori, statut et date limite. |
| `src/components/VideoCard.tsx` | **Carte vidéo.** Affiche une vidéo YouTube avec miniature, catégorie et lien. |

---

## 5. Pages publiques — Plateforme principale (`src/pages/`)

| Fichier | Rôle |
|---|---|
| `src/pages/HomePage.tsx` | **Page d'accueil.** Présentation de NexusLab, statistiques, opportunités récentes, vidéos populaires, appel à l'action. |
| `src/pages/CatalogPage.tsx` | **Catalogue d'opportunités.** Liste filtrable par catégorie, niveau, mot-clé. Recherche textuelle. |
| `src/pages/OpportunityDetailPage.tsx` | **Page de détail d'une opportunité.** Toutes les infos : description, critères, documents, date limite, lien de candidature, bouton favori, signalement. |
| `src/pages/QuestionnairePage.tsx` | **Questionnaire de personnalisation.** L'utilisateur indique son niveau, ses objectifs, son domaine, sa destination. Les réponses alimentent les recommandations. |
| `src/pages/PourToiPage.tsx` | **Page « Pour toi ».** Affiche les opportunités recommandées selon les réponses au questionnaire, avec score et raisons du match. |
| `src/pages/FavoritesPage.tsx` | **Page des favoris.** Liste des opportunités que l'utilisateur a sauvegardées. |
| `src/pages/VideosPage.tsx` | **Bibliothèque vidéo.** Vidéos pédagogiques filtrables par catégorie et niveau. |
| `src/pages/ProfilePage.tsx` | **Profil utilisateur.** Modification du nom d'affichage, mot de passe, voir son rôle et son questionnaire. |
| `src/pages/UserDashboardPage.tsx` | **Tableau de bord utilisateur.** Vue d'ensemble : favoris, recommandations, vidéos, statut du questionnaire. |
| `src/pages/AuthPages.tsx` | **Connexion et inscription.** Pages de connexion et de création de compte. |
| `src/pages/StaticPages.tsx` | Pages statiques : À propos, Contact, Politique de confidentialité, Mentions légales, page 404. |

---

## 6. Pages Hub — Espace communautaire (`src/pages/hub/`)

| Fichier | Rôle |
|---|---|
| `src/pages/hub/HubPages.tsx` | **Pages principales du Hub.** Accueil du Hub, liste des activités, liste des clubs, liste des projets, galerie des réalisations. |
| `src/pages/hub/HubDetailPages.tsx` | **Pages de détail du Hub.** Détail d'une activité (avec inscription), détail d'un club (avec adhésion), détail d'un projet (avec demande de participation). |
| `src/pages/hub/AdminHubPages.tsx` | **Administration du Hub.** Gérer les activités, modérer les clubs (approuver/refuser), modérer les projets, gérer la galerie. |

---

## 7. Pages Administration (`src/pages/admin/`)

| Fichier | Rôle |
|---|---|
| `src/pages/admin/AdminLayout.tsx` | **Tableau de bord admin.** Vue d'ensemble avec statistiques et liens vers toutes les sections d'administration. |
| `src/pages/admin/AdminOpportunityEditPage.tsx` | **Édition d'une opportunité.** Formulaire complet pour créer ou modifier une opportunité (titre, description, catégorie, dates, liens, critères, etc.). |
| `src/pages/admin/AdminPages.tsx` | **Autres pages admin.** Gestion des vidéos, des catégories, des utilisateurs et des signalements. |

---

## 8. Base de données (`supabase/migrations/`)

| Fichier | Rôle |
|---|---|
| `supabase/migrations/20261016012929_nexuslab_core_schema.sql` | **Schéma principal.** Tables : profils, catégories, domaines d'étude, opportunités, vidéos, favoris, questionnaires, signalements, audit. Inclut les politiques de sécurité (RLS). |
| `supabase/migrations/20261016085343_nexuslab_hub_schema.sql` | **Schéma du Hub.** Tables : activités, inscriptions, clubs, membres, demandes d'adhésion, projets, galeries, compétences. Inclut les politiques de sécurité (RLS). |

---

## Où aller pour...

| Je veux... | Fichier à modifier |
|---|---|
| Changer le menu de navigation | `src/components/Layout.tsx` |
| Modifier les couleurs ou le design global | `src/index.css` et `tailwind.config.js` |
| Ajouter une nouvelle page | `src/lib/router.tsx` (route) + `src/App.tsx` (branchement) + nouveau fichier dans `src/pages/` |
| Changer l'algorithme de recommandation | `src/lib/utils.ts` (fonction `computeRecommendation`) |
| Modifier les types de données ou les statuts | `src/lib/types.ts` |
| Modifier la page d'accueil | `src/pages/HomePage.tsx` |
| Changer le catalogue ou ses filtres | `src/pages/CatalogPage.tsx` |
| Modifier le questionnaire | `src/pages/QuestionnairePage.tsx` |
| Modifier la base de données | `supabase/migrations/` (nouvelle migration SQL) |
| Gérer l'affichage d'une carte d'opportunité | `src/components/OpportunityCard.tsx` |
| Modifier une page du Hub | `src/pages/hub/HubPages.tsx` ou `HubDetailPages.tsx` |
| Modifier l'administration | `src/pages/admin/` ou `src/pages/hub/AdminHubPages.tsx` |

---

## Charte graphique

- **Couleur principale (fond sombre) :** `#080808` (presque noir)
- **Couleur d'accent (jaune) :** `#FFD400`
- **Icônes :** Lucide React (`lucide-react`)
- **Police :** Tailwind par défaut (sans-serif)
- **Langue de l'interface :** Français
