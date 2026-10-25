import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { t } from '../../i18n';
import {
  X,
  Search,
  CheckSquare,
  Square,
  Smartphone,
  RefreshCw,
  FileText,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Loader2,
  Users,
  Upload,
  AlertCircle,
} from 'lucide-react';
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
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.associations && c.associations.some((a) => a.toLowerCase().includes(q)))
    );
  }, [contacts, searchQuery]);

  // Windowed visible contacts to prevent rendering thousands of DOM elements
  const displayedContacts = useMemo(() => {
    return filteredContacts.slice(0, visibleLimit);
  }, [filteredContacts, visibleLimit]);

  const areAllFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedPhones.has(c.phoneNumber));

  const handleToggleSelectAll = () => {
    const nextSelected = new Set(selectedPhones);
    if (areAllFilteredSelected) {
      filteredContacts.forEach((c) => nextSelected.delete(c.phoneNumber));
    } else {
      filteredContacts.forEach((c) => nextSelected.add(c.phoneNumber));
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

  const showPermissionWarning = activeTab === 'phonebook' && permissionStatus !== 'granted';

  return (
    <div
      role="region"
      aria-label={t("Sinkronisasi & Impor Kontak")}
      className="w-full max-w-2xl mx-auto h-full flex flex-col bg-[#f8f9ff] text-slate-900 font-sans dark:bg-[#090A0F] dark:text-white"
    >
      {/* Top Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between pt-[env(safe-area-inset-top,12px)] dark:bg-[#1C1C1E]/95 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">{t("Impor Kontak")}</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("Pilih kontak HP yang ingin disapa")}</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Tutup")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Banner / Helper Info */}
        <div className="relative overflow-hidden bg-white border border-slate-200/70 rounded-3xl p-4 shadow-sm dark:bg-[#1C1C1E] dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 dark:bg-emerald-500/15">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t("Sinkronisasi & Impor Kontak")}</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed dark:text-slate-400">
                {t("Pilih kontak dari buku telepon ponsel atau unggah file vCard/CSV untuk dipantau ritme follow-up-nya secara berkala.")}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Sources Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('phonebook');
              loadContacts();
            }}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'phonebook'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100 dark:bg-[#1C1C1E] dark:text-slate-300 dark:border-white/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Buku Telepon (HP) {activeTab === 'phonebook' && contacts.length > 0 ? `(${contacts.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100 dark:bg-[#1C1C1E] dark:text-slate-300 dark:border-white/10'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("Google Kontak")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100 dark:bg-[#1C1C1E] dark:text-slate-300 dark:border-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File CSV / VCF {uploadedFileName ? `(${contacts.length})` : ''}</span>
          </button>
        </div>

        {/* Google Contacts Tab with Step-by-Step Sync Guide & File Upload */}
        {activeTab === 'google' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 dark:bg-[#1C1C1E] dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("Sinkronisasi Google Kontak")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Impor kontak akun Google Anda ke Sapa CRM dalam 3 langkah mudah:")}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 dark:text-slate-300 dark:bg-white/5 dark:border-white/10">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>{t("Buka")} <strong>contacts.google.com</strong> {t("di browser ponsel atau laptop.")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>{t("Klik")} <strong>{t("Ekspor (Export)")}</strong> {t("lalu pilih format")} <strong>Google CSV</strong> {t("atau")} <strong>vCard</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>{t("Unggah file hasil ekspor tersebut di bawah ini untuk langsung dipilih & diatur ritme sapaannya.")}</span>
              </div>
            </div>

            <div className="pt-1">
              <input
                type="file"
                accept=".vcf,.vcard,.csv,text/csv,text/vcard,text/x-vcard"
                onChange={handleFileUpload}
                className="hidden"
                id="google-contacts-file-input"
              />
              <label
                htmlFor="google-contacts-file-input"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>{t("Unggah File Google Contacts (.csv / .vcf)")}</span>
              </label>
            </div>
          </div>
        )}

        {/* CSV / VCF File Tab */}
        {activeTab === 'csv' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 dark:bg-[#1C1C1E] dark:border-white/10">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 dark:bg-emerald-500/15">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("Unggah File Kontak (.vcf / .csv)")}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto dark:text-slate-400">
                {t("Mendukung file vCard dari Google, iPhone, Android, WhatsApp, atau file spreadsheet CSV.")}
              </p>
            </div>

            {uploadedFileName && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs dark:bg-emerald-500/15">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900 truncate">
                    File dimuat: {uploadedFileName} ({contacts.length} kontak)
                  </span>
                </div>
              </div>
            )}

            {fileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <input
              type="file"
              accept=".vcf,.vcard,.csv,text/csv,text/vcard,text/x-vcard"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-vcf-file-input"
            />
            <label
              htmlFor="csv-vcf-file-input"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold cursor-pointer shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{uploadedFileName ? t('Ganti File Kontak') : t('Pilih File dari Perangkat')}</span>
            </label>
          </div>
        )}

        {/* Native Permission Card for Phonebook */}
        {showPermissionWarning && (
          <div className="border border-amber-300 bg-amber-50/90 rounded-3xl p-4 space-y-3 shadow-sm dark:bg-amber-500/10 dark:border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {t("Akses Kontak Belum Diizinkan")}
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed dark:text-amber-200">
                  {t("Diperlukan izin sistem Android agar Sapa dapat membaca kontak dari buku telepon Anda secara offline & aman.")}
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={requestingPermission}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {requestingPermission && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("Izinkan Akses Kontak")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {importResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start gap-3 dark:bg-emerald-500/15">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-800">
                {t('Berhasil menyinkronkan {a} kontak baru, {b} kontak diperbarui.', { a: importResult.importedCount, b: importResult.updatedCount })}
              </p>
              <p className="text-emerald-600 mt-0.5">
                {t("Kontak sudah diberi ritme sapaan.")}
              </p>
            </div>
          </div>
        )}

        {/* Empty state for phonebook when device contacts list is empty */}
        {activeTab === 'phonebook' && !loading && !searchQuery && contacts.length === 0 && !showPermissionWarning && (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 dark:bg-[#1C1C1E] dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto dark:bg-white/10 dark:text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t("Buku Telepon Kosong")}</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto dark:text-slate-400">
                {t("Tidak ada kontak ditemukan di buku telepon HP Anda, atau izin membaca kontak belum aktif.")}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={loadContacts}
                className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                {t("Muat Ulang Buku Telepon")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('csv')}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer dark:bg-white/10 dark:text-slate-200"
              >
                {t("Unggah File CSV / VCF")}
              </button>
            </div>
          </div>
        )}

        {/* Contact List Section (available for Phonebook, or uploaded CSV/Google) */}
        {(contacts.length > 0 || loading || searchQuery) && (
          <>
            {/* Search Input */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Cari nama atau nomor telepon...")}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm dark:bg-[#1C1C1E] dark:border-white/10"
                />
              </div>

              {/* Selection Counter & Select All Toggle */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>
                    {t('Dipilih: {a} dari {b} kontak', { a: selectedPhones.size, b: contacts.length })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  {areAllFilteredSelected ? t('Batalkan Pilihan') : t('Pilih Semua')}
                </button>
              </div>
            </div>

            {/* Contact Checklist Cards */}
            <div className="space-y-2">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-300" />
                  <span className="text-xs">{t("Memuat kontak telepon...")}</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs dark:bg-[#1C1C1E] dark:border-white/10">
                  {t("Tidak ada kontak ditemukan.")}
                </div>
              ) : (
                <>
                  {displayedContacts.map((contact) => {
                    const isSelected = selectedPhones.has(contact.phoneNumber);
                    return (
                      <div
                        key={contact.phoneNumber}
                        onClick={() => handleToggleContact(contact.phoneNumber)}
                        className={`flex items-center justify-between p-3 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs dark:bg-[#1C1C1E] ${
                          isSelected
                            ? 'border-emerald-500/70 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-400/30'
                            : 'border-slate-200/70 hover:border-slate-300 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Squircle Avatar with Initials */}
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 dark:border-white/10 dark:text-slate-200">
                            {getInitials(contact.name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-slate-900 truncate dark:text-white">
                                {contact.name}
                              </h3>
                              {contact.associations && contact.associations.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold truncate max-w-[120px] dark:bg-white/10 dark:text-slate-300">
                                  {contact.associations[0]}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 dark:text-slate-400">
                              {contact.phoneNumber}
                            </p>
                          </div>
                        </div>

                        <div className="pl-2 shrink-0">
                          <label
                            htmlFor={`contact-${contact.phoneNumber}`}
                            className="cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              id={`contact-${contact.phoneNumber}`}
                              aria-label={`Pilih ${contact.name}`}
                              checked={isSelected}
                              onChange={() => handleToggleContact(contact.phoneNumber)}
                              className="sr-only"
                            />
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                            )}
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  {/* Load more button when contacts exceed visible limit */}
                  {filteredContacts.length > visibleLimit && (
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 50)}
                      className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs transition-colors cursor-pointer dark:text-slate-200 dark:bg-[#1C1C1E] dark:border-white/10"
                    >
                      Tampilkan 50 Kontak Lainnya ({filteredContacts.length - visibleLimit} tersisa)
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Intentional Care Cadence Selector */}
            <div className="bg-white border border-slate-200/70 rounded-3xl p-4 space-y-3 shadow-xs dark:bg-[#1C1C1E] dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("Tentukan Ritme Sapaan Awal")}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
                    {t("Frekuensi pengingat follow-up untuk kontak yang dipilih")}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  {t("Ritme sapa")}
                </span>
              </div>

              {/* Cadence Cards */}
              <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={t("Ritme Sapaan")}>
                {CADENCE_OPTIONS.map((opt) => {
                  const isChecked = selectedCadence === opt.days;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      data-testid={`cadence-${opt.days}`}
                      onClick={() => setSelectedCadence(opt.days)}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900 text-slate-900 shadow-xs dark:text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {isChecked && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          )}
                          <span>{t(opt.title)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight dark:text-slate-400">
                          {t(opt.subtitle)}
                        </p>
                      </div>

                      <div className="pl-3 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="shrink-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 space-y-2 dark:bg-[#1C1C1E]/95 dark:border-white/10">
        <button
          type="button"
          onClick={handleImport}
          disabled={selectedPhones.size === 0 || importing}
          className="w-full bg-slate-900 text-white rounded-full py-3.5 font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md text-xs sm:text-sm active:scale-[0.99] cursor-pointer"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{t("Menyinkronkan Kontak...")}</span>
            </>
          ) : (
            <span>{t('Sinkronkan {n} Kontak', { n: selectedPhones.size })}</span>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t("Kontak hanya disimpan di HP ini")}</span>
        </div>
      </footer>
    </div>
  );
};
