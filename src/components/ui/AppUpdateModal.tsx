import React, { useState } from 'react';
import { t } from '../../i18n';
import { ArrowRight, Rocket, Download, X, Sparkles, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { UpdateCheckResult } from '../../services/updateService';
import { needsReinstall, openUpdateDownload } from '../../services/updateService';

export interface AppUpdateModalProps {
  isOpen: boolean;
  update: UpdateCheckResult | null;
  onClose: () => void;
  onDismissForever?: (version: string) => void;
  /** Saves a backup; resolves true when it worked. Needed for the reinstall (new signing key) flow. */
  onBackup?: () => Promise<boolean>;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  update,
  onClose,
  onDismissForever,
  onBackup,
}) => {
  const [backedUp, setBackedUp] = useState(false);
  if (!isOpen || !update || !update.hasUpdate) {
    return null;
  }

  const handleDownload = () => {
    openUpdateDownload(update.apkUrl || update.releaseUrl);
    onClose();
  };

  const reinstall = needsReinstall(update);
  const handleBackup = async () => {
    if (onBackup && (await onBackup())) setBackedUp(true);
  };

  const handleDismiss = () => {
    if (onDismissForever && update.latestVersion) {
      onDismissForever(update.latestVersion);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div className="animate-rise relative w-full max-w-md bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl border border-white/80 dark:border-white/15 rounded-[32px] p-6 shadow-2xl text-slate-900 dark:text-white space-y-5 animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100/60 dark:bg-white/10 hover:bg-slate-200/60 dark:hover:bg-white/20 transition-colors"
          aria-label={t("Tutup")}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Rocket className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("Versi Baru Siap Diinstal")}</span>
            </div>
            <h2 id="update-modal-title" className="text-lg font-extrabold tracking-tight">
              {t("Pembaruan Sapa-ai")}
            </h2>
          </div>
        </div>

        {/* Version Badge comparison */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
          <div className="text-center flex-1">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {t("Versi Anda")}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              v{update.currentVersion}
            </span>
          </div>
          <ArrowRight className="w-5 h-5 mx-2 text-blue-500 dark:text-cyan-400 shrink-0" aria-hidden="true" />
          <div className="text-center flex-1">
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">
              {t("Versi Terbaru")}
            </span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              v{update.latestVersion}
            </span>
          </div>
        </div>

        {reinstall && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-100 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold">
              <TriangleAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("Versi ini harus dipasang ulang")}</span>
            </div>
            <p>{t("Sapa sekarang memakai kunci aplikasi baru, jadi HP tidak bisa memperbarui langsung. Kalau Sapa dihapus tanpa cadangan, semua kontak dan catatanmu hilang.")}</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>{t("Buat cadangan, lalu simpan ke Google Drive atau kirim ke WhatsApp-mu sendiri.")}</li>
              <li>{t("Unduh Sapa versi baru.")}</li>
              <li>{t("Hapus (uninstall) Sapa yang lama.")}</li>
              <li>{t("Pasang Sapa yang baru, lalu buka Pengaturan → Pulihkan cadangan.")}</li>
            </ol>
          </div>
        )}

        {/* Release Notes Preview */}
        {!reinstall && update.releaseNotes && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("Catatan Pembaruan:")}
            </span>
            <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed whitespace-pre-line font-mono text-[11px]">
              {update.releaseNotes}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {reinstall && onBackup && (
            <button
              type="button"
              onClick={handleBackup}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-full font-bold text-sm active:scale-[0.98] transition-all ${
                backedUp
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{backedUp ? t("Cadangan tersimpan") : t("1. Buat cadangan dulu")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={reinstall && Boolean(onBackup) && !backedUp}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
          >
            <Download className="w-4 h-4" />
            <span>{reinstall ? t("2. Unduh Sapa versi baru") : t("Unduh & Perbarui Sekarang (APK)")}</span>
          </button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => openUpdateDownload(update.releaseUrl)}
              className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t("Lihat di GitHub")}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors"
            >
              {t("Nanti Saja")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
