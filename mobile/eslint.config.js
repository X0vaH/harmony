// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginSecurity = require('eslint-plugin-security');

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*', 'scripts/*'],
        plugins: {
            security: eslintPluginSecurity,
        },
        rules: {
            // Active toutes les règles de sécurité recommandées
            ...eslintPluginSecurity.configs.recommended.rules,
            'security/detect-object-injection': 'off',
        },
    },
]);