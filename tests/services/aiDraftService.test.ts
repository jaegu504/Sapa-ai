import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateDeterministicFallbackDraft,
  generateWhatsAppDraft,
} from '../../src/services/aiDraftService';
import { Contact } from '../../src/types/crm';

describe('aiDraftService fallback', () => {
  it('uses polite honorifics for Hoca category', () => {
    const contact: Contact = {
      id: 'h1',
      name: 'Yılmaz Kileci Abi',
      phoneNumber: '+90532000000',
      associations: ['Hoca'],
      isProfessional: true,
      lastContactedDate: '2026-09-20',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Kabar dan silaturahmi',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Assalamu’alaikum');
    expect(draft).toContain('Yılmaz Kileci Abi');
    expect(draft).toContain('Kabar dan silaturahmi');
  });

  it('uses warm and friendly tone for Ihvan / Teman category', () => {
    const contact: Contact = {
      id: 'i1',
      name: 'Ahmad Faiz',
      phoneNumber: '+628123456789',
      associations: ['Ihvan', 'Teman'],
      isProfessional: false,
      lastContactedDate: '2026-09-25',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Kajian Rutin',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Rencana halaqah pekan depan',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Ahmad Faiz');
    expect(draft).toContain('Rencana halaqah pekan depan');
    // Warm brotherhood or friendly greeting
    expect(draft.toLowerCase()).toMatch(/assalamu’alaikum|assalamu'alaikum|halo/);
  });

  it('uses loving and personal tone for Keluarga category', () => {
    const contact: Contact = {
      id: 'k1',
      name: 'Tante Dewi',
      phoneNumber: '+628111222333',
      associations: ['Keluarga'],
      isProfessional: false,
      lastContactedDate: '2026-09-10',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Keluarga besar',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Kumpul arisan keluarga',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Tante Dewi');
    expect(draft).toContain('Kumpul arisan keluarga');
  });

  it('uses formal and polite tone for Profesional category', () => {
    const contact: Contact = {
      id: 'p1',
      name: 'Pak Hendra Pratama',
      phoneNumber: '+6281999888777',
      associations: ['Profesional'],
      isProfessional: true,
      lastContactedDate: '2026-09-15',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Konferensi Tech Jakarta',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Kerjasama integrasi API',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Pak Hendra Pratama');
    expect(draft).toContain('Kerjasama integrasi API');
  });

  it('synthesizes lastUpdateNotes if possibleFollowUpTopic is not provided', () => {
    const contact: Contact = {
      id: 'u1',
      name: 'Ridwan',
      phoneNumber: '+6281233344455',
      associations: ['Teman'],
      isProfessional: false,
      lastContactedDate: '2026-09-01',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: 'Sedang persiapan ujian tesis',
      possibleFollowUpTopic: '',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Ridwan');
    expect(draft).toContain('Sedang persiapan ujian tesis');
  });

  it('produces a natural greeting without undefined when neither topic nor notes exist', () => {
    const contact: Contact = {
      id: 'empty1',
      name: 'Budi',
      phoneNumber: '+6281233344455',
      associations: ['Teman'],
      isProfessional: false,
      lastContactedDate: '2026-09-01',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: '',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Budi');
    expect(draft).not.toContain('undefined');
    expect(draft).not.toContain('null');
    expect(draft.length).toBeGreaterThan(15);
  });
});

describe('generateWhatsAppDraft (Gemini API & Fallback)', () => {
  const sampleContact: Contact = {
    id: 's1',
    name: 'Ust. Abdullah',
    phoneNumber: '+6281234567890',
    associations: ['Hoca'],
    isProfessional: false,
    lastContactedDate: '2026-09-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: '',
    lastUpdateNotes: '',
    possibleFollowUpTopic: 'Jadwal kajian bulanan',
    createdAt: '',
    updatedAt: '',
  };

  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns deterministic fallback when no apiKey is provided', async () => {
    const draft = await generateWhatsAppDraft(sampleContact);
    expect(draft).toContain('Assalamu’alaikum');
    expect(draft).toContain('Ust. Abdullah');
    expect(draft).toContain('Jadwal kajian bulanan');
  });

  it('calls Gemini API and returns generated draft when apiKey is valid', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Assalamu’alaikum Ust. Abdullah, semoga sehat selalu. Izin menanyakan mengenai jadwal kajian bulanan jika beliau ada kelapangan waktu. Jazakallah khair.',
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGeminiResponse,
    });

    const draft = await generateWhatsAppDraft(sampleContact, 'test-gemini-key');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(draft).toBe(
      'Assalamu’alaikum Ust. Abdullah, semoga sehat selalu. Izin menanyakan mengenai jadwal kajian bulanan jika beliau ada kelapangan waktu. Jazakallah khair.'
    );
  });

  it('gracefully falls back to deterministic generator on fetch network error without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline or failed'));

    const draft = await generateWhatsAppDraft(sampleContact, 'test-gemini-key');
    expect(draft).toContain('Assalamu’alaikum');
    expect(draft).toContain('Ust. Abdullah');
    expect(draft).toContain('Jadwal kajian bulanan');
  });

  it('gracefully falls back on HTTP error response (e.g. 500 or 403)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'API key expired' } }),
    });

    const draft = await generateWhatsAppDraft(sampleContact, 'invalid-key');
    expect(draft).toContain('Assalamu’alaikum');
    expect(draft).toContain('Ust. Abdullah');
  });

  it('gracefully falls back when Gemini response candidates are empty or malformed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    });

    const draft = await generateWhatsAppDraft(sampleContact, 'test-key');
    expect(draft).toContain('Assalamu’alaikum');
    expect(draft).toContain('Ust. Abdullah');
  });
});
