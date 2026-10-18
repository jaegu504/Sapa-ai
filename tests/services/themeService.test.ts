import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getThemePreference,
  setThemePreference,
  resolveEffectiveTheme,
  applyTheme,
  initTheme,
} from '../../src/services/themeService';

describe('themeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('defaults to system preference when no stored value exists', () => {
    expect(getThemePreference()).toBe('system');
  });

  it('persists and retrieves user theme preference in localStorage', () => {
    setThemePreference('dark');
    expect(getThemePreference()).toBe('dark');
    expect(localStorage.getItem('sapa_theme_preference')).toBe('dark');

    setThemePreference('light');
    expect(getThemePreference()).toBe('light');

    setThemePreference('system');
    expect(getThemePreference()).toBe('system');
  });

  it('resolves explicit light and dark themes correctly', () => {
    expect(resolveEffectiveTheme('light')).toBe('light');
    expect(resolveEffectiveTheme('dark')).toBe('dark');
  });

  it('resolves system theme based on window.matchMedia', () => {
    // Mock matchMedia returning matches: true (dark mode preferred)
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(resolveEffectiveTheme('system')).toBe('dark');
  });

  it('applies dark theme by adding .dark to document.documentElement', () => {
    const effective = applyTheme('dark');
    expect(effective).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies light theme by removing .dark from document.documentElement', () => {
    document.documentElement.classList.add('dark');
    const effective = applyTheme('light');
    expect(effective).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initTheme applies current preference and listens to system changes when set to system', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event: string, handler: any) => {
        changeHandler = handler;
      },
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    setThemePreference('system');
    const listenerCallback = vi.fn();
    const cleanup = initTheme(listenerCallback);

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Simulate system switching to dark mode
    if (changeHandler) {
      (changeHandler as any)({ matches: true } as MediaQueryListEvent);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(listenerCallback).toHaveBeenCalledWith('dark');
    }

    cleanup();
  });
});
