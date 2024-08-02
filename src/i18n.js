// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Initialize react-i18next
  .init({
    resources: {
      en: {
        translation: {
          'Company Name': 'Company Name', // English translation
          // Add more translations here
        },
      },
      // Add translations for other languages as needed
    },
    fallbackLng: 'en', // Fallback language
    debug: true, // Enable debug mode
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
