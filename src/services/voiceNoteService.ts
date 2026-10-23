import type { Contact, ContactFact } from '../types/crm';
import { DEFAULT_WORKER_PROXY_URL } from './aiDraftService';

export interface VoiceNoteResult {
  personName: string;
  kabar: string; // Pembaruan Kabar Terakhir
  facts: string[]; // Fakta penting baru
  topic: string; // Bahan Obrolan Follow Up Berikutnya
  followUpDate: string | null; // YYYY-MM-DD
  source: 'ai' | 'fallback';
}

export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function buildVoiceNotePrompt(transcript: string, contact: Contact | null, today: Date = new Date()): string {
  return [
    'Anda membantu pengguna aplikasi Sapa mencatat kabar tentang seorang relasi setelah mereka mengobrol.',
    `Hari ini: ${DAY_NAMES[today.getDay()]}, ${toDateKey(today)}.`,
    contact
      ? `Relasi yang dibicarakan: ${contact.name}. Kabar lama: ${contact.lastUpdateNotes || '-'}.`
      : 'Relasi yang dibicarakan belum diketahui: ambil namanya dari cerita.',
    '',
    'PERAN: Cerita di bawah diucapkan oleh PENGGUNA tentang RELASI. "aku/saya" = pengguna. "dia/beliau" = relasi.',
    '',
    'Cerita pengguna (hasil suara, mungkin tidak rapi):',
    `"""${transcript}"""`,
    '',
    'Kembalikan HANYA JSON ARRAY berisi tepat satu objek, tanpa markdown:',
    '[{"personName": "...", "kabar": "...", "facts": ["..."], "topic": "...", "followUpDate": "YYYY-MM-DD atau null"}]',
    '',
    'Aturan:',
    '- personName: nama relasi seperti disebut di cerita ("" jika tidak ada).',
    '- kabar: ringkasan kabar terbaru relasi, 1-2 kalimat, pakai NAMA relasi (bukan "dia"). Contoh: "Ahmad baru dikaruniai anak dan akan membuka toko baru pada 31 Oktober 2026."',
    '- facts: hal yang MENETAP tentang relasi, pendek, maksimal 5 kata per item. Contoh: "Punya anak", "Punya toko kue", "Hobi futsal". Jangan masukkan nama, gelar (Ustadz, Pak, Hoca), atau acara sekali jalan. [] jika tidak ada.',
    '- topic: apa yang sebaiknya pengguna tanyakan/bahas saat menyapa berikutnya, pakai NAMA relasi dan TANGGAL PASTI. Contoh: "Tanyakan kabar pembukaan toko Ahmad (31 Oktober 2026)."',
    '- followUpDate: tanggal pasti acara/janji berikutnya, hitung dari Hari ini ("minggu depan", "lusa", "tanggal 31"). null jika tidak ada.',
    '- JANGAN pernah menulis kata waktu relatif ("minggu depan", "besok") di kabar/topic: selalu ubah ke tanggal pasti.',
  ].join('\n');
}

export function parseVoiceNoteJson(raw: string): Omit<VoiceNoteResult, 'source'> | null {
  const match = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    const obj = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!obj || typeof obj !== 'object') return null;
    const date = typeof obj.followUpDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.followUpDate) ? obj.followUpDate : null;
    return {
      personName: typeof obj.personName === 'string' ? obj.personName.trim() : '',
      kabar: typeof obj.kabar === 'string' ? obj.kabar.trim() : '',
      facts: Array.isArray(obj.facts) ? obj.facts.filter((f: unknown) => typeof f === 'string' && f.trim()).map((f: string) => f.trim()) : [],
      topic: typeof obj.topic === 'string' ? obj.topic.trim() : '',
      followUpDate: date,
    };
  } catch {
    return null;
  }
}

/** One AI call turns the spoken story into contact fields; falls back to saving the raw text. */
export async function extractVoiceNote(
  transcript: string,
  contact: Contact | null,
  opts: { today?: Date; proxyUrl?: string } = {}
): Promise<VoiceNoteResult> {
  const fallback: VoiceNoteResult = {
    personName: '',
    kabar: transcript.trim(),
    facts: [],
    topic: '',
    followUpDate: null,
    source: 'fallback',
  };
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const endpoint = opts.proxyUrl || (!isTestEnv ? DEFAULT_WORKER_PROXY_URL : undefined);
  if (!endpoint || !transcript.trim()) return fallback;
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: buildVoiceNotePrompt(transcript, contact, opts.today), temperature: 0.2 }),
    });
    if (!resp.ok) return fallback;
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = typeof raw === 'string' ? parseVoiceNoteJson(raw) : null;
    if (!parsed || !parsed.kabar) return fallback;
    return { ...parsed, source: 'ai' };
  } catch {
    return fallback;
  }
}

function normalizeName(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();
}

/** Local name match, so the contact list never leaves the phone. */
export function matchContactsByName(name: string, contacts: Contact[]): Contact[] {
  const words = normalizeName(name).split(/\s+/).filter((w) => w.length >= 3);
  if (words.length === 0) return [];
  return contacts.filter((c) => {
    const contactWords = normalizeName(c.name).split(/\s+/);
    return words.every((w) => contactWords.some((cw) => cw.startsWith(w)));
  });
}

/** Turns a reviewed voice note into contact updates; the replaced kabar is returned to be kept in the timeline. */
export function applyVoiceNote(
  contact: Contact,
  note: Pick<VoiceNoteResult, 'kabar' | 'facts' | 'topic' | 'followUpDate'>,
  today: Date = new Date()
): { updates: Partial<Contact>; archivedKabar: string | null } {
  const dateKey = toDateKey(today);
  const existing = contact.facts ?? [];
  const known = new Set(existing.map((f) => f.text.toLowerCase()));
  const newFacts: ContactFact[] = note.facts
    .filter((t) => !known.has(t.toLowerCase()))
    .map((text) => ({ text, date: dateKey }));

  const updates: Partial<Contact> = { lastContactedDate: dateKey };
  if (note.kabar) updates.lastUpdateNotes = note.kabar;
  if (newFacts.length) updates.facts = [...existing, ...newFacts];
  if (note.topic) updates.possibleFollowUpTopic = note.topic;
  // Same format as the dossier date picker (default reminder time 09:00).
  if (note.followUpDate) updates.nextSpecificFollowUp = `${note.followUpDate}T09:00`;

  const old = contact.lastUpdateNotes?.trim();
  const archivedKabar = note.kabar && old && old !== note.kabar ? old : null;
  return { updates, archivedKabar };
}
