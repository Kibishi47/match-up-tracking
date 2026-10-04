# Feuille de Route & Liste des Tâches (Backlog)

Ce document répertorie l'ensemble des chantiers et évolutions du projet, organisés selon **3 niveaux de priorité stratégique**.

---

## 🔴 Priorité 1 — Mobile PWA & Expérience Hors-Ligne (Immédiat)

Amélioration critique de la robustesse et du confort visuel sur smartphone et application installée.

- [ ] **Correction définitive du flou / voile sur le header iOS en mode PWA**
  - *Problème :* Sur iOS en mode application installée (PWA standalone), WebKit applique un voile ou flou translucide au niveau de la barre d'état et du dessus de l'en-tête, dégradant la netteté du design sombre.
  - *Pistes de résolution :*
    - Éliminer toute interférence de WebKit via un faux bloc de status bar opaque fixe (`div` d'arrière-plan rigide `h-[env(safe-area-inset-top)]` à fond uni).
    - Tester l'interaction entre `viewport-fit=cover`, `theme-color`, et les variantes de `apple-mobile-web-app-status-bar-style` (`default`, `black-translucent`, ou retrait pour laisser le contrôle à `theme-color`).
    - Empêcher tout débordement ou propagation d'effet de calque sur l'élément `<header>`.

- [ ] **Mode Hors-Connexion PWA & Synchronisation Automatique en Base de Données**
  - *Objectif :* Permettre à un joueur d'utiliser l'application sans interruption dans des lieux à faible réseau (ex: salles de tournois en sous-sol, conventions) :
    1. **Stockage local des actions :** Enregistrement des matchs, notes et changements de configuration dans le stockage local (IndexedDB via Dexie / idb ou LocalStorage) si `navigator.onLine === false` ou en cas d'échec réseau.
    2. **File d'attente de synchronisation (Sync Queue) :** Dès que la connexion Internet est rétablie (écouteur `online` et retry automatique), envoi séquentiel des actions en attente vers l'API et la base de données PostgreSQL.
    3. **Indicateur visuel d'état :** Badge discret indiquant l'état ("Hors ligne", "Synchronisation en cours...", "Tout est synchronisé") avec le nombre d'actions en attente.
    4. **Cache de consultation :** Mise en cache des archétypes, métas et derniers matchs via le Service Worker pour consulter ses stats et son deck sans aucun chargement.

---

## 🟠 Priorité 2 — Conformité Légale & RGPD (Obligations Européennes)

Mise en conformité juridique complète avant l'ouverture à un public élargi et l'arrivée de la publicité/monétisation.

- [ ] **Bannière et Gestionnaire de Consentement Cookies / Traceurs (RGPD & ePrivacy)**
  - *Obligation légale :* Requis dès lors que des cookies tiers, des publicités ou des outils d'analyse d'audience sont intégrés.
  - *Spécifications :*
    - Bandeau d'information clair avec choix équilibrés : **« Tout accepter »**, **« Tout refuser »** et **« Paramétrer »**.
    - Blocage strict de tout chargement de script publicitaire ou analytique tant que l'accord n'a pas été donné.
    - Mémorisation du choix et possibilité pour l'utilisateur de modifier ses préférences à tout moment depuis les paramètres du compte ou le pied de page.

- [ ] **Politique de Confidentialité & Mentions Légales dédiées**
  - *Obligation légale :* Mise en ligne de pages transparentes accessibles depuis l'application (`/privacy` et `/terms`).
  - *Contenu :*
    - Détail des données collectées (compte Discord : pseudo, avatar, ID Discord ; parties saisies, archétypes et statistiques).
    - Base légale et finalité des traitements (authentification, calcul des statistiques).
    - Durées de conservation et droits des utilisateurs (accès, rectification, suppression).

- [ ] **Portabilité & Export des Données Utilisateur (Droit d'accès RGPD)**
  - *Objectif :* Permettre à chaque joueur d'exporter l'intégralité de son historique (matchs, notes, archétypes, winrates) en un clic au format JSON standardisé dans la page des Paramètres.
  - *Bénéfice :* Respect de l'article 20 du RGPD et garantie pour l'utilisateur de conserver ses données.

---

## 🟡 Priorité 3 — Monétisation, Nom de Domaine & Modèle Économique

Assurer la viabilité financière de la plateforme pour couvrir l'achat d'un nom de domaine propre et les coûts d'infrastructure.

- [ ] **Page et Système de Don / Soutien (Donateurs & Supporters)**
  - *Objectif :* Permettre aux joueurs réguliers de soutenir le projet financièrement pour financer le nom de domaine et le serveur.
  - *Spécifications :*
    - Création d'une page dédiée `/support` ou `/donate` expliquant les coûts de fonctionnement.
    - Liens ou intégration simplifiée vers des plateformes reconnues et sécurisées (Ko-fi, Buy Me a Coffee, Stripe Payment Links ou GitHub Sponsors).
    - Attribution d'un badge ou rôle "Supporter" valorisant l'utilisateur sur son profil et le menu utilisateur.

- [ ] **Intégration d'Espaces Publicitaires Éthiques et Non-Intrusifs**
  - *Objectif :* Monétiser l'audience gratuite sans dégrader l'ergonomie de jeu :
    - Emplacements discrets (ex: bas de page ou encart dédié dans les statistiques), sans jamais bloquer la saisie rapide des matchs.
    - Intégration d'une régie publicitaire conforme (Google AdSense, EthicalAds ou régie orientée TCG).
    - Conditionnement direct au consentement préalable des cookies publicitaires (RGPD).

- [ ] **Avantage Supporter : Expérience 100% sans publicité (Ad-Free)**
  - *Spécification :* Désactivation automatique de tous les encarts publicitaires pour les utilisateurs ayant fait un don ou disposant du statut "Supporter" (champ booléen `isSupporter` en base de données).

- [ ] **Migration & Déploiement sur Nom de Domaine Personnalisé**
  - *Spécifications :*
    - Configuration DNS (A/CNAME), certificat SSL automatique (Let's Encrypt / Cloudflare).
    - Adaptation des URLs de redirection OAuth Discord (`NUXT_OAUTH_DISCORD_REDIRECT_URL`).
    - Mise à jour des balises canonical, Open Graph URL absolue et génération automatique d'un `sitemap.xml` et `robots.txt` optimisés.
