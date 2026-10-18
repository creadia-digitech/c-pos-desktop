import id from '../locales/id';
import en from '../locales/en';
import type { Language } from '../types';

type LocaleData = typeof id;

const locales: Record<Language, LocaleData> = { id, en };

let currentLang: Language = 'id';

export function setLanguage(lang: Language) {
  currentLang = lang;
  document.documentElement.lang = lang;
}

export function getLanguage(): Language {
  return currentLang;
}

export function t(path: string, lang?: Language): string {
  const activeLang = lang || currentLang;
  const keys = path.split('.');
  let result: unknown = locales[activeLang];
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      // Fallback to Indonesian
      let fallback: unknown = locales.id;
      for (const k of keys) {
        if (fallback && typeof fallback === 'object' && k in fallback) {
          fallback = (fallback as Record<string, unknown>)[k];
        } else {
          return path; // Return path if not found
        }
      }
      return typeof fallback === 'string' ? fallback : path;
    }
  }
  return typeof result === 'string' ? result : path;
}
