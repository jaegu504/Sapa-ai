import { describe, it, expect } from 'vitest';
import { applyContactsFilter } from '../../src/utils/contactFilters';
import type { Contact } from '../../src/types/crm';

const make = (overrides: Partial<Contact>): Contact => ({
  id: 'x',
  name: 'X',
  phoneNumber: '+62',
  associations: [],
  isProfessional: false,
  lastContactedDate: null,
  followUpCycleDays: 15,
  nextSpecificFollowUp: null,
  metContext: '',
  lastUpdateNotes: '',
  possibleFollowUpTopic: '',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('applyContactsFilter', () => {
  const now = new Date('2026-10-24T10:00:00Z');
  const hoca = make({ id: 'hoca', associations: ['Hoca'], lastContactedDate: '2026-10-20' });
  const pro = make({ id: 'pro', isProfessional: true, lastContactedDate: '2026-08-01' });
  const fresh = make({ id: 'fresh', lastContactedDate: '2026-10-14', followUpCycleDays: 15 });
  const never = make({ id: 'never' });
  const all = [hoca, pro, fresh, never];

  it('filters by label case-insensitively, counting the professional flag', () => {
    expect(applyContactsFilter(all, { kind: 'label', label: 'hoca' }, now).map((c) => c.id)).toEqual(['hoca']);
    expect(applyContactsFilter(all, { kind: 'label', label: 'Profesional' }, now).map((c) => c.id)).toEqual(['pro']);
  });

  it('filters overdue, due within 7 days, and never contacted', () => {
    expect(applyContactsFilter(all, { kind: 'overdue' }, now).map((c) => c.id)).toContain('pro');
    expect(applyContactsFilter(all, { kind: 'week' }, now).map((c) => c.id)).toEqual(['fresh']);
    expect(applyContactsFilter(all, { kind: 'never' }, now).map((c) => c.id)).toEqual(['never']);
    expect(applyContactsFilter(all, null, now)).toHaveLength(4);
  });
});
