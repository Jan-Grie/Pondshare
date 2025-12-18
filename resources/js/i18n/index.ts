import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

//Import Namespaces
import enCommon from "./resources/en/common.json";
import enAuth from "./resources/en/auth.json";
import enBin from "./resources/en/bin.json";
import enPonds from "./resources/en/ponds.json";
import enDashboard from "./resources/en/dashboard.json";
import enSidebar from "./resources/en/sidebar.json";
import enErrors from "./resources/en/errors.json";
import enSettings from "./resources/en/settings.json";

//German Imports
import deCommon from "./resources/de/common.json";



const initialLanguage = (window as any).APP_LOCALE || "en";

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
                bin: enBin,
                ponds: enPonds,
                dashboard: enDashboard,
                sidebar: enSidebar,
                errors: enErrors,
                settings: enSettings,
            },
            de: {
                common: deCommon,
            }
        },
        defaultNS: 'common',
        ns: ['common', 'auth', 'bin', 'ponds', 'dashboard', 'sidebar', 'errors', 'settings'],
    })

export default i18n;