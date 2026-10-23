import { describe, it, expect } from 'vitest';
import {
  parseVoiceNoteJson,
  rankContactsByName,
  pickConfidentMatch,
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

  it('ranks contacts ignoring honorifics and tolerating spelling slips', () => {
    const hasan = { ...base, id: 'h', name: 'Hasan' };
    const ahmadR = { ...base, id: 'r', name: 'Ahmad Rizki' };
    const budi = { ...base, id: 'b', name: 'Budi' };
    const all = [base, hasan, ahmadR, budi];
    // "Ustadz" is dropped, so the saved "Hasan" is a confident match.
    expect(pickConfidentMatch(rankContactsByName('Ustadz Hasan', all))?.id).toBe('h');
    // Full name beats a shared first name.
    expect(pickConfidentMatch(rankContactsByName('Ahmad Fauzi', all))?.id).toBe('c1');
    // Two Ahmads: ask instead of guessing, both ranked first.
    const twoAhmads = rankContactsByName('Pak Ahmad', all);
    expect(pickConfidentMatch(twoAhmads)).toBeNull();
    expect(twoAhmads.slice(0, 2).map((r) => r.contact.id).sort()).toEqual(['c1', 'r']);
    // Speech typo "Ahmed Fauzy" still finds Ahmad Fauzi first.
    expect(rankContactsByName('Ahmed Fauzy', all)[0].contact.id).toBe('c1');
    expect(rankContactsByName('', all)).toEqual([]);
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
