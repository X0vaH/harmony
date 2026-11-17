<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paths
    |--------------------------------------------------------------------------
    |
    | Routes soumises au CORS. Inclure l'API, l'endpoint Sanctum si utilisé,
    | et l'endpoint d'auth de broadcasting si tu fais des canaux privés.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'broadcasting/auth',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    |
    | Méthodes HTTP autorisées. '*' pour tout (GET, POST, PUT, DELETE, etc.)
    |
    */

    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Origines autorisées. Mets ici tes frontends (Vite/React).
    | Ajoute/retire des origines selon tes besoins.
    |
    */

    'allowed_origins' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns
    |--------------------------------------------------------------------------
    |
    | Tu peux utiliser des regex ici si tu préfères des motifs (laisse vide si inutile).
    |
    */

    'allowed_origins_patterns' => [
        // Exemple: '#^http://localhost:\d+$#',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    |
    | En dev, '*' est simple et efficace (Authorization, Content-Type, etc.)
    |
    */

    'allowed_headers' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    |
    | En-têtes visibles côté client (si besoin).
    |
    */

    'exposed_headers' => [
        'Authorization',
        'X-Requested-With',
        'XSRF-TOKEN',
        'Content-Type',
    ],

    /*
    |--------------------------------------------------------------------------
    | Max Age
    |--------------------------------------------------------------------------
    |
    | Durée de cache des pré-requêtes (en secondes).
    |
    */

    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    |
    | Mets à true si tu envoies des cookies (Sanctum cross-site, etc.).
    | Pour des requêtes avec Bearer token, laisse false.
    |
    */

    'supports_credentials' => false,

];
