# READ ME DU PROJET HARMONY MOBILE 

## OBJECTIF

Le but est de faire une version mobile de l'application chat Harmony connectée à la même API Laravel que la version desktop,
tout en utilisant Expo et React Native.

## CHOIX TECHNIQUES
- Expo
- React-Native
- JAVASCRIPT
- NodeJS
- HTML/CSS
- I18n
- expo-router (stack navigation)
- echo
- pusher-js
- rsa encryption(pour les messages) et aes encryption (pour encrypter la clé privé) 
## PRÉREQUIS
- NodeJS
- npm ou yarn
- Un éditeur de texte (Visual Studio Code, WebStorm, etc.)
- Un terminal (Git Bash, PowerShell, cmd, wsl, etc.)
- Un accès a l'application backend (Laravel)
- Une connexion internet

## INSTALLATION ET LANCEMENT DU PROJET
1. Cloner le dépôt GitHub du projet avec la commande `git clone <https://github.com/Poro007/harmony_expo.git>`.
2. Ouvrir le terminal et naviguer jusqu'au répertoire du projet.
3. Installer les dépendances du projet en utilisant la commande `npm install`.
4. Installer les bonnes versions des packages, si besoin, avec `npx expo install`.
5. Configurer l'application backend (Laravel) en suivant les instructions dans son README.
6. Dans le fichier apiManager.js, changer l'URL de base pour qu'elle pointe vers l'adresse du serveur backend. 
(https://definitelynotharmony.dev/ ou utiliser l'adresse IP locale si vous testez en local)
7. on doit créer les paires de clés rsa par electron pour que l'encryption fonctionne. on peut faire ca en ce connectaint au différent compte en prenant les infos dans le seeder
8. Démarrer l'application en utilisant la commande `npx expo start`.
9. Scanner le QR code avec l'application Expo Go sur votre appareil mobile pour lancer l'application.


## TEST
Les tests sont fait manuellement en utilisant l'application sur un appareil mobile.
Changer de compte permet de voir qu'il y a bien une persistance des données.
Enlever la connexion internet permet de tester la detection reseau, etc.

## LIMITATIONS ET AMÉLIORATIONS FUTURES
- L'application pourrait être plus belle, mais elle répond aux besoins de base.
- Il n'y a pas de build pour le moment. (spoiler, y'en auras jamais)

## BUG ET AUTRES
- l'encryption était inexistante au début de ce controle, elle est maintenant fonctionnelle mais pas optimale.

 - Il est beaucoup trop long de créer les paires de clés rsa coter mobile, donc, on doit créer les clés avec l'application electron.
 - l'application crash si on fait trop de chose en même temps, l'encryption/décryption est très lourde aussi et ralentis l'application. donc il faut y aller lentement. avec l'application. 
 - quand il y à trop de messages, l'application met du temps à charger. il n'y a pas vraiment de fix pour le moment.
## DETTE TECHNIQUE

#### Auteurs
- Eddi Rousseau
- Alex Heroux
- Maxime Nobert
- Tommy Desjardins

