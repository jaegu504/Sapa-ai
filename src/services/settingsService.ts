// Small user preferences kept in localStorage (always wrapped: storage can be unavailable).
const DEFAULT_CYCLE_KEY = 'sapa_default_cycle_days';
export const FALLBACK_CYCLE_DAYS = 15;

export function getDefaultCycleDays(): number {
  try {
    const n = Number(localStorage.getItem(DEFAULT_CYCLE_KEY));
    if (Number.isInteger(n) && n >= 1 && n <= 365) return n;
  } catch {
    // Ignore localStorage failures
  }
  return FALLBACK_CYCLE_DAYS;
}

export function setDefaultCycleDays(days: number): void {
  try {
    localStorage.setItem(DEFAULT_CYCLE_KEY, String(Math.min(365, Math.max(1, Math.round(days)))));
  } catch {
    // Ignore localStorage failures
  }
}
