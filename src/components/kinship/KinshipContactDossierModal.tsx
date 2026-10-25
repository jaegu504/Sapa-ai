import React, { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Compass,
  History,
  MessageCircle,
  MessageSquare,
  Mic,
  PenLine,
  Phone,
  Plus,
  Repeat,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react';
import { Contact, InteractionLog } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { dueLabel, formatLongDate, formatShortDate, getInitials, monthName } from '../../utils/display';
import { getLabels, hasAssociation, toggleAssociation } from '../../services/labelService';
import { Sheet, useSticky } from '../ui/Sheet';
import { tapHaptic } from '../../services/haptics';

export interface KinshipContactDossierModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEditContact?: (contact: Contact) => void;
  onSapa?: (contact: Contact) => void;
  onOpenAiDraft?: (contact: Contact) => void;
  onOpenLogEncounter?: (contact: Contact) => void;
  onOpenVoiceNote?: (contact: Contact) => void;
  onUpdateContact?: (contactId: string, updates: Partial<Contact>) => Promise<void> | void;
  interactions?: InteractionLog[];
  now?: Date;
}

/** "2026-10-24" → "24 Okt 2026" (manual so it reads the same on every phone locale). */
export function formatFactDate(date: string): string {
  const [y, m, d] = date.split('T')[0].split('-').map(Number);
  if (!y || !m || !d || m > 12) return date;
  return `${d} ${monthName(m - 1)} ${y}`;
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
  { label: 'Besok', days: 1 },
  { label: '+3 Hari', days: 3 },
  { label: '+1 Minggu', days: 7 },
  { label: '+2 Minggu', days: 14 },
  { label: 'Bulan Depan', days: 30 },
  { label: 'Hapus', days: null },
];

const CYCLE_CHIPS = [7, 15, 30, 60];

