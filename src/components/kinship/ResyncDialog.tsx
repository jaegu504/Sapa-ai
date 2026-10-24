import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import type { Contact } from '../../types/crm';

export interface ResyncDialogProps {
  result: { newCount: number; missing: Contact[] } | null;
  onClose: () => void;
  onPickNew: () => void;
  onDeleteMissing: (ids: string[]) => void;
}

/** Outcome of a phone re-sync. Removing contacts always needs this explicit confirmation. */
export const ResyncDialog: React.FC<ResyncDialogProps> = ({ result, onClose, onPickNew, onDeleteMissing }) => (
  <AnimatePresence>
    {result && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
        <motion.div
          className="absolute inset-0 bg-black/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="resync-title"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', damping: 26, stiffness: 380 }}
          className="relative w-full max-w-xs rounded-[22px] bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl text-center text-slate-900 dark:text-white overflow-hidden"
        >
          <div className="px-5 pt-5 pb-4">
            <span className="mx-auto mb-2 w-11 h-11 rounded-full flex items-center justify-center bg-blue-500/15 text-blue-600 dark:text-cyan-400">
              <RefreshCw className="w-5 h-5" />
            </span>
            <h2 id="resync-title" className="text-[17px] font-bold">
              Sinkron selesai
            </h2>
            <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
              {result.newCount > 0 ? `${result.newCount} kontak di HP belum ada di Sapa.` : 'Tidak ada kontak baru di HP.'}
            </p>
            {result.missing.length > 0 && (
              <>
                <p className="mt-3 text-[13px] text-slate-600 dark:text-slate-300">
                  {result.missing.length} kontak sudah tidak ada di HP:
                </p>
                <ul className="mt-1.5 max-h-28 overflow-y-auto text-left text-[13px] font-semibold rounded-xl bg-slate-100 dark:bg-white/[0.06] px-3 py-2 space-y-0.5">
                  {result.missing.map((c) => (
                    <li key={c.id} className="truncate">
                      {c.name}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">
                  Jika dihapus, catatan dan riwayatnya ikut terhapus. Kontak lain tidak berubah.
                </p>
              </>
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-white/10 divide-y divide-slate-200 dark:divide-white/10 text-[15px]">
            {result.newCount > 0 && (
              <button type="button" onClick={onPickNew} className="w-full py-3 font-semibold text-blue-600 dark:text-cyan-400">
                Pilih kontak baru
              </button>
            )}
            {result.missing.length > 0 && (
              <button
                type="button"
                onClick={() => onDeleteMissing(result.missing.map((c) => c.id))}
                className="w-full py-3 font-semibold text-rose-600 dark:text-rose-400"
              >
                Hapus {result.missing.length} kontak
              </button>
            )}
            <button type="button" onClick={onClose} className="w-full py-3 text-blue-600 dark:text-cyan-400">
              {result.missing.length > 0 ? 'Simpan saja' : 'Tutup'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
