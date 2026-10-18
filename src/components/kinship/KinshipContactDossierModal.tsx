import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Edit3,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  Phone,
  Plus,
  Compass,
  Repeat,
  Tag,
  Hash,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Contact, InteractionLog } from '../../types/crm';
import { calculateContactStatus, getDaysLeftOrOverdue } from '../../utils/status';
import { CadenceBadge } from './CadenceBadge';
import { DualWhatsAppButton } from './DualWhatsAppButton';

export interface KinshipContactDossierModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEditContact?: (contact: Contact) => void;
  onOpenAiDraft?: (contact: Contact) => void;
  onOpenLogEncounter?: (contact: Contact) => void;
  onUpdateContact?: (contactId: string, updates: Partial<Contact>) => Promise<void> | void;
  interactions?: InteractionLog[];
  now?: Date;
}

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAssociationBadgeClass(assoc?: string): string {
  switch (assoc?.toLowerCase()) {
    case 'ihvan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'hoca':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
    case 'keluarga':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    case 'zahiri':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30';
    case 'teman':
      return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30';
    case 'profesional':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/15';
  }
}

function getInteractionTypeBadge(type: string) {
  switch (type?.toLowerCase()) {
    case 'meetup':
      return {
        label: 'Kopi / Makan',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
      };
    case 'whatsapp':
      return {
        label: 'WhatsApp',
        color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30',
      };
    case 'call':
      return {
        label: 'Telepon',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
      };
    case 'other':
    default:
      return {
        label: 'Acara / Majelis',
        color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
      };
  }
}

const AVAILABLE_ASSOCIATIONS = [
  'Ihvan',
  'Hoca',
  'Keluarga',
  'Zahiri',
  'Teman',
  'Profesional',
] as const;

