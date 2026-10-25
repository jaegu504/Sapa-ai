import React, { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { Calendar, Loader2, MessageSquare, Mic, Search, Sparkles, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Sheet } from '../ui/Sheet';
import { avatarTone, formatLongDate, getInitials } from '../../utils/display';
import type { Contact } from '../../types/crm';
import { isSpeechAvailable, listenOnce } from '../../services/speechService';
import { extractVoiceNote, rankContactsByName, pickConfidentMatch, VoiceNoteResult } from '../../services/voiceNoteService';

const LANGUAGE_KEY = 'sapa_voice_language';
const LANGUAGES = [
  { code: 'id-ID', label: '🇮🇩 ID' },
  { code: 'tr-TR', label: '🇹🇷 TR' },
];
const WAVE = [8, 16, 26, 14, 30, 20, 10, 24, 32, 18, 12, 22, 8];

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
  'w-full text-[14.5px] leading-relaxed bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none';
const label = 'flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1';
const group = 'rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]';
const card = 'rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10';
const NewTag: React.FC<{ text?: string }> = ({ text = t('BARU') }) => (
  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">{text}</span>
);

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

  const handleListen = async () => {
    setError('');
    setListening(true);
    try {
      const text = await listenOnce(language);
      if (text) setTranscript((prev) => (prev ? `${prev} ${text}` : text));
      else setError(t('Suara tidak terdengar. Coba lagi, atau ketik ceritanya.'));
    } catch {
      setError(t('Perekam suara tidak tersedia di perangkat ini. Silakan ketik ceritanya.'));
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
    setPendingResult(result);
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

  const factList = facts.split(',').map((f) => f.trim()).filter(Boolean);
  const knownFacts = new Set((target?.facts ?? []).map((f) => f.text.toLowerCase()));
  const addedFacts = factList.filter((f) => !knownFacts.has(f.toLowerCase())).length;
  return (
    <Sheet isOpen={isOpen} onClose={onClose} ariaLabel={t('Catat dengan Suara')} size="full" zIndex="z-[60]">
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 pb-3">
        {stage === 'review' ? (
          <button type="button" onClick={() => setStage('record')} className="press text-[16px] text-blue-600 dark:text-cyan-400">
            {t("Ulangi")}
          </button>
        ) : (
          <button type="button" onClick={onClose} className="press text-[16px] text-blue-600 dark:text-cyan-400">
            {t("Batal")}
          </button>
        )}
        <h2 className="text-[16px] font-bold">{stage === 'review' ? t('Periksa Dulu') : stage === 'pick' ? t('Tentang Siapa?') : t('Catat Suara')}</h2>
        {stage === 'record' ? (
          <div className="flex p-0.5 rounded-full bg-slate-200/70 dark:bg-white/10" role="group" aria-label={t("Bahasa Suara")}>
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
                className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap ${
                  language === l.code ? 'bg-white dark:bg-white/25 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" aria-label={t("Tutup")} onClick={onClose} className="press w-8 h-8 rounded-full flex items-center justify-center bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
        {stage === 'record' && (
          <div className="space-y-4">
            <p className="text-center text-[13px] text-slate-500 dark:text-slate-400">
              {target ? t('Kabar tentang {name}', { name: target.name }) : t('Sebut nama orangnya dalam cerita')}
            </p>
            <div className="flex flex-col items-center pt-2">
              <button
                type="button"
                aria-label={t("Mulai Rekam Suara")}
                onClick={handleListen}
                disabled={listening || !isSpeechAvailable()}
                className="relative w-40 h-40 flex items-center justify-center disabled:opacity-60"
              >
                <motion.span
                  className="absolute inset-0 rounded-full bg-indigo-500/15"
                  animate={listening ? { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 0.6 }}
                  transition={listening ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
                />
                <motion.span
                  className="absolute inset-5 rounded-full bg-indigo-500/25"
                  animate={listening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={listening ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } : { duration: 0.3 }}
                />
                <span
                  className={`relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-white shadow-[0_14px_30px_-10px_rgba(99,102,241,0.9)] ${
                    listening ? 'bg-gradient-to-br from-rose-500 to-pink-500' : 'bg-gradient-to-br from-blue-600 to-indigo-500'
                  }`}
                >
                  <Mic className="w-9 h-9" />
                </span>
              </button>
              <div className="flex items-center gap-1 h-8 mt-2" aria-hidden="true">
                {WAVE.map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-cyan-500 dark:bg-cyan-400"
                    style={{ height: h }}
                    animate={listening ? { scaleY: [0.35, 1, 0.5, 0.9, 0.35] } : { scaleY: 0.25 }}
                    transition={listening ? { duration: 1.1, repeat: Infinity, delay: i * 0.07 } : { duration: 0.3 }}
                  />
                ))}
              </div>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{listening ? t('Mendengarkan...') : t('Ketuk mikrofon lalu ceritakan kabarnya')}</p>
            </div>

            <div className={`${card} px-3.5 py-3`}>
              <span className={label}>
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                {t("Cerita Anda (bisa juga diketik)")}
              </span>
              <textarea
                aria-label={t("Cerita Kabar")}
                rows={4}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t('Contoh: "Tadi ngobrol sama Ahmad, anaknya baru lahir. Tanggal 31 dia buka toko baru."')}
                className={field}
              />
            </div>
            {error && <p className="text-xs text-amber-700 dark:text-amber-300 px-1">{error}</p>}
            <button
              type="button"
              onClick={handleProcess}
              disabled={!transcript.trim()}
              className="press w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15.5px] font-bold text-white bg-blue-600 dark:bg-blue-500 disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" /> {t("Proses Catatan")}
            </button>
          </div>
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-16 text-[13px] text-slate-500 dark:text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-cyan-400" />
            {t("Merapikan catatan Anda...")}
          </div>
        )}

        {stage === 'pick' && (
          <div className="space-y-3">
            <p className="text-[13px] text-slate-600 dark:text-slate-300 px-1">
              {pendingResult?.personName ? t('Cerita ini menyebut "{name}". Pilih kontaknya:', { name: pendingResult.personName }) : t('Pilih kontak yang dimaksud:')}
            </p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                aria-label={t("Cari Kontak")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Cari nama kontak")}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[15px] bg-slate-200/60 dark:bg-white/[0.08] placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <div className={group}>
              {candidates
                .filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()))
                .slice(0, 60)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pendingResult && showReview(pendingResult, c)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:bg-slate-50 dark:active:bg-white/5"
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${avatarTone(c.name)}`}>{getInitials(c.name)}</span>
                    <span className="text-[15px] font-medium">{c.name}</span>
                  </button>
                ))}
              {candidates.length === 0 && <p className="px-4 py-4 text-[13px] text-slate-500">{t("Belum ada kontak. Tambahkan kontaknya dulu.")}</p>}
            </div>
          </div>
        )}

        {stage === 'review' && target && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-[18px] bg-emerald-500/[0.08] border border-emerald-500/25">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold ${avatarTone(target.name)}`}>{getInitials(target.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold truncate">{target.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{contact ? t('Kontak yang dipilih') : t('Cocok dari cerita Anda')}</p>
              </div>
              {!contact && pendingResult && (
                <button
                  type="button"
                  onClick={() => {
                    setCandidates(contacts);
                    setStage('pick');
                  }}
                  className="press text-[13px] font-bold text-cyan-700 dark:text-cyan-300 px-2"
                >
                  {t("Ganti")}
                </button>
              )}
            </div>
            {usedFallback && (
              <p className="text-xs text-amber-700 dark:text-amber-300 px-1">{t("AI sedang sibuk, jadi cerita disimpan apa adanya. Rapikan sendiri bila perlu.")}</p>
            )}
            <div className={group}>
              <div className="px-3.5 py-3">
                <label htmlFor="voice-kabar" className={label}>
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  {t('Pembaruan Kabar Terakhir')}
                  {kabar.trim() && kabar.trim() !== (target.lastUpdateNotes || '').trim() && <NewTag />}
                </label>
                <textarea id="voice-kabar" rows={3} value={kabar} onChange={(e) => setKabar(e.target.value)} className={field} />
              </div>
              <div className="px-3.5 py-3">
                <label htmlFor="voice-facts" className={label}>
                  <Star className="w-3.5 h-3.5 text-slate-400" />
                  {t('Fakta Penting Baru (pisahkan dengan koma)')}
                  {addedFacts > 0 && <NewTag text={`+${addedFacts}`} />}
                </label>
                {factList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {factList.map((f) => (
                      <span key={f} className="px-2.5 py-0.5 rounded-full text-[12.5px] bg-blue-500/10 text-blue-800 dark:text-blue-200 border border-blue-500/25">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                <input id="voice-facts" value={facts} onChange={(e) => setFacts(e.target.value)} className={field} />
              </div>
              <div className="px-3.5 py-3 bg-emerald-500/[0.06]">
                <label htmlFor="voice-topic" className={`${label} text-emerald-700 dark:text-emerald-300`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("Bahan Obrolan Follow Up Berikutnya")}
                </label>
                <textarea id="voice-topic" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} className={field} />
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-rose-500 shrink-0">
                  <Calendar className="w-4 h-4" />
                </span>
                <label htmlFor="voice-date" className="flex-1 text-[15px]">
                  {t("Jadwal Follow Up")}
                </label>
                <input
                  id="voice-date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-200 focus:outline-none"
                />
              </div>
            </div>
            {followUpDate && <p className="text-xs text-slate-500 dark:text-slate-400 px-1 -mt-2">{t('{date}, jam 09:00', { date: formatLongDate(followUpDate) })}</p>}
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{t("Kabar lama otomatis disimpan ke Riwayat.")}</p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="press w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15.5px] font-bold text-white bg-blue-600 dark:bg-blue-500 shadow-[0_10px_22px_-10px_rgba(59,107,255,0.9)] disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('Perbarui Kontak')}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
};
