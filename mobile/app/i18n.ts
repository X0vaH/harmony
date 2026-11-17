// i18n.js
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import Backend from "i18next-http-backend";

import enTranslation from '../public/locales/en/translation.json';
import frTranslation from '../public/locales/fr/translation.json';

// eslint-disable-next-line import/no-named-as-default-member
i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation,
            },
            fr: {
                translation: frTranslation,
            },
        },
        lng: 'fr', // default language
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false, // react already escapes by default
        },
    });

export default i18n;