const INTERACTION_TYPES: Record<string, { label: string; dot: string; pill: string }> = {
  whatsapp: { label: 'Chat WA', dot: 'bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  call: { label: 'Telepon', dot: 'bg-blue-500', pill: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
  meetup: { label: 'Ketemu', dot: 'bg-amber-500', pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  other: { label: 'Catatan', dot: 'bg-violet-500', pill: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
};

const fieldBox =
  'w-full text-[14px] leading-relaxed text-slate-800 dark:text-white bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-cyan-400 placeholder:text-slate-400 dark:placeholder:text-slate-500';

const chipBase = 'press px-3 py-1.5 rounded-full text-[12.5px] font-medium border';
const chipIdle = 'bg-white dark:bg-white/[0.06] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200';
const chipOn = 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold';

const FieldLabel: React.FC<{ icon: React.ReactNode; htmlFor?: string; children: React.ReactNode; className?: string }> = ({
  icon,
  htmlFor,
  children,
  className = 'text-slate-600 dark:text-slate-300',
}) => (
  <label htmlFor={htmlFor} className={`flex items-center gap-1.5 text-[12.5px] font-semibold mb-1.5 ${className}`}>
    {icon}
    {children}
  </label>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-[22px] bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 p-4 ${className}`}>{children}</div>
);

const DossierContent: React.FC<Omit<KinshipContactDossierModalProps, 'isOpen' | 'contact'> & { contact: Contact }> = ({
  contact,
  onClose,
  onEditContact,
  onSapa,
  onOpenAiDraft,
  onOpenLogEncounter,
  onOpenVoiceNote,
  onUpdateContact,
  interactions = [],
  now,
}) => {
  const [followUpTopic, setFollowUpTopic] = useState(contact.possibleFollowUpTopic || '');
  const [lastUpdateNotes, setLastUpdateNotes] = useState(contact.lastUpdateNotes || '');
  const [metContext, setMetContext] = useState(contact.metContext || '');
  const [nextSpecificFollowUp, setNextSpecificFollowUp] = useState(contact.nextSpecificFollowUp || '');
  const [followUpTime, setFollowUpTime] = useState<string>(() => {
    if (contact.nextSpecificFollowUp?.includes('T')) return contact.nextSpecificFollowUp.split('T')[1].slice(0, 5);
    return '09:00';
  });
  const [lastContactedDate, setLastContactedDate] = useState(contact.lastContactedDate || '');
  // '' lets the user clear the field while typing; only valid numbers are saved
  const [followUpCycleDays, setFollowUpCycleDays] = useState<number | ''>(contact.followUpCycleDays ?? 15);
  const [isEditingAssociations, setIsEditingAssociations] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setFollowUpTopic(contact.possibleFollowUpTopic || '');
    setLastUpdateNotes(contact.lastUpdateNotes || '');
    setMetContext(contact.metContext || '');
    setNextSpecificFollowUp(contact.nextSpecificFollowUp || '');
    if (contact.nextSpecificFollowUp?.includes('T')) setFollowUpTime(contact.nextSpecificFollowUp.split('T')[1].slice(0, 5));
    setLastContactedDate(contact.lastContactedDate || '');
    setFollowUpCycleDays(contact.followUpCycleDays ?? 15);
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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleUpdate = async (updates: Partial<Contact>) => {
    if (!onUpdateContact) return;
    setSaveStatus('saving');
    try {
      await onUpdateContact(contact.id, updates);
      if (isMountedRef.current) setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => isMountedRef.current && setSaveStatus('idle'), 1500);
    } catch {
      if (isMountedRef.current) setSaveStatus('idle');
    }
  };

  const setSchedule = (date: string | null) => {
    const combined = date ? `${date}T${followUpTime || '09:00'}` : null;
    setNextSpecificFollowUp(combined || '');
    handleUpdate({ nextSpecificFollowUp: combined });
  };

  const setCycle = (days: number) => {
    const valid = Math.min(365, Math.max(1, days));
    setFollowUpCycleDays(valid);
    handleUpdate({ followUpCycleDays: valid });
  };

  const status = calculateContactStatus(contact, now);
  const labels = [...new Set([...getLabels(), ...(contact.associations || [])])];
  const shownLabels = [...(contact.associations || [])];
  if (contact.isProfessional && !shownLabels.includes('Profesional')) shownLabels.push('Profesional');
  const sortedInteractions = [...interactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const scheduleDate = nextSpecificFollowUp ? nextSpecificFollowUp.split('T')[0] : '';

  return (
    <>
      {/* Navigation bar */}
      <div className="shrink-0 flex items-center justify-between px-3 pb-2">
        <button type="button" onClick={onClose} aria-label={t("Tutup")} className="press flex items-center gap-0.5 px-1 py-1 text-[16px] text-blue-600 dark:text-cyan-400">
          <ChevronLeft className="w-5 h-5" />
          {t("Kembali")}
        </button>
        <span className="text-[11px] font-semibold text-slate-400" aria-live="polite">
          {saveStatus === 'saving' ? t('Menyimpan...') : saveStatus === 'saved' ? t('Tersimpan') : ''}
        </span>
        {onEditContact ? (
          <button type="button" onClick={() => onEditContact(contact)} aria-label={t("Edit Relasi")} className="press px-2 py-1 text-[16px] text-blue-600 dark:text-cyan-400">
            {t("Edit")}
          </button>
        ) : (
          <span className="w-12" />
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-3">
        {/* Header card */}
        <Card>
          <div className="flex items-center gap-3.5">
            <div className="w-[60px] h-[60px] rounded-[18px] bg-gradient-to-br from-blue-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-[0_10px_24px_-12px_rgba(47,84,235,0.9)]">
              {getInitials(contact.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="dossier-contact-name" className="text-xl font-bold tracking-tight truncate">
                {contact.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {shownLabels.map((label) => (
                  <span key={label} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">
                    {label}
                  </span>
                ))}
                <button
                  type="button"
                  aria-label={t("Ubah Asosiasi Kontak")}
                  aria-expanded={isEditingAssociations}
                  onClick={() => setIsEditingAssociations((v) => !v)}
                  className="press inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                >
                  <Tag className="w-3 h-3" />
                  {isEditingAssociations ? t('Selesai') : t('Ubah label')}
                </button>
              </div>
            </div>
          </div>

          {isEditingAssociations && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {labels.map((label) => {
                const on = hasAssociation(contact, label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => handleUpdate(toggleAssociation(contact, label))}
                    className={`${chipBase} inline-flex items-center gap-1 ${on ? chipOn : chipIdle}`}
                  >
                    {on ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
              <Phone className="w-3 h-3" />
              {contact.phoneNumber}
            </span>
            <span
              data-testid="cadence-dot"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                status.isOverdue ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.isOverdue ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {dueLabel(status, contact.lastContactedDate)}
            </span>
          </div>
          <div className="flex justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.07] text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {contact.lastContactedDate ? t('Terakhir {date}', { date: formatShortDate(contact.lastContactedDate) }) : t('Belum pernah disapa')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-slate-400" />
              {t('Tiap {n} hari', { n: contact.followUpCycleDays || 15 })}
            </span>
          </div>
        </Card>

        {/* Main action + quick actions */}
        {onSapa && (
          <button
            type="button"
            onClick={() => {
              tapHaptic('medium');
              onSapa(contact);
            }}
            className="press w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-bold text-white bg-[#25D366] shadow-[0_10px_22px_-10px_rgba(37,211,102,0.9)]"
          >
            <MessageCircle className="w-5 h-5" />
            {t('Sapa {name}', { name: contact.name.split(' ')[0] })}
          </button>
        )}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onOpenLogEncounter?.(contact)}
            className="press flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11.5px] font-semibold bg-white dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10"
          >
            <PenLine className="w-5 h-5" />
            {t("Catat")}
          </button>
          <button
            type="button"
            data-tour="dossier-draft-ai"
            onClick={() => onOpenAiDraft?.(contact)}
            className="press flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11.5px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
          >
            <Sparkles className="w-5 h-5" />
            {t("Draf AI")}
          </button>
          <button
            type="button"
            data-tour="dossier-voice"
            aria-label={t("Catat Kabar dengan Suara")}
            onClick={() => onOpenVoiceNote?.(contact)}
            className="press flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11.5px] font-semibold bg-indigo-500/15 border border-indigo-500/35 text-indigo-700 dark:text-indigo-300"
          >
            <Mic className="w-5 h-5" />
            {t("Suara")}
          </button>
          <a
            href={`tel:${contact.phoneNumber}`}
            className="press flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11.5px] font-semibold bg-white dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10"
          >
            <Phone className="w-5 h-5" />
            {t("Panggil")}
          </a>
        </div>

        {/* Notes */}
        <Card className="space-y-4">
          <div data-tour="field-facts">
            <FieldLabel icon={<Star className="w-3.5 h-3.5 text-slate-400" />}>{t("Fakta Penting")}</FieldLabel>
            {contact.facts && contact.facts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.facts.map((f) => (
                  <span
                    key={`${f.text}-${f.date}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium bg-blue-500/10 text-blue-800 dark:text-blue-200 border border-blue-500/25"
                  >
                    {f.text}
                    <span className="text-[10.5px] text-blue-500/80 dark:text-blue-300/70">{formatFactDate(f.date)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">{t("Belum ada. Hal yang menetap seperti \"punya anak\" atau \"punya toko\" muncul di sini.")}</p>
            )}
          </div>

          <div data-tour="field-met">
            <FieldLabel icon={<Compass className="w-3.5 h-3.5 text-slate-400" />} htmlFor="dossier-met-context">
              {t("Pertama Ketemu & Konteks")}
            </FieldLabel>
            <textarea
              id="dossier-met-context"
              aria-label={t("Pertama Ketemu & Konteks Pertemuan")}
              rows={2}
              value={metContext}
              onChange={(e) => setMetContext(e.target.value)}
              onBlur={() => metContext !== (contact.metContext || '') && handleUpdate({ metContext })}
              placeholder={t("Di mana dan bagaimana kalian kenal")}
              className={fieldBox}
            />
          </div>

          <div data-tour="field-notes">
            <FieldLabel icon={<MessageSquare className="w-3.5 h-3.5 text-slate-400" />} htmlFor="dossier-last-notes">
              {t("Pembaruan Kabar Terakhir")}
            </FieldLabel>
            <textarea
              id="dossier-last-notes"
              aria-label={t("Pembaruan Kabar Terakhir")}
              rows={2}
              value={lastUpdateNotes}
              onChange={(e) => setLastUpdateNotes(e.target.value)}
              onBlur={() => lastUpdateNotes !== (contact.lastUpdateNotes || '') && handleUpdate({ lastUpdateNotes })}
              placeholder={t("Kabar keluarga, pekerjaan, atau kesehatan terakhir")}
              className={fieldBox}
            />
          </div>

          <div data-tour="field-topic" className="rounded-2xl p-3 bg-emerald-500/[0.07] border border-emerald-500/25">
            <FieldLabel icon={<Sparkles className="w-3.5 h-3.5" />} htmlFor="dossier-topic" className="text-emerald-700 dark:text-emerald-300">
              {t("Bahan Obrolan Follow Up Berikutnya")}
            </FieldLabel>
            <textarea
              id="dossier-topic"
              aria-label={t("Bahan Obrolan & Topik Follow Up")}
              rows={2}
              value={followUpTopic}
              onChange={(e) => setFollowUpTopic(e.target.value)}
              onBlur={() => followUpTopic !== (contact.possibleFollowUpTopic || '') && handleUpdate({ possibleFollowUpTopic: followUpTopic })}
              placeholder={t("Yang ingin ditanyakan saat menyapa berikutnya")}
              className={`${fieldBox} bg-white dark:bg-[#1C1C1E]/70 border-emerald-500/25`}
            />
          </div>
        </Card>

        {/* Schedule & rhythm */}
        <Card className="space-y-4">
          <div data-tour="field-schedule">
            <FieldLabel icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />} htmlFor="dossier-next-followup">
              {t("Jadwal Follow Up Khusus")}
            </FieldLabel>
            <div className="flex flex-wrap gap-2">
              <input
                id="dossier-next-followup"
                type="date"
                aria-label={t("Jadwal Follow Up Khusus")}
                value={scheduleDate}
                onChange={(e) => setSchedule(e.target.value || null)}
                className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-200 border border-blue-500/30 focus:outline-none"
              />
              <input
                type="time"
                aria-label={t("Jam Follow Up")}
                value={followUpTime}
                onChange={(e) => {
                  const timeVal = e.target.value;
                  setFollowUpTime(timeVal);
                  const datePart = scheduleDate || computeDateOffset(now, 1) || '';
                  const combined = timeVal ? `${datePart}T${timeVal}` : datePart;
                  setNextSpecificFollowUp(combined);
                  handleUpdate({ nextSpecificFollowUp: combined });
                }}
                className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-200 border border-blue-500/30 focus:outline-none"
              />
            </div>
            {scheduleDate && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{formatLongDate(scheduleDate)}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {QUICK_SCHEDULE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  aria-label={chip.days === null ? t('Hapus Jadwal') : chip.days === 1 ? t('Besok (+1 hr)') : t(chip.label)}
                  onClick={() => setSchedule(chip.days === null ? null : computeDateOffset(now, chip.days))}
                  className={`${chipBase} ${chip.days === null ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-300' : chipIdle}`}
                >
                  {t(chip.label)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel icon={<Repeat className="w-3.5 h-3.5 text-slate-400" />} htmlFor="dossier-cycle-days">
              {t("Ritme Sapa")}
            </FieldLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              {CYCLE_CHIPS.map((d) => (
                <button key={d} type="button" aria-pressed={followUpCycleDays === d} onClick={() => setCycle(d)} className={`${chipBase} ${followUpCycleDays === d ? chipOn : chipIdle}`}>
                  {t('{n} hari', { n: d })}
                </button>
              ))}
              <span className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                {t("atau")}
                <input
                  id="dossier-cycle-days"
                  type="number"
                  min="1"
                  max="365"
                  aria-label={t("Ritme Sapa")}
                  value={followUpCycleDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) return setFollowUpCycleDays('');
                    setCycle(val);
                  }}
                  onBlur={() => followUpCycleDays === '' && setFollowUpCycleDays(contact.followUpCycleDays ?? 15)}
                  className="w-14 px-2 py-1 rounded-lg text-center text-[13px] bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                {t("hari")}
              </span>
            </div>
          </div>

          <div>
            <FieldLabel icon={<Clock className="w-3.5 h-3.5 text-slate-400" />} htmlFor="dossier-last-contact">
              {t("Terakhir Disapa")}
            </FieldLabel>
            <input
              id="dossier-last-contact"
              type="date"
              aria-label={t("Terakhir Sapa")}
              value={lastContactedDate ? lastContactedDate.split('T')[0] : ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setLastContactedDate(val || '');
                handleUpdate({ lastContactedDate: val });
              }}
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </Card>

        {/* History */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">
              <History className="w-3.5 h-3.5 text-slate-400" />
              {t("Riwayat Interaksi")}
            </span>
            <button type="button" onClick={() => onOpenLogEncounter?.(contact)} className="press text-[13px] font-semibold text-blue-600 dark:text-cyan-400">
              {t("+ Catat Interaksi")}
            </button>
          </div>
          {sortedInteractions.length > 0 ? (
            <ol className="relative ml-1.5 border-l-2 border-slate-100 dark:border-white/10 space-y-3">
              {sortedInteractions.map((log) => {
                const type = INTERACTION_TYPES[log.type] || INTERACTION_TYPES.other;
                return (
                  <li key={log.id} className="relative pl-4">
                    <span className={`absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-[#232325] ${type.dot}`} />
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${type.pill}`}>{t(type.label)}</span>
                      <span className="text-[11.5px] text-slate-400">{formatFactDate(log.date)}</span>
                    </div>
                    {log.notes && <p className="text-[13.5px] text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">{log.notes}</p>}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">{t("Belum ada riwayat interaksi.")}</p>
          )}
        </Card>
      </div>
    </>
  );
};

export const KinshipContactDossierModal: React.FC<KinshipContactDossierModalProps> = ({ contact, isOpen, ...rest }) => {
  const shown = useSticky(contact);
  return (
    <Sheet isOpen={isOpen && Boolean(contact)} onClose={rest.onClose} labelledBy="dossier-contact-name" size="full">
      {shown && <DossierContent key={shown.id} contact={shown} {...rest} />}
    </Sheet>
  );
};
