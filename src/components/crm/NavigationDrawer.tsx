import React, { useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { Contact, InteractionLog } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';

export interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  interactions: InteractionLog[];
  onSelectFilter?: (filterType: 'all' | 'overdue' | 'week' | 'never_contacted') => void;
  onExportBackup: () => void;
  onImportBackup: (jsonData: string) => Promise<void>;
  now?: Date;
}

const CATEGORIES = ['Ihvan', 'Hoca', 'Keluarga', 'Zahiri', 'Teman', 'Profesional'] as const;

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  contacts,
  interactions,
  onSelectFilter,
  onExportBackup,
  onImportBackup,
  now = new Date(),
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    CATEGORIES.forEach((cat) => {
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
  }, [contacts]);

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
        await onImportBackup(content);
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
        className="relative z-10 w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2F54EB] flex items-center justify-center font-bold text-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Ringkasan & Analitik</h2>
              <p className="text-[11px] text-slate-500">Kesehatan relasi & pintasan kontrol</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup Menu"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1">
          {/* Section 1: Relationship Health Breakdown */}
          <section aria-label="Kesehatan Relasi" className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2F54EB]" />
              <span>Status Kesehatan Relasi</span>
            </h3>

            {/* Health Score Summary Card */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900">Health Score Silaturahmi</span>
                <span className="text-xl font-extrabold text-[#2F54EB]">{healthScore}%</span>
              </div>
              <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2F54EB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                <span className="font-medium">{activeCount} Total Relasi</span>
                <span className="text-rose-600 font-semibold">{overdueCount} Perlu Disapa</span>
              </div>
            </div>

            {/* Category Distribution Badges */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Distribusi Kategori Relasi</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-700">{cat}</span>
                    <span
                      data-testid={`category-count-${cat.toLowerCase()}`}
                      className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-[#2F54EB] border border-blue-100 shadow-2xs"
                    >
                      {categoryCounts[cat] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Smart Quick Filter Shortcuts */}
          <section aria-label="Filter Cepat" className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Pintasan Filter Pintar</span>
            </h3>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleFilterClick('all')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F54EB] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#2F54EB]">
                      Semua Relasi
                    </span>
                    <p className="text-[10px] text-slate-400">Tampilkan seluruh kontak aktif</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-[#2F54EB]">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('overdue')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                      Perlu Disapa (Overdue)
                    </span>
                    <p className="text-[10px] text-rose-500">Sudah melewati siklus silaturahmi</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600">{overdueCount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('week')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                      Jadwal Minggu Ini
                    </span>
                    <p className="text-[10px] text-slate-400">Jadwal follow-up dalam 7 hari</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('never_contacted')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                      Belum Pernah Disapa
                    </span>
                    <p className="text-[10px] text-slate-400">Relasi baru yang belum ada riwayat</p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Section 3: Riwayat Log Interaksi Terakhir */}
          <section aria-label="Riwayat Log Interaksi" className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Riwayat Log Interaksi Terakhir</span>
            </h3>

            {recentLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                Belum ada riwayat interaksi
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {log.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.date ? log.date.split('T')[0] : ''}
                      </span>
                    </div>
                    <p className="text-slate-700 line-clamp-2">{log.notes || 'Selesai berinteraksi'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Cadangan & Pemulihan (Backup & Restore) */}
          <section aria-label="Cadangan & Pemulihan" className="space-y-2.5 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-slate-500" />
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
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#2F54EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Backup JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
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
