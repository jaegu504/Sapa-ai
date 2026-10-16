import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Contact, DigestResult, AlarmItem } from '../types/crm';
import { calculateContactStatus } from '../utils/status';

export type { DigestResult, AlarmItem };

export const MORNING_DIGEST_NOTIFICATION_ID = 1001;
export const CHANNEL_MORNING_DIGEST = 'crm_morning_digest';
export const CHANNEL_TARGETED_ALARMS = 'crm_targeted_alarms';

function getLocalNotificationsPlugin(): any {
  if (typeof window !== 'undefined') {
    const custom =
      (window as any).Capacitor?.Plugins?.LocalNotifications ||
      (window as any).LocalNotifications;
    if (custom) {
      return custom;
    }
  }
  return LocalNotifications;
}

export function isNativePlatform(): boolean {
  if (
    typeof window !== 'undefined' &&
    typeof (window as any).Capacitor?.isNativePlatform === 'function'
  ) {
    return (window as any).Capacitor.isNativePlatform();
  }
  return (
    Capacitor.isNativePlatform() ||
    Boolean(
      typeof window !== 'undefined' &&
        ((window as any).Capacitor?.Plugins?.LocalNotifications ||
          (window as any).LocalNotifications)
    )
  );
}

/**
 * Generates a stable positive 32-bit integer identifier from a string contact ID.
 * Avoids collision with MORNING_DIGEST_NOTIFICATION_ID (1001).
 */
export function hashContactId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return (positive % 2000000000) + 2000;
}

/**
 * Calculates next digest time (defaults to 08:00 AM local time).
 */
