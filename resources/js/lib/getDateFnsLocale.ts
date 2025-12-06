import { enUS, de, fr, es } from "date-fns/locale";
export function getDateFnsLocale(i18nLocale: string) {
  switch (i18nLocale) {
    case "de":
      return de;
    case "fr":
      return fr;
    case "es":
      return es;
    default:
      return enUS;
  }
}