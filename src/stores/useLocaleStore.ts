import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import enTranslations from '@/locales/en.json';

export type Locale = 'ru' | 'en' | 'kk' | 'es';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

type Translations = Record<string, string>;

/* Cache for dynamically-loaded locale bundles.
   English is always available synchronously (imported above). */
const localeCache: Record<string, Translations> = {
  en: enTranslations as Translations,
};

/** Dynamically import a locale bundle and cache it.
 *  Exported so that tests / SSR can pre-load bundles before rendering. */
export async function loadLocale(lang: string): Promise<Translations> {
  if (localeCache[lang]) return localeCache[lang];

  let mod: { default: Translations };
  switch (lang) {
    case 'ru':
      mod = await import('@/locales/ru.json');
      break;
    case 'kk':
      mod = await import('@/locales/kk.json');
      break;
    case 'es':
      mod = await import('@/locales/es.json');
      break;
    default:
      return localeCache['en'];
  }

  localeCache[lang] = mod.default as Translations;
  return localeCache[lang];
}

function translate(locale: Locale, key: string): string {
  return localeCache[locale]?.[key] ?? localeCache['en'][key] ?? key;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      setLocale: (locale) => {
        /* Set locale immediately so the UI reflects the choice.
           If the bundle is already cached, translations work right away.
           Otherwise, t() falls back to English until the bundle loads. */
        set({
          locale,
          t: (key: string) => translate(locale, key),
        });

        if (!localeCache[locale]) {
          loadLocale(locale).then(() => {
            /* Re-set only if the user hasn't switched again while loading. */
            if (get().locale === locale) {
              set({
                t: (key: string) => translate(locale, key),
              });
            }
          });
        }
      },
      t: (key: string) => {
        const { locale } = get();
        return translate(locale, key);
      },
    }),
    {
      name: 'tf-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        /* After zustand restores the persisted locale,
           eagerly load the bundle so t() works immediately. */
        if (state && state.locale !== 'en') {
          loadLocale(state.locale).then(() => {
            const current = useLocaleStore.getState();
            if (current.locale === state.locale) {
              useLocaleStore.setState({
                t: (key: string) => translate(state.locale, key),
              });
            }
          });
        }
      },
    }
  )
);
