import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { buildWordMapTranslations, translateWorkerWord } from "./workerWordMap";

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    nativeName: "English",
    badge: "EN",
  },
  {
    code: "hi",
    label: "Hindi (हिंदी - कारीगर भाषा)",
    shortLabel: "हिंदी",
    nativeName: "हिंदी",
    badge: "हिं",
  },
  {
    code: "pa",
    label: "Punjabi (ਪੰਜਾਬੀ)",
    shortLabel: "ਪੰਜਾਬੀ",
    nativeName: "ਪੰਜਾਬੀ",
    badge: "ਪੰ",
  },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const enTranslations = {
  ...buildWordMapTranslations("en"),
  nav: {
    dashboard: "Dashboard",
    customers: "Customers",
    orders: "Orders",
    cuttingQueue: "Cutting Queue",
    measurements: "Measurements",
    services: "Services & Pricing",
    addOns: "Add-ons",
    productionCalendar: "Production Calendar",
    checkout: "Checkout",
    newOrder: "New Order",
    logout: "Logout",
    language: "Language",
  },
  stepper: {
    customer: "Customer",
    garments: "Fabric & Garments",
    measurements: "Measurements",
    payment: "Billing & Payment",
    confirm: "Confirm",
  },
};

const hiTranslations = {
  ...buildWordMapTranslations("hi"),
  nav: {
    dashboard: "होम / डैशबोर्ड",
    customers: "ग्राहक (Customers)",
    orders: "ऑर्डर लिस्ट (Orders)",
    cuttingQueue: "कटाई लिस्ट (Cutting)",
    measurements: "नाप (Measurements)",
    services: "सिलाई और रेट",
    addOns: "डिज़ाइन / एक्स्ट्रा काम",
    productionCalendar: "काम का कैलेंडर",
    checkout: "बिल और पेमेंट",
    newOrder: "+ नया ऑर्डर",
    logout: "लॉगआउट",
    language: "भाषा (Language)",
  },
  stepper: {
    customer: "1. ग्राहक चुनें",
    garments: "2. कपड़ा और डिज़ाइन",
    measurements: "3. नाप (Measurements)",
    payment: "4. बिल और बयाना",
    confirm: "5. पक्का करें",
  },
};

const paTranslations = {
  ...buildWordMapTranslations("pa"),
  nav: {
    dashboard: "ਮੁੱਖ ਪੰਨਾ (Dashboard)",
    customers: "ਗਾਹਕ (Customers)",
    orders: "ਆਰਡਰ ਲਿਸਟ (Orders)",
    cuttingQueue: "ਕਟਾਈ ਲਿਸਟ (Cutting)",
    measurements: "ਨਾਪ (Measurements)",
    services: "ਸਿਲਾਈ ਅਤੇ ਰੇਟ",
    addOns: "ਡਿਜ਼ਾਈਨ / ਵਾਧੂ ਕੰਮ",
    productionCalendar: "ਕੰਮ ਦਾ ਕੈਲੰਡਰ",
    checkout: "ਬਿੱਲ ਅਤੇ ਪੇਮੈਂਟ",
    newOrder: "+ ਨਵਾਂ ਆਰਡਰ",
    logout: "ਲੌਗਆਊਟ",
    language: "ਭਾਸ਼ਾ (Language)",
  },
  stepper: {
    customer: "1. ਗਾਹਕ ਚੁਣੋ",
    garments: "2. ਕੱਪੜਾ ਅਤੇ ਡਿਜ਼ਾਈਨ",
    measurements: "3. ਨਾਪ (Measurements)",
    payment: "4. ਬਿੱਲ ਅਤੇ ਬਿਆਨਾ",
    confirm: "5. ਪੱਕਾ ਕਰੋ",
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      pa: { translation: paTranslations },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "sff_language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export { translateWorkerWord };
export default i18n;
