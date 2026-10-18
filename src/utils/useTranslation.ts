import { useStore } from '../stores/useStore';
import { t } from './i18n';
import type { Language } from '../types';

export function useTranslation() {
  const language = useStore((state) => state.language);

  return {
    t: (path: string) => t(path, language),
    language,
    isEn: language === 'en',
    isId: language === 'id',
  };
}

export { t };
