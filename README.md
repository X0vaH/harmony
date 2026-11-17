# 💬 Harmony — Messagerie multiplateforme chiffrée

**Harmony** est une application de clavardage **multiplateforme** (desktop + mobile) inspirée de Discord : salons, messages privés, liste d'amis, présence en temps réel et **chiffrement de bout en bout des messages privés** (RSA + AES).

Les deux clients — une application **Electron** pour ordinateur et une application **Expo / React Native** pour mobile — partagent une même **API Laravel** avec WebSockets (Laravel Reverb).

> Projet d'équipe réalisé dans le cadre du cours de développement multiplateforme au cégep. Ce dépôt regroupe les trois dépôts d'origine (API, desktop, mobile) en un seul monorepo.

---

## ✨ Fonctionnalités

- **Comptes** : inscription, connexion par jeton (Laravel Sanctum), profil avec photo, préférences (langue FR/EN, mode sombre).
- **Salons** de discussion avec gestion des membres.
- **Messages privés (DM)** chiffrés de bout en bout :
  - paire de clés **RSA** par utilisateur pour chiffrer les messages ;
  - clé privée chiffrée en **AES** avant d'être stockée sur le serveur.
- **Temps réel** via WebSockets (Laravel Reverb + Laravel Echo / Pusher JS) : nouveaux messages, présence en ligne, indicateur « en train d'écrire ».
- **Amis** : ajout et liste d'amis.
- **Tags** sur les messages.
- **Panneau d'administration** : suppression d'utilisateurs, de salons et de messages.
- **Détection réseau** : file d'attente des messages hors ligne, envoi différé au retour de la connexion.
- **Internationalisation** (i18next) : français et anglais.
- Suivi des erreurs avec **Sentry**.

## 🧱 Stack technique

| Partie | Technologies |
| --- | --- |
| API (`api/`) | PHP 8.2+, Laravel 12, Sanctum, Reverb (WebSockets), MySQL 8, Redis, Docker Compose, Nginx |
| Desktop (`desktop/`) | Electron, React 18, Vite, Bootstrap / React-Bootstrap, Laravel Echo, Pusher JS, node-forge (RSA/AES), i18next |
| Mobile (`mobile/`) | Expo 54, React Native 0.81, Expo Router, Laravel Echo, Pusher JS, i18next |

## 🗂️ Structure du dépôt

```
harmony/
├── api/        API REST + WebSockets (Laravel, Reverb, MySQL, Redis)
├── desktop/    Client ordinateur (Electron + React + Vite)
└── mobile/     Client mobile (Expo / React Native)
```

Architecture :

```
 Desktop (Electron) ─┐                ┌─► MySQL
                     ├─ HTTP /api ───►│ Laravel (app :8000)
 Mobile (Expo) ──────┤                └─► Redis ◄─► bridge (pub/sub)
                     └─ WebSocket ───► Reverb :8080
```

---

## 🚀 Installation et lancement

