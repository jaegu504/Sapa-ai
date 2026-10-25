import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { t } from '../../i18n';
import { AlertCircle, Check, CheckCircle2, FileText, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck, Smartphone, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';
import { crmDb } from '../../db/crmDatabase';
import { normalizePhoneNumber } from '../../utils/phone';
import { avatarTone } from '../../utils/display';
import type { RawPhoneContact, ImportResult } from '../../types/crm';
import {
  getDeviceContactsWithStatus,
  ContactsPermissionStatus,
} from '../../services/nativeContactsAdapter';
import { importContacts } from '../../services/contactService';
import { getDefaultCycleDays } from '../../services/settingsService';
import { parseVcf, parseCsv } from '../../utils/contactImportParsers';

export interface KinshipPhonebookSyncViewProps {
  isOpen?: boolean; // if used as modal or full screen
  onClose?: () => void;
  onImportComplete?: (result: { importedCount: number; updatedCount: number; totalProcessed?: number }) => void;
}

type SyncSourceTab = 'phonebook' | 'google' | 'csv';

interface CadenceOption {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  badge?: string;
}

const CADENCE_OPTIONS: CadenceOption[] = [
  {
    id: 'weekly',
    title: 'Mingguan',
    subtitle: 'Setiap 7 hari · Relasi sangat dekat',
    days: 7,
  },
  {
    id: 'biweekly',
    title: '2 Mingguan (Rekomendasi)',
    subtitle: 'Setiap 14-15 hari · Sahabat & kolega aktif',
    days: 15,
  },
  {
    id: 'monthly',
    title: 'Bulanan',
    subtitle: 'Setiap 30 hari · Jaringan umum & kenalan',
    days: 30,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const KinshipPhonebookSyncView: React.FC<KinshipPhonebookSyncViewProps> = ({
  isOpen = true,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<SyncSourceTab>('phonebook');
  const [contacts, setContacts] = useState<RawPhoneContact[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<ContactsPermissionStatus>('granted');
  const [loading, setLoading] = useState<boolean>(false);
  const [requestingPermission, setRequestingPermission] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [selectedCadence, setSelectedCadence] = useState<number>(() => getDefaultCycleDays());
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(50);
  // Numbers already in Sapa: shown as "Sudah di Sapa" and not selectable.
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    crmDb.contacts
      .toArray()
      .then((all) => setExistingPhones(new Set(all.map((c) => c.phoneNumber))))
      .catch(() => setExistingPhones(new Set()));
  }, [isOpen, importResult]);

  const isInSapa = useCallback(
    (c: RawPhoneContact) => existingPhones.has(normalizePhoneNumber(c.phoneNumber)),
    [existingPhones]
  );

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setUploadedFileName(null);
    setFileError(null);
    try {
      const result = await getDeviceContactsWithStatus();
      setPermissionStatus(result.permissionStatus);
      if (result.permissionStatus === 'granted' || result.permissionStatus === 'unsupported') {
        setContacts(result.contacts);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Failed to load device contacts:', err);
      setContacts([]);
      setPermissionStatus('denied');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen === false) {
      setSearchQuery('');
      setSelectedPhones(new Set());
      setImportResult(null);
      setFileError(null);
      return;
    }

    if (activeTab === 'phonebook') {
      loadContacts();
    }
  }, [isOpen, activeTab, loadContacts]);

  // Reset pagination limit on search query change to keep DOM render count light
  useEffect(() => {
    setVisibleLimit(50);
  }, [searchQuery]);

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    try {
      const result = await getDeviceContactsWithStatus();
      setPermissionStatus(result.permissionStatus);
      if (result.permissionStatus === 'granted' || result.permissionStatus === 'unsupported') {
        setContacts(result.contacts);
      }
    } catch (err) {
      console.error('Permission request failed:', err);
    } finally {
      setRequestingPermission(false);
    }
  };

  // Handle CSV / VCF file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setLoading(true);

    try {
      const text = await file.text();
      let parsed: RawPhoneContact[] = [];

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.vcf') || lowerName.endsWith('.vcard')) {
        parsed = parseVcf(text);
      } else if (lowerName.endsWith('.csv') || file.type.includes('csv')) {
        parsed = parseCsv(text);
      } else {
        parsed = parseVcf(text);
        if (parsed.length === 0) {
          parsed = parseCsv(text);
        }
      }

      if (parsed.length === 0) {
        setFileError(t('Tidak ditemukan kontak dengan nomor telepon valid dalam file ini.'));
        return;
      }

      setContacts(parsed);
      setUploadedFileName(file.name);
      // Auto-select all parsed contacts for convenience
      setSelectedPhones(new Set(parsed.map((c) => c.phoneNumber)));
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setFileError(t('Gagal memproses file: ') + (err?.message || t('Format tidak didukung')));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Filter contacts by search query
  // A to Z, like the phone's own contact list.
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = !q
      ? contacts
      : contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phoneNumber.toLowerCase().includes(q) ||
            (c.associations && c.associations.some((a) => a.toLowerCase().includes(q)))
        );
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
  }, [contacts, searchQuery]);

  const selectableFiltered = useMemo(() => filteredContacts.filter((c) => !isInSapa(c)), [filteredContacts, isInSapa]);

  // Windowed visible contacts to prevent rendering thousands of DOM elements
  const displayedContacts = useMemo(() => {
    return filteredContacts.slice(0, visibleLimit);
  }, [filteredContacts, visibleLimit]);

  const areAllFilteredSelected =
    selectableFiltered.length > 0 && selectableFiltered.every((c) => selectedPhones.has(c.phoneNumber));

  const handleToggleSelectAll = () => {
    const nextSelected = new Set(selectedPhones);
    if (areAllFilteredSelected) {
      selectableFiltered.forEach((c) => nextSelected.delete(c.phoneNumber));
    } else {
      selectableFiltered.forEach((c) => nextSelected.add(c.phoneNumber));
    }
    setSelectedPhones(nextSelected);
  };

  const handleToggleContact = (phone: string) => {
    const nextSelected = new Set(selectedPhones);
    if (nextSelected.has(phone)) {
      nextSelected.delete(phone);
    } else {
      nextSelected.add(phone);
    }
    setSelectedPhones(nextSelected);
  };

  const handleImport = async () => {
    if (selectedPhones.size === 0 || importing) return;

    setImporting(true);
    try {
      const selectedContacts = contacts.filter((c) => selectedPhones.has(c.phoneNumber));
      const toImport: RawPhoneContact[] = selectedContacts.map((c) => ({
        ...c,
        followUpCycleDays: selectedCadence,
      }));

      // File imports are not the phone's list, so a later re-sync must never remove them.
      const result = await importContacts(toImport, '62', uploadedFileName ? 'manual' : 'phone');
      setImportResult(result);
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err) {
      console.error('Failed to import contacts:', err);
    } finally {
      setImporting(false);
    }
  };

  if (isOpen === false) return null;

  // Desktop browsers report 'unsupported' and show demo contacts: no permission card there.
  const showPermissionWarning = activeTab === 'phonebook' && (permissionStatus === 'denied' || permissionStatus === 'prompt');

  const tabBtn = (id: SyncSourceTab, label: string, Icon: typeof Smartphone, count?: number, onClick?: () => void, shortLabel?: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={activeTab === id}
      onClick={onClick ?? (() => setActiveTab(id))}
      className={`press flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${
        activeTab === id ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{shortLabel ?? label}</span>
      {count !== undefined && count > 0 && <span className="opacity-60">{count}</span>}
    </button>
  );

  const card = 'rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/10';
  const uploadButton = (inputId: string, label: string) => (
    <>
      <input type="file" accept=".vcf,.vcard,.csv,text/csv,text/vcard,text/x-vcard" onChange={handleFileUpload} className="hidden" id={inputId} />
      <label
        htmlFor={inputId}
        className="press w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-semibold text-white bg-blue-600 dark:bg-blue-500 cursor-pointer"
      >
        <Upload className="w-4 h-4" />
        <span>{label}</span>
      </label>
    </>
  );

  let lastLetter = '';
  return (
    <div
      role="region"
      aria-label={t("Sinkronisasi & Impor Kontak")}
      className="w-full max-w-2xl mx-auto h-full flex flex-col bg-[#F2F2F7] dark:bg-[#090A0F] text-slate-900 dark:text-white font-sans"
    >
      <header className="shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight">{t("Impor Kontak")}</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Pilih kontak HP yang ingin disapa")}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Tutup")}
            className="press w-9 h-9 rounded-full flex items-center justify-center bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="flex p-1 rounded-full bg-slate-200/70 dark:bg-white/10">
          {tabBtn('phonebook', t('Buku Telepon'), Smartphone, activeTab === 'phonebook' ? contacts.length : undefined, () => {
            setActiveTab('phonebook');
            loadContacts();
          })}
          {tabBtn('google', t('Google Kontak'), RefreshCw, undefined, undefined, 'Google')}
          {tabBtn('csv', t('File'), FileText, uploadedFileName ? contacts.length : undefined)}
        </div>

        {activeTab === 'google' && (
          <div className={`${card} p-4 space-y-3`}>
            <h3 className="text-[15px] font-bold">{t("Sinkronisasi Google Kontak")}</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Impor kontak akun Google Anda ke Sapa CRM dalam 3 langkah mudah:")}</p>
            <ol className="space-y-2.5 text-[13px] text-slate-700 dark:text-slate-200">
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>{t("Buka")} <strong>contacts.google.com</strong> {t("di browser ponsel atau laptop.")}</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>{t("Klik")} <strong>{t("Ekspor (Export)")}</strong> {t("lalu pilih format")} <strong>Google CSV</strong> {t("atau")} <strong>vCard</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>{t("Unggah file hasil ekspor tersebut di bawah ini untuk langsung dipilih & diatur ritme sapaannya.")}</span>
              </li>
            </ol>
            {uploadButton('google-contacts-file-input', t("Unggah File Google Contacts (.csv / .vcf)"))}
          </div>
        )}

        {activeTab === 'csv' && (
          <div className={`${card} p-4 space-y-3 text-center`}>
            <span className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-6 h-6" />
            </span>
            <h3 className="text-[15px] font-bold">{t("Unggah File Kontak (.vcf / .csv)")}</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Mendukung file vCard dari Google, iPhone, Android, WhatsApp, atau file spreadsheet CSV.")}</p>
            {uploadedFileName && (
              <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                {uploadedFileName} · {t('{n} kontak', { n: contacts.length })}
              </p>
            )}
            {uploadButton('csv-vcf-file-input', uploadedFileName ? t('Ganti File Kontak') : t('Pilih File dari Perangkat'))}
          </div>
        )}

        {fileError && (
          <div className="p-3 rounded-2xl flex items-center gap-2 text-[13px] bg-rose-500/10 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {showPermissionWarning && (
          <div className="rounded-[20px] p-4 space-y-3 bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[14px] font-bold text-amber-900 dark:text-amber-200">{t("Akses Kontak Belum Diizinkan")}</h3>
                <p className="text-[13px] text-amber-800 dark:text-amber-200/90 mt-1 leading-relaxed">
                  {t("Diperlukan izin sistem Android agar Sapa dapat membaca kontak dari buku telepon Anda secara offline & aman.")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={requestingPermission}
              className="press w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold text-white bg-amber-500 disabled:opacity-60"
            >
              {requestingPermission && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("Izinkan Akses Kontak")}
            </button>
          </div>
        )}

        {importResult && (
          <div className="flex items-start gap-3 p-3.5 rounded-[20px] bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-[13px]">
              <p className="font-bold text-emerald-800 dark:text-emerald-200">
                {t('Berhasil menyinkronkan {a} kontak baru, {b} kontak diperbarui.', { a: importResult.importedCount, b: importResult.updatedCount })}
              </p>
              <p className="text-emerald-700 dark:text-emerald-300/90 mt-0.5">{t("Kontak sudah diberi ritme sapaan.")}</p>
            </div>
          </div>
        )}

        {(activeTab === 'phonebook' || uploadedFileName) && !showPermissionWarning && (
          <>
            {!loading && contacts.length === 0 && activeTab === 'phonebook' ? (
              <div className={`${card} p-6 text-center space-y-3`}>
                <span className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-500">
                  <Smartphone className="w-6 h-6" />
                </span>
                <h3 className="text-[15px] font-bold">{t("Buku Telepon Kosong")}</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Tidak ada kontak ditemukan di buku telepon HP Anda, atau izin membaca kontak belum aktif.")}</p>
                <button type="button" onClick={loadContacts} className="press px-4 py-2 rounded-full text-[13px] font-semibold bg-slate-100 dark:bg-white/10">
                  {t("Muat Ulang Buku Telepon")}
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("Cari nama atau nomor telepon...")}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[15px] bg-slate-200/60 dark:bg-white/[0.08] placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[13px] text-slate-500 dark:text-slate-400">
                    {t('Dipilih: {a} dari {b} kontak', { a: selectedPhones.size, b: contacts.length })}
                  </span>
                  {selectableFiltered.length > 0 && (
                    <button type="button" onClick={handleToggleSelectAll} className="text-[13px] font-semibold text-blue-600 dark:text-cyan-400">
                      {areAllFilteredSelected ? t('Batalkan Pilihan') : t('Pilih Semua')}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("Memuat kontak telepon...")}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-slate-500">{t("Tidak ada kontak ditemukan.")}</p>
                ) : (
                  <div className="space-y-3">
                    {displayedContacts.map((contact, index) => {
                      const letter = /[a-zçğıöşü]/i.test(contact.name.trim()[0] || '') ? contact.name.trim()[0].toLocaleUpperCase('tr') : '#';
                      const showLetter = letter !== lastLetter;
                      lastLetter = letter;
                      const inSapa = isInSapa(contact);
                      const selected = selectedPhones.has(contact.phoneNumber);
                      return (
                        <React.Fragment key={`${contact.phoneNumber}-${index}`}>
                          {showLetter && <p className="px-2 pt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{letter}</p>}
                          <motion.button
                            type="button"
                            role="checkbox"
                            aria-checked={selected}
                            aria-label={t('Pilih {name}', { name: contact.name })}
                            disabled={inSapa}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index, 10) * 0.025 }}
                            onClick={() => handleToggleContact(contact.phoneNumber)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[18px] text-left border ${
                              selected
                                ? 'bg-blue-500/10 border-blue-500/40'
                                : 'bg-white dark:bg-[#1C1C1E] border-slate-200/70 dark:border-white/10'
                            } ${inSapa ? 'opacity-55' : 'active:scale-[0.99]'}`}
                          >
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${avatarTone(contact.name)}`}>
                              {getInitials(contact.name)}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[15px] font-semibold truncate">{contact.name}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{contact.phoneNumber}</span>
                            </span>
                            {inSapa ? (
                              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">{t('Sudah di Sapa')}</span>
                            ) : (
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                  selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-white/25'
                                }`}
                              >
                                {selected && <Check className="w-3.5 h-3.5" />}
                              </span>
                            )}
                          </motion.button>
                        </React.Fragment>
                      );
                    })}
                    {filteredContacts.length > visibleLimit && (
                      <button
                        type="button"
                        onClick={() => setVisibleLimit((v) => v + 50)}
                        className="press w-full py-2.5 rounded-2xl text-[13px] font-semibold bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/10"
                      >
                        {t('Tampilkan {n} lagi', { n: Math.min(50, filteredContacts.length - visibleLimit) })}
                      </button>
                    )}
                  </div>
                )}

                <div className={`${card} p-4 space-y-3`}>
                  <div>
                    <h3 className="text-[15px] font-bold">{t("Tentukan Ritme Sapaan Awal")}</h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400">{t("Frekuensi pengingat follow-up untuk kontak yang dipilih")}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={t("Ritme Sapaan")}>
                    {CADENCE_OPTIONS.map((opt) => {
                      const on = selectedCadence === opt.days;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          data-testid={`cadence-${opt.days}`}
                          onClick={() => setSelectedCadence(opt.days)}
                          className={`press flex items-center gap-3 p-3 rounded-2xl text-left border ${
                            on ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-200/70 dark:border-white/10'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full shrink-0 ${on ? 'border-[6px] border-blue-600' : 'border-2 border-slate-300 dark:border-white/25'}`} />
                          <span className="min-w-0">
                            <span className="block text-[14px] font-semibold">{t(opt.title)}</span>
                            <span className="block text-[12px] text-slate-500 dark:text-slate-400">{t(opt.subtitle)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <footer className="shrink-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] space-y-2 bg-[#F2F2F7]/90 dark:bg-[#090A0F]/90 backdrop-blur-xl border-t border-slate-200/70 dark:border-white/10">
        <button
          type="button"
          onClick={handleImport}
          disabled={selectedPhones.size === 0 || importing}
          className="press w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15.5px] font-bold text-white bg-blue-600 dark:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-white/10 disabled:text-slate-500"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("Menyinkronkan Kontak...")}</span>
            </>
          ) : (
            <span>{t('Sinkronkan {n} Kontak', { n: selectedPhones.size })}</span>
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {t("Kontak hanya disimpan di HP ini")}
        </p>
      </footer>
    </div>
  );
};
