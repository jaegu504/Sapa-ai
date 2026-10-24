import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDailyDigestItems,
  getUpcomingAlarms,
  requestNotificationPermission,
  initNotificationService,
  scheduleDailyMorningDigest,
  scheduleTargetedFollowUpAlarm,
  cancelAllScheduledNotifications,
  scheduleAppUpdateNotification,
  CHANNEL_MORNING_DIGEST,
  CHANNEL_TARGETED_ALARMS,
  CHANNEL_APP_UPDATES,
  MORNING_DIGEST_NOTIFICATION_ID,
  UPDATE_NOTIFICATION_ID,
  hashContactId,
  isAlarmForToday,
} from '../../src/services/notificationService';
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

  describe('Native Local Notification Scheduling & Alarms', () => {
    let mockCheckPermissions: any;
    let mockRequestPermissions: any;
    let mockCreateChannel: any;
    let mockSchedule: any;
    let mockCancel: any;
    let mockCancelAll: any;
    let mockGetPending: any;

    beforeEach(() => {
      mockCheckPermissions = vi.fn().mockResolvedValue({ display: 'granted' });
      mockRequestPermissions = vi.fn().mockResolvedValue({ display: 'granted' });
      mockCreateChannel = vi.fn().mockResolvedValue(undefined);
      mockSchedule = vi.fn().mockResolvedValue({ notifications: [] });
      mockCancel = vi.fn().mockResolvedValue(undefined);
      mockCancelAll = vi.fn().mockResolvedValue(undefined);
      mockGetPending = vi.fn().mockResolvedValue({ notifications: [] });

      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          LocalNotifications: {
            checkPermissions: mockCheckPermissions,
            requestPermissions: mockRequestPermissions,
            createChannel: mockCreateChannel,
            schedule: mockSchedule,
            cancel: mockCancel,
            cancelAll: mockCancelAll,
            getPending: mockGetPending,
          },
        },
      };
    });

    afterEach(() => {
      delete (window as any).Capacitor;
      vi.restoreAllMocks();
    });

    describe('requestNotificationPermission', () => {
      it('returns true when permission is already granted', async () => {
        mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
        const granted = await requestNotificationPermission();
        expect(granted).toBe(true);
        expect(mockCheckPermissions).toHaveBeenCalled();
        expect(mockRequestPermissions).not.toHaveBeenCalled();
      });

      it('requests permission if checkPermissions is prompt or not granted, and returns true if user grants', async () => {
        mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
        mockRequestPermissions.mockResolvedValueOnce({ display: 'granted' });

        const granted = await requestNotificationPermission();
        expect(granted).toBe(true);
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      it('returns false when user denies permission', async () => {
        mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
        mockRequestPermissions.mockResolvedValueOnce({ display: 'denied' });

        const granted = await requestNotificationPermission();
        expect(granted).toBe(false);
      });

      it('returns true fallback for desktop web when plugin is unavailable or check throws', async () => {
        delete (window as any).Capacitor;
        const granted = await requestNotificationPermission();
        expect(granted).toBe(true);
      });
    });

    describe('initNotificationService', () => {
      it('creates morning digest, targeted alarms, and app updates notification channels on Android', async () => {
        await initNotificationService();

        expect(mockCreateChannel).toHaveBeenCalledTimes(3);
        expect(mockCreateChannel).toHaveBeenCalledWith(
          expect.objectContaining({
            id: CHANNEL_MORNING_DIGEST,
            name: 'Ringkasan Sapaan Pagi Sapa',
            description: 'Ringkasan sapaan harian setiap pagi',
            importance: 4,
          })
        );
        expect(mockCreateChannel).toHaveBeenCalledWith(
          expect.objectContaining({
            id: CHANNEL_TARGETED_ALARMS,
            name: 'Pengingat Jadwal Sapa',
            description: 'Pengingat jadwal follow up khusus',
            importance: 5,
          })
        );
        expect(mockCreateChannel).toHaveBeenCalledWith(
          expect.objectContaining({
            id: CHANNEL_APP_UPDATES,
            name: 'Pembaruan Aplikasi Sapa',
            importance: 4,
          })
        );
      });

      it('handles channel registration errors gracefully on unsupported platforms without crashing', async () => {
        mockCreateChannel.mockRejectedValueOnce(new Error('Channel creation not supported'));
        await expect(initNotificationService()).resolves.not.toThrow();
      });
    });

    describe('scheduleDailyMorningDigest', () => {
      // Sample dates assume "today" is 2026-10-14; pin the clock so the test does not expire.
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-14T09:00:00'));
      });
      afterEach(() => {
        vi.useRealTimers();
      });

      it('schedules 08:00 WIB daily morning digest with overdue contacts count', async () => {
        // Bu Siti is overdue
        const contacts: Contact[] = [sampleContacts[0], sampleContacts[1]];
        const scheduledCount = await scheduleDailyMorningDigest(contacts);
        expect(scheduledCount).toBeGreaterThan(0);
        expect(scheduledCount).toBe(1);

        expect(mockSchedule).toHaveBeenCalledTimes(1);
        const callArgs = mockSchedule.mock.calls[0][0];
        expect(callArgs.notifications).toHaveLength(1);

        const scheduledNotif = callArgs.notifications[0];
        expect(scheduledNotif.id).toBe(MORNING_DIGEST_NOTIFICATION_ID);
        expect(scheduledNotif.channelId).toBe(CHANNEL_MORNING_DIGEST);
        expect(scheduledNotif.title).toBe('Sapa: Waktunya Menyapa Relasi');
        expect(scheduledNotif.body).toContain('1 relasi perlu disapa hari ini');
        expect(scheduledNotif.schedule).toBeDefined();
        expect(scheduledNotif.schedule.on).toEqual(expect.objectContaining({ hour: 8, minute: 0 }));
      });

      it('handles zero overdue contacts and schedules friendly digest', async () => {
        const contacts: Contact[] = [sampleContacts[1]]; // Only Necmiye (safe)
        const count = await scheduleDailyMorningDigest(contacts);
        expect(count).toBe(0);

        expect(mockSchedule).toHaveBeenCalledTimes(1);
        const callArgs = mockSchedule.mock.calls[0][0];
        const scheduledNotif = callArgs.notifications[0];
        expect(scheduledNotif.body).toBe('Semua relasi aman hari ini');
      });

      it('falls back safely without crashing when local notifications are unsupported', async () => {
        delete (window as any).Capacitor;
        const contacts: Contact[] = [sampleContacts[0]];
        const count = await scheduleDailyMorningDigest(contacts);
        expect(count).toBe(1);
      });
    });

    describe('scheduleTargetedFollowUpAlarm', () => {
      it('schedules targeted exact alarm on contact nextSpecificFollowUp date', async () => {
        const contact: Contact = {
          id: 'test-1',
          name: 'Ahmad Faiz',
          phoneNumber: '+628123456789',
          associations: ['Ihvan'],
          isProfessional: false,
          lastContactedDate: '2026-09-01',
          followUpCycleDays: 15,
          nextSpecificFollowUp: '2026-10-20T08:00:00.000Z',
          metContext: '',
          lastUpdateNotes: '',
          possibleFollowUpTopic: 'Diskusi proyek',
          createdAt: '2026-09-01',
          updatedAt: '2026-09-01',
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(true);

        expect(mockSchedule).toHaveBeenCalledTimes(1);
        const scheduledNotif = mockSchedule.mock.calls[0][0].notifications[0];
        expect(scheduledNotif.title).toBe('Jadwal Follow-up: Ahmad Faiz');
        expect(scheduledNotif.body).toBe('Diskusi proyek');
        expect(scheduledNotif.channelId).toBe(CHANNEL_TARGETED_ALARMS);
        expect(scheduledNotif.id).toBe(hashContactId('test-1'));
        expect(scheduledNotif.schedule.at).toEqual(new Date('2026-10-20T08:00:00.000Z'));
      });

      it('falls back to default body when possibleFollowUpTopic is empty', async () => {
        const contact: Contact = {
          ...sampleContacts[2],
          id: 'test-2',
          name: 'Haji Yusuf',
          nextSpecificFollowUp: '2026-10-25T14:30:00.000Z',
          possibleFollowUpTopic: '',
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(true);

        const scheduledNotif = mockSchedule.mock.calls[0][0].notifications[0];
        expect(scheduledNotif.body).toBe('Waktunya menyapa kembali');
      });

      it('handles date-only nextSpecificFollowUp strings (YYYY-MM-DD)', async () => {
        const contact: Contact = {
          ...sampleContacts[2],
          id: 'test-3',
          name: 'Pak Budi',
          nextSpecificFollowUp: '2026-11-01',
          possibleFollowUpTopic: 'Silaturahmi',
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(true);

        const scheduledNotif = mockSchedule.mock.calls[0][0].notifications[0];
        expect(scheduledNotif.schedule.at).toBeInstanceOf(Date);
        expect(scheduledNotif.schedule.at.getFullYear()).toBe(2026);
        expect(scheduledNotif.schedule.at.getMonth()).toBe(10); // 0-indexed: Nov = 10
        expect(scheduledNotif.schedule.at.getDate()).toBe(1);
        expect(scheduledNotif.schedule.at.getHours()).toBe(8);
      });

      it('handles datetime strings with custom hour and minute (YYYY-MM-DDTHH:mm)', async () => {
        const contact: Contact = {
          ...sampleContacts[2],
          id: 'test-custom-time',
          name: 'Pak Budi Sore',
          nextSpecificFollowUp: '2026-11-01T15:30',
          possibleFollowUpTopic: 'Kopi sore',
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(true);

        const scheduledNotif = mockSchedule.mock.calls[0][0].notifications[0];
        expect(scheduledNotif.schedule.at).toBeInstanceOf(Date);
        expect(scheduledNotif.schedule.at.getFullYear()).toBe(2026);
        expect(scheduledNotif.schedule.at.getMonth()).toBe(10);
        expect(scheduledNotif.schedule.at.getDate()).toBe(1);
        expect(scheduledNotif.schedule.at.getHours()).toBe(15);
        expect(scheduledNotif.schedule.at.getMinutes()).toBe(30);
      });

      it('respects kinship_digest_time in localStorage for date-only follow-ups', async () => {
        localStorage.setItem('kinship_digest_time', '10:15');
        const contact: Contact = {
          ...sampleContacts[2],
          id: 'test-pref-time',
          name: 'Pak Budi Pagi',
          nextSpecificFollowUp: '2026-11-01',
          possibleFollowUpTopic: 'Diskusi pagi',
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(true);

        const scheduledNotif = mockSchedule.mock.calls[0][0].notifications[0];
        expect(scheduledNotif.schedule.at.getHours()).toBe(10);
        expect(scheduledNotif.schedule.at.getMinutes()).toBe(15);
        localStorage.removeItem('kinship_digest_time');
      });

      it('correctly identifies whether an alarm is for today with isAlarmForToday', () => {
        const todayAlarm = {
          contactId: '1',
          contactName: 'Test',
          phoneNumber: '+628',
          scheduledDate: '2026-10-17T14:00',
          topic: '',
          message: '',
        };
        const tomorrowAlarm = {
          contactId: '2',
          contactName: 'Test 2',
          phoneNumber: '+628',
          scheduledDate: '2026-10-18T09:00',
          topic: '',
          message: '',
        };

        expect(isAlarmForToday(todayAlarm, new Date('2026-10-17T10:00:00'))).toBe(true);
        expect(isAlarmForToday(tomorrowAlarm, new Date('2026-10-17T10:00:00'))).toBe(false);
      });


      it('returns false when contact has no nextSpecificFollowUp', async () => {
        const contact: Contact = {
          ...sampleContacts[0],
          nextSpecificFollowUp: null,
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(false);
        expect(mockSchedule).not.toHaveBeenCalled();
      });

      it('returns false when nextSpecificFollowUp is an invalid date string', async () => {
        const contact: Contact = {
          ...sampleContacts[0],
          nextSpecificFollowUp: 'not-a-valid-date',
        };
        const success = await scheduleTargetedFollowUpAlarm(contact);
        expect(success).toBe(false);
        expect(mockSchedule).not.toHaveBeenCalled();
      });
    });

    describe('cancelAllScheduledNotifications', () => {
      it('cancels all pending notifications via cancelAll', async () => {
        await cancelAllScheduledNotifications();
        expect(mockCancelAll).toHaveBeenCalled();
      });

      it('handles unsupported environment without throwing error', async () => {
        delete (window as any).Capacitor;
        await expect(cancelAllScheduledNotifications()).resolves.not.toThrow();
      });
    });

    describe('scheduleAppUpdateNotification', () => {
      it('schedules app update notification with UPDATE_NOTIFICATION_ID and CHANNEL_APP_UPDATES', async () => {
        const result = await scheduleAppUpdateNotification({
          latestVersion: '1.1.0',
          apkUrl: 'https://example.com/sapa-1.1.0.apk',
        });

        expect(result).toBe(true);
        expect(mockSchedule).toHaveBeenCalledWith(
          expect.objectContaining({
            notifications: [
              expect.objectContaining({
                id: UPDATE_NOTIFICATION_ID,
                title: expect.stringContaining('1.1.0'),
                channelId: CHANNEL_APP_UPDATES,
                extra: expect.objectContaining({
                  type: 'app_update',
                  latestVersion: '1.1.0',
                }),
              }),
            ],
          })
        );
      });

      it('returns true fallback when Capacitor is not present', async () => {
        delete (window as any).Capacitor;
        const result = await scheduleAppUpdateNotification({
          latestVersion: '1.1.0',
        });
        expect(result).toBe(true);
      });
    });

    describe('hashContactId', () => {
      it('generates a consistent positive 32-bit integer for a given id', () => {
        const hash1 = hashContactId('contact-abc-123');
        const hash2 = hashContactId('contact-abc-123');
        expect(hash1).toBe(hash2);
        expect(hash1).toBeGreaterThan(0);
        expect(Number.isInteger(hash1)).toBe(true);
        expect(hash1).not.toBe(MORNING_DIGEST_NOTIFICATION_ID);
      });

      it('produces different hash IDs for different contact ids', () => {
        const hashA = hashContactId('contact-a');
        const hashB = hashContactId('contact-b');
        expect(hashA).not.toBe(hashB);
      });
    });
  });
});

