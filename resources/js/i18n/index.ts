import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

//Import Namespaces
import enCommon from "./resources/en/common.json";

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
            },
        },
        defaultNS: 'common',
        ns: ['common'],
    })

export default i18n;