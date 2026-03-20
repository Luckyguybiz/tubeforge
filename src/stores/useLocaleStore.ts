import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ruTranslations from '@/locales/ru.json';

export type Locale = 'ru' | 'en' | 'kk' | 'es';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

type Translations = Record<string, string>;

/* Cache for dynamically-loaded locale bundles.
   Russian is always available synchronously (imported above). */
const localeCache: Record<string, Translations> = {
  ru: ruTranslations as Translations,
};

/** Dynamically import a locale bundle and cache it.
 *  Exported so that tests / SSR can pre-load bundles before rendering. */
export async function loadLocale(lang: string): Promise<Translations> {
  if (localeCache[lang]) return localeCache[lang];

  let mod: { default: Translations };
  switch (lang) {
    case 'en':
      mod = await import('@/locales/en.json');
      break;
    case 'kk':
      mod = await import('@/locales/kk.json');
      break;
    case 'es':
      mod = await import('@/locales/es.json');
      break;
    default:
      return localeCache['ru'];
  }

  localeCache[lang] = mod.default as Translations;
  return localeCache[lang];
}

function translate(locale: Locale, key: string): string {
  return localeCache[locale]?.[key] ?? localeCache['ru'][key] ?? key;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ru',
      setLocale: (locale) => {
        /* Set locale immediately so the UI reflects the choice.
           If the bundle is already cached, translations work right away.
           Otherwise, t() falls back to Russian until the bundle loads. */
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
        if (state && state.locale !== 'ru') {
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
