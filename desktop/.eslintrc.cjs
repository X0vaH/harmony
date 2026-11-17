const security = require('eslint-plugin-security');

module.exports = {
    root: true,
    env: { browser: true, es2020: true, node: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', 'security'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        // Ajouter toutes les règles de sécurité recommandées
        ...security.configs.recommended.rules,
        // Désactiver uniquement detect-object-injection
        'security/detect-object-injection': 'off',
    },
};
