import { Contact, ContactStatusResult } from '../types/crm';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Adds a given number of days to a YYYY-MM-DD or ISO date string using UTC arithmetic.
 * Returns formatted YYYY-MM-DD string, or null if date is invalid.
 */
function addDaysToDateString(dateStr: string, days: number): string | null {
  if (!dateStr) return null;

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const utcDate = new Date(Date.UTC(y, m, d + days));
    if (isNaN(utcDate.getTime())) return null;
    const resY = utcDate.getUTCFullYear();
    const resM = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const resD = String(utcDate.getUTCDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  const utcDate = new Date(parsed.getTime() + days * MS_PER_DAY);
  return utcDate.toISOString().split('T')[0];
}

/**
 * Converts a Date object or date string to midnight UTC timestamp for day-accurate arithmetic.
 */
function toMidnightUtcTimestamp(dateInput: Date | string): number {
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    }
    const parsed = new Date(dateInput);
    return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  // Date object: if already at UTC midnight (from date-only string), use UTC getters
  if (
    dateInput.getUTCHours() === 0 &&
    dateInput.getUTCMinutes() === 0 &&
    dateInput.getUTCSeconds() === 0 &&
    dateInput.getUTCMilliseconds() === 0
  ) {
    return Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate());
  }

  // Otherwise treat as local date representation
  return Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
}

/**
 * Calculates the contact follow-up status based on the Notion 15-day cadence formula
 * and specific scheduled follow-up dates.
 *
 * Rules:
 * 1. Default routine cadence: lastContactedDate + followUpCycleDays (default 15 days).
 * 2. Next Specific Follow Up takes priority over the routine cadence if scheduled.
 * 3. Contacts without any prior contact date (fresh imports) default to 'Time to reach out!' gracefully without NaN.
 */
export function calculateContactStatus(contact: Contact, now?: Date): ContactStatusResult {
  const currentDate = now ? new Date(now.getTime()) : new Date();
  const currentMidnight = toMidnightUtcTimestamp(currentDate);

  const cycleDays =
    typeof contact.followUpCycleDays === 'number' && contact.followUpCycleDays > 0
      ? contact.followUpCycleDays
      : 15;

  const suggestedDate = contact.lastContactedDate
    ? addDaysToDateString(contact.lastContactedDate, cycleDays)
    : null;

  // Case 1: Specific next follow-up date is set (takes priority over routine cadence)
  if (contact.nextSpecificFollowUp && contact.nextSpecificFollowUp.trim() !== '') {
    const specificMidnight = toMidnightUtcTimestamp(contact.nextSpecificFollowUp);
    const diffDays = Math.floor((currentMidnight - specificMidnight) / MS_PER_DAY);

    if (diffDays >= 0) {
      return {
        isOverdue: true,
        statusText: 'Time to reach out!',
        suggestedDate,
        daysOverdue: diffDays,
        daysRemaining: 0,
      };
    } else {
      return {
        isOverdue: false,
        statusText: 'Aman (👍)',
        suggestedDate,
        daysOverdue: 0,
        daysRemaining: Math.abs(diffDays),
      };
    }
  }

  // Case 2: No specific follow up, but suggestedDate is calculated from lastContactedDate
  if (suggestedDate) {
    const suggestedMidnight = toMidnightUtcTimestamp(suggestedDate);
    const diffDays = Math.floor((currentMidnight - suggestedMidnight) / MS_PER_DAY);

    if (diffDays >= 0) {
      return {
        isOverdue: true,
        statusText: 'Time to reach out!',
        suggestedDate,
        daysOverdue: diffDays,
        daysRemaining: 0,
      };
    } else {
      return {
        isOverdue: false,
        statusText: 'Aman (👍)',
        suggestedDate,
        daysOverdue: 0,
        daysRemaining: Math.abs(diffDays),
      };
    }
  }

  // Case 3: Fresh contact with no lastContactedDate and no nextSpecificFollowUp
  return {
    isOverdue: true,
    statusText: 'Time to reach out!',
    suggestedDate: null,
    daysOverdue: 0,
    daysRemaining: 0,
  };
}

/**
 * Returns the effective count of days left or overdue for CadenceBadge display.
 */
export function getDaysLeftOrOverdue(status: ContactStatusResult): number {
  return status.isOverdue ? status.daysOverdue : (status.daysRemaining ?? 0);
}

