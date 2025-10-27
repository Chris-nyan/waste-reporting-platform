import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi) // Loads translations from /public/locales
  .use(LanguageDetector) // Detects user's language
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
     supportedLngs: ['en', 'es', 'th', 'zh', 'my', 'vi'], // <-- Add languages as you create them
    fallbackLng: 'en', // Default language if detection fails
    debug: process.env.NODE_ENV === 'development', // Show logs in dev mode

    // Configure language detector
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'], // Where to cache the selected language
    },

    // Configure http backend (where to load files from)
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    react: {
      useSuspense: true, // Recommended for loading translations
    },
  });

export default i18n;