import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import { Calendar, Coffee, FileText, MapPin, MessageSquare, Phone, Plus, Repeat, Star, Users, X } from 'lucide-react';
import { Sheet, useSticky } from '../ui/Sheet';
import { avatarTone, getInitials } from '../../utils/display';
import { Contact, InteractionType } from '../../types/crm';

export interface KinshipLogInteractionModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (encounter: {
    contactId: string;
    type: InteractionType;
    date: string;
    location?: string;
    talkingPoints?: string;
    newFacts?: string[];
    resetCadence?: boolean;
  }) => Promise<void> | void;
}

const FORMAT_OPTIONS: { type: InteractionType; label: string; Icon: typeof Coffee; tone: string }[] = [
  { type: 'meetup', label: 'Kopi / Makan', Icon: Coffee, tone: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
  { type: 'call', label: 'Telepon', Icon: Phone, tone: 'bg-blue-500/15 text-blue-600 dark:text-blue-300' },
  { type: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare, tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
  { type: 'other', label: 'Acara / Majelis', Icon: Users, tone: 'bg-violet-500/15 text-violet-600 dark:text-violet-300' },
];

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const KinshipLogInteractionModal: React.FC<KinshipLogInteractionModalProps> = ({
  contact: liveContact,
  isOpen,
  onClose,
  onSave,
}) => {
  const contact = useSticky(liveContact);
  const [selectedType, setSelectedType] = useState<InteractionType>('meetup');
  const [date, setDate] = useState<string>(getTodayString());
  const [location, setLocation] = useState<string>('');
  const [talkingPoints, setTalkingPoints] = useState<string>('');
  const [newFacts, setNewFacts] = useState<string[]>([]);
  const [factInput, setFactInput] = useState<string>('');
  const [resetCadence, setResetCadence] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType('meetup');
      setDate(getTodayString());
      setLocation('');
      setTalkingPoints('');
      setNewFacts([]);
      setFactInput('');
      setResetCadence(true);
      setIsSubmitting(false);
    }
  }, [isOpen, contact?.id]);

  const handleAddFact = () => {
    const trimmed = factInput.trim();
    if (!trimmed) return;
    if (!newFacts.includes(trimmed)) {
      setNewFacts([...newFacts, trimmed]);
    }
    setFactInput('');
  };

  const handleRemoveFact = (factToRemove: string) => {
    setNewFacts(newFacts.filter((f) => f !== factToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !contact) return;

    setIsSubmitting(true);
    try {
      await onSave({
        contactId: contact.id,
        type: selectedType,
        date,
        location: location.trim() || undefined,
        talkingPoints: talkingPoints.trim() || undefined,
        newFacts: newFacts.length > 0 ? newFacts : undefined,
        resetCadence,
      });
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const group = 'rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]';

  return (
    <Sheet isOpen={isOpen && Boolean(liveContact)} onClose={onClose} labelledBy="log-interaction-title" size="full" zIndex="z-[56]">
      {contact && (
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 flex items-center justify-between px-4 pb-3">
            <button type="button" onClick={onClose} className="press text-[16px] text-blue-600 dark:text-cyan-400">
              {t("Batal")}
            </button>
            <h2 id="log-interaction-title" className="text-[16px] font-bold">
              {t("Catat Interaksi")}
            </h2>
            <button type="button" onClick={onClose} aria-label={t("Tutup")} className="press w-8 h-8 rounded-full flex items-center justify-center bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-[18px] bg-emerald-500/[0.08] border border-emerald-500/25">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold ${avatarTone(contact.name)}`}>{getInitials(contact.name)}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold truncate">{contact.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.associations.join(', ') || t('Tanpa label')}</p>
              </div>
            </div>

            <div>
              <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("Bagaimana kalian menyapa?")}</p>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("Format Interaksi")}>
                {FORMAT_OPTIONS.map((opt) => {
                  const on = selectedType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelectedType(opt.type)}
                      className={`press flex flex-col items-center gap-1.5 px-1 py-3 rounded-2xl text-[11.5px] font-semibold border ${
                        on ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center ${opt.tone}`}>
                        <opt.Icon className="w-4 h-4" />
                      </span>
                      <span className="leading-tight text-center">{t(opt.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={group}>
              <label className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-rose-500 shrink-0">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="flex-1 text-[15px]">{t("Tanggal")}</span>
                <input
                  type="date"
                  aria-label={t("Hari & Tanggal")}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-200 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-amber-500 shrink-0">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  aria-label={t("Lokasi Ketemu")}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("Lokasi (boleh kosong)")}
                  className="flex-1 min-w-0 bg-transparent text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </label>
            </div>

            <div className={group}>
              <label className="block px-3.5 py-3">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {t("Apa yang diobrolkan?")}
                </span>
                <textarea
                  rows={3}
                  aria-label={t("Poin Obrolan & Catatan Penting")}
                  value={talkingPoints}
                  onChange={(e) => setTalkingPoints(e.target.value)}
                  placeholder={t("Kabar terbaru, cerita, atau rencana berikutnya")}
                  className="w-full text-[14.5px] leading-relaxed bg-transparent resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </label>
              <div className="px-3.5 py-3">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  <Star className="w-3.5 h-3.5 text-slate-400" />
                  {t("Fakta Penting baru")}
                </span>
                {newFacts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newFacts.map((fact) => (
                      <span key={fact} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-[12.5px] font-medium bg-blue-500/10 text-blue-800 dark:text-blue-200 border border-blue-500/25">
                        {fact}
                        <button type="button" aria-label={t('Hapus tag {name}', { name: fact })} onClick={() => handleRemoveFact(fact)} className="w-5 h-5 rounded-full flex items-center justify-center text-blue-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={factInput}
                    onChange={(e) => setFactInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFact();
                      }
                    }}
                    placeholder={t("Tambah fakta baru (hobi, kabar keluarga, dsb)")}
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-full text-[13px] bg-slate-100 dark:bg-white/10 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={t("Tambah Fakta")}
                    onClick={handleAddFact}
                    className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-semibold border border-dashed border-cyan-500/60 text-cyan-700 dark:text-cyan-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("Tambah")}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 px-3.5 py-3 rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-emerald-500 shrink-0">
                <Repeat className="w-4 h-4" />
              </span>
              <span className="flex-1 text-[14px]">{t("Hitung ulang ritme sapa dari tanggal ini")}</span>
              <input
                type="checkbox"
                aria-label={t("Reset ritme follow-up")}
                checked={resetCadence}
                onChange={(e) => setResetCadence(e.target.checked)}
                className="w-5 h-5 accent-emerald-500"
              />
            </label>

            <button
              type="submit"
              aria-label={t("Simpan Catatan Interaksi")}
              disabled={isSubmitting}
              className="press w-full py-3.5 rounded-2xl text-[15.5px] font-bold text-white bg-blue-600 dark:bg-blue-500 shadow-[0_10px_22px_-10px_rgba(59,107,255,0.9)] disabled:opacity-60"
            >
              {isSubmitting ? t('Menyimpan...') : t('Simpan')}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
};
