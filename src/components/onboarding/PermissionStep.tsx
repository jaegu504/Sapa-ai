import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Users, Check, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import {
  PermissionState,
  checkContactsPermission,
  requestContactsPermission,
  checkNotificationsPermission,
  requestNotificationsPermission,
  openAppSettings,
} from '../../services/permissionService';

export interface PermissionStepProps {
  onContinue: () => void;
}

interface CardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  state: PermissionState | null;
  askedAndDenied: boolean;
  onRequest: () => void;
}

const PermissionCard: React.FC<CardProps> = ({ icon: Icon, title, desc, state, askedAndDenied, onRequest }) => (
  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      {state === 'granted' ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
          <Check className="w-4 h-4" /> Diizinkan
        </span>
      ) : state === 'unavailable' ? (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 text-right max-w-[90px]">
          Tidak tersedia di perangkat ini
        </span>
      ) : askedAndDenied ? (
        <button
          type="button"
          onClick={() => openAppSettings()}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0"
        >
          <SettingsIcon className="w-3.5 h-3.5" /> Buka Pengaturan
        </button>
      ) : (
        <button
          type="button"
          onClick={onRequest}
          disabled={state === null}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-slate-900 dark:bg-blue-600 shrink-0 disabled:opacity-50"
        >
          Izinkan
        </button>
      )}
    </div>
    {askedAndDenied && state === 'denied' && (
      <p className="text-[11px] text-amber-700 dark:text-amber-300">
        Izin belum aktif. Aktifkan di Pengaturan HP, lalu kembali ke Sapa.
      </p>
    )}
  </div>
);

export const PermissionStep: React.FC<PermissionStepProps> = ({ onContinue }) => {
  const [contacts, setContacts] = useState<PermissionState | null>(null);
  const [notifications, setNotifications] = useState<PermissionState | null>(null);
  const [contactsDenied, setContactsDenied] = useState(false);
  const [notificationsDenied, setNotificationsDenied] = useState(false);

  const recheck = useCallback(async () => {
    setContacts(await checkContactsPermission());
    setNotifications(await checkNotificationsPermission());
  }, []);

  useEffect(() => {
    recheck();
    // Coming back from Android settings: refresh the cards.
    const onVisible = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [recheck]);

  return (
    <div className="my-auto py-2 space-y-4">
      <div className="text-center space-y-1.5">
        <h2 id="onboarding-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Izinkan Akses Penting
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-2">
          Dua izin ini membuat Sapa bisa bekerja penuh. Anda tetap bisa lanjut walau belum mengizinkan.
        </p>
      </div>
      <PermissionCard
        icon={Users}
        title="Akses Kontak"
        desc="Agar Anda bisa mengimpor kontak dari buku telepon."
        state={contacts}
        askedAndDenied={contactsDenied}
        onRequest={async () => {
          const res = await requestContactsPermission();
          setContacts(res);
          setContactsDenied(res === 'denied');
        }}
      />
      <PermissionCard
        icon={Bell}
        title="Notifikasi"
        desc="Agar Sapa bisa mengingatkan Anda untuk menyapa."
        state={notifications}
        askedAndDenied={notificationsDenied}
        onRequest={async () => {
          const res = await requestNotificationsPermission();
          setNotifications(res);
          setNotificationsDenied(res === 'denied');
        }}
      />
      <button
        type="button"
        onClick={onContinue}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span>Mulai Tutorial</span>
      </button>
    </div>
  );
};
