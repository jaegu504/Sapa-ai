import { describe, it, expect } from 'vitest';
import { calculateContactStatus } from '../../src/utils/status';
import { Contact } from '../../src/types/crm';

describe('calculateContactStatus', () => {
  const baseContact: Contact = {
    id: '1',
    name: 'Budi Santoso',
    phoneNumber: '+628123456789',
    associations: ['Keluarga'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: '',
    lastUpdateNotes: '',
    possibleFollowUpTopic: '',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  it('marks as healthy (Aman) when within 15-day cycle', () => {
    const result = calculateContactStatus(baseContact, new Date('2026-10-10'));
    expect(result.isOverdue).toBe(false);
    expect(result.statusText).toBe('Aman (👍)');
    expect(result.suggestedDate).toBe('2026-10-16');
  });

  it('marks as overdue when past 15-day cycle', () => {
    const result = calculateContactStatus(baseContact, new Date('2026-10-18'));
    expect(result.isOverdue).toBe(true);
    expect(result.statusText).toBe('Time to reach out!');
    expect(result.daysOverdue).toBe(2);
  });

  it('prioritizes specific nextFollowUp date over routine 15 days', () => {
    const contactWithSpecific: Contact = {
      ...baseContact,
      nextSpecificFollowUp: '2026-10-08T09:00:00Z',
    };
    const result = calculateContactStatus(contactWithSpecific, new Date('2026-10-09'));
    expect(result.isOverdue).toBe(true);
  });

  it('handles contact without lastContactedDate gracefully without NaN or errors', () => {
    const freshContact: Contact = {
      ...baseContact,
      lastContactedDate: null,
      nextSpecificFollowUp: null,
    };
    const result = calculateContactStatus(freshContact, new Date('2026-10-10'));
    expect(result.isOverdue).toBe(true);
    expect(result.statusText).toBe('Time to reach out!');
    expect(result.suggestedDate).toBeNull();
    expect(result.daysOverdue).toBe(0);
  });

  it('respects future specific follow-up even if 15-day cycle has elapsed', () => {
    const scheduledContact: Contact = {
      ...baseContact,
      lastContactedDate: '2026-10-01', // routine cycle was 2026-10-16
      nextSpecificFollowUp: '2026-10-25T14:00:00Z', // scheduled later
    };
    const result = calculateContactStatus(scheduledContact, new Date('2026-10-18'));
    // Since user explicitly set nextSpecificFollowUp for Oct 25, it is not overdue yet
    expect(result.isOverdue).toBe(false);
    expect(result.statusText).toBe('Aman (👍)');
    expect(result.suggestedDate).toBe('2026-10-16');
  });

  it('supports custom followUpCycleDays', () => {
    const customCycleContact: Contact = {
      ...baseContact,
      followUpCycleDays: 30,
    };
    const result = calculateContactStatus(customCycleContact, new Date('2026-10-20'));
    // Oct 1 + 30 days = Oct 31
    expect(result.isOverdue).toBe(false);
    expect(result.statusText).toBe('Aman (👍)');
    expect(result.suggestedDate).toBe('2026-10-31');
  });

  it('defaults now to current date when omitted without throwing error', () => {
    const result = calculateContactStatus(baseContact);
    expect(typeof result.isOverdue).toBe('boolean');
    expect(typeof result.statusText).toBe('string');
  });

  it('calculates daysRemaining accurately for future follow-up and routine cadence', () => {
    // Tomorrow follow-up
    const tomorrowContact: Contact = {
      ...baseContact,
      nextSpecificFollowUp: '2026-10-19',
    };
    const resTomorrow = calculateContactStatus(tomorrowContact, new Date('2026-10-18'));
    expect(resTomorrow.isOverdue).toBe(false);
    expect(resTomorrow.daysRemaining).toBe(1);

    // 7 days away follow-up
    const weekContact: Contact = {
      ...baseContact,
      nextSpecificFollowUp: '2026-10-25',
    };
    const resWeek = calculateContactStatus(weekContact, new Date('2026-10-18'));
    expect(resWeek.isOverdue).toBe(false);
    expect(resWeek.daysRemaining).toBe(7);

    // Routine cadence remaining
    const routineContact: Contact = {
      ...baseContact,
      lastContactedDate: '2026-10-01',
      followUpCycleDays: 15, // Suggested Oct 16
      nextSpecificFollowUp: null,
    };
    const resRoutine = calculateContactStatus(routineContact, new Date('2026-10-10'));
    expect(resRoutine.isOverdue).toBe(false);
    expect(resRoutine.daysRemaining).toBe(6);
  });
});

