# READ ME DU PROJET HARMONY

## OBJECTIF

Le but est de faire une application de chat (potentiellement vidéo et audio) multi-plateforme en utilisant electron, dans 
notre cas, avec react et vite en supplément.

## CHOIX TECHNIQUES
- Electron
- React
- Vite
- JAVASCRIPT
- NodeJS
- HTML/CSS
- bootstrap
- pusher-js
- laravel-echo
- axios
- Rsa (messages) et Aes (clé privé) encryption pour la sécurité des messages

## PRÉREQUIS
- NodeJS
- npm ou yarn
- Un éditeur de texte (Visual Studio Code, WebStorm, etc.)
- Un terminal (Git Bash, PowerShell, cmd, wsl, etc.)
- Un accès a l'application backend (Laravel)
- Une connexion internet

## INSTALLATION ET LANCEMENT DU PROJET
1. Cloner le dépôt GitHub du projet avec la commande `git clone <https://github.com/Poro007/projet-multiplateforme-harmony.git>`.
2. Ouvrir le terminal et naviguer jusqu'au répertoire du projet.
3. Installer les dépendances du projet en utilisant la commande `npm install`.
4. Configurer l'application backend (Laravel) en suivant les instructions dans son README.
5. Démarrer l'application en utilisant la commande `npm run dev`.
6. on doit créer les paires de clés rsa par electron pour que l'encryption fonctionne. on peut faire ca en ce connectaint au différent compte en prenant les infos dans le seeder. 

## BUILD
Sera effectué pour le prochain contrôle → Fait

## TEST
Pour les tests, nous utilisons surtout des tests manuels. Par exemple, pour le test de la détection réseaux, 
on doit passer par le dev tool pour simuler une perte de connexion. Dans d'autres cas, on crée des réponses automatiques.
Changer de compte permet de voir qu'il y a bien une persistance des données.

## LIMITATIONS ET AMÉLIORATIONS FUTURES
- L'application pourrait être plus belle, mais elle répond aux besoins de base.
- Optimiser les performances de l'application.

## BUG
- l'encryption était inexistante au début de ce controle, elle est maintenant fonctionnelle mais pas optimale (coter expo en tout cas ca vas bien coter électron).

 - Il est beaucoup trop long de créer les paires de clés rsa coter mobile, donc, on doit créer les clés avec l'application electron.
 - il faut aussi ce connecter a chaque compte si on refresh les migration de la database, pour créer les clés rsa.

#### Auteurs
- Eddi Rousseau
- Alex Heroux
- Maxime Nobert
- Tommy Desjardins