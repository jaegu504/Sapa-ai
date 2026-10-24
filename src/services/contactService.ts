import { crmDb } from '../db/crmDatabase';
import type { Contact, ImportResult, InteractionLog, InteractionType, RawPhoneContact } from '../types/crm';
import { normalizePhoneNumber } from '../utils/phone';
import { getDefaultCycleDays } from './settingsService';

/**
 * Imports raw phone contacts in batch, automatically deduplicating based on normalized phone number.
 * If phone number exists, updates the existing contact; otherwise adds a new contact.
 */
export async function importContacts(
  rawContacts: RawPhoneContact[],
  defaultCountryCode: string = '62',
  source: 'phone' | 'manual' = 'phone'
): Promise<ImportResult> {
  let importedCount = 0;
  let updatedCount = 0;

  for (const raw of rawContacts) {
    if (!raw.phoneNumber || !raw.phoneNumber.trim()) {
      continue;
    }

    const normalizedPhone = normalizePhoneNumber(raw.phoneNumber, defaultCountryCode);
    if (!normalizedPhone) {
      continue;
    }

    const existing = await crmDb.contacts.where('phoneNumber').equals(normalizedPhone).first();
    const nowIso = new Date().toISOString();

    if (existing) {
      // Never overwrite what the user already has (name, notes, schedule). Labels are only added.
      const updatedAssociations =
        raw.associations && raw.associations.length > 0
          ? Array.from(new Set([...existing.associations, ...raw.associations]))
          : existing.associations;

      await crmDb.contacts.update(existing.id, {
        associations: updatedAssociations,
        ...(source === 'phone' ? { source } : {}),
        updatedAt: nowIso,
      });
      updatedCount++;
    } else {
      const newContact: Contact = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `c_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: (raw.name || '').trim(),
        phoneNumber: normalizedPhone,
        associations: raw.associations && raw.associations.length > 0 ? raw.associations : ['Teman'],
        isProfessional: raw.isProfessional ?? false,
        lastContactedDate: null,
        followUpCycleDays: raw.followUpCycleDays ?? getDefaultCycleDays(),
        nextSpecificFollowUp: null,
        metContext: '',
        lastUpdateNotes: '',
        possibleFollowUpTopic: '',
        source,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await crmDb.contacts.add(newContact);
      importedCount++;
    }
  }

  return {
    importedCount,
    updatedCount,
    totalProcessed: rawContacts.length,
  };
}

export interface ResyncResult {
  /** Phone contacts that are not in Sapa yet (the user picks which to add). */
  newOnPhone: RawPhoneContact[];
  /** Sapa contacts that came from the phone but are no longer in the phone's list. */
  missing: Contact[];
}

/**
 * Compares Sapa with the phone's full contact list. Changes nothing except marking
 * matching contacts as coming from the phone; removal is left to the user's confirmation.
 * `allowRemoval` must be false when the list may be partial (web picker, empty result).
 */
export async function resyncPhoneContacts(
  deviceContacts: RawPhoneContact[],
  allowRemoval: boolean,
  defaultCountryCode: string = '62'
): Promise<ResyncResult> {
  const devicePhones = new Map<string, RawPhoneContact>();
  for (const raw of deviceContacts) {
    const phone = raw.phoneNumber ? normalizePhoneNumber(raw.phoneNumber, defaultCountryCode) : '';
    if (phone && !devicePhones.has(phone)) devicePhones.set(phone, raw);
  }

  const all = await crmDb.contacts.toArray();
  const known = new Set(all.map((c) => c.phoneNumber));
  const nowIso = new Date().toISOString();
  for (const c of all) {
    if (devicePhones.has(c.phoneNumber) && c.source !== 'phone') {
      await crmDb.contacts.update(c.id, { source: 'phone', updatedAt: nowIso });
    }
  }

  const newOnPhone = [...devicePhones.entries()].filter(([phone]) => !known.has(phone)).map(([, raw]) => raw);
  const missing =
    allowRemoval && devicePhones.size > 0
      ? all.filter((c) => c.source === 'phone' && !devicePhones.has(c.phoneNumber))
      : [];
  return { newOnPhone, missing };
}

/** Deletes contacts together with their interaction history. */
export async function deleteContacts(ids: string[]): Promise<void> {
  for (const id of ids) {
    await crmDb.contacts.delete(id);
    await crmDb.interactions.where('contactId').equals(id).delete();
  }
}

/**
 * Marks a conversation/chat as completed:
 * - Updates lastContactedDate to today (YYYY-MM-DD)
 * - Resets nextSpecificFollowUp to null
 * - Logs interaction to interactions table
 * - Returns updated Contact
 */
export async function markChatCompleted(
  contactId: string,
  notes?: string,
  type: InteractionType = 'whatsapp',
  customDate?: string
): Promise<Contact> {
  const contact = await crmDb.contacts.get(contactId);
  if (!contact) {
    throw new Error(`Contact with id ${contactId} not found`);
  }

  const today = customDate || new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  const updatedContact: Contact = {
    ...contact,
    lastContactedDate: today,
    nextSpecificFollowUp: null,
    ...(notes !== undefined && notes !== '' ? { lastUpdateNotes: notes } : {}),
    updatedAt: nowIso,
  };

  await crmDb.contacts.put(updatedContact);

  const interaction: InteractionLog = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    contactId,
    date: nowIso,
    notes: notes || '',
    type,
    createdAt: nowIso,
  };

  await crmDb.interactions.add(interaction);

  return updatedContact;
}

/**
 * Helper to fetch all contacts sorted by lastContactedDate or name.
 */
export async function getAllContacts(): Promise<Contact[]> {
  return crmDb.contacts.toArray();
}

/**
 * Helper to fetch a single contact by ID.
 */
export async function getContactById(id: string): Promise<Contact | undefined> {
  return crmDb.contacts.get(id);
}

/**
 * Helper to get all interaction logs for a contact.
 */
export async function getContactInteractions(contactId: string): Promise<InteractionLog[]> {
  return crmDb.interactions.where('contactId').equals(contactId).toArray();
}