export const KinshipContactDossierModal: React.FC<KinshipContactDossierModalProps> = ({
  contact,
  isOpen,
  onClose,
  onEditContact,
  onOpenAiDraft,
  onOpenLogEncounter,
  onUpdateContact,
  interactions = [],
  now,
}) => {
  if (!isOpen || !contact) return null;

  // Local state for inline editing
  const [followUpTopic, setFollowUpTopic] = useState<string>(contact.possibleFollowUpTopic || '');
  const [lastUpdateNotes, setLastUpdateNotes] = useState<string>(contact.lastUpdateNotes || '');
  const [metContext, setMetContext] = useState<string>(contact.metContext || '');
  const [nextSpecificFollowUp, setNextSpecificFollowUp] = useState<string>(
    contact.nextSpecificFollowUp || ''
  );
  const [followUpTime, setFollowUpTime] = useState<string>(() => {
    if (contact.nextSpecificFollowUp && contact.nextSpecificFollowUp.includes('T')) {
      return contact.nextSpecificFollowUp.split('T')[1].slice(0, 5);
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kinship_digest_time');
      if (saved) return saved;
    }
    return '09:00';
  });
  const [lastContactedDate, setLastContactedDate] = useState<string>(
    contact.lastContactedDate || ''
  );
  const [followUpCycleDays, setFollowUpCycleDays] = useState<number>(
    contact.followUpCycleDays ?? 15
  );
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when contact updates
  useEffect(() => {
    if (contact) {
      setFollowUpTopic(contact.possibleFollowUpTopic || '');
      setLastUpdateNotes(contact.lastUpdateNotes || '');
      setMetContext(contact.metContext || '');
      setNextSpecificFollowUp(contact.nextSpecificFollowUp || '');
      if (contact.nextSpecificFollowUp && contact.nextSpecificFollowUp.includes('T')) {
        setFollowUpTime(contact.nextSpecificFollowUp.split('T')[1].slice(0, 5));
      }
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

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const [isEditingAssociations, setIsEditingAssociations] = useState<boolean>(false);

  const handleUpdate = async (updates: Partial<Contact>) => {
    if (!onUpdateContact || !contact) return;
    setSaveStatus('saving');
    try {
      await onUpdateContact(contact.id, updates);
      if (typeof window !== 'undefined' && isMountedRef.current) {
        setSaveStatus('saved');
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (typeof window !== 'undefined' && isMountedRef.current) {
          setSaveStatus('idle');
        }
      }, 1500);
    } catch {
      if (typeof window !== 'undefined' && isMountedRef.current) {
        setSaveStatus('idle');
      }
    }
  };

  const handleToggleAssociation = async (assoc: string) => {
    if (!contact) return;
    const current = contact.associations || [];
    let updated: string[];
    let updatedIsProf = contact.isProfessional;

    if (assoc === 'Profesional') {
      updatedIsProf = !contact.isProfessional;
      if (updatedIsProf) {
        if (!current.includes('Profesional')) updated = [...current, 'Profesional'];
        else updated = current;
      } else {
        updated = current.filter((a) => a !== 'Profesional');
      }
    } else {
      if (current.includes(assoc)) {
        updated = current.filter((a) => a !== assoc);
      } else {
        updated = [...current, assoc];
      }
    }

    await handleUpdate({
      associations: updated,
      isProfessional: updatedIsProf,
    });
  };

  const status = calculateContactStatus(contact, now);
  const initials = getInitials(contact.name);
  const daysLeftOrOverdue = getDaysLeftOrOverdue(status);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-contact-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85"
    >
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/90 dark:border-white/12 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white transition-colors">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Profil Relasi
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Star bookmark button */}
            <button
              type="button"
              aria-label="Tandai favorit"
              aria-pressed={isStarred}
              onClick={() => setIsStarred(!isStarred)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isStarred
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/20'
                  : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
              }`}
            >
              <Star
                className="w-4 h-4"
                fill={isStarred ? '#F59E0B' : 'none'}
                stroke={isStarred ? '#F59E0B' : 'currentColor'}
              />
            </button>

            {/* Edit button */}
            {onEditContact && (
              <button
                type="button"
                onClick={() => onEditContact(contact)}
                aria-label="Edit Relasi"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-white/10 rounded-full border border-transparent hover:border-slate-200 dark:hover:border-white/15 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 text-slate-900 dark:text-white">
          {/* Profile Dossier Hero Card */}
          <div className="relative bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 overflow-hidden shadow-xs">
            <div className="flex items-start gap-3.5 relative z-10">
              {/* Squircle Avatar with initials */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-cyan-700 dark:to-blue-700 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  {initials}
                </div>
                {status.isOverdue && (
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  </span>
                )}
              </div>

              {/* Contact info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3
                    id="dossier-contact-name"
                    className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate"
                  >
                    {contact.name}
                  </h3>
                  <CadenceBadge
                    cadenceDays={contact.followUpCycleDays || 15}
                    isOverdue={status.isOverdue}
                    daysLeftOrOverdue={daysLeftOrOverdue}
                  />
                </div>

                {/* Association badges with edit toggle */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {contact.associations?.map((assoc) => (
                    <span
                      key={assoc}
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getAssociationBadgeClass(
                        assoc
                      )}`}
                    >
                      {assoc}
                    </span>
                  ))}
                  {contact.isProfessional && !contact.associations?.includes('Profesional') && (
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                      Profesional
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Ubah Asosiasi Kontak"
                    onClick={() => setIsEditingAssociations((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-cyan-500/30 bg-blue-50/60 dark:bg-cyan-500/15 hover:bg-blue-100/60 dark:hover:bg-cyan-500/25 transition-colors cursor-pointer"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    <span>{isEditingAssociations ? 'Tutup' : 'Ubah Label'}</span>
                  </button>
                </div>

                {/* Interactive Association Selector Drawer/Panel */}
                {isEditingAssociations && (
                  <div className="mt-2.5 p-2.5 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/15 rounded-xl shadow-xs space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Pilih Label / Hubungan:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_ASSOCIATIONS.map((assoc) => {
                        const isSelected =
                          assoc === 'Profesional'
                            ? Boolean(contact.isProfessional || contact.associations?.includes('Profesional'))
                            : Boolean(contact.associations?.includes(assoc));

                        return (
                          <button
                            key={assoc}
                            type="button"
                            onClick={() => handleToggleAssociation(assoc)}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                              isSelected
                                ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/20'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{assoc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phone & Met details */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {contact.phoneNumber}
                  </span>
                  {contact.lastContactedDate && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Terakhir: {contact.lastContactedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Pill Banner */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Jadwal Sapa:{' '}
                  <strong className={status.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}>
                    {status.isOverdue ? 'Perlu Disapa' : 'Sesuai Siklus'}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Siklus: {contact.followUpCycleDays || 15} Hari
              </span>
            </div>
          </div>

          {/* Dual WhatsApp Action Bar & Outreach Triggers */}
          <div className="flex flex-col gap-2">
            <DualWhatsAppButton
              phoneNumber={contact.phoneNumber}
              draftText={followUpTopic || contact.possibleFollowUpTopic}
              size="md"
            />

            {/* Secondary Action Row: [+ Catat Interaksi] & [✨ Draf AI] & Phone */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onOpenLogEncounter?.(contact)}
                className="min-h-[42px] bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 rounded-xl flex items-center justify-center gap-1.5 shadow-sm text-xs font-semibold active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ Catat Interaksi</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAiDraft?.(contact)}
                className="min-h-[42px] bg-blue-50 dark:bg-cyan-500/15 text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-cyan-500/25 border border-blue-200/70 dark:border-cyan-500/30 rounded-xl flex items-center justify-center gap-1.5 shadow-xs text-xs font-semibold active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Draf AI</span>
              </button>

              <a
                href={`tel:${contact.phoneNumber}`}
                className="min-h-[42px] bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 rounded-xl flex items-center justify-center gap-1.5 shadow-xs text-xs font-semibold active:scale-[0.98] transition-all"
              >
                <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Panggil</span>
              </a>
            </div>
          </div>

          {/* Notion-Style Structured Key Information / 10-Properties Grid */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/90 dark:border-white/10 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/10 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 min-w-0">
                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
                  Profil & Properti Relasi
                </h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping" />
                    Menyimpan...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Tersimpan
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  SINKRON OTOMATIS
                </span>
              </div>
            </div>

            {/* Notion Grid Row 1: Pertama Ketemu (metContext) */}
            <div className="space-y-1">
              <label
                htmlFor="dossier-met-context"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Pertama Ketemu & Konteks
              </label>
              <textarea
                id="dossier-met-context"
                aria-label="Pertama Ketemu & Konteks Pertemuan"
                rows={2}
                value={metContext}
                onChange={(e) => {
                  const val = e.target.value;
                  setMetContext(val);
                }}
                onBlur={() => handleUpdate({ metContext })}
                placeholder="Misal: Tech conference booth, rekomendasi teman..."
                className="w-full text-xs text-slate-800 dark:text-white bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Notion Grid Row 2: Pembaruan Terakhir (lastUpdateNotes) */}
            <div className="space-y-1">
              <label
                htmlFor="dossier-last-notes"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Pembaruan Kabar Terakhir
              </label>
              <textarea
                id="dossier-last-notes"
                aria-label="Pembaruan Kabar Terakhir"
                rows={2}
                value={lastUpdateNotes}
                onChange={(e) => {
                  const val = e.target.value;
                  setLastUpdateNotes(val);
                }}
                onBlur={() => handleUpdate({ lastUpdateNotes })}
                placeholder="Pembaruan kabar, keluarga, karir, atau project terakhir..."
                className="w-full text-xs text-slate-800 dark:text-white bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Notion Grid Row 3: Bahan Obrolan Follow Up (possibleFollowUpTopic) */}
            <div className="space-y-1 bg-emerald-50/40 dark:bg-emerald-950/25 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <label
                htmlFor="dossier-topic"
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Bahan Obrolan Follow Up Berikutnya
              </label>
              <textarea
                id="dossier-topic"
                aria-label="Bahan Obrolan & Topik Follow Up"
                rows={2}
                value={followUpTopic}
                onChange={(e) => {
                  const val = e.target.value;
                  setFollowUpTopic(val);
                }}
                onBlur={() => handleUpdate({ possibleFollowUpTopic: followUpTopic })}
                placeholder="Topik atau bahan sapaan untuk silaturahmi berikutnya..."
                className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-[#1C1C1E]/80 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Notion Grid Row 4: Jadwal Follow Up Khusus (nextSpecificFollowUp) + Quick Chips */}
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="dossier-next-followup"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Jadwal Follow Up Khusus
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  id="dossier-next-followup"
                  type="date"
                  aria-label="Jadwal Follow Up Khusus"
                  value={nextSpecificFollowUp ? nextSpecificFollowUp.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateVal = e.target.value;
                    if (!dateVal) {
                      setNextSpecificFollowUp('');
                      handleUpdate({ nextSpecificFollowUp: null });
                      return;
                    }
                    const timePart = followUpTime || '09:00';
                    const combined = `${dateVal}T${timePart}`;
                    setNextSpecificFollowUp(combined);
                    handleUpdate({ nextSpecificFollowUp: combined });
                  }}
                  className="sm:col-span-2 text-xs font-mono bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
                />
                <input
                  id="dossier-next-followup-time"
                  type="time"
                  aria-label="Jam Follow Up"
                  value={followUpTime}
                  onChange={(e) => {
                    const timeVal = e.target.value;
                    setFollowUpTime(timeVal);
                    const datePart = nextSpecificFollowUp
                      ? nextSpecificFollowUp.split('T')[0]
                      : computeDateOffset(now, 1) || '';
                    const combined = timeVal ? `${datePart}T${timeVal}` : datePart;
                    setNextSpecificFollowUp(combined);
                    handleUpdate({ nextSpecificFollowUp: combined });
                  }}
                  className="sm:col-span-1 text-xs font-mono bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
                />
              </div>

              {/* Quick schedule chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_SCHEDULE_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      if (chip.days === null) {
                        setNextSpecificFollowUp('');
                        handleUpdate({ nextSpecificFollowUp: null });
                      } else {
                        const newDate = computeDateOffset(now, chip.days);
                        const timePart = followUpTime || '09:00';
                        const combined = newDate ? `${newDate}T${timePart}` : null;
                        setNextSpecificFollowUp(combined || '');
                        handleUpdate({ nextSpecificFollowUp: combined });
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all active:scale-95 ${
                      chip.days === null
                        ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25 hover:border-rose-300'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notion Grid Row 5 & 6: Terakhir Sapa & Ritme Sapa (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label
                  htmlFor="dossier-last-contact"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Terakhir Sapa
                </label>
                <input
                  id="dossier-last-contact"
                  type="date"
                  aria-label="Terakhir Sapa"
                  value={lastContactedDate ? lastContactedDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setLastContactedDate(val || '');
                    handleUpdate({ lastContactedDate: val });
                  }}
                  className="w-full text-xs font-mono bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="dossier-cycle-days"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  <Repeat className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Ritme Sapa (Hari)
                </label>
                <input
                  id="dossier-cycle-days"
                  type="number"
                  min="1"
                  max="365"
                  aria-label="Ritme Sapa"
                  value={followUpCycleDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 15;
                    setFollowUpCycleDays(val);
                    handleUpdate({ followUpCycleDays: val });
                  }}
                  className="w-full text-xs font-mono bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Notion Grid Row 7-10: Quick Read-Only Properties */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Asosiasi:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {contact.associations?.join(', ') || 'Umum'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Kategori:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {contact.isProfessional ? 'Profesional' : 'Personal'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Hash className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>ID:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 truncate">{contact.id}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <AlertCircle
                  className={`w-3 h-3 ${status.isOverdue ? 'text-rose-500' : 'text-emerald-500'}`}
                />
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    status.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {status.isOverdue ? 'Perlu Disapa' : 'Aman'}
                </span>
              </div>
            </div>
          </div>

          {/* Warm Editorial Relationship Timeline */}
          <div className="bg-slate-50/70 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Interaction Timeline
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onOpenLogEncounter?.(contact)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Interaksi</span>
              </button>
            </div>

            {interactions.length > 0 ? (
              <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-white/15">
                {interactions.map((log) => {
                  const typeBadge = getInteractionTypeBadge(log.type);
                  return (
                    <div key={log.id} className="relative group">
                      {/* Marker dot */}
                      <div className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="bg-white dark:bg-[#1C1C1E]/80 rounded-xl border border-slate-200/70 dark:border-white/10 p-3 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge.color}`}
                          >
                            {typeBadge.label}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{log.date}</span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-slate-700 dark:text-slate-200 mt-1.5 leading-relaxed">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/15">
                <p>Belum ada riwayat interaksi tercatat.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Klik &apos;+ Catat Interaksi&apos; untuk menambahkan catatan temu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
