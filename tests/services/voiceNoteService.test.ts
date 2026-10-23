import { describe, it, expect } from 'vitest';
import {
  parseVoiceNoteJson,
  matchContactsByName,
  applyVoiceNote,
  buildVoiceNotePrompt,
} from '../../src/services/voiceNoteService';
import type { Contact } from '../../src/types/crm';

const base: Contact = {
  id: 'c1',
  name: 'Ahmad Fauzi',
  phoneNumber: '+628123',
  associations: [],
  isProfessional: false,
  lastContactedDate: null,
  followUpCycleDays: 15,
  nextSpecificFollowUp: null,
  metContext: '',
  lastUpdateNotes: 'Pindah kerja ke Bandung',
  possibleFollowUpTopic: '',
  facts: [{ text: 'Hobi futsal', date: '2026-01-01' }],
  createdAt: '',
  updatedAt: '',
};

describe('voiceNoteService', () => {
  it('parses the JSON array the worker returns, even with extra text', () => {
    const raw = 'Berikut: [{"personName":"Ahmad","kabar":"Ahmad baru punya anak.","facts":["Punya anak"],"topic":"Tanya kabar bayi","followUpDate":"2026-10-31"}]';
    expect(parseVoiceNoteJson(raw)).toEqual({
      personName: 'Ahmad',
      kabar: 'Ahmad baru punya anak.',
      facts: ['Punya anak'],
      topic: 'Tanya kabar bayi',
      followUpDate: '2026-10-31',
    });
  });

  it('drops a malformed followUpDate and returns null for garbage', () => {
    expect(parseVoiceNoteJson('[{"kabar":"x","followUpDate":"minggu depan"}]')?.followUpDate).toBeNull();
    expect(parseVoiceNoteJson('tidak ada json')).toBeNull();
  });

  it('matches contacts by spoken first name, accent and case insensitive', () => {
    const others = [{ ...base, id: 'c2', name: 'Budi' }, { ...base, id: 'c3', name: 'Ahmad Rizki' }];
    expect(matchContactsByName('ahmad', [base, ...others]).map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(matchContactsByName('Ahmad Fauzi', [base, ...others]).map((c) => c.id)).toEqual(['c1']);
    expect(matchContactsByName('', [base])).toEqual([]);
  });

  it('applyVoiceNote archives old kabar, appends only new facts, sets dates', () => {
    const today = new Date(2026, 9, 24);
    const { updates, archivedKabar } = applyVoiceNote(
      base,
      { kabar: 'Ahmad baru punya anak.', facts: ['Punya anak', 'hobi futsal'], topic: 'Tanya bayi', followUpDate: '2026-10-31' },
      today
    );
    expect(archivedKabar).toBe('Pindah kerja ke Bandung');
    expect(updates.lastUpdateNotes).toBe('Ahmad baru punya anak.');
    expect(updates.facts).toEqual([
      { text: 'Hobi futsal', date: '2026-01-01' },
      { text: 'Punya anak', date: '2026-10-24' },
    ]);
    expect(updates.lastContactedDate).toBe('2026-10-24');
    expect(updates.nextSpecificFollowUp).toBe('2026-10-31T09:00');
  });

  it('prompt carries today, the roles rule and the contact name', () => {
    const prompt = buildVoiceNotePrompt('dia baru punya anak', base, new Date(2026, 9, 24));
    expect(prompt).toContain('2026-10-24');
    expect(prompt).toContain('"aku/saya" = pengguna');
    expect(prompt).toContain('Ahmad Fauzi');
  });
});
