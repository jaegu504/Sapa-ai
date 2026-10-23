import React, { useMemo, useRef, useState } from 'react';
import {
  X,
  Activity,
  Users,
  AlertCircle,
  Calendar,
  UserX,
  Download,
  Upload,
  MessageSquare,
  ShieldCheck,
  Tag,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { getLabels, addLabel, saveLabels } from '../../services/labelService';
import { Contact, InteractionLog } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';

export interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  interactions: InteractionLog[];
  onSelectFilter?: (filterType: 'all' | 'overdue' | 'week' | 'never_contacted') => void;
  /** Open Kontak filtered by this label. */
  onSelectLabel?: (label: string) => void;
  /** Rename (to = new name) or remove (to = null) a label on every contact. */
  onRemapLabel?: (from: string, to: string | null) => Promise<void> | void;
  onExportBackup: () => void;
  onImportBackup: (jsonData: string) => Promise<void>;
  now?: Date;
}


export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  contacts,
  interactions,
  onSelectFilter,
  onSelectLabel,
  onRemapLabel,
  onExportBackup,
  onImportBackup,
  now = new Date(),
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [labels, setLabels] = useState<string[]>(getLabels);
  const [newLabel, setNewLabel] = useState('');
  const [labelError, setLabelError] = useState('');

  // Health and overdue calculation
  const { overdueCount, healthScore, activeCount } = useMemo(() => {
    const active = contacts.length;
    let overdue = 0;
    contacts.forEach((c) => {
      if (calculateContactStatus(c, now).isOverdue) {
        overdue += 1;
      }
    });
    const health = active === 0 ? 100 : Math.round(((active - overdue) / active) * 100);
    return { overdueCount: overdue, healthScore: health, activeCount: active };
  }, [contacts, now]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    labels.forEach((cat) => {
      if (cat === 'Profesional') {
        counts[cat] = contacts.filter(
          (c) => c.isProfessional || c.associations.some((a) => a.toLowerCase() === 'profesional')
        ).length;
      } else {
        counts[cat] = contacts.filter((c) =>
          c.associations.some((a) => a.toLowerCase() === cat.toLowerCase())
        ).length;
      }
    });
    return counts;
  }, [contacts, labels]);

  const handleAddLabel = () => {
    const next = addLabel(labels, newLabel);
    if (!next) {
      setLabelError('Nama label kosong atau sudah ada.');
      return;
    }
    saveLabels(next);
    setLabels(next);
    setNewLabel('');
    setLabelError('');
  };

  const handleRenameLabel = async (label: string) => {
    const to = window.prompt(`Ubah nama label "${label}" menjadi:`, label)?.trim();
    if (!to || to === label) return;
    if (labels.some((l) => l !== label && l.toLowerCase() === to.toLowerCase())) {
      setLabelError(`Label "${to}" sudah ada.`);
      return;
    }
    const next = labels.map((l) => (l === label ? to : l));
    saveLabels(next);
    setLabels(next);
    setLabelError('');
    await onRemapLabel?.(label, to);
  };

  const handleRemoveLabel = async (label: string) => {
    const count = categoryCounts[label] || 0;
    const msg = count
      ? `Hapus label "${label}"? Label ini juga akan dilepas dari ${count} kontak.`
      : `Hapus label "${label}"?`;
    if (!window.confirm(msg)) return;
    const next = labels.filter((l) => l !== label);
    saveLabels(next);
    setLabels(next);
    await onRemapLabel?.(label, null);
  };

  // Sorted recent interaction logs
  const recentLogs = useMemo(() => {
    return [...interactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [interactions]);

  const handleFilterClick = (type: 'all' | 'overdue' | 'week' | 'never_contacted') => {
    onSelectFilter?.(type);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        try {
          await onImportBackup(content);
        } catch (err) {
          console.error('Error importing backup JSON:', err);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        data-testid="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        aria-label="Panel Navigasi & Analitik"
        className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/12 h-full shadow-2xl flex flex-col overflow-y-auto text-slate-900 dark:text-white transition-colors animate-in slide-in-from-left duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-[#2F54EB] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Ringkasan & Analitik</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Kesehatan relasi & pintasan kontrol</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup Menu"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1">
          {/* Section 1: Relationship Health Breakdown */}
          <section aria-label="Kesehatan Relasi" className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2F54EB] dark:text-blue-400" />
              <span>Status Kesehatan Relasi</span>
            </h3>

            {/* Health Score Summary Card */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">Health Score Silaturahmi</span>
                <span className="text-xl font-extrabold text-[#2F54EB] dark:text-blue-400">{healthScore}%</span>
              </div>
              <div className="w-full bg-blue-200/60 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2F54EB] dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                <span className="font-medium">{activeCount} Total Relasi</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">{overdueCount} Perlu Disapa</span>
              </div>
            </div>

            {/* Category Distribution Badges */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Label Relasi (ketuk untuk melihat kontaknya)</span>
              </span>
              <div className="space-y-1.5">
                {labels.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 p-1.5 pl-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                  >
                    <button
                      type="button"
                      aria-label={`Lihat kontak berlabel ${cat}`}
                      onClick={() => {
                        onSelectLabel?.(cat);
                        onClose();
                      }}
                      className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{cat}</span>
                      <span
                        data-testid={`category-count-${cat.toLowerCase()}`}
                        className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-white/15 text-[#2F54EB] dark:text-blue-400 border border-blue-100 dark:border-white/15 shadow-2xs"
                      >
                        {categoryCounts[cat] || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Ubah nama label ${cat}`}
                      onClick={() => handleRenameLabel(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus label ${cat}`}
                      onClick={() => handleRemoveLabel(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  aria-label="Nama Label Baru"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                  placeholder="Tambah label, misal: Tetangga"
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  aria-label="Tambah Label"
                  onClick={handleAddLabel}
                  className="p-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {labelError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{labelError}</p>}
            </div>
          </section>

          {/* Section 2: Smart Quick Filter Shortcuts */}
          <section aria-label="Filter Cepat" className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Pintasan Filter Pintar</span>
            </h3>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleFilterClick('all')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/40 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-[#2F54EB] dark:text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#2F54EB] dark:group-hover:text-blue-400">
                      Semua Relasi
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">Tampilkan seluruh kontak aktif</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-[#2F54EB] dark:group-hover:text-blue-400">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('overdue')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-300">
                      Perlu Disapa (Overdue)
                    </span>
                    <p className="text-[10px] text-rose-500 dark:text-rose-400">Sudah melewati siklus silaturahmi</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{overdueCount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('week')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10 hover:border-amber-200 dark:hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">
                      Jadwal Minggu Ini
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">Jadwal follow-up dalam 7 hari</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('never_contacted')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/40 hover:bg-purple-50/50 dark:hover:bg-purple-500/10 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400">
                      Belum Pernah Disapa
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">Relasi baru yang belum ada riwayat</p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Section 3: Riwayat Log Interaksi Terakhir */}
          <section aria-label="Riwayat Log Interaksi" className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Riwayat Log Interaksi Terakhir</span>
            </h3>

            {recentLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-center text-xs text-slate-400">
                Belum ada riwayat interaksi
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        {log.type}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                        {log.date ? log.date.split('T')[0] : ''}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 line-clamp-2">{log.notes || 'Selesai berinteraksi'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Cadangan & Pemulihan (Backup & Restore) */}
          <section aria-label="Cadangan & Pemulihan" className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Cadangan & Pemulihan (Backup & Restore)</span>
            </h3>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              data-testid="backup-file-input"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#2F54EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Backup JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/15 text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor Backup JSON</span>
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
