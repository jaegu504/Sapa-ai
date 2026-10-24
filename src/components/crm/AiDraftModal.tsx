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
import { Coffee, HandHeart, MessageSquareText, RefreshCw, Sparkles, X, Zap } from 'lucide-react';
import { Sheet, useSticky } from '../ui/Sheet';

const ANGLE_UI: Record<SapaAngle, { title: string; Icon: typeof Coffee }> = {
  warm_greeting: { title: 'Kabar & Doa', Icon: HandHeart },
  topic_discussion: { title: 'Bahas Topik', Icon: MessageSquareText },
  catchup_meet: { title: 'Ajak Temu', Icon: Coffee },
};

export interface AiDraftModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onLogChatCompleted?: (contact: Contact) => void;
  apiKey?: string;
}

export function AiDraftModal({
  contact: liveContact,
  isOpen,
  onClose,
  onLogChatCompleted,
  apiKey,
}: AiDraftModalProps) {
  // Keep showing the last contact while the sheet slides away.
  const contact = useSticky(liveContact);
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
    if (!isOpen || !liveContact) return;
    fetchDrafts(language, []);
  }, [isOpen, contactId, language, fetchDrafts]);

  if (!contact) return null;

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
    <Sheet isOpen={isOpen && Boolean(liveContact)} onClose={onClose} labelledBy="ai-draft-title">
      <div className={`flex-1 min-h-0 overflow-y-auto px-4 pb-5 space-y-3.5 ${loading ? 'ai-loading' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-cyan-500 shrink-0">
            <Sparkles className="w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="ai-draft-title" className="text-[16px] font-bold leading-tight">
              Draf Sapaan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Untuk <span className="font-semibold text-slate-700 dark:text-slate-200">{contact.name}</span>
            </p>
          </div>
          <div className="flex p-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 shrink-0">
            {(['id', 'tr'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                aria-label={lang === 'id' ? 'Bahasa Indonesia' : 'Türkçe'}
                aria-pressed={language === lang}
                className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-colors ${
                  language === lang ? 'bg-white dark:bg-white/25 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {lang === 'id' ? '🇮🇩 ID' : '🇹🇷 TR'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="press w-8 h-8 rounded-full flex items-center justify-center bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tone + rewrite */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">
              <Sparkles className="w-3 h-3" />
              {tone.label}
            </span>
            {draftSource === 'offline_rule' && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300"
                title="AI sedang tidak tersedia, memakai draf cadangan"
              >
                <Zap className="w-3 h-3" />
                Cadangan
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={loading}
            aria-label="Tulis ulang"
            className="press shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Menulis...' : 'Tulis ulang'}
          </button>
        </div>

        {/* Greeting type */}
        <div className="grid grid-cols-3 gap-1.5" data-tour="draft-options" role="radiogroup" aria-label="Jenis sapaan">
          {draftOptions.map((opt) => {
            const ui = ANGLE_UI[opt.angle] || { title: opt.title, Icon: Sparkles };
            const isSelected = opt.angle === selectedAngle;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectOption(opt)}
                className={`press flex items-center justify-center gap-1 px-1 py-2 rounded-full text-[12px] font-semibold border whitespace-nowrap min-w-0 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                    : 'border-transparent bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-200'
                }`}
              >
                <ui.Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ui.title}</span>
              </button>
            );
          })}
        </div>

        {/* Message */}
        {loading ? (
          <div className="relative h-36 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.05] overflow-hidden p-4 space-y-2.5">
            <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 w-11/12" />
            <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 w-full" />
            <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 w-3/4" />
            <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">{language === 'tr' ? 'Mesaj hazırlanıyor...' : 'Sapa sedang menulis pesan...'}</p>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent shimmer-wave pointer-events-none" />
          </div>
        ) : (
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={5}
            aria-label="Draf Pesan WhatsApp"
            placeholder="Tulis atau edit pesan..."
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 text-[14.5px] leading-relaxed text-slate-800 dark:text-white bg-white dark:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
          />
        )}

        {contact.possibleFollowUpTopic && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 text-xs min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="font-bold text-blue-700 dark:text-cyan-300 shrink-0">Topik:</span>
            <span className="text-slate-600 dark:text-slate-300 truncate">{contact.possibleFollowUpTopic}</span>
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
          <input
            type="checkbox"
            checked={autoMarkDone}
            onChange={(e) => setAutoMarkDone(e.target.checked)}
            aria-label="Tandai sudah disapa saat buka WhatsApp"
            className="w-5 h-5 rounded-md accent-blue-600"
          />
          <span className="text-[13.5px] text-slate-700 dark:text-slate-200">Tandai sudah disapa saat buka WhatsApp</span>
        </label>

        <div data-tour="draft-whatsapp">
          <DualWhatsAppButton phoneNumber={contact.phoneNumber} draftText={draftText} onChatLogged={handleChatLogged} size="lg" layout="col" />
        </div>
      </div>
    </Sheet>
  );
}
