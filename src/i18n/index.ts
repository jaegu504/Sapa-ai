import { TR } from './tr';

// Indonesian text is the key itself: t('Perlu disapa') returns it unchanged in Indonesian
// and looks up the Turkish version in TR. Missing entries fall back to Indonesian.
export type UiLanguage = 'id' | 'tr';

const STORAGE_KEY = 'sapa_ui_language';

function load(): UiLanguage {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'tr' ? 'tr' : 'id';
  } catch {
    return 'id';
  }
}

let current: UiLanguage = load();

export function getUiLanguage(): UiLanguage {
  return current;
}

export function setUiLanguage(lang: UiLanguage): void {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore localStorage failures
  }
}

export function t(text: string, vars?: Record<string, string | number>): string {
  const base = current === 'tr' ? TR[text] ?? text : text;
  return vars ? base.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : base;
}
