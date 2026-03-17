import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';
import kk from '@/locales/kk.json';
import es from '@/locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    kk: { translation: kk },
    es: { translation: es },
  },
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: true },
});

export default i18n;
