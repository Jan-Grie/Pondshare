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
import enPublic from "./resources/en/public.json";

//German Imports
import deCommon from "./resources/de/common.json";
import deAuth from "./resources/de/auth.json";
import deBin from "./resources/de/bin.json";
import dePonds from "./resources/de/ponds.json";
import deDashboard from "./resources/de/dashboard.json";
import deSidebar from "./resources/de/sidebar.json";
import deErrors from "./resources/de/errors.json";
import deSettings from "./resources/de/settings.json";
import dePublic from "./resources/de/public.json";

//Dutch Imports
import nlCommon from "./resources/nl/common.json";
import nlAuth from "./resources/nl/auth.json";
import nlBin from "./resources/nl/bin.json";
import nlPonds from "./resources/nl/ponds.json";
import nlDashboard from "./resources/nl/dashboard.json";
import nlSidebar from "./resources/nl/sidebar.json";
import nlErrors from "./resources/nl/errors.json";
import nlSettings from "./resources/nl/settings.json";
import nlPublic from "./resources/nl/public.json";


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
                public: enPublic,
            },
            de: {
                common: deCommon,
                auth: deAuth,
                bin: deBin,
                ponds: dePonds,
                dashboard: deDashboard,
                sidebar: deSidebar,
                errors: deErrors,
                settings: deSettings,
                public: dePublic,
            },
            nl: {
                common: nlCommon,
                auth: nlAuth,
                bin: nlBin,
                ponds: nlPonds,
                dashboard: nlDashboard,
                sidebar: nlSidebar,
                errors: nlErrors,
                settings: nlSettings,
                public: nlPublic,
            }
        },
        defaultNS: 'common',
        ns: ['common', 'auth', 'bin', 'ponds', 'dashboard', 'sidebar', 'errors', 'settings', 'public'],
    })

export default i18n;
