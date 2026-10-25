import type { ContactStatusResult } from '../types/crm';
import { getUiLanguage, t } from '../i18n';

const DAYS = {
  id: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
};
const MONTHS = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
};

export const monthName = (m: number): string => MONTHS[getUiLanguage()][m];
const dayName = (d: number): string => DAYS[getUiLanguage()][d];

export function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Soft avatar colors, picked from the name so a person keeps the same color everywhere.
const AVATAR_TONES = [
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
];

export function avatarTone(name: string): string {
  let hash = 0;
  for (const ch of name || '') hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

/** Parses "YYYY-MM-DD" (optionally with a time) as a local calendar date. */
function parseLocalDate(date: string): Date | null {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** "2026-10-31" → { day: '31', weekday: 'Sab', month: 'Okt' } */
export function dateParts(date: string): { day: string; weekday: string; month: string } | null {
  const d = parseLocalDate(date);
  if (!d) return null;
  return { day: String(d.getDate()), weekday: dayName(d.getDay()), month: monthName(d.getMonth()) };
}

/** "2026-10-31" → "Sab, 31 Okt 2026" */
export function formatLongDate(date: string): string {
  const d = parseLocalDate(date);
  if (!d) return date;
  return `${dayName(d.getDay())}, ${d.getDate()} ${monthName(d.getMonth())} ${d.getFullYear()}`;
}

/** "2026-10-16" → "16 Okt" */
export function formatShortDate(date: string): string {
  const d = parseLocalDate(date);
  if (!d) return date;
  return `${d.getDate()} ${monthName(d.getMonth())}`;
}

/** Short status text such as "Lewat 9 hari", "Hari ini" or "3 hari lagi". */
export function dueLabel(status: ContactStatusResult, lastContactedDate?: string | null): string {
  if (status.isOverdue) {
    if (lastContactedDate === null && status.daysOverdue === 0) return t('Belum disapa');
    return status.daysOverdue > 0 ? t('Lewat {n} hari', { n: status.daysOverdue }) : t('Hari ini');
  }
  const left = status.daysRemaining ?? 0;
  if (left <= 0) return t('Hari ini');
  if (left === 1) return t('Besok');
  return t('{n} hari lagi', { n: left });
}

/** The date the next greeting is due: the specific follow-up when set, else the cadence date. */
export function dueDate(nextSpecificFollowUp: string | null, status: ContactStatusResult): string | null {
  if (nextSpecificFollowUp) return nextSpecificFollowUp.split('T')[0];
  return status.suggestedDate;
}
