import { useState, useEffect } from 'react';
import { Contact } from '../../types/crm';
import { generateWhatsAppDraft } from '../../services/aiDraftService';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

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
  const [draftText, setDraftText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [autoMarkDone, setAutoMarkDone] = useState<boolean>(false);

  const contactId = contact?.id;

  useEffect(() => {
    if (!isOpen || !contact) return;

    let isMounted = true;
    setLoading(true);

    generateWhatsAppDraft(contact, apiKey)
      .then((draft) => {
        if (isMounted) {
          setDraftText(draft);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contactId, apiKey]);

  if (!isOpen || !contact) return null;

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const newDraft = await generateWhatsAppDraft(contact, apiKey);
      setDraftText(newDraft);
    } catch {
      // keep existing draft on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl(contact.phoneNumber, draftText);
    if (!url) return;
    window.open(url, '_blank');
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
    if (contact.associations.includes('Hoca')) {
      return {
        label: 'Nada: Takzim, Hormat & Santun',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (contact.associations.includes('Keluarga')) {
      return {
        label: 'Nada: Penuh Perhatian & Kasih',
        classes: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (contact.isProfessional || contact.associations.includes('Profesional')) {
      return {
        label: 'Nada: Profesional & Sopan',
        classes: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }
    if (contact.associations.includes('Ihvan') || contact.associations.includes('Teman')) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">✨</span>
              <h2 id="ai-draft-title" className="text-lg font-bold text-slate-900">
                Sapa via WhatsApp
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Draf pesan cerdas untuk{' '}
              <span className="font-semibold text-slate-800">{contact.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Etiquette Tone Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tone.classes}`}
            >
              <span>🎯</span>
              <span>{tone.label}</span>
            </span>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loading}
              aria-label="Generate Ulang"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F54EB] hover:text-blue-700 disabled:opacity-50 transition-colors"
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
              <span>{loading ? 'Menyusun...' : 'Generate Ulang'}</span>
            </button>
          </div>

          {/* Draft Message Area */}
          <div className="relative">
            {loading ? (
              <div className="h-44 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-8 h-8 border-3 border-[#2F54EB] border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Menyusun draf pembuka santun dengan AI...
                </p>
              </div>
            ) : (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={6}
                aria-label="Draf Pesan WhatsApp"
                placeholder="Tulis atau edit draf pesan WhatsApp..."
                className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2F54EB] focus:border-transparent transition-all resize-none shadow-inner bg-slate-50/50"
              />
            )}
          </div>

          {/* Follow up Topic Context Callout if available */}
          {contact.possibleFollowUpTopic && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs text-slate-700">
              <span className="font-semibold text-[#2F54EB]">Topik Follow-Up:</span>{' '}
              {contact.possibleFollowUpTopic}
            </div>
          )}

          {/* Auto Log Chat Option */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoMarkDone}
                onChange={(e) => setAutoMarkDone(e.target.checked)}
                aria-label="Tandai langsung selesai ngobrol"
                className="w-4 h-4 rounded text-[#2F54EB] focus:ring-[#2F54EB] border-slate-300"
              />
              <span className="text-xs text-slate-600 font-medium">
                Tandai langsung selesai ngobrol saat buka WA
              </span>
            </label>

            <button
              type="button"
              onClick={handleQuickMarkDone}
              aria-label="Tandai Selesai"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors"
            >
              ✓ Tandai Selesai
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Batal"
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            aria-label="Buka di WhatsApp"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <span>💬</span>
            <span>Buka di WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
