import { useState, useEffect, useCallback, useRef } from 'react';
import { Contact } from '../../types/crm';
import {
  generateSapaDrafts,
  generateWhatsAppDraft,
  isTurkishPhoneNumber,
  SapaLanguage,
  SapaAngle,
  SapaDraftOption,
} from '../../services/aiDraftService';
import { DualWhatsAppButton } from '../kinship/DualWhatsAppButton';

export interface AiDraftModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onLogChatCompleted?: (contact: Contact) => void;
  apiKey?: string;
}

export function AiDraftModal({
  contact,
  isOpen,
  onClose,
  onLogChatCompleted,
  apiKey,
}: AiDraftModalProps) {
  const [language, setLanguage] = useState<SapaLanguage>('id');
  const [selectedAngle, setSelectedAngle] = useState<SapaAngle>('warm_greeting');
  const [draftOptions, setDraftOptions] = useState<SapaDraftOption[]>([]);
  const [draftText, setDraftText] = useState<string>('');
  const [previousDrafts, setPreviousDrafts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoMarkDone, setAutoMarkDone] = useState<boolean>(false);
  const [draftSource, setDraftSource] = useState<'worker' | 'gemini_direct' | 'groq_direct' | 'offline_rule'>('worker');

  const contactId = contact?.id;
  const selectedAngleRef = useRef<SapaAngle>(selectedAngle);
  selectedAngleRef.current = selectedAngle;

  // Initialize language based on phone number (+90 Turkey vs other)
  useEffect(() => {
    if (contact && isOpen) {
      const isTurkish = isTurkishPhoneNumber(contact.phoneNumber);
      setLanguage(isTurkish ? 'tr' : 'id');
      setPreviousDrafts([]);
      setSelectedAngle('warm_greeting');
    }
  }, [contactId, isOpen]);

  // Load drafts when modal opens or language changes
  const fetchDrafts = useCallback(
    async (lang: SapaLanguage, accumulatedDrafts: string[] = [], preferredAngle?: SapaAngle) => {
      if (!contact) return;
      setLoading(true);

      try {
        let mockedDraft = '';
        if ((generateWhatsAppDraft as any)?.mock) {
          mockedDraft = await generateWhatsAppDraft(contact, apiKey);
        }

        const sapaResult = await generateSapaDrafts(
          {
            contact,
            language: lang,
            previousDrafts: accumulatedDrafts,
          },
          undefined,
          apiKey
        );

        if (mockedDraft) {
          setDraftText(mockedDraft);
          setDraftOptions([
            { id: 'opt_1', angle: 'warm_greeting', title: 'Kabar & Doa', text: mockedDraft },
            { id: 'opt_2', angle: 'topic_discussion', title: 'Bahasan Topik', text: mockedDraft },
            { id: 'opt_3', angle: 'catchup_meet', title: 'Ajak Temu / Ngopi', text: mockedDraft },
          ]);
        } else if (sapaResult && sapaResult.drafts && sapaResult.drafts.length > 0) {
          setDraftOptions(sapaResult.drafts);
          setDraftSource(sapaResult.source);
          const targetAngle = preferredAngle || selectedAngleRef.current;
          const activeOpt =
            sapaResult.drafts.find((d) => d.angle === targetAngle) || sapaResult.drafts[0];
          setDraftText(activeOpt.text);
          setSelectedAngle(activeOpt.angle);
        }
      } catch (_err) {
        setDraftSource('offline_rule');
      } finally {
        setLoading(false);
      }
    },
    [contact?.id, apiKey]
  );

  useEffect(() => {
    if (!isOpen || !contact) return;
    fetchDrafts(language, []);
  }, [isOpen, contactId, language, fetchDrafts]);

  if (!isOpen || !contact) return null;

  const handleLanguageChange = (newLang: SapaLanguage) => {
    if (newLang === language) return;
    setLanguage(newLang);
    setPreviousDrafts([]);
  };

  const handleSelectOption = (option: SapaDraftOption) => {
    setSelectedAngle(option.angle);
    setDraftText(option.text);
  };

  const handleRegenerate = async () => {
    const updatedHistory = draftText ? [...previousDrafts, draftText] : previousDrafts;
    setPreviousDrafts(updatedHistory);
    await fetchDrafts(language, updatedHistory, selectedAngle);
  };

  const handleChatLogged = () => {
    if (autoMarkDone && onLogChatCompleted) {
      onLogChatCompleted(contact);
    }
  };

  const handleQuickMarkDone = () => {
    if (onLogChatCompleted) {
      onLogChatCompleted(contact);
    }
  };

  const getToneBadge = () => {
    const isHoca = contact.associations.includes('Hoca');
    const isTeman =
      contact.associations.includes('Teman') || contact.associations.includes('Ihvan');
    const isKeluarga = contact.associations.includes('Keluarga');
    const isPro = contact.isProfessional || contact.associations.includes('Profesional');

    if (isHoca && isTeman) {
      return {
        label: 'Nada: Takzim Santun & Hangat Akrab',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };
    }
    if (isKeluarga && isPro) {
      return {
        label: 'Nada: Hangat Keluarga & Profesional',
        classes: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      };
    }
    if (isHoca) {
      return {
        label: 'Nada: Takzim, Hormat & Santun',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (isKeluarga) {
      return {
        label: 'Nada: Penuh Perhatian & Kasih',
        classes: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (isPro) {
      return {
        label: 'Nada: Profesional & Sopan',
        classes: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }
    if (isTeman) {
      return {
        label: 'Nada: Hangat & Santai',
        classes: 'bg-blue-50 text-[#2F54EB] border-blue-200',
      };
    }
    return {
      label: 'Nada: Hangat & Ramah',
      classes: 'bg-slate-50 text-slate-700 border-slate-200',
    };
  };

  const tone = getToneBadge();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-draft-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 animate-fade-in"
    >
      {/* Outer Card with Gemini Live Iridescent Glow when generating */}
      <div
        className={`w-full max-w-lg transition-all duration-500 rounded-3xl ${
          loading ? 'gemini-aura-glow p-[2.5px]' : 'p-0 shadow-2xl'
        }`}
      >
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/90 dark:border-white/12 shadow-xl w-full overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white transition-colors">
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white/95 dark:bg-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#3B82F6] to-[#10B981] flex items-center justify-center text-white text-sm shadow-xs">
                ✨
              </div>
              <div>
                <h2 id="ai-draft-title" className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Sapa via WhatsApp
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Untuk <span className="font-semibold text-slate-800 dark:text-slate-200">{contact.name}</span>
                </p>
              </div>
            </div>

            {/* iOS Segmented Language Switcher */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-white/10 p-0.5 rounded-full flex items-center shadow-inner border border-slate-200/70 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('id')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ios-tap ${
                    language === 'id'
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  aria-label="Bahasa Indonesia"
                >
                  🇮🇩 ID
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('tr')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ios-tap ${
                    language === 'tr'
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  aria-label="Türkçe"
                >
                  🇹🇷 TR
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto space-y-3.5">
            {/* Tone and Regenerate Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${tone.classes}`}>
                  <span>🎯</span>
                  <span>{tone.label}</span>
                </span>
                {draftSource === 'offline_rule' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30" title="Koneksi atau kuota AI tidak tersedia, menggunakan draf aturan cadangan offline">
                    <span>⚡</span> Cadangan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    <span>✨</span> {draftSource === 'groq_direct' ? 'Groq AI' : draftSource === 'gemini_direct' ? 'Gemini AI' : 'Sapa AI'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                aria-label="Generate Ulang"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F54EB] dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 disabled:opacity-50 transition-colors ios-tap cursor-pointer"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{loading ? 'Meracik kata...' : 'Generate Ulang'}</span>
              </button>
            </div>

            {/* 3 Instant Draft Option Cards */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pilih Sudut Pandang Sapaan
              </p>
              <div className="grid grid-cols-3 gap-2" data-tour="draft-options">
                {draftOptions.map((opt) => {
                  const isSelected = opt.angle === selectedAngle;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`text-left p-2.5 rounded-2xl border text-xs transition-all ios-tap cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 dark:border-cyan-400 bg-blue-50/70 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-300 shadow-xs font-semibold ring-1 ring-blue-500 dark:ring-cyan-400'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 hover:bg-slate-100/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] truncate">{opt.title}</span>
                        {isSelected && <span className="text-[10px] text-blue-600 dark:text-cyan-400">✓</span>}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                        {opt.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Draft Message Editor Container */}
            <div className="relative">
              {loading ? (
                <div className="h-40 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                  <div className="w-8 h-8 rounded-full border-3 border-blue-600 dark:border-cyan-400 border-t-transparent animate-spin mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    AI sedang meracik 3 opsi kalimat santun...
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    {language === 'tr' ? 'Türkçe üslup hazırlanıyor' : 'Menyesuaikan etika multi-label'}
                  </p>
                  {/* Subtle shimmer wave overlay */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 dark:via-white/10 to-transparent shimmer-wave pointer-events-none" />
                </div>
              ) : (
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={5}
                  aria-label="Draf Pesan WhatsApp"
                  placeholder="Tulis atau edit draf pesan WhatsApp..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:border-transparent transition-all resize-none shadow-inner bg-slate-50/50 dark:bg-white/5 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              )}
            </div>

            {/* Follow up Topic Context Callout if available */}
            {contact.possibleFollowUpTopic && (
              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-500/20 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 shrink-0">Poin Catatan:</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{contact.possibleFollowUpTopic}</span>
              </div>
            )}

            {/* Auto Log Chat Option */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoMarkDone}
                  onChange={(e) => setAutoMarkDone(e.target.checked)}
                  aria-label="Tandai langsung selesai ngobrol"
                  className="w-4 h-4 rounded text-blue-600 dark:text-cyan-500 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Tandai langsung selesai ngobrol saat buka WA
                </span>
              </label>

              <button
                type="button"
                onClick={handleQuickMarkDone}
                aria-label="Tandai Selesai"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                ✓ Tandai Selesai
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              aria-label="Batal"
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors order-2 sm:order-1 cursor-pointer"
            >
              Batal
            </button>
            <div className="flex-1 order-1 sm:order-2" data-tour="draft-whatsapp">
              <DualWhatsAppButton
                phoneNumber={contact.phoneNumber}
                draftText={draftText}
                onChatLogged={handleChatLogged}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
