import { describe, it, expect } from 'vitest';
import { getDailyDigestItems, getUpcomingAlarms } from '../../src/services/notificationService';
import { Contact } from '../../src/types/crm';

describe('notificationService', () => {
  const sampleContacts: Contact[] = [
    {
      id: '1',
      name: 'Bu Siti',
      phoneNumber: '+6281234567890',
      associations: ['Zahiri'],
      isProfessional: true,
      lastContactedDate: '2026-09-20',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null, // Overdue by routine cycle
      metContext: 'Alumni gathering',
      lastUpdateNotes: 'Kabar baik sekeluarga',
      possibleFollowUpTopic: 'Acara keynote',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-20T00:00:00Z',
    },
    {
      id: '2',
      name: 'Necmiye',
      phoneNumber: '+905321234567',
      associations: ['Keluarga'],
      isProfessional: false,
      lastContactedDate: '2026-10-10', // Aman on 2026-10-14
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Adik sepupu',
      lastUpdateNotes: 'Studi di Istanbul',
      possibleFollowUpTopic: '',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    },
    {
      id: '3',
      name: 'Pak Ahmad',
      phoneNumber: '+628111222333',
      associations: ['Ihvan'],
      isProfessional: true,
      lastContactedDate: '2026-10-01',
      followUpCycleDays: 15,
      nextSpecificFollowUp: '2026-10-14', // Scheduled follow-up today!
      metContext: 'Masjid',
      lastUpdateNotes: 'Diskusi program wakaf',
      possibleFollowUpTopic: 'Progress yayasan',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: '4',
      name: 'Dr. Faisal',
      phoneNumber: '+628999888777',
      associations: ['Hoca', 'Teman'],
      isProfessional: true,
      lastContactedDate: '2026-10-05',
      followUpCycleDays: 15,
      nextSpecificFollowUp: '2026-10-15T10:00:00Z', // Tomorrow morning
      metContext: 'Seminar Kedokteran',
      lastUpdateNotes: 'Sedang riset klinis',
      possibleFollowUpTopic: 'Hasil riset jurnal',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
    },
    {
      id: '5',
      name: 'Zaid',
      phoneNumber: '+628777666555',
      associations: ['Teman'],
      isProfessional: false,
      lastContactedDate: null, // Fresh contact without previous contact date -> Overdue
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Kenalan di konferensi',
      lastUpdateNotes: '',
      possibleFollowUpTopic: '',
      createdAt: '2026-10-14T00:00:00Z',
      updatedAt: '2026-10-14T00:00:00Z',
    },
  ];

  describe('getDailyDigestItems', () => {
    it('aggregates overdue contacts for morning digest', () => {
      // Bu Siti (id: 1) is overdue (lastContacted: 2026-09-20 + 15 = 2026-10-05 < 2026-10-14)
      // Pak Ahmad (id: 3) is overdue because nextSpecificFollowUp is today (2026-10-14)
      // Zaid (id: 5) has null lastContactedDate -> overdue
      // Necmiye (id: 2) and Dr. Faisal (id: 4) are aman
      const testSet = [sampleContacts[0], sampleContacts[1]];
      const digest = getDailyDigestItems(testSet, new Date('2026-10-14'));

      expect(digest.totalOverdue).toBe(1);
      expect(digest.contacts[0].name).toBe('Bu Siti');
      expect(digest.digestSummary).toContain('1 relasi perlu disapa hari ini');
      expect(digest.date).toBe('2026-10-14');
    });

    it('summarizes multiple overdue contacts correctly', () => {
      // 3 overdue contacts: Bu Siti, Pak Ahmad, Zaid
      const digest = getDailyDigestItems(sampleContacts, new Date('2026-10-14'));

      expect(digest.totalOverdue).toBe(3);
      expect(digest.contacts.map((c) => c.name)).toEqual(['Bu Siti', 'Pak Ahmad', 'Zaid']);
      expect(digest.digestSummary).toContain('3 relasi perlu disapa hari ini');
    });

    it('returns friendly empty state message when no contacts are overdue', () => {
      const allSafeContacts = [sampleContacts[1]]; // Only Necmiye
      const digest = getDailyDigestItems(allSafeContacts, new Date('2026-10-14'));

      expect(digest.totalOverdue).toBe(0);
      expect(digest.contacts).toEqual([]);
      expect(digest.digestSummary).toBe('Semua relasi aman hari ini');
    });

    it('handles empty contact list gracefully', () => {
      const digest = getDailyDigestItems([], new Date('2026-10-14'));

      expect(digest.totalOverdue).toBe(0);
      expect(digest.contacts).toEqual([]);
      expect(digest.digestSummary).toBe('Semua relasi aman hari ini');
      expect(digest.date).toBe('2026-10-14');
    });

    it('handles date format variations: Date object, string YYYY-MM-DD, or omitted', () => {
      const fromString = getDailyDigestItems([sampleContacts[0]], '2026-10-14');
      expect(fromString.totalOverdue).toBe(1);
      expect(fromString.date).toBe('2026-10-14');

      const fromDate = getDailyDigestItems([sampleContacts[0]], new Date('2026-10-14'));
      expect(fromDate.totalOverdue).toBe(1);
      expect(fromDate.date).toBe('2026-10-14');

      const fromDefault = getDailyDigestItems([]);
      expect(typeof fromDefault.date).toBe('string');
      expect(fromDefault.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getUpcomingAlarms', () => {
    it('returns alarms for contacts with specific follow-up date today', () => {
      const alarms = getUpcomingAlarms(sampleContacts, 24, new Date('2026-10-14T00:00:00Z'));

      const ahmadAlarm = alarms.find((a) => a.contactId === '3');
      expect(ahmadAlarm).toBeDefined();
      expect(ahmadAlarm?.contactName).toBe('Pak Ahmad');
      expect(ahmadAlarm?.phoneNumber).toBe('+628111222333');
      expect(ahmadAlarm?.scheduledDate).toBe('2026-10-14');
      expect(ahmadAlarm?.topic).toBe('Progress yayasan');
      expect(ahmadAlarm?.message).toContain('Pak Ahmad');
      expect(ahmadAlarm?.message).toContain('Progress yayasan');
    });

    it('returns alarms within the specified window (e.g. 36 hours covering tomorrow)', () => {
      // At 2026-10-14T00:00:00Z:
      // Pak Ahmad is at 2026-10-14 (today)
      // Dr. Faisal is at 2026-10-15T10:00:00Z (34 hours away)
      const alarms36h = getUpcomingAlarms(sampleContacts, 36, new Date('2026-10-14T00:00:00Z'));
      const contactIds = alarms36h.map((a) => a.contactId);

      expect(contactIds).toContain('3');
      expect(contactIds).toContain('4');

      const faisalAlarm = alarms36h.find((a) => a.contactId === '4');
      expect(faisalAlarm?.contactName).toBe('Dr. Faisal');
      expect(faisalAlarm?.topic).toBe('Hasil riset jurnal');
      expect(faisalAlarm?.message).toContain('Dr. Faisal');
    });

    it('filters out alarms that fall outside the given window', () => {
      // Window is 12 hours from 2026-10-14T00:00:00Z
      // Dr. Faisal is at 2026-10-15T10:00:00Z (34 hours away -> should be excluded)
      const alarms12h = getUpcomingAlarms(sampleContacts, 12, new Date('2026-10-14T00:00:00Z'));
      const contactIds = alarms12h.map((a) => a.contactId);

      expect(contactIds).toContain('3'); // Pak Ahmad is today
      expect(contactIds).not.toContain('4'); // Dr. Faisal is outside 12h
    });

    it('ignores contacts without nextSpecificFollowUp', () => {
      const withoutSpecific = [sampleContacts[0], sampleContacts[1], sampleContacts[4]];
      const alarms = getUpcomingAlarms(withoutSpecific, 24, new Date('2026-10-14'));

      expect(alarms).toEqual([]);
    });

    it('handles contacts with specific follow-up but without topic gracefully', () => {
      const contactNoTopic: Contact = {
        ...sampleContacts[2],
        id: '99',
        name: 'Ustadz Danang',
        possibleFollowUpTopic: '',
        nextSpecificFollowUp: '2026-10-14',
      };

      const alarms = getUpcomingAlarms([contactNoTopic], 24, new Date('2026-10-14'));
      expect(alarms).toHaveLength(1);
      expect(alarms[0].topic).toBe('');
      expect(alarms[0].message).toContain('Ustadz Danang');
    });

    it('handles referenceDate as string YYYY-MM-DD or Date object', () => {
      const alarmsFromString = getUpcomingAlarms(sampleContacts, 24, '2026-10-14');
      const alarmsFromDate = getUpcomingAlarms(sampleContacts, 24, new Date('2026-10-14'));

      expect(alarmsFromString.map((a) => a.contactId)).toEqual(alarmsFromDate.map((a) => a.contactId));
    });

    it('sorts alarms in chronological order (earliest scheduled first)', () => {
      const contactsWithMultipleAlarms: Contact[] = [
        {
          ...sampleContacts[3],
          id: 'b',
          name: 'Contact Later',
          nextSpecificFollowUp: '2026-10-14T18:00:00Z',
        },
        {
          ...sampleContacts[3],
          id: 'a',
          name: 'Contact Earlier',
          nextSpecificFollowUp: '2026-10-14T09:00:00Z',
        },
      ];

      const alarms = getUpcomingAlarms(contactsWithMultipleAlarms, 24, new Date('2026-10-14T00:00:00Z'));
      expect(alarms[0].contactId).toBe('a');
      expect(alarms[1].contactId).toBe('b');
    });
  });
});
