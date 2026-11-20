import { describe, expect, it } from 'vitest';
import { nextOccurrence, upcomingImportantDates } from '../../src/utils/importantDates';
import type { Contact } from '../../src/types/crm';

const contact = (name: string, dates: { label: string; date: string }[]) => ({ id: name, name, importantDates: dates }) as unknown as Contact;

describe('importantDates', () => {
  const now = new Date(2026, 10, 20, 15, 0); // 20 Nov 2026

  it('repeats every year and rolls past dates to next year', () => {
    expect(nextOccurrence('1990-11-20', now)?.getFullYear()).toBe(2026);
    expect(nextOccurrence('1990-03-01', now)?.getFullYear()).toBe(2027);
  });

  it('puts 29 February on 28 February in a non-leap year', () => {
    const occ = nextOccurrence('2000-02-29', now)!;
    expect([occ.getFullYear(), occ.getMonth(), occ.getDate()]).toEqual([2027, 1, 28]);
  });

  it('lists only dates within the window, soonest first, across the new year', () => {
    const lateDec = new Date(2026, 11, 29);
    const events = upcomingImportantDates(
      [contact('Ahmet', [{ label: 'Ulang tahun', date: '1980-01-02' }]), contact('Ibu', [{ label: 'Ulang tahun', date: '1960-12-29' }, { label: 'Pernikahan', date: '1985-06-01' }])],
      lateDec
    );
    expect(events.map((e) => [e.contact.name, e.inDays, e.date])).toEqual([
      ['Ibu', 0, '2026-12-29'],
      ['Ahmet', 4, '2027-01-02'],
    ]);
  });
});
