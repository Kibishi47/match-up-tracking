# TCG Matchup Tracking

Application web de suivi de confrontations et de statistiques (matchups) pour les Trading Card Games (Disney Lorcana, Magic: The Gathering, Pokémon, One Piece, Star Wars Unlimited, etc.).

## 🚀 Stack Technique

- **Framework :** [Nuxt 3](https://nuxt.com/) (SSR activé) + TypeScript
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) (Thème Dark Mode moderne, glassmorphism & responsive)
- **Base de données & ORM :** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`
- **Authentification :** [`nuxt-auth-utils`](https://github.com/atinux/nuxt-auth-utils) (OAuth Discord uniquement)
- **Déploiement :** Docker / Docker Compose compatible [Coolify](https://coolify.io/)

---

## ✨ Fonctionnalités Clés

1. **Authentification Discord & Rôles :**
   - Connexion unique et sécurisée via Discord OAuth2.
   - Session chiffrée côté serveur.
   - **Règle du premier inscrit :** Le tout premier utilisateur à se connecter prend automatiquement le rôle `admin`. Tous les suivants sont `user`.
   - Protection granulaire par middlewares et helpers serveur (`requireAuthUser`, `requireAdminUser`).

2. **Catalogue Global des Jeux (Admin) :**
   - CRUD complet des jeux TCG (`/admin/games`) réservé aux administrateurs.
   - Gestion des noms, slugs uniques et logos.
   - Sélection des jeux par les utilisateurs.

3. **Archétypes 100% Isolés par Utilisateur :**
   - Chaque joueur gère ses propres archétypes pour chaque jeu (`/archetypes`).
   - Deux emplacements pour les cartes clés avec illustrations (URLs) et noms.
   - Isolation stricte au niveau de la base de données : aucun utilisateur ne peut voir ni modifier les archétypes d'un autre joueur.

4. **Tracking de Matchups Haute Vitesse :**
   - Sélecteur rapide du jeu et de « Mon deck actuel ».
   - Grille visuelle de tous les decks du metagame adverse avec prévisualisation des cartes clés.
   - Boutons instantanés **Victoire (W)** et **Défaite (L)** : un clic enregistre la partie en temps réel.
   - **Protection anti miss-clic (10s) :** Toast persistant pendant 10 secondes avec compte à rebours, permettant d'annuler immédiatement le match ou d'ouvrir une modale pour éditer les résultats et ajouter des notes de match.
   - Historique récent éditable avec calcul des winrates en direct (global et par adversaire).

---

## 🛠️ Installation & Démarrage Local

### 1. Variables d'environnement
Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```
Renseignez vos identifiants d'application Discord :
- `NUXT_OAUTH_DISCORD_CLIENT_ID`
- `NUXT_OAUTH_DISCORD_CLIENT_SECRET`
*(Dans le portail développeur Discord, ajoutez l'URL de redirection : `http://localhost:3000/auth/discord`)*

### 2. Démarrage avec Docker Compose (recommandé en dev)
Lance l'application avec rechargement à chaud (hot-reload) et le conteneur PostgreSQL :
```bash
# Met à jour automatiquement l'IP locale dans .env puis lance les conteneurs avec build :
make dev

# Ou sans rebuild des images :
make up

# Pour arrêter les conteneurs :
make stop

# Pour arrêter et supprimer les conteneurs et réseaux :
make down

# Pour uniquement rafraîchir l'IP locale dans le fichier .env :
make ip
```
L'adresse IP locale de votre machine (ex: `192.168.4.80`) est automatiquement détectée et injectée dans le fichier `.env` et dans Nuxt pour afficher le bon QR Code et permettre l'accès direct depuis votre smartphone / iPhone sur le même réseau Wi-Fi.

L'application est accessible sur : `http://localhost:3000` et sur votre réseau local via `http://<VOTRE_IP_LOCALE>:3000`.

### 3. Migrations de base de données
Appliquer les migrations SQL Drizzle :
```bash
npm run db:migrate
```
Pour inspecter visuellement les tables via Drizzle Studio :
```bash
npm run db:studio
```

---

## 🚢 Déploiement en Production (Coolify)

Le fichier `docker-compose.prod.yml` et le `Dockerfile` multi-stage sont optimisés pour Coolify :
- Build léger en 2 étapes (Node 22 Alpine).
- En production, la base PostgreSQL est gérée par Coolify en tant que ressource indépendante.
- L'image de production exécute le serveur Nitro autonome (`node .output/server/index.mjs`) sans dépendances de développement.
