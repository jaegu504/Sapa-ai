import { Contact, DigestResult, AlarmItem } from '../types/crm';
import { calculateContactStatus } from '../utils/status';

export type { DigestResult, AlarmItem };

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