### Prérequis

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (avec WSL 2 sur Windows)
- [Node.js](https://nodejs.org/) 20+ et npm
- Pour le mobile : l'application **Expo Go** sur un téléphone (Android / iOS) ou un émulateur

```bash
git clone https://github.com/X0vaH/harmony.git
cd harmony
```

### 1. Lancer l'API (`api/`)

```bash
cd api
cp .env.example .env
```

Dans `api/.env`, ajuster pour un usage local :

```env
APP_URL=http://localhost:8000
REVERB_APP_ID=harmony
REVERB_APP_KEY=harmony-key
REVERB_APP_SECRET=harmony-secret
REVERB_HOST=reverb
REVERB_PORT=8080
REVERB_SCHEME=http
```

Installer les dépendances PHP (aucune installation locale de PHP requise) :

```bash
docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html \
  laravelsail/php84-composer:latest composer install --ignore-platform-reqs
```

> Sur Windows, exécuter cette commande dans un terminal **WSL**.

Démarrer les services (sans le conteneur `nginx`, qui sert uniquement en production avec HTTPS) :

```bash
docker compose up -d --build app mysql redis reverb bridge
```

Générer la clé et préparer la base de données :

```bash
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate:fresh --seed --force
```

L'API est alors disponible sur <http://localhost:8000/api> et le serveur WebSocket sur `ws://localhost:8080`.

Les comptes de test créés par les seeders se trouvent dans `api/database/seeders/`.

### 2. Pointer les clients vers l'API locale

Par défaut, les clients pointent vers le serveur de production du projet. Pour un usage local, remplacer `https://definitelynotharmony.dev` par l'adresse de votre API :

| Client | Fichiers à modifier |
| --- | --- |
| Desktop | `desktop/src/data/apiManager.js`, `desktop/src/data/useDmKeys.js`, `desktop/src/components/Auth.jsx`, `desktop/src/components/AdminPanel.jsx` → `http://localhost:8000/api` |
| Desktop (WebSocket) | `desktop/src/lib/echo.js` → `key: "harmony-key"`, `wsHost: "localhost"` |
| Mobile | `mobile/data/apiManager.js` → `http://<IP-de-votre-PC>:8000/api` |
| Mobile (WebSocket) | `mobile/data/echo.js` → `key: "harmony-key"`, `wsHost: "<IP-de-votre-PC>"` |

> 📱 Sur téléphone, `localhost` désigne le téléphone lui-même : utiliser l'adresse IP locale de l'ordinateur (ex. `192.168.1.42`, voir `ipconfig` / `ip a`). Le téléphone et l'ordinateur doivent être sur le même réseau Wi-Fi.

Astuce pour tout remplacer d'un coup :

```bash
grep -rl "https://definitelynotharmony.dev" desktop/src | xargs sed -i 's#https://definitelynotharmony.dev#http://localhost:8000#g'
```

### 3. Lancer le client desktop (`desktop/`)

```bash
cd desktop
npm install
npm run dev
```

La fenêtre Electron s'ouvre automatiquement.

**Important :** se connecter au moins une fois avec chaque compte depuis le client **desktop** afin de générer les paires de clés RSA (la génération est trop lente sur mobile). À refaire après chaque `migrate:fresh`.

Générer un exécutable :

```bash
npm run make      # Electron Forge (installateur Windows / .deb / .rpm / .zip)
```

### 4. Lancer le client mobile (`mobile/`)

```bash
cd mobile
npm install
npx expo install --fix   # aligne les versions des paquets avec Expo
npx expo start
```

Scanner le code QR avec **Expo Go** (Android) ou l'appareil photo (iOS). Raccourcis : `a` pour un émulateur Android, `w` pour la version web.

---

## 🧪 Tests

Les tests ont été principalement réalisés manuellement :

- requêtes de l'API avec **Postman** ;
- changement de compte pour valider la persistance des données ;
- simulation d'une perte de connexion (DevTools / mode avion) pour tester la détection réseau et l'envoi différé.

Lint :

```bash
cd desktop && npm run lint
cd mobile && npx expo lint
```

## ⚠️ Limitations connues

- Le chiffrement/déchiffrement RSA est coûteux et peut ralentir le client mobile lorsqu'il y a beaucoup de messages.
- Les paires de clés RSA doivent être générées depuis le client desktop.
- Certains endpoints de l'API mériteraient une optimisation.

## 📚 Documentation complémentaire

- [api/README.md](api/README.md) — API (endpoints principaux, diagramme UML)
- [desktop/README.md](desktop/README.md) — client Electron
- [mobile/README.md](mobile/README.md) — client Expo

## 👥 Équipe

- **Alex Héroux** ([@X0vaH](https://github.com/X0vaH))
- Eddi Rousseau
- Maxime Nobert
- Tommy Desjardins

Dépôts d'origine : [multiplateforme-harmony-API](https://github.com/Poro007/multiplateforme-harmony-API) · [projet-multiplateforme-harmony](https://github.com/Poro007/projet-multiplateforme-harmony) · [harmony_expo](https://github.com/Poro007/harmony_expo)
