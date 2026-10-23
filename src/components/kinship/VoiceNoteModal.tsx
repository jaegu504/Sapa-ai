import React, { useEffect, useState } from 'react';
import { Mic, X, Sparkles, Loader2, UserCircle2, Search } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { isSpeechAvailable, listenOnce } from '../../services/speechService';
import { extractVoiceNote, rankContactsByName, pickConfidentMatch, VoiceNoteResult } from '../../services/voiceNoteService';

const LANGUAGE_KEY = 'sapa_voice_language';
const LANGUAGES = [
  { code: 'id-ID', label: '🇮🇩 ID' },
  { code: 'tr-TR', label: '🇹🇷 TR' },
];

function loadLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'tr-TR' ? 'tr-TR' : 'id-ID';
  } catch {
    return 'id-ID';
  }
}

export interface VoiceNoteModalProps {
  isOpen: boolean;
  /** Known contact (opened from the contact page); null = global entry, the contact is found from the story. */
  contact: Contact | null;
  contacts: Contact[];
  onClose: () => void;
  onSave: (contact: Contact, note: Pick<VoiceNoteResult, 'kabar' | 'facts' | 'topic' | 'followUpDate'>) => Promise<void> | void;
}

type Stage = 'record' | 'processing' | 'pick' | 'review';

const field =
  'w-full text-xs text-slate-800 dark:text-white bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-cyan-400';
const label = 'text-[11px] font-semibold text-slate-600 dark:text-slate-300';

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({ isOpen, contact, contacts, onClose, onSave }) => {
  const [stage, setStage] = useState<Stage>('record');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<Contact | null>(contact);
  const [candidates, setCandidates] = useState<Contact[]>([]);
  const [kabar, setKabar] = useState('');
  const [facts, setFacts] = useState('');
  const [topic, setTopic] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingResult, setPendingResult] = useState<VoiceNoteResult | null>(null);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState(loadLanguage);

  useEffect(() => {
    if (isOpen) {
      setStage('record');
      setTranscript('');
      setError('');
      setTarget(contact);
      setCandidates([]);
      setSearch('');
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const handleListen = async () => {
    setError('');
    setListening(true);
    try {
      const text = await listenOnce(language);
      if (text) setTranscript((prev) => (prev ? `${prev} ${text}` : text));
      else setError('Suara tidak terdengar. Coba lagi, atau ketik ceritanya.');
    } catch {
      setError('Perekam suara tidak tersedia di perangkat ini. Silakan ketik ceritanya.');
    } finally {
      setListening(false);
    }
  };

  const showReview = (result: VoiceNoteResult, who: Contact) => {
    setTarget(who);
    setKabar(result.kabar);
    setFacts(result.facts.join(', '));
    setTopic(result.topic);
    setFollowUpDate(result.followUpDate ?? '');
    setUsedFallback(result.source === 'fallback');
    setStage('review');
  };

  const handleProcess = async () => {
    if (!transcript.trim()) return;
    setStage('processing');
    const result = await extractVoiceNote(transcript, target);
    if (target) {
      showReview(result, target);
      return;
    }
    const ranked = rankContactsByName(result.personName, contacts);
    const confident = pickConfidentMatch(ranked);
    if (confident) {
      showReview(result, confident);
    } else {
      // Closest names first, then everyone else, so the search box covers all contacts.
      const rankedIds = new Set(ranked.map((r) => r.contact.id));
      setPendingResult(result);
      setCandidates([...ranked.map((r) => r.contact), ...contacts.filter((c) => !rankedIds.has(c.id))]);
      setStage('pick');
    }
  };

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await onSave(target, {
        kabar: kabar.trim(),
        facts: facts.split(',').map((f) => f.trim()).filter(Boolean),
        topic: topic.trim(),
        followUpDate: followUpDate || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Catat dengan Suara"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1C1C1E] text-slate-800 dark:text-white rounded-t-[28px] sm:rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Catat dengan Suara</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {target ? `Kabar tentang ${target.name}` : 'Sebut nama orangnya dalam cerita'}
            </p>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {stage === 'record' && (
          <div className="space-y-3">
            <div className="flex justify-center gap-1.5" role="group" aria-label="Bahasa Suara">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  aria-pressed={language === l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    try {
                      localStorage.setItem(LANGUAGE_KEY, l.code);
                    } catch {
                      // Ignore localStorage failures
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    language === l.code
                      ? 'bg-slate-900 dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                type="button"
                aria-label="Mulai Rekam Suara"
                onClick={handleListen}
                disabled={listening || !isSpeechAvailable()}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                  listening ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {listening ? 'Mendengarkan...' : 'Ketuk mikrofon lalu ceritakan kabarnya'}
              </p>
            </div>
            <textarea
              aria-label="Cerita Kabar"
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Contoh: "Tadi ngobrol sama Ahmad, anaknya baru lahir. Tanggal 31 dia buka toko baru."`}
              className={field}
            />
            {error && <p className="text-[11px] text-amber-700 dark:text-amber-300">{error}</p>}
            <button
              type="button"
              onClick={handleProcess}
              disabled={!transcript.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-slate-900 dark:bg-blue-600 text-white font-bold text-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> Proses Catatan
            </button>
          </div>
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-2 py-10 text-xs text-slate-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-cyan-400" />
            Merapikan catatan Anda...
          </div>
        )}

        {stage === 'pick' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {pendingResult?.personName
                ? `Kabar ini tentang siapa? ("${pendingResult.personName}")`
                : 'Kabar ini tentang siapa?'}
            </p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Cari Kontak"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kontak..."
                className={`${field} pl-9`}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {candidates
                .filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()))
                .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pendingResult && showReview(pendingResult, c)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-left text-sm"
                >
                  <UserCircle2 className="w-5 h-5 text-slate-400" /> {c.name}
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="text-xs text-slate-500">Belum ada kontak. Tambahkan kontaknya dulu.</p>
              )}
            </div>
          </div>
        )}

        {stage === 'review' && target && (
          <div className="space-y-3">
            {usedFallback && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                AI sedang sibuk, jadi cerita Anda disimpan apa adanya. Silakan rapikan sendiri bila perlu.
              </p>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Periksa dulu sebelum disimpan. Kabar lama akan dipindahkan ke Riwayat beserta tanggalnya.
            </p>
            <div className="space-y-1">
              <label htmlFor="voice-kabar" className={label}>Pembaruan Kabar Terakhir</label>
              <textarea id="voice-kabar" rows={3} value={kabar} onChange={(e) => setKabar(e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label htmlFor="voice-facts" className={label}>Fakta Penting Baru (pisahkan dengan koma)</label>
              <input id="voice-facts" value={facts} onChange={(e) => setFacts(e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label htmlFor="voice-topic" className={label}>Bahan Obrolan Follow Up Berikutnya</label>
              <textarea id="voice-topic" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label htmlFor="voice-date" className={label}>Jadwal Follow Up</label>
              <input id="voice-date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={field} />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Perbarui {target.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
