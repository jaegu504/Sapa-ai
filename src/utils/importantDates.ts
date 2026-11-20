import type { Contact } from '../types/crm';

export interface ImportantDateEvent {
  contact: Contact;
  label: string;
  /** This year's (or next year's) occurrence, YYYY-MM-DD. */
  date: string;
  /** 0 = today. */
  inDays: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Next occurrence of a yearly date on or after `today` (local time). 29 Feb falls on 28 Feb in other years. */
export function nextOccurrence(date: string, today: Date): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (const year of [start.getFullYear(), start.getFullYear() + 1]) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const occ = new Date(year, month, Math.min(day, lastDay));
    if (occ >= start) return occ;
  }
  return null;
}

/** Important dates of all contacts that fall within the next `withinDays` days, soonest first. */
export function upcomingImportantDates(contacts: Contact[], now: Date = new Date(), withinDays = 7): ImportantDateEvent[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const events: ImportantDateEvent[] = [];
  for (const contact of contacts) {
    for (const d of contact.importantDates || []) {
      const occ = nextOccurrence(d.date, now);
      if (!occ) continue;
      const inDays = Math.round((occ.getTime() - start.getTime()) / 86400000);
      if (inDays <= withinDays) {
        events.push({ contact, label: d.label, inDays, date: `${occ.getFullYear()}-${pad(occ.getMonth() + 1)}-${pad(occ.getDate())}` });
      }
    }
  }
  return events.sort((a, b) => a.inDays - b.inDays || a.contact.name.localeCompare(b.contact.name));
}
