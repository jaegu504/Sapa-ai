export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'sapa_theme_preference';

/**
 * Retrieves the currently saved theme preference, defaulting to 'system'.
 */
export function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Graceful fallback if localStorage is restricted
  }
  return 'system';
}

/**
 * Saves the user's theme preference to localStorage.
 */
export function setThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Graceful fallback
  }
}

/**
 * Resolves whether the effective visual mode is 'light' or 'dark'
 * taking into account system media query if 'system' is chosen.
 */
export function resolveEffectiveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';

  if (typeof window !== 'undefined' && window.matchMedia) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Applies the given theme preference by toggling the 'dark' class
 * on document.documentElement. Returns the resolved effective theme.
 */
export function applyTheme(pref: ThemePreference): 'light' | 'dark' {
  const effective = resolveEffectiveTheme(pref);
  if (typeof document !== 'undefined') {
    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  return effective;
}

/**
 * Initializes theme listener and applies current stored preference.
 * Calls onThemeChange callback whenever the effective theme shifts.
 * Returns a cleanup unsubscribe function.
 */
export function initTheme(onThemeChange?: (effective: 'light' | 'dark') => void): () => void {
  const currentPref = getThemePreference();
  const initialEffective = applyTheme(currentPref);
  onThemeChange?.(initialEffective);

  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent) => {
    const pref = getThemePreference();
    if (pref === 'system') {
      const newEffective = e.matches ? 'dark' : 'light';
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      onThemeChange?.(newEffective);
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
  } else if ((mediaQuery as any).addListener) {
    (mediaQuery as any).addListener(listener);
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', listener);
    } else if ((mediaQuery as any).removeListener) {
      (mediaQuery as any).removeListener(listener);
    }
  };
}
