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
import { calculateContactStatus } from '../../utils/status';
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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'hoca':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'keluarga':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'zahiri':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'teman':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'profesional':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function getInteractionTypeBadge(type: string) {
  switch (type?.toLowerCase()) {
    case 'meetup':
      return { label: 'Kopi / Makan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'whatsapp':
      return { label: 'WhatsApp', color: 'bg-green-50 text-green-700 border-green-200' };
    case 'call':
      return { label: 'Telepon', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'other':
    default:
      return { label: 'Acara / Majelis', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
}

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

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleUpdate = async (updates: Partial<Contact>) => {
    if (!onUpdateContact || !contact) return;
    setSaveStatus('saving');
    try {
      await onUpdateContact(contact.id, updates);
      setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    } catch {
      setSaveStatus('idle');
    }
  };

  const status = calculateContactStatus(contact, now);
  const initials = getInitials(contact.name);

  // Calculate days left for cadence badge
  let daysLeft = 0;
  if (!status.isOverdue) {
    const today = now ? new Date(now) : new Date();
    const targetStr = contact.nextSpecificFollowUp || status.suggestedDate;
    if (targetStr) {
      const targetDate = new Date(targetStr);
      const diffMs = targetDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      daysLeft = contact.followUpCycleDays ?? 15;
    }
  }

  const daysLeftOrOverdue = status.isOverdue ? status.daysOverdue : daysLeft;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-contact-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Dossier Relasi
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
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
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
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all"
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* Profile Dossier Hero Card */}
          <div className="relative bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 overflow-hidden shadow-xs">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              {/* Squircle Avatar with initials */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  {initials}
                </div>
                {status.isOverdue && (
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 ring-2 ring-white" />
                  </span>
                )}
              </div>

              {/* Contact info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3
                    id="dossier-contact-name"
                    className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate"
                  >
                    {contact.name}
                  </h3>
                  <CadenceBadge
                    cadenceDays={contact.followUpCycleDays || 15}
                    isOverdue={status.isOverdue}
                    daysLeftOrOverdue={daysLeftOrOverdue}
                  />
                </div>

                {/* Association badges */}
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
                  {contact.isProfessional && (
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                      Profesional
                    </span>
                  )}
                </div>

                {/* Phone & Met details */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {contact.phoneNumber}
                  </span>
                  {contact.lastContactedDate && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Terakhir: {contact.lastContactedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Pill Banner */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Jadwal Sapa:{' '}
                  <strong className={status.isOverdue ? 'text-rose-600' : 'text-emerald-700'}>
                    {status.isOverdue ? 'Perlu Disapa' : 'Sesuai Siklus'}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
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
                className="min-h-[42px] bg-slate-900 text-white hover:bg-slate-800 rounded-xl flex items-center justify-center gap-1.5 shadow-sm text-xs font-semibold active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ Catat Interaksi</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAiDraft?.(contact)}
                className="min-h-[42px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 rounded-xl flex items-center justify-center gap-1.5 shadow-xs text-xs font-semibold active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Draf AI</span>
              </button>

              <a
                href={`tel:${contact.phoneNumber}`}
                className="min-h-[42px] bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 shadow-xs text-xs font-semibold active:scale-[0.98] transition-all"
              >
                <Phone className="w-4 h-4 text-slate-500" />
                <span>Panggil</span>
              </a>
            </div>
          </div>

          {/* Notion-Style Structured Key Information / 10-Properties Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-800">
                <FileText className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Dossier & Notion Properties
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    Menyimpan...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Tersimpan
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  LIVE SYNC
                </span>
              </div>
            </div>

            {/* Notion Grid Row 1: Pertama Ketemu (metContext) */}
            <div className="space-y-1">
              <label
                htmlFor="dossier-met-context"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400" />
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
                className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notion Grid Row 2: Pembaruan Terakhir (lastUpdateNotes) */}
            <div className="space-y-1">
              <label
                htmlFor="dossier-last-notes"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
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
                className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notion Grid Row 3: Bahan Obrolan Follow Up (possibleFollowUpTopic) */}
            <div className="space-y-1 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
              <label
                htmlFor="dossier-topic"
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
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
                className="w-full text-xs text-slate-800 bg-white border border-emerald-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notion Grid Row 4: Jadwal Follow Up Khusus (nextSpecificFollowUp) + Quick Chips */}
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="dossier-next-followup"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Jadwal Follow Up Khusus
              </label>
              <input
                id="dossier-next-followup"
                type="date"
                aria-label="Jadwal Follow Up Khusus"
                value={nextSpecificFollowUp ? nextSpecificFollowUp.split('T')[0] : ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setNextSpecificFollowUp(val || '');
                  handleUpdate({ nextSpecificFollowUp: val });
                }}
                className="w-full text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              {/* Quick schedule chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
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

            {/* Notion Grid Row 5 & 6: Terakhir Sapa & Ritme Sapa (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label
                  htmlFor="dossier-last-contact"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                  className="w-full text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="dossier-cycle-days"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"
                >
                  <Repeat className="w-3.5 h-3.5 text-slate-400" />
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
                  className="w-full text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Notion Grid Row 7-10: Quick Read-Only Properties */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1 text-slate-500">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Asosiasi:</span>
                <span className="font-semibold text-slate-700 truncate">
                  {contact.associations?.join(', ') || 'Umum'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span>Kategori:</span>
                <span className="font-semibold text-slate-700">
                  {contact.isProfessional ? 'Profesional' : 'Personal'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Hash className="w-3 h-3 text-slate-400" />
                <span>ID:</span>
                <span className="font-mono text-slate-600 truncate">{contact.id}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <AlertCircle
                  className={`w-3 h-3 ${status.isOverdue ? 'text-rose-500' : 'text-emerald-500'}`}
                />
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    status.isOverdue ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {status.isOverdue ? 'Perlu Disapa' : 'Aman'}
                </span>
              </div>
            </div>
          </div>

          {/* Warm Editorial Relationship Timeline */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interaction Timeline
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onOpenLogEncounter?.(contact)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Interaksi</span>
              </button>
            </div>

            {interactions.length > 0 ? (
              <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {interactions.map((log) => {
                  const typeBadge = getInteractionTypeBadge(log.type);
                  return (
                    <div key={log.id} className="relative group">
                      {/* Marker dot */}
                      <div className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                      <div className="bg-white rounded-xl border border-slate-200/70 p-3 shadow-xs hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge.color}`}
                          >
                            {typeBadge.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{log.date}</span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <p>Belum ada riwayat interaksi tercatat.</p>
                <p className="text-[11px] text-slate-400 mt-1">
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
