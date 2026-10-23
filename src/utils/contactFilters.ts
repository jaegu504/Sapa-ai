import type { Contact } from '../types/crm';
import { calculateContactStatus } from './status';

export type ContactsFilter =
  | { kind: 'label'; label: string }
  | { kind: 'overdue' }
  | { kind: 'week' }
  | { kind: 'never' };

export function describeContactsFilter(filter: ContactsFilter): string {
  switch (filter.kind) {
    case 'label':
      return `Label: ${filter.label}`;
    case 'overdue':
      return 'Perlu Disapa';
    case 'week':
      return 'Jadwal 7 Hari ke Depan';
    case 'never':
      return 'Belum Pernah Disapa';
  }
}

export function applyContactsFilter(contacts: Contact[], filter: ContactsFilter | null, now: Date = new Date()): Contact[] {
  if (!filter) return contacts;
  return contacts.filter((c) => {
    switch (filter.kind) {
      case 'label': {
        const label = filter.label.toLowerCase();
        return (
          c.associations.some((a) => a.toLowerCase() === label) || (label === 'profesional' && c.isProfessional)
        );
      }
      case 'overdue':
        return calculateContactStatus(c, now).isOverdue;
      case 'week': {
        const status = calculateContactStatus(c, now);
        return !status.isOverdue && (status.daysRemaining ?? Infinity) <= 7;
      }
      case 'never':
        return !c.lastContactedDate;
    }
  });
}
