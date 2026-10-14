import { crmDb } from '../db/crmDatabase';
import type { Contact, ImportResult, InteractionLog, InteractionType, RawPhoneContact } from '../types/crm';
import { normalizePhoneNumber } from '../utils/phone';

/**
 * Imports raw phone contacts in batch, automatically deduplicating based on normalized phone number.
 * If phone number exists, updates the existing contact; otherwise adds a new contact.
 */
export async function importContacts(
  rawContacts: RawPhoneContact[],
  defaultCountryCode: string = '62'
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
      const updatedAssociations =
        raw.associations && raw.associations.length > 0
          ? Array.from(new Set([...existing.associations, ...raw.associations]))
          : existing.associations;

      await crmDb.contacts.update(existing.id, {
        name: (raw.name && raw.name.trim()) || existing.name,
        associations: updatedAssociations,
        isProfessional: raw.isProfessional !== undefined ? raw.isProfessional : existing.isProfessional,
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
        followUpCycleDays: 15,
        nextSpecificFollowUp: null,
        metContext: '',
        lastUpdateNotes: '',
        possibleFollowUpTopic: '',
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
