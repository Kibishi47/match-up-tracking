# Feuille de Route & Liste des Tâches (Backlog)

Ce document répertorie les tâches et évolutions futures du projet, classées selon **4 niveaux de priorité**.

---

## 🔴 Priorité 1 — Correctifs UX & Stabilité Mobile (Immédiat)

Tâches critiques pour la fluidité et le confort d'utilisation au quotidien, en particulier sur smartphone.

- [x] **Verrouillage du scroll arrière-plan (Body Scroll Lock)**
  - *Problème :* Lorsqu'une modale, popup ou bottom sheet est ouverte, faire défiler le contenu entraîne souvent le scroll de la page située derrière.
  - *Solution :* Bloquer le scroll du `body` (via composable dédié `useScrollLock` ou `overflow: hidden` sur `body` / `html` avec compensation de la barre de défilement) à l'ouverture de n'importe quel composant modal ou bottom sheet.

- [x] **Correction des notifications d'annulation de match sur mobile**
  - *Problème :* Le toast / bandeau d'annulation ("Annuler le match") peut être mal positionné, tronqué ou masquer des actions clés sur mobile.
  - *Solution :* Revoir l'ancrage, le z-index, la marge inférieure (`safe-area-inset-bottom`) et s'assurer que le toast d'undo reste parfaitement accessible sans gêner la navigation.

- [x] **Refonte mobile de la section "Historique Récent" (en-tête prioritaire & lignes)**
  - *Problème :* Sur smartphone, l'en-tête de la section (titre "Historique Récent", sous-compteur de matchs et bouton "Actualiser") rend particulièrement mal visuellement (alignements rigides, texte tronqué ou tassé). La disposition des lignes de matchs peut également être perfectionnée.
  - *Solution :* Repenser en priorité l'en-tête mobile (titre épuré, badge compteur subtil, bouton actualiser compact avec icône optimisée) et harmoniser la structure des lignes de match en dessous pour un rendu fluide et équilibré.

---

## 🟠 Priorité 2 — Nettoyage UI & Hiérarchie Visuelle (Design System)

Épuration de l'interface graphique pour un rendu plus moderne, sobre et respirant.

- [x] **Allègement de la hiérarchie et suppression de la sur-imbrication ("blocs dans des blocs")**
  - *Problème :* Trop de panneaux imbriqués les uns dans les autres (panneau principal > bloc de section > cartes > sous-blocs) alourdissent la lisibilité.
  - *Solution :* Aérer l'espace avec de simples séparateurs subtils, un contraste de fond mesuré ou des espaces négatifs plutôt que d'empiler des conteneurs encadrés.

- [x] **Retrait des bordures et arrondis superflus**
  - *Problème :* Trop de `rounded-*` et bordures cumulées (notamment dans la liste de l'historique récent des matchs).
  - *Solution :* Adopter un style de liste continue plus épuré (diviseurs simples `divide-y`, sans cartes arrondies isolées pour chaque ligne d'historique).

- [x] **Harmonisation des icônes d'en-tête de modale / bottom sheet**
  - *Problème :* Les carrés arrondis colorés avec icône dans les en-têtes peuvent faire datés ou chargés.
  - *Solution :* Explorer une approche plus légère (icône monochrome intégrée au titre, badge épuré, ou absence d'icône pour laisser respirer le titre).

- [x] **Harmonisation de tous les boutons "Actualiser"**
  - *Solution :* Standardisation de l'ensemble des boutons de rafraîchissement (Dashboard, Archétypes, Administration des jeux) sur le modèle du dashboard (icône SVG réactive compacte sur mobile, texte desktop, padding et styles de hover uniformes).

- [x] **Alignement pleine largeur des actions de compte (Settings)**
  - *Solution :* Suppression des contraintes `max-w-sm` / `sm:max-w-lg` sur les boutons *Se déconnecter* et *Supprimer mon compte* pour qu'ils épousent exactement la largeur des sections au-dessus sur mobile et desktop.

---

## 🟡 Priorité 3 — Ergonomie & Expérience d'Édition (Workflows)

Amélioration des parcours de saisie et préparation à l'international.

- [ ] **Modal / Bottom Sheet pour la création et l'édition d'archétypes**
  - *Objectif :* Remplacer le formulaire fixe ou accordéon actuel de la page `/archetypes` par une expérience unifiée en modale (desktop) et bottom sheet (mobile), similaire à la sélection de deck et à l'édition de match.
  - *Bénéfice :* Cohérence absolue des interactions et libération d'espace visuel sur la page des archétypes.

- [ ] **Barre de recherche pour les archétypes (Dashboard Matchups & Page Archétypes)**
  - *Objectif :* Intégrer un champ de recherche instantané (filtrant par nom d'archétype et noms de cartes clés) :
    1. Sur la grille des **Matchups** du dashboard principal (retrouver immédiatement un adversaire pour saisir un match sans défiler).
    2. Sur la page de gestion des **Archétypes** (`/archetypes`).
  - *Bénéfice :* Saisie et navigation ultra-rapides sur les métas comportant un grand nombre d'archétypes.

- [ ] **Internationalisation du site (i18n)**
  - *Objectif :* Traduction multilingue (ex: FR / EN) via `@nuxtjs/i18n`.
  - *Règle stricte :* Conserver les termes et boutons de match en anglais universel : `Win`, `Loss` et `Draw` (ne pas les traduire en Victoire / Défaite / Nul).

- [ ] **Statistiques globales par archétype et par méta (joué & affronté)**
  - *Objectif :* Disposer d'une vue d'analyse globale des performances de chaque archétype au sein d'une méta donnée, qu'il soit joué par l'utilisateur ou affronté.
  - *Indicateurs clés :*
    - **En tant que deck joué :** Winrate global du joueur avec cet archétype, volume de parties (W/L/D) et historique agrégé.
    - **En tant qu'adversaire :** Winrate global face à cet archétype (tous mes decks confondus), volume de confrontations et taux de présence global (Show Rate) dans la méta.
    - Filtrage réactif par jeu et méta sélectionnée pour comparer la performance globale des archétypes.

---

## 🟢 Priorité 4 — Partage, Plateforme & Fonctionnalités Avancées

Évolutions majeures pour ouvrir l'application vers l'extérieur et améliorer la distribution mobile.

- [ ] **Système de partage par lien (Share Link)**
  - *Objectif :* Pouvoir générer un lien direct pour partager une vue précise, un match, un matchup ou un récapitulatif de deck.

- [ ] **Profil et statistiques en mode public**
  - *Objectif :* Permettre à un utilisateur d'exposer son tableau de bord et ses matchups publiquement en lecture seule sans exiger de compte aux visiteurs.

- [ ] **Transformation en Progressive Web App (PWA)**
  - *Objectif :* Installation de l'application sur l'écran d'accueil (iOS / Android) sans passer par les stores.
  - *Spécifications :* Web App Manifest, icônes d'application, thème splash screen, mode plein écran autonome (`standalone`) et mise en cache hors-ligne de base.