export function getNextDigestTime(targetHour: number = 8, targetMinute: number = 0, now: Date = new Date()): Date {
  const target = new Date(now.getTime());
  target.setHours(targetHour, targetMinute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Calculates next 08:00 AM local time (backward compatible).
 */
export function getNextEightAM(now: Date = new Date()): Date {
  return getNextDigestTime(8, 0, now);
}

/**
 * Formats a Date object or date string into a standard YYYY-MM-DD string.
 * Accurately handles UTC date strings to prevent local timezone shifts.
 */
export function formatDateKey(dateInput?: Date | string): string {
  if (!dateInput) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return dateInput;
  }

  // Date object:
  // If UTC midnight (hours, minutes, seconds, ms === 0), use UTC getters
  if (
    dateInput.getUTCHours() === 0 &&
    dateInput.getUTCMinutes() === 0 &&
    dateInput.getUTCSeconds() === 0 &&
    dateInput.getUTCMilliseconds() === 0
  ) {
    const y = dateInput.getUTCFullYear();
    const m = String(dateInput.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const y = dateInput.getFullYear();
  const m = String(dateInput.getMonth() + 1).padStart(2, '0');
  const d = String(dateInput.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates daily morning digest of overdue relationships.
 *
 * @param contacts Array of contacts to analyze
 * @param date Reference date (Date object or YYYY-MM-DD string, defaults to now)
 * @returns DigestResult containing overdue count, contacts list, friendly Indonesian summary, and date string
 */
export function getDailyDigestItems(
  contacts: Contact[],
  date?: Date | string
): DigestResult {
  const targetDateObj = date
    ? typeof date === 'string'
      ? new Date(date)
      : date
    : new Date();

  const dateString = formatDateKey(date || targetDateObj);

  const overdueContacts = contacts.filter((contact) => {
    const status = calculateContactStatus(contact, targetDateObj);
    return status.isOverdue;
  });

  const totalOverdue = overdueContacts.length;
  let digestSummary = 'Semua relasi aman hari ini';
  if (totalOverdue === 1) {
    digestSummary = '1 relasi perlu disapa hari ini';
  } else if (totalOverdue > 1) {
    digestSummary = `${totalOverdue} relasi perlu disapa hari ini`;
  }

  return {
    totalOverdue,
    contacts: overdueContacts,
    digestSummary,
    date: dateString,
  };
}

/**
 * Calculates upcoming scheduled follow-up alarms for contacts with specific scheduled dates.
 *
 * @param contacts Array of contacts to evaluate
 * @param withinHours Time window in hours (default: 24)
 * @param referenceDate Reference date (Date object or YYYY-MM-DD string, defaults to now)
 * @returns Array of AlarmItem sorted in chronological order
 */
export function getUpcomingAlarms(
  contacts: Contact[],
  withinHours: number = 24,
  referenceDate?: Date | string
): AlarmItem[] {
  const ref = referenceDate
    ? typeof referenceDate === 'string'
      ? new Date(referenceDate)
      : new Date(referenceDate.getTime())
    : new Date();

  const refMs = ref.getTime();
  const windowEndMs = refMs + withinHours * 60 * 60 * 1000;
  const refDateKey = formatDateKey(ref);

  const alarms: AlarmItem[] = [];

  for (const contact of contacts) {
    if (!contact.nextSpecificFollowUp || contact.nextSpecificFollowUp.trim() === '') {
      continue;
    }

    const scheduledDateStr = contact.nextSpecificFollowUp.trim();
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(scheduledDateStr);
    const scheduledDateObj = new Date(scheduledDateStr);

    if (isNaN(scheduledDateObj.getTime())) {
      continue;
    }

    const scheduledDateKey = formatDateKey(scheduledDateStr);
    const scheduledMs = scheduledDateObj.getTime();

    // Check if scheduled for today (date-only match) or falls within [refMs, windowEndMs]
    const isToday = isDateOnly && scheduledDateKey === refDateKey;
    const inWindow = scheduledMs >= refMs && scheduledMs <= windowEndMs;

    if (isToday || inWindow) {
      const topic = contact.possibleFollowUpTopic?.trim() || '';
      const message = topic
        ? `Waktunya follow-up dengan ${contact.name}: ${topic}`
        : `Waktunya follow-up dengan ${contact.name}`;

      alarms.push({
        contactId: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
        scheduledDate: scheduledDateStr,
        topic,
        message,
      });
    }
  }

  // Sort earliest scheduled date first
  alarms.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return alarms;
}

/**
 * Requests runtime notification permission on Android/native devices.
 * Checks permissions via LocalNotifications.checkPermissions(); if not 'granted', calls requestPermissions().
 * Provides safe fallback for desktop web mode.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin) {
      return true;
    }

    if (typeof plugin.checkPermissions === 'function') {
      const checkRes = await plugin.checkPermissions();
      let status = checkRes?.display;

      if (status !== 'granted') {
        if (typeof plugin.requestPermissions === 'function') {
          const reqRes = await plugin.requestPermissions();
          status = reqRes?.display;
        }
      }

      return status === 'granted';
    }

    // Web Notification API fallback if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      const res = await Notification.requestPermission();
      return res === 'granted';
    }

    return true;
  } catch (err) {
    console.warn('[notificationService] Failed checking/requesting permissions, falling back safely:', err);
    return true;
  }
}

/**
 * Initializes notification service by registering required Android notification channels:
 * - crm_morning_digest (Kinship Daily Digest, importance 4)
 * - crm_targeted_alarms (Kinship Targeted Follow-Ups, importance 5)
 */
export async function initNotificationService(): Promise<void> {
  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin || typeof plugin.createChannel !== 'function') {
      return;
    }

    await plugin.createChannel({
      id: CHANNEL_MORNING_DIGEST,
      name: 'Ringkasan Sapaan Pagi Sapa',
      description: 'Ringkasan sapaan harian jam 08:00 WIB',
      importance: 4,
    });

    await plugin.createChannel({
      id: CHANNEL_TARGETED_ALARMS,
      name: 'Pengingat Jadwal Sapa',
      description: 'Pengingat jadwal follow up khusus',
      importance: 5,
    });
  } catch (err) {
    console.warn('[notificationService] Could not register notification channels:', err);
  }
}

/**
 * Schedules repeating daily digest summarizing due/overdue contacts at custom or 08:00 WIB time.
 * Uses notification ID 1001 and channel 'crm_morning_digest'.
 * Returns total count of overdue contacts scheduled.
 */
export async function scheduleDailyMorningDigest(
  contacts: Contact[],
  options?: { hour?: number; minute?: number }
): Promise<number> {
  const digest = getDailyDigestItems(contacts);

  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin || typeof plugin.schedule !== 'function') {
      return digest.totalOverdue;
    }

    const hour = options?.hour ?? 8;
    const minute = options?.minute ?? 0;
    const nextTime = getNextDigestTime(hour, minute);

    await plugin.schedule({
      notifications: [
        {
          id: MORNING_DIGEST_NOTIFICATION_ID,
          title: 'Sapa: Waktunya Menyapa Relasi',
          body: digest.digestSummary,
          channelId: CHANNEL_MORNING_DIGEST,
          schedule: {
            at: nextTime,
            every: 'day',
            on: {
              hour,
              minute,
            },
            allowWhileIdle: true,
          },
          extra: {
            type: 'morning_digest',
            overdueCount: digest.totalOverdue,
          },
        },
      ],
    });
  } catch (err) {
    console.warn('[notificationService] Failed to schedule morning digest:', err);
  }

  return digest.totalOverdue;
}

/**
 * Schedules a targeted exact alarm for a contact on their nextSpecificFollowUp date/time.
 * Generates numeric hash ID from contact.id and assigns channel 'crm_targeted_alarms'.
 */
export async function scheduleTargetedFollowUpAlarm(contact: Contact): Promise<boolean> {
  if (!contact.nextSpecificFollowUp || !contact.nextSpecificFollowUp.trim()) {
    return false;
  }

  const dateStr = contact.nextSpecificFollowUp.trim();
  let scheduleDate: Date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    scheduleDate = new Date(y, m - 1, d, 8, 0, 0);
  } else {
    scheduleDate = new Date(dateStr);
  }

  if (isNaN(scheduleDate.getTime())) {
    return false;
  }

  const hashId = hashContactId(contact.id);
  const topic = contact.possibleFollowUpTopic?.trim() || '';
  const body = topic || 'Waktunya menyapa kembali';

  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin || typeof plugin.schedule !== 'function') {
      return true; // Web fallback
    }

    await plugin.schedule({
      notifications: [
        {
          id: hashId,
          title: `Jadwal Follow-up: ${contact.name}`,
          body,
          channelId: CHANNEL_TARGETED_ALARMS,
          schedule: {
            at: scheduleDate,
            allowWhileIdle: true,
          },
          extra: {
            contactId: contact.id,
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('[notificationService] Failed to schedule targeted alarm:', err);
    return true;
  }
}

/**
 * Cancels all pending/scheduled notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin) return;

    if (typeof plugin.cancelAll === 'function') {
      await plugin.cancelAll();
    } else if (typeof plugin.getPending === 'function' && typeof plugin.cancel === 'function') {
      const pending = await plugin.getPending();
      if (pending?.notifications && pending.notifications.length > 0) {
        await plugin.cancel({ notifications: pending.notifications });
      }
    }
  } catch (err) {
    console.warn('[notificationService] Failed to cancel scheduled notifications:', err);
  }
}

