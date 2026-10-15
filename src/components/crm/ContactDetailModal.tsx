import { useState, useEffect, useRef } from 'react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { MetricStrip } from '../ui/MetricStrip';

export interface ContactDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEditContact?: (contact: Contact) => void;
  onOpenAiDraft?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  onUpdateContact?: (contactId: string, updates: Partial<Contact>) => Promise<void> | void;
  now?: Date;
}

/**
 * Computes a target date string formatted as YYYY-MM-DD offset by a number of days
 * relative to the provided base date (or current date).
 */
export function computeDateOffset(baseDate?: Date, daysOffset?: number | null): string | null {
  if (daysOffset === null || daysOffset === undefined) return null;
  const ref = baseDate ? new Date(baseDate) : new Date();
  const isUtc =
    baseDate !== undefined &&
    ref.getUTCHours() === 0 &&
    ref.getUTCMinutes() === 0 &&
    ref.getUTCSeconds() === 0 &&
    ref.getUTCMilliseconds() === 0;

  const y = isUtc ? ref.getUTCFullYear() : ref.getFullYear();
  const m = isUtc ? ref.getUTCMonth() : ref.getMonth();
  const d = isUtc ? ref.getUTCDate() : ref.getDate();

  const target = new Date(Date.UTC(y, m, d + daysOffset));
  const resY = target.getUTCFullYear();
  const resM = String(target.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(target.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

const QUICK_SCHEDULE_CHIPS = [
  { label: 'Besok (+1 hr)', days: 1 },
  { label: '+3 Hari', days: 3 },
  { label: '+1 Minggu', days: 7 },
  { label: '+2 Minggu', days: 14 },
  { label: 'Bulan Depan', days: 30 },
  { label: 'Hapus Jadwal', days: null },
];

export function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  onEditContact,
  onOpenAiDraft,
  onLogChat,
  onUpdateContact,
  now,
}: ContactDetailModalProps) {
  if (!isOpen || !contact) return null;

  // Local interactive states for inline editing
  const [followUpTopic, setFollowUpTopic] = useState<string>(contact.possibleFollowUpTopic || '');
  const [lastUpdateNotes, setLastUpdateNotes] = useState<string>(contact.lastUpdateNotes || '');
  const [metContext, setMetContext] = useState<string>(contact.metContext || '');
  const [nextSpecificFollowUp, setNextSpecificFollowUp] = useState<string>(
    contact.nextSpecificFollowUp || ''
  );
  const [lastContactedDate, setLastContactedDate] = useState<string>(
    contact.lastContactedDate || ''
  );
  const [followUpCycleDays, setFollowUpCycleDays] = useState<number>(
    contact.followUpCycleDays ?? 15
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when contact prop changes
  useEffect(() => {
    if (contact) {
      setFollowUpTopic(contact.possibleFollowUpTopic || '');
      setLastUpdateNotes(contact.lastUpdateNotes || '');
      setMetContext(contact.metContext || '');
      setNextSpecificFollowUp(contact.nextSpecificFollowUp || '');
      setLastContactedDate(contact.lastContactedDate || '');
      setFollowUpCycleDays(contact.followUpCycleDays ?? 15);
    }
  }, [
    contact.id,
    contact.possibleFollowUpTopic,
    contact.lastUpdateNotes,
    contact.metContext,
    contact.nextSpecificFollowUp,
    contact.lastContactedDate,
    contact.followUpCycleDays,
  ]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleUpdate = async (updates: Partial<Contact>) => {
    if (!contact || !onUpdateContact) return;
    setSaveStatus('saving');
    try {
      const res = onUpdateContact(contact.id, updates);
      if (res && typeof (res as Promise<void>).then === 'function') {
        await res;
      }
      setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch {
      setSaveStatus('idle');
    }
  };

  const currentContactForStatus: Contact = {
    ...contact,
    possibleFollowUpTopic: followUpTopic,
    lastUpdateNotes,
    metContext,
    nextSpecificFollowUp: nextSpecificFollowUp || null,
    lastContactedDate: lastContactedDate || null,
    followUpCycleDays,
  };

  const status = calculateContactStatus(currentContactForStatus, now);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getAvatarGradient = (name: string): string => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-emerald-500 to-teal-700',
      'from-violet-600 to-purple-800',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-700',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Build 3-Metric Strip items
  let statusDisplay = '';
  if (status.isOverdue) {
    statusDisplay =
      status.daysOverdue > 0
        ? `Terlambat ${status.daysOverdue} hari`
        : 'Jatuh tempo hari ini';
  } else {
    const targetDateStr = currentContactForStatus.nextSpecificFollowUp || status.suggestedDate;
    if (targetDateStr) {
      const ref = now ? new Date(now) : new Date();
      const currentUtc = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
      const targetParts = targetDateStr.split('T')[0].split('-').map(Number);
      const targetUtc = Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2]);
      const diffDays = Math.ceil((targetUtc - currentUtc) / (24 * 60 * 60 * 1000));
      statusDisplay = diffDays > 0 ? `Sisa ${diffDays} hari` : 'Aman';
    } else {
      statusDisplay = 'Aman';
    }
  }

  const metrics = [
    {
      label: 'Siklus',
      value: `${followUpCycleDays} Hari`,
      badgeColor: 'blue' as const,
    },
    {
      label: 'Status',
      value: statusDisplay,
      badgeColor: status.isOverdue ? ('rose' as const) : ('green' as const),
    },
    {
      label: 'Terakhir Sapa',
      value: lastContactedDate || 'Belum Pernah',
      badgeColor: 'slate' as const,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-detail-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top App Bar inside modal */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Profil Relasi
          </span>
          <div className="flex items-center gap-1.5">
            {onEditContact && (
              <button
                type="button"
                onClick={() => onEditContact(contact)}
                aria-label="Edit Relasi"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#2F54EB] hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>Edit Relasi</span>
              </button>
            )}
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
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* John Carter Hero Section */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                contact.name
              )} text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3`}
            >
              {getInitials(contact.name)}
            </div>

            <h2 id="contact-detail-name" className="text-xl font-bold text-slate-900">
              {contact.name}
            </h2>

            <p className="text-xs font-mono text-slate-500 mt-1 mb-3">
              {contact.phoneNumber}
            </p>

            {/* Association Badges */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {contact.associations.map((assoc) => (
                <span
                  key={assoc}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                >
                  {assoc}
                </span>
              ))}
              {contact.isProfessional && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Kontak Profesional
                </span>
              )}
            </div>
          </div>

          {/* 3-Metric Strip */}
          <div className="pt-1">
            <MetricStrip metrics={metrics} />
          </div>

          {/* Quick Inline Cadence & Last Contacted Editors */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Siklus & Tanggal Kontak
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="modal-last-contacted"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Tanggal Terakhir Sapa
                </label>
                <input
                  id="modal-last-contacted"
                  type="date"
                  aria-label="Tanggal Terakhir Sapa"
                  value={lastContactedDate || ''}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setLastContactedDate(val || '');
                    handleUpdate({ lastContactedDate: val });
                  }}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB]"
                />
              </div>
              <div>
                <label
                  htmlFor="modal-cycle-days"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Siklus Follow Up (Hari)
                </label>
                <input
                  id="modal-cycle-days"
                  type="number"
                  min={1}
                  max={365}
                  aria-label="Siklus Follow Up"
                  value={followUpCycleDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const valid = isNaN(val) ? 1 : Math.max(1, val);
                    setFollowUpCycleDays(valid);
                    handleUpdate({ followUpCycleDays: valid });
                  }}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB]"
                />
              </div>
            </div>
          </div>

          {/* Notion Context & Follow Up Details Cards */}
          <div className="space-y-3 pt-1">
            {/* Section 1: Ketemu di mana & bagaimana */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 transition-all focus-within:border-slate-300">
              <label
                htmlFor="modal-met-context"
                className="text-xs font-bold text-slate-600 block mb-1.5"
              >
                Ketemu di mana & bagaimana
              </label>
              <textarea
                id="modal-met-context"
                aria-label="Ketemu di mana & bagaimana"
                rows={2}
                value={metContext}
                onChange={(e) => {
                  const val = e.target.value;
                  setMetContext(val);
                  handleUpdate({ metContext: val });
                }}
                onBlur={() => handleUpdate({ metContext })}
                placeholder="Misal: Daurah fiqih di Pesantren Luhur..."
                className="w-full text-xs text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] transition-all"
              />
            </div>

            {/* Section 2: Pembaruan Terakhir */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 transition-all focus-within:border-slate-300">
              <label
                htmlFor="modal-last-notes"
                className="text-xs font-bold text-slate-600 block mb-1.5"
              >
                Pembaruan Terakhir
              </label>
              <textarea
                id="modal-last-notes"
                aria-label="Pembaruan Terakhir"
                rows={2}
                value={lastUpdateNotes}
                onChange={(e) => {
                  const val = e.target.value;
                  setLastUpdateNotes(val);
                  handleUpdate({ lastUpdateNotes: val });
                }}
                onBlur={() => handleUpdate({ lastUpdateNotes })}
                placeholder="Pembaruan kabar terakhir..."
                className="w-full text-xs text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] transition-all"
              />
            </div>

            {/* Section 3: Topik Follow Up Selanjutnya */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 transition-all focus-within:border-blue-200">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="modal-topic"
                  className="text-xs font-bold text-[#2F54EB]"
                >
                  Topik Follow Up Selanjutnya
                </label>
                {saveStatus === 'saving' && (
                  <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    Menyimpan...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span>✓</span>
                    Tersimpan
                  </span>
                )}
              </div>
              <textarea
                id="modal-topic"
                aria-label="Topik Follow Up Selanjutnya"
                rows={2}
                value={followUpTopic}
                onChange={(e) => {
                  const val = e.target.value;
                  setFollowUpTopic(val);
                  handleUpdate({ possibleFollowUpTopic: val });
                }}
                onBlur={() => handleUpdate({ possibleFollowUpTopic: followUpTopic })}
                placeholder="Topik atau bahan obrolan untuk silaturahmi berikutnya..."
                className="w-full text-xs text-slate-800 leading-relaxed bg-white border border-blue-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] transition-all"
              />
            </div>

            {/* Section 4: Jadwal Follow Up Khusus */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
              <label
                htmlFor="modal-next-followup"
                className="text-xs font-bold text-slate-600 block"
              >
                Jadwal Follow Up Khusus
              </label>

              <input
                id="modal-next-followup"
                type="date"
                aria-label="Jadwal Follow Up Khusus"
                value={nextSpecificFollowUp ? nextSpecificFollowUp.split('T')[0] : ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setNextSpecificFollowUp(val || '');
                  handleUpdate({ nextSpecificFollowUp: val });
                }}
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB]"
              />

              {/* Row of quick schedule chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {QUICK_SCHEDULE_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      const newDate =
                        chip.days === null ? null : computeDateOffset(now, chip.days);
                      setNextSpecificFollowUp(newDate || '');
                      handleUpdate({ nextSpecificFollowUp: newDate });
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all active:scale-95 ${
                      chip.days === null
                        ? 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5">
          {onOpenAiDraft && (
            <button
              type="button"
              onClick={() => onOpenAiDraft(contact)}
              aria-label="Sapa via WhatsApp"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-bold text-white bg-[#2F54EB] hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>✨</span>
              <span>Sapa via WhatsApp</span>
            </button>
          )}

          {onLogChat && (
            <button
              type="button"
              onClick={() => onLogChat(contact)}
              aria-label="Tandai Selesai Ngobrol"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            >
              <span>✓</span>
              <span>Tandai Selesai Ngobrol</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
