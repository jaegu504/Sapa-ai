import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  ChevronRight,
  Download,
  HelpCircle,
  Info,
  KeyRound,
  Palette,
  Repeat,
  Rocket,
  Smartphone,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import type { ThemePreference } from '../../services/themeService';
import { CURRENT_APP_VERSION } from '../../services/updateService';
import { getDefaultCycleDays, setDefaultCycleDays } from '../../services/settingsService';

export interface SettingsViewProps {
  contactsCount: number;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  digestTime: string;
  onDigestTimeChange: (time: string) => void;
  hasUpdate: boolean;
  latestVersion?: string;
  isCheckingUpdate: boolean;
  onCheckUpdate: () => void;
  onOpenUpdate: () => void;
  onOpenLabels: () => void;
  onImportPhone: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (jsonText: string) => void;
  onReplayTutorial: () => void;
  onResetData: () => void;
  apiKeyInput: string;
  onApiKeyInputChange: (value: string) => void;
  isApiKeySaved: boolean;
  onSaveApiKey: () => void;
}

const CYCLE_OPTIONS = [7, 14, 15, 30, 60, 90];

const Group: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    {title && <p className="px-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>}
    <div className="rounded-[20px] bg-white/90 dark:bg-[#1C1C1E]/85 border border-white/80 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]">
      {children}
    </div>
  </section>
);

