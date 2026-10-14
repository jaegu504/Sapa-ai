import Dexie, { type EntityTable } from 'dexie';
import type { Contact, InteractionLog } from '../types/crm';

export class CRMDatabase extends Dexie {
  contacts!: EntityTable<Contact, 'id'>;
  interactions!: EntityTable<InteractionLog, 'id'>;

  constructor() {
    super('PersonalRelationshipCRM');
    this.version(1).stores({
      contacts: 'id, phoneNumber, lastContactedDate, *associations, isProfessional, createdAt',
      interactions: 'id, contactId, date, type, createdAt',
    });
  }
}

export const crmDb = new CRMDatabase();
