import { getLabels } from '../../services/labelService';
import React, { useState, useEffect } from 'react';
import { X, UserPlus, Edit3, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { getDefaultCycleDays } from '../../services/settingsService';

export interface EditContactModalProps {
  contact?: Contact | null; // null/undefined for adding new, Contact object for editing
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Partial<Contact>) => void | Promise<void>;
  onDelete?: (contactId: string) => void;
}


export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(contact);

  const [name, setName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [associations, setAssociations] = useState<string[]>(['Teman']);
  const [isProfessional, setIsProfessional] = useState<boolean>(false);
  const [followUpCycleDays, setFollowUpCycleDays] = useState<number | ''>(() => getDefaultCycleDays());
  const [lastContactedDate, setLastContactedDate] = useState<string>('');
  const [nextSpecificFollowUp, setNextSpecificFollowUp] = useState<string>('');
  const [metContext, setMetContext] = useState<string>('');
  const [lastUpdateNotes, setLastUpdateNotes] = useState<string>('');
  const [possibleFollowUpTopic, setPossibleFollowUpTopic] = useState<string>('');

  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string }>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setName(contact.name || '');
        setPhoneNumber(contact.phoneNumber || '');
        setAssociations(
          contact.associations && contact.associations.length > 0
            ? [...contact.associations]
            : ['Teman']
        );
        setIsProfessional(contact.isProfessional ?? false);
        setFollowUpCycleDays(contact.followUpCycleDays ?? 15);
        setLastContactedDate(contact.lastContactedDate ? contact.lastContactedDate.split('T')[0] : '');
        setNextSpecificFollowUp(
          contact.nextSpecificFollowUp ? contact.nextSpecificFollowUp.split('T')[0] : ''
        );
        setMetContext(contact.metContext || '');
        setLastUpdateNotes(contact.lastUpdateNotes || '');
        setPossibleFollowUpTopic(contact.possibleFollowUpTopic || '');
      } else {
        setName('');
        setPhoneNumber('');
        setAssociations(['Teman']);
        setIsProfessional(false);
        setFollowUpCycleDays(getDefaultCycleDays());
        setLastContactedDate('');
        setNextSpecificFollowUp('');
        setMetContext('');
        setLastUpdateNotes('');
        setPossibleFollowUpTopic('');
      }
      setErrors({});
      setConfirmDelete(false);
      setSaving(false);
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const handleToggleAssociation = (assoc: string) => {
    setAssociations((prev) =>
      prev.includes(assoc) ? prev.filter((a) => a !== assoc) : [...prev, assoc]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; phoneNumber?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor telepon wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Contact> = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        associations: associations.length > 0 ? associations : ['Teman'],
        isProfessional,
        followUpCycleDays: Number(followUpCycleDays) || getDefaultCycleDays(),
        lastContactedDate: lastContactedDate.trim() ? lastContactedDate : null,
        nextSpecificFollowUp: nextSpecificFollowUp.trim() ? nextSpecificFollowUp : null,
        metContext: metContext.trim(),
        lastUpdateNotes: lastUpdateNotes.trim(),
        possibleFollowUpTopic: possibleFollowUpTopic.trim(),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save contact', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!contact?.id) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(contact.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-contact-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 animate-fade-in"
    >
      <div className="animate-rise bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200 dark:border-white/12 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white transition-colors">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-[#2F54EB] dark:text-cyan-400 flex items-center justify-center shrink-0">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="edit-contact-modal-title" className="text-lg font-bold text-slate-800 dark:text-white">
                {isEditing ? 'Edit Kontak' : 'Tambah Kontak Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Perbarui informasi dan siklus silaturahmi kontak'
                  : 'Tambahkan data relasi baru ke dalam CRM'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap *
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Contoh: Ustadz Danu, Bunda Sarah..."
              className={`w-full px-3.5 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                errors.name
                  ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-white/10 focus:border-[#2F54EB] dark:focus:border-cyan-400'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor WhatsApp / Telepon *
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
              }}
              placeholder="Contoh: 081234567890 atau +6281234567890"
              className={`w-full px-3.5 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                errors.phoneNumber
                  ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-white/10 focus:border-[#2F54EB] dark:focus:border-cyan-400'
              }`}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.phoneNumber}</span>
              </p>
            )}
          </div>

          {/* Association Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Asosiasi Relasi
            </label>
            <div className="flex flex-wrap gap-1.5">
              {getLabels().filter((l) => l !== 'Profesional').map((assoc) => {
                const active = associations.includes(assoc);
                return (
                  <button
                    key={assoc}
                    type="button"
                    onClick={() => handleToggleAssociation(assoc)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#2F54EB] dark:bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'
                    }`}
                  >
                    {assoc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Professional Switch */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="contact-is-professional"
              type="checkbox"
              checked={isProfessional}
              onChange={(e) => setIsProfessional(e.target.checked)}
              className="w-4 h-4 text-[#2F54EB] rounded border-slate-300 dark:border-slate-600 focus:ring-[#2F54EB]"
            />
            <label
              htmlFor="contact-is-professional"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer"
            >
              Kontak Profesional
            </label>
          </div>

          {/* Follow Up Cycle & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label
                htmlFor="contact-cycle"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Siklus Follow Up (Hari)
              </label>
              <input
                id="contact-cycle"
                type="number"
                min="1"
                value={followUpCycleDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFollowUpCycleDays(isNaN(val) ? '' : Math.max(1, val));
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] dark:focus:border-cyan-400 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="contact-last-contacted"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Terakhir Dihubungi
              </label>
              <input
                id="contact-last-contacted"
                type="date"
                value={lastContactedDate}
                onChange={(e) => setLastContactedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] dark:focus:border-cyan-400 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Next Specific Follow Up */}
          <div>
            <label
              htmlFor="contact-next-followup"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Jadwal Next Follow Up Khusus (Alarm Target)
            </label>
            <input
              id="contact-next-followup"
              type="date"
              value={nextSpecificFollowUp}
              onChange={(e) => setNextSpecificFollowUp(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] dark:focus:border-cyan-400 transition-all text-slate-900 dark:text-white"
            />
          </div>

          {/* Met Context */}
          <div>
            <label
              htmlFor="contact-met-context"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Ketemu di mana & bagaimana
            </label>
            <textarea
              id="contact-met-context"
              rows={2}
              value={metContext}
              onChange={(e) => setMetContext(e.target.value)}
              placeholder="Contoh: Dikenalkan oleh Ustadz Hasan di kajian bulanan..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] dark:focus:border-cyan-400 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Last Update Notes */}
          <div>
            <label
              htmlFor="contact-last-notes"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Pembaruan Terakhir
            </label>
            <textarea
              id="contact-last-notes"
              rows={2}
              value={lastUpdateNotes}
              onChange={(e) => setLastUpdateNotes(e.target.value)}
              placeholder="Kabar terakhir, update kondisi keluarga atau pekerjaan..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] dark:focus:border-cyan-400 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Possible Follow Up Topic */}
          <div>
            <label
              htmlFor="contact-next-topic"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Possible Follow Up Topic
            </label>
            <textarea
              id="contact-next-topic"
              rows={2}
              value={possibleFollowUpTopic}
              onChange={(e) => setPossibleFollowUpTopic(e.target.value)}
              placeholder="Ide obrolan / topik silaturahmi yang pas untuk follow-up..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F54EB]/20 focus:border-[#2F54EB] dark:focus:border-cyan-400 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Delete Action (if editing) */}
          {isEditing && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Yakin ingin menghapus?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kontak</span>
                </button>
              )}
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#2F54EB] dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
