import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import type { RawPhoneContact, ImportResult } from '../../types/crm';
import {
  getDeviceContactsWithStatus,
  ContactsPermissionStatus,
} from '../../services/nativeContactsAdapter';
import { importContacts } from '../../services/contactService';

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
  const [selectedCadence, setSelectedCadence] = useState<number>(15);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
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
      return;
    }

    loadContacts();
  }, [isOpen, loadContacts]);

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

      const result = await importContacts(toImport);
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

  const showPermissionWarning = permissionStatus !== 'granted';

  return (
    <div
      role="region"
      aria-label="Sinkronisasi & Impor Kontak"
      className="w-full max-w-2xl mx-auto min-h-screen bg-[#f8f9ff] text-slate-900 flex flex-col font-sans pb-32"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#f8f9ff]/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kinship
              </span>
              <span className="text-slate-300 font-bold">·</span>
              <h1 className="text-base font-bold text-slate-900">Impor Kontak</h1>
            </div>
            <p className="text-xs text-slate-500">Sinkronisasi buku telepon perangkat</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="p-4 space-y-4 flex-1">
        {/* Banner / Helper Info */}
        <div className="relative overflow-hidden bg-white border border-slate-200/70 rounded-3xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-800">Sinkronisasi & Impor Kontak</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Pilih kontak dari buku telepon ponsel atau akun Google untuk dipantau ritme
                follow-up-nya secara berkala.
              </p>
            </div>
          </div>
        </div>

        {/* Sync Sources Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveTab('phonebook')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'phonebook'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Buku Telepon (HP) {contacts.length > 0 ? `(${contacts.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'google'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Google Kontak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'csv'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File CSV / VCF</span>
          </button>
        </div>

        {/* Tab Placeholder States */}
        {activeTab === 'google' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-2">
            <RefreshCw className="w-8 h-8 text-blue-500 mx-auto animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800">Google Kontak segera hadir</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Fitur integrasi Google People API sedang disiapkan. Silakan gunakan tab Buku Telepon
              (HP) untuk mengimpor kontak dari perangkat Anda saat ini.
            </p>
          </div>
        )}

        {activeTab === 'csv' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-2">
            <FileText className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">File CSV / VCF segera hadir</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Unggah file vCard (.vcf) atau spreadsheet (.csv) akan didukung pada pembaruan
              berikutnya.
            </p>
          </div>
        )}

        {/* Phonebook Tab Content */}
        {activeTab === 'phonebook' && (
          <>
            {/* Native Permission Card */}
            {showPermissionWarning && (
              <div className="border border-amber-300 bg-amber-50/90 rounded-3xl p-4 space-y-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-amber-900">
                      Akses Kontak Belum Diizinkan
                    </h3>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Diperlukan izin sistem Android agar GrowSphere dapat membaca kontak dari buku
                      telepon Anda secara offline & aman.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={requestingPermission}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {requestingPermission && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Izinkan Akses Kontak</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {importResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-800">
                    Berhasil menyinkronkan {importResult.importedCount} kontak baru,{' '}
                    {importResult.updatedCount} kontak diperbarui.
                  </p>
                  <p className="text-emerald-600 mt-0.5">
                    Kontak telah disetel dengan ritme sapaan Intentional Care.
                  </p>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, kantor, nomor..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                />
              </div>

              {/* Selection Counter & Select All Toggle */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>
                    Dipilih: {selectedPhones.size} dari {contacts.length} kontak
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  {areAllFilteredSelected ? 'Batalkan Pilihan' : 'Pilih Semua'}
                </button>
              </div>
            </div>

            {/* Contact Checklist */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                  <span className="text-xs">Memuat kontak telepon...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs">
                  Tidak ada kontak ditemukan.
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedPhones.has(contact.phoneNumber);
                  return (
                    <div
                      key={contact.phoneNumber}
                      onClick={() => handleToggleContact(contact.phoneNumber)}
                      className={`flex items-center justify-between p-3 rounded-2xl bg-white border transition-all cursor-pointer shadow-sm ${
                        isSelected
                          ? 'border-emerald-500/70 bg-emerald-50/20 shadow-md ring-1 ring-emerald-400/30'
                          : 'border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Squircle Avatar with Initials */}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {getInitials(contact.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-slate-900 truncate">
                              {contact.name}
                            </h3>
                            {contact.associations && contact.associations.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                {contact.associations[0]}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
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
                })
              )}
            </div>

            {/* Intentional Care Cadence Selector */}
            <div className="bg-white border border-slate-200/70 rounded-3xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Tentukan Ritme Sapaan Awal
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Frekuensi pengingat follow-up untuk kontak yang dipilih
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Intentional Care
                </span>
              </div>

              {/* Cadence Cards */}
              <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Ritme Sapaan">
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
                      className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900 text-slate-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {isChecked && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          )}
                          <span>{opt.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {opt.subtitle}
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

            {/* Primary Action Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={selectedPhones.size === 0 || importing}
                className="w-full bg-slate-900 text-white rounded-full py-3.5 font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md text-xs sm:text-sm active:scale-[0.99]"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Menyinkronkan Kontak...</span>
                  </>
                ) : (
                  <span>Sinkronkan {selectedPhones.size} Kontak</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp direct launch enabled on due dates</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
