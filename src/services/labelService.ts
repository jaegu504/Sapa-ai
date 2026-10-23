// Single source for relation labels (Asosiasi); users can add, rename and remove their own.
export const DEFAULT_LABELS = ['Ihvan', 'Hoca', 'Keluarga', 'Zahiri', 'Teman', 'Profesional'];
export const LABELS_STORAGE_KEY = 'sapa_labels';

export function getLabels(): string[] {
  try {
    const raw = localStorage.getItem(LABELS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.every((l) => typeof l === 'string')) return parsed;
  } catch {
    // Corrupt or unavailable storage: use defaults.
  }
  return [...DEFAULT_LABELS];
}

export function saveLabels(labels: string[]): void {
  try {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels));
  } catch {
    // Ignore localStorage failures
  }
}

/** Returns the new list, or null when the name is empty or already exists (case-insensitive). */
export function addLabel(labels: string[], name: string): string[] | null {
  const clean = name.trim();
  if (!clean || labels.some((l) => l.toLowerCase() === clean.toLowerCase())) return null;
  return [...labels, clean];
}

export function renameLabel(labels: string[], from: string, to: string): string[] | null {
  const clean = to.trim();
  if (!clean || labels.some((l) => l !== from && l.toLowerCase() === clean.toLowerCase())) return null;
  return labels.map((l) => (l === from ? clean : l));
}

export function removeLabel(labels: string[], name: string): string[] {
  return labels.filter((l) => l !== name);
}

/** Applies a rename (to = new name) or removal (to = null) to one contact's labels. */
export function remapAssociations(associations: string[], from: string, to: string | null): string[] {
  const next = associations.flatMap((a) => (a === from ? (to ? [to] : []) : [a]));
  return Array.from(new Set(next));
}
