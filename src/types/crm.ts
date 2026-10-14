export type InteractionType = 'whatsapp' | 'call' | 'meetup' | 'other';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string; // International E.164 format (+62..., +90...)
  associations: string[]; // e.g. ['Keluarga', 'Ihvan', 'Zahiri', 'Hoca', 'Teman']
  isProfessional: boolean;
  lastContactedDate: string | null; // YYYY-MM-DD or null if never contacted
  followUpCycleDays: number; // default: 15
  nextSpecificFollowUp: string | null; // ISO datetime or YYYY-MM-DD, or null
  metContext: string; // Ketemu di mana & bagaimana
  lastUpdateNotes: string; // Pembaruan kabar terakhir
  possibleFollowUpTopic: string; // Bahan obrolan follow-up berikutnya
  userId?: string; // Owner user ID (optional for local-first)
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface InteractionLog {
  id: string;
  contactId: string;
  date: string; // ISO datetime or YYYY-MM-DD
  notes?: string;
  type: InteractionType;
  createdAt?: string;
}

export interface ContactStatusResult {
  isOverdue: boolean;
  statusText: string; // 'Time to reach out!' | 'Aman (👍)'
  suggestedDate: string | null; // YYYY-MM-DD or null
  daysOverdue: number; // 0 if not overdue, or number of days overdue
}

export interface RawPhoneContact {
  name: string;
  phoneNumber: string;
  associations?: string[];
  isProfessional?: boolean;
}

export interface ImportResult {
  importedCount: number;
  updatedCount: number;
  totalProcessed?: number;
}

export interface DigestResult {
  totalOverdue: number;
  contacts: Contact[];
  digestSummary: string;
  date: string;
}

export interface AlarmItem {
  contactId: string;
  contactName: string;
  phoneNumber: string;
  scheduledDate: string;
  topic: string;
  message: string;
}