const Icon: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-white shrink-0 ${color}`}>{children}</span>
);

const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
}> = ({ icon, label, value, onClick, danger, children }) => {
  const content = (
    <>
      {icon}
      <span className={`flex-1 text-left text-[15px] ${danger ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`}>{label}</span>
      {children ?? (
        <>
          {value !== undefined && <span className="text-[15px] text-slate-500 dark:text-slate-400">{value}</span>}
          {onClick && !danger && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
        </>
      )}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[52px] active:bg-slate-50 dark:active:bg-white/5">
      {content}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-4 py-2.5 min-h-[52px]">{content}</div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [defaultCycle, setDefaultCycle] = useState<number>(() => getDefaultCycleDays());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1>(0);
  const [resetText, setResetText] = useState('');

  const themes: { id: ThemePreference; label: string }[] = [
    { id: 'light', label: 'Terang' },
    { id: 'dark', label: 'Gelap' },
    { id: 'system', label: 'Otomatis' },
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) file.text().then(props.onRestoreBackup);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-3 pb-32 space-y-6 text-slate-900 dark:text-white">
      <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">Pengaturan</h1>

      <Group title="Umum">
        <Row icon={<Icon color="bg-indigo-500"><Palette className="w-4 h-4" /></Icon>} label="Tema">
          <div className="flex p-0.5 rounded-full bg-slate-200/70 dark:bg-white/10" role="radiogroup" aria-label="Tema">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={props.themePreference === t.id}
                aria-label={`Mode ${t.label}`}
                onClick={() => props.onThemeChange(t.id)}
                className={`relative px-2.5 py-1 rounded-full text-[12.5px] font-semibold ${
                  props.themePreference === t.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {props.themePreference === t.id && (
                  <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full bg-white dark:bg-white/20 shadow-sm" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        </Row>
        <Row icon={<Icon color="bg-rose-500"><Bell className="w-4 h-4" /></Icon>} label="Pengingat harian">
          <input
            type="time"
            aria-label="Jam pengingat harian"
            value={props.digestTime}
            onChange={(e) => e.target.value && props.onDigestTimeChange(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-[15px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none"
          />
        </Row>
        <Row icon={<Icon color="bg-emerald-500"><Repeat className="w-4 h-4" /></Icon>} label="Ritme bawaan">
          <select
            aria-label="Ritme bawaan untuk kontak baru"
            value={defaultCycle}
            onChange={(e) => {
              const days = Number(e.target.value);
              setDefaultCycle(days);
              setDefaultCycleDays(days);
            }}
            className="px-2.5 py-1 rounded-lg text-[15px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {[...new Set([...CYCLE_OPTIONS, defaultCycle])].sort((a, b) => a - b).map((d) => (
              <option key={d} value={d}>
                Tiap {d} hari
              </option>
            ))}
          </select>
        </Row>
        <Row icon={<Icon color="bg-amber-500"><Tag className="w-4 h-4" /></Icon>} label="Label" onClick={props.onOpenLabels} />
      </Group>

      <Group title="Data & cadangan">
        <Row icon={<Icon color="bg-green-500"><Smartphone className="w-4 h-4" /></Icon>} label="Impor dari kontak HP" onClick={props.onImportPhone} />
        <Row icon={<Icon color="bg-cyan-600"><Download className="w-4 h-4" /></Icon>} label="Simpan cadangan" value={`${props.contactsCount} kontak`} onClick={props.onExportBackup} />
        <Row icon={<Icon color="bg-cyan-600"><Upload className="w-4 h-4" /></Icon>} label="Pulihkan cadangan" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" data-testid="backup-file-input" onChange={handleFile} />
      </Group>

      <Group title="Aplikasi">
        <Row
          icon={<Icon color="bg-blue-500"><Rocket className="w-4 h-4" /></Icon>}
          label="Pembaruan"
          onClick={props.hasUpdate ? props.onOpenUpdate : props.onCheckUpdate}
        >
          {props.hasUpdate ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">v{props.latestVersion} siap</span>
          ) : (
            <span className="text-[15px] text-slate-500 dark:text-slate-400">{props.isCheckingUpdate ? 'Memeriksa...' : `v${CURRENT_APP_VERSION}`}</span>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
        </Row>
        <Row icon={<Icon color="bg-slate-500"><HelpCircle className="w-4 h-4" /></Icon>} label="Ulangi tutorial" onClick={props.onReplayTutorial} />
        <Row icon={<Icon color="bg-slate-500"><KeyRound className="w-4 h-4" /></Icon>} label="Lanjutan (kunci AI)" onClick={() => setShowAdvanced((v) => !v)} />
        <AnimatePresence initial={false}>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tidak wajib. Sapa sudah memakai AI bawaan. Isi kunci Groq atau Gemini pribadi hanya jika ingin kuota sendiri.
                </p>
                <input
                  type="password"
                  value={props.apiKeyInput}
                  onChange={(e) => props.onApiKeyInputChange(e.target.value)}
                  placeholder="gsk_... atau AIza..."
                  aria-label="Kunci AI pribadi"
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{props.isApiKeySaved ? 'Kunci pribadi aktif' : 'Memakai AI bawaan'}</span>
                  <button type="button" onClick={props.onSaveApiKey} className="press px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-blue-600 dark:bg-blue-500">
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Group>

      <Group>
        {resetStep === 0 ? (
          <Row icon={<Icon color="bg-rose-500"><Trash2 className="w-4 h-4" /></Icon>} label="Hapus semua data" danger onClick={() => setResetStep(1)} />
        ) : (
          <div className="px-4 py-3.5 space-y-2.5">
            <p className="text-[13px] text-slate-700 dark:text-slate-200">
              Semua kontak, catatan dan riwayat akan terhapus dari HP ini dan tidak bisa dikembalikan, kecuali Anda punya file cadangan. Ketik <b>HAPUS</b> untuk melanjutkan.
            </p>
            <input
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              aria-label="Ketik HAPUS untuk konfirmasi"
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetStep(0);
                  setResetText('');
                }}
                className="press px-4 py-1.5 rounded-full text-[13px] font-semibold text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetText.trim().toUpperCase() !== 'HAPUS'}
                onClick={() => {
                  props.onResetData();
                  setResetStep(0);
                  setResetText('');
                }}
                className="press px-4 py-1.5 rounded-full text-[13px] font-semibold text-white bg-rose-500 disabled:opacity-40"
              >
                Hapus semua
              </button>
            </div>
          </div>
        )}
      </Group>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Info className="w-3.5 h-3.5" />
        Sapa v{CURRENT_APP_VERSION} · Data tersimpan hanya di HP ini
      </p>
    </div>
  );
};
