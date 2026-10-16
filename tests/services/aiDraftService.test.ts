import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateDeterministicFallbackDraft,
  generateWhatsAppDraft,
  generateSapaDrafts,
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

describe('Sapa AI Engine: Multi-Label Tone Blending & Turkish Support', () => {
  it('blends Hoca + Teman: takzim salam + warm friendly brotherhood tone in Indonesian', () => {
    const contact: Contact = {
      id: 'ht1',
      name: 'Ust. Ridwan',
      phoneNumber: '+628123456789',
      associations: ['Hoca', 'Teman'],
      isProfessional: false,
      lastContactedDate: '2026-09-20',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Kajian & Futsal',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Agenda silaturahmi & ngopi santai',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact, 'id');
    expect(draft).toMatch(/Assalamu’alaikum|Assalamu'alaikum/);
    expect(draft).toContain('Ust. Ridwan');
    // Blended tone check: contains respect and friendly warmth
    expect(draft.toLowerCase()).toMatch(/ngopi|santai|silaturahmi|senggang/);
  });

  it('blends Keluarga + Profesional: caring family tone with business clarity', () => {
    const contact: Contact = {
      id: 'kp1',
      name: 'Om Budi',
      phoneNumber: '+628111222333',
      associations: ['Keluarga', 'Profesional'],
      isProfessional: true,
      lastContactedDate: '2026-09-10',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Kerjasama renovasi rumah',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact, 'id');
    expect(draft).toContain('Om Budi');
    expect(draft).toContain('Kerjasama renovasi rumah');
    expect(draft.toLowerCase()).toMatch(/keluarga|sehat|kabar/);
  });

  it('generates authentic Turkish greetings for Hoca category', () => {
    const contact: Contact = {
      id: 'tr_hoca',
      name: 'Mehmet',
      phoneNumber: '+905551234567',
      associations: ['Hoca'],
      isProfessional: false,
      lastContactedDate: '2026-09-01',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Istanbul',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Kuran dersi ve sohbet',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact, 'tr');
    expect(draft.toLowerCase()).toMatch(/selamün aleyküm|hocam|saygılar/);
    expect(draft).toContain('Mehmet');
  });

  it('generates authentic Turkish friendly / brotherhood greetings with çay invitation', () => {
    const contact: Contact = {
      id: 'tr_friend',
      name: 'Emre',
      phoneNumber: '+905559876543',
      associations: ['Ihvan', 'Teman'],
      isProfessional: false,
      lastContactedDate: '2026-09-01',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Hafta sonu buluşması',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact, 'tr', 'catchup_meet');
    expect(draft.toLowerCase()).toMatch(/çay|kahve|buluş|görüş/);
    expect(draft).toContain('Emre');
  });
});

describe('generateSapaDrafts', () => {
  const sampleContact: Contact = {
    id: 'sapa_c1',
    name: 'Fatih',
    phoneNumber: '+905551112233',
    associations: ['Teman'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: '',
    lastUpdateNotes: '',
    possibleFollowUpTopic: 'Proyek mobile app',
    createdAt: '',
    updatedAt: '',
  };

  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns 3 distinct options (Kabar & Doa, Bahasan Topik, Ajak Temu/Çay) on offline fallback', async () => {
    // When no API key or proxy is provided, or fetch fails
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await generateSapaDrafts({
      contact: sampleContact,
      language: 'tr',
    });

    expect(result.drafts).toHaveLength(3);
    const angles = result.drafts.map((d) => d.angle);
    expect(angles).toContain('warm_greeting');
    expect(angles).toContain('topic_discussion');
    expect(angles).toContain('catchup_meet');
    expect(result.source).toBe('offline_rule');
  });

  it('calls Cloudflare Worker proxy and maps AI response into 3 distinct options', async () => {
    const mockWorkerResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify([
                  { angle: 'warm_greeting', title: 'Kabar & Doa', text: 'Selamün aleyküm Fatih, afiyettesinizdir inşallah.' },
                  { angle: 'topic_discussion', title: 'Bahasan Topik', text: 'Selam Fatih, geçen konuştuğumuz mobil uygulama projesi nasıl gidiyor?' },
                  { angle: 'catchup_meet', title: 'Ajak Temu / Çay', text: 'Selam Fatih, bu hafta müsait olduğunda bir çay içelim mi?' },
                ]),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWorkerResponse,
    });

    const result = await generateSapaDrafts(
      {
        contact: sampleContact,
        language: 'tr',
      },
      'https://sapa-ai.jaegu108.workers.dev/'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.drafts).toHaveLength(3);
    expect(result.drafts[0].text).toContain('Selamün aleyküm Fatih');
    expect(result.drafts[1].text).toContain('mobil uygulama');
    expect(result.drafts[2].text).toContain('çay içelim');
  });

  it('uses variationIndex and previousDrafts to ensure anti-repetition across multiple generations', () => {
    const prevDrafts = [
      generateDeterministicFallbackDraft(sampleContact, 'tr', 'warm_greeting', 0),
    ];
    const newDraft = generateDeterministicFallbackDraft(sampleContact, 'tr', 'warm_greeting', 1);

    expect(newDraft).not.toBe(prevDrafts[0]);
  });

  it('prevents raw Indonesian notes from leaking into Turkish fallback drafts', () => {
    const contact: Contact = {
      id: 'tr_indo_notes',
      name: 'Emre Yilmaz',
      phoneNumber: '+905551234567',
      associations: ['Hoca', 'Teman'],
      isProfessional: false,
      lastContactedDate: '2026-09-01',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Istanbul',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'mau nanya kelanjutan proyek riset kemarin dan ngajak ngeteh santai',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact, 'tr', 'topic_discussion');
    expect(draft).not.toContain('mau nanya');
    expect(draft).not.toContain('proyek riset');
    expect(draft).toContain('geçenlerde bahsettiğimiz konu');
  });

  it('calls Cloudflare Worker proxy and maps Groq OpenAI choices format into 3 distinct options', async () => {
    const mockGroqWorkerResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              { angle: 'warm_greeting', title: 'Hâl Hatır & Dua', text: 'Selam Fatih kardeşim, nasılsın? Sıhhatin yerindedir inşallah.' },
              { angle: 'topic_discussion', title: 'Konu & Gündem', text: 'Selam Fatih, mobil uygulama projesi konusunu konuşalım mı?' },
              { angle: 'catchup_meet', title: 'Buluşma & Çay Daveti', text: 'Selam Fatih, bu hafta uygun olduğunda bir çay içip sohbet edelim.' },
            ]),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGroqWorkerResponse,
    });

    const result = await generateSapaDrafts(
      {
        contact: sampleContact,
        language: 'tr',
      },
      'https://sapa-ai.jaegu108.workers.dev/'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('worker');
    expect(result.drafts).toHaveLength(3);
    expect(result.drafts[0].text).toContain('Fatih kardeşim');
    expect(result.drafts[1].text).toContain('mobil uygulama');
    expect(result.drafts[2].text).toContain('çay içip');
  });

  it('calls Groq API directly when apiKey starts with gsk_', async () => {
    const mockGroqDirectResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              { angle: 'warm_greeting', title: 'Kabar & Doa', text: 'Hai Fatih, apa kabar? Semoga sehat selalu.' },
              { angle: 'topic_discussion', title: 'Bahasan Topik', text: 'Hai Fatih, mau tanya update proyek aplikasi.' },
              { angle: 'catchup_meet', title: 'Ajak Temu / Ngopi', text: 'Hai Fatih, kapan ada waktu ngopi bareng?' },
            ]),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGroqDirectResponse,
    });

    const result = await generateSapaDrafts(
      {
        contact: sampleContact,
        language: 'id',
      },
      undefined,
      'gsk_testGroqKey123'
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gsk_testGroqKey123',
        }),
      })
    );
    expect(result.source).toBe('groq_direct');
    expect(result.drafts).toHaveLength(3);
  });

  it('supports Groq gsk_ API key in legacy generateWhatsAppDraft', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Halo Fatih, semoga sehat selalu!' } }],
      }),
    });

    const draft = await generateWhatsAppDraft(sampleContact, 'gsk_mockGroqKey');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.anything()
    );
    expect(draft).toBe('Halo Fatih, semoga sehat selalu!');
  });

  it('safely parses plain string array from AI response into 3 distinct Sapa options', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify([
                'Hai Fatih! Lama tak jumpa, gimana kabarmu?',
                'Yo Fatih! Apa kabar bro? Proyek aplikasi gimana?',
                'Halo Fatih! Kapan nih ada waktu ngopi bareng?',
              ]),
            },
          },
        ],
      }),
    });

    const result = await generateSapaDrafts(
      {
        contact: sampleContact,
        language: 'id',
      },
      'https://sapa-ai.jaegu108.workers.dev/'
    );

    expect(result.drafts).toHaveLength(3);
    expect(result.drafts[0].text).toBe('Hai Fatih! Lama tak jumpa, gimana kabarmu?');
    expect(result.drafts[1].text).toBe('Yo Fatih! Apa kabar bro? Proyek aplikasi gimana?');
    expect(result.drafts[2].text).toBe('Halo Fatih! Kapan nih ada waktu ngopi bareng?');
  });
});
