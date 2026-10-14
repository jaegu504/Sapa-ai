import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, Square, Users, CheckCircle, Loader2 } from 'lucide-react';
import type { RawPhoneContact, ImportResult } from '../../types/crm';
import { getDeviceContacts } from '../../services/nativeContactsAdapter';
import { importContacts } from '../../services/contactService';

export interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: { importedCount: number; updatedCount: number; totalProcessed?: number }) => void;
}

const AVAILABLE_TAGS = ['Ihvan', 'Hoca', 'Keluarga', 'Zahiri', 'Teman', 'Profesional'];

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [contacts, setContacts] = useState<RawPhoneContact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>(['Teman']);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedPhones(new Set());
      setImportResult(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getDeviceContacts()
      .then((data) => {
        if (isMounted) {
          setContacts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setContacts([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phoneNumber.toLowerCase().includes(q)
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

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImport = async () => {
    if (selectedPhones.size === 0 || importing) return;

    setImporting(true);
    try {
      const selectedContacts = contacts.filter((c) => selectedPhones.has(c.phoneNumber));
      const isProfessional = selectedTags.includes('Profesional');
      const associations =
        selectedTags.filter((t) => t !== 'Profesional').length > 0
          ? selectedTags.filter((t) => t !== 'Profesional')
          : ['Teman'];

      const toImport: RawPhoneContact[] = selectedContacts.map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        associations,
        isProfessional,
      }));

      const result = await importContacts(toImport);
      setImportResult(result);
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err) {
      console.error('Failed to import contacts', err);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2F54EB] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-lg font-bold text-slate-800">
                Impor Kontak Telepon
              </h2>
              <p className="text-xs text-slate-500">
                Pilih kontak dari buku telepon untuk ditambahkan ke CRM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {importResult && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-800">
                Berhasil mengimpor {importResult.importedCount} kontak baru,{' '}
                {importResult.updatedCount} kontak diperbarui.
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Semua data kontak telah disinkronkan ke database lokal CRM.
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Association Tags Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Asosiasi Bawaan untuk Kontak yang Dipilih:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#2F54EB] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar & Selection Toggle */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau nomor telepon..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                {filteredContacts.length} kontak ditemukan • {selectedPhones.size} dipilih
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[#2F54EB] font-semibold hover:underline focus:outline-none"
              >
                {areAllFilteredSelected ? 'Batalkan Pilihan' : 'Pilih Semua'}
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2F54EB]" />
                <span className="text-sm">Memuat kontak telepon...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Tidak ada kontak ditemukan.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedPhones.has(contact.phoneNumber);
                return (
                  <div
                    key={contact.phoneNumber}
                    onClick={() => handleToggleContact(contact.phoneNumber)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
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
                        <CheckSquare className="w-5 h-5 text-[#2F54EB]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </label>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{contact.phoneNumber}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            {importResult ? 'Selesai' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={selectedPhones.size === 0 || importing}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#2F54EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            {importing && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Impor {selectedPhones.size} Kontak</span>
          </button>
        </div>
      </div>
    </div>
  );
};
