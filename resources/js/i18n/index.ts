import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

//Import Namespaces
import enCommon from "./resources/en/common.json";
import enAuth from "./resources/en/auth.json";

const initialLanguage = (window as any).APP_LOCAL || "en";

i18n
    .use(initReactI18next)
    .init({
        lng: initialLanguage,
        fallbackLng: 'en',

        interpolation: {
            escapeValue: false,
        },

        resources: {
            en: {
                common: enCommon,
                auth: enAuth,
            },
        },
        defaultNS: 'common',
        ns: ['common', 'auth'],
    })

export default i18n;