import { describe, it, expect } from 'vitest';
import { dateParts, dueLabel, formatLongDate, getInitials } from '../../src/utils/display';

const status = (over: Partial<Parameters<typeof dueLabel>[0]>) => ({
  isOverdue: false, statusText: '', suggestedDate: null, daysOverdue: 0, ...over,
});

describe('display helpers', () => {
  it('formats due labels', () => {
    expect(dueLabel(status({ isOverdue: true, daysOverdue: 9 }))).toBe('Lewat 9 hari');
    expect(dueLabel(status({ isOverdue: true, daysOverdue: 0 }), null)).toBe('Belum disapa');
    expect(dueLabel(status({ daysRemaining: 1 }))).toBe('Besok');
    expect(dueLabel(status({ daysRemaining: 5 }))).toBe('5 hari lagi');
  });

  it('formats dates in Indonesian without depending on the phone locale', () => {
    expect(dateParts('2026-10-31')).toEqual({ day: '31', weekday: 'Sab', month: 'Okt' });
    expect(formatLongDate('2026-10-31T09:00')).toBe('Sab, 31 Okt 2026');
    expect(getInitials('Ahmet Hoca')).toBe('AH');
  });
});
