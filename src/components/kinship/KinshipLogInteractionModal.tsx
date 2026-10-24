import React, { useState, useEffect } from 'react';
import {
  X,
  Coffee,
  Phone,
  MessageSquare,
  Users,
  Calendar,
  MapPin,
  FileText,
  Lightbulb,
  Plus,
  RefreshCw,
  BookmarkCheck,
} from 'lucide-react';
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

const FORMAT_OPTIONS: { type: InteractionType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'meetup',
    label: 'Kopi / Makan',
    icon: <Coffee className="w-4 h-4 text-amber-600" />,
  },
  {
    type: 'call',
    label: 'Telepon',
    icon: <Phone className="w-4 h-4 text-blue-600" />,
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
  },
  {
    type: 'other',
    label: 'Acara / Majelis',
    icon: <Users className="w-4 h-4 text-purple-600" />,
  },
];

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const KinshipLogInteractionModal: React.FC<KinshipLogInteractionModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSave,
}) => {
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

  if (!isOpen || !contact) return null;

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
    if (isSubmitting) return;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-interaction-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 dark:bg-black/85 animate-fade-in p-0 sm:p-4"
    >
      <div className="animate-rise w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200/90 dark:border-white/12 text-slate-900 dark:text-white transition-colors">
        {/* Top Grabber Handle & Header */}
        <div className="pt-3 pb-3 px-5 border-b border-slate-100 dark:border-white/10 flex flex-col bg-slate-50/70 dark:bg-white/5">
          {/* Bottom Sheet Grabber Pill */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5 opacity-80" />

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Catatan Interaksi Sapa
                </span>
              </div>
              <h2
                id="log-interaction-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5"
              >
                Catat Interaksi: <span className="text-emerald-700 dark:text-emerald-400">{contact.name}</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {/* Format Interaksi Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Format Interaksi</span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Pilih salah satu</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => {
                const isActive = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="shrink-0">{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Waktu & Tempat (Date and Location) */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label
                htmlFor="encounter-date"
                className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Hari & Tanggal
              </label>
              <input
                id="encounter-date"
                type="date"
                aria-label="Hari & Tanggal"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs font-mono bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="encounter-location"
                className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Lokasi Ketemu
              </label>
              <input
                id="encounter-location"
                type="text"
                aria-label="Lokasi Ketemu"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Misal: Filosofi Kopi Senopati, Masjid At-Tin, Online WA..."
                className="w-full text-xs bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Poin Obrolan (Notion Bullet Style Textarea) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="encounter-talking-points"
                className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Poin Obrolan & Catatan Penting
              </label>
            </div>
            <textarea
              id="encounter-talking-points"
              aria-label="Poin Obrolan & Catatan Penting"
              rows={4}
              value={talkingPoints}
              onChange={(e) => setTalkingPoints(e.target.value)}
              placeholder="• Bahas silaturahmi & update kabar terkini&#10;• Rekomendasi bacaan atau proyek bersama&#10;• Rencana pertemuan berikutnya..."
              className="w-full text-xs text-slate-800 dark:text-white leading-relaxed bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
            />
          </div>

          {/* Fakta Baru / Topik Personal Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Fakta Baru / Topik Personal
              </label>
            </div>

            {/* Display Tags */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50/70 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 min-h-[42px]">
              {newFacts.map((fact) => (
                <span
                  key={fact}
                  className="inline-flex items-center gap-1 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-full text-xs shadow-2xs font-medium"
                >
                  <span>{fact}</span>
                  <button
                    type="button"
                    aria-label={`Hapus tag ${fact}`}
                    onClick={() => handleRemoveFact(fact)}
                    className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {newFacts.length === 0 && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Belum ada fakta baru.</span>
              )}
            </div>

            {/* Add Tag Input */}
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={factInput}
                onChange={(e) => setFactInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFact();
                  }
                }}
                placeholder="Tambah fakta baru (hobi, kabar keluarga, dsb)..."
                className="flex-1 text-xs bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddFact}
                className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Fakta</span>
              </button>
            </div>
          </div>

          {/* Toggle Switch: Reset Ritme / Cadence */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <label
                  htmlFor="reset-cadence-toggle"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 block cursor-pointer"
                >
                  Reset ritme follow-up dari hari ini
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Memperbarui tanggal terakhir sapa dan mengosongkan jadwal khusus
                </span>
              </div>
            </div>

            {/* Checkbox switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="reset-cadence-toggle"
                type="checkbox"
                checked={resetCadence}
                onChange={(e) => setResetCadence(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] rounded-full bg-slate-900 dark:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 dark:hover:bg-blue-500 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <BookmarkCheck className="w-4 h-4 text-emerald-400" />
              <span>Simpan Catatan Interaksi</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
