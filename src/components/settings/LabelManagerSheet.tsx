import React, { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { Sheet } from '../ui/Sheet';
import { addLabel, getLabels, hasAssociation, removeLabel, renameLabel, saveLabels } from '../../services/labelService';

export interface LabelManagerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  /** Rename (to = new name) or remove (to = null) the label on every contact. */
  onRemapLabel: (from: string, to: string | null) => void | Promise<void>;
}

/** Add, rename and remove relation labels. Edits happen inline (no browser prompt dialogs). */
export const LabelManagerSheet: React.FC<LabelManagerSheetProps> = ({ isOpen, onClose, contacts, onRemapLabel }) => {
  const [labels, setLabels] = useState<string[]>(() => getLabels());
  const [newLabel, setNewLabel] = useState('');
  const [editing, setEditing] = useState<{ from: string; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLabels(getLabels());
      setEditing(null);
      setConfirmDelete(null);
      setError('');
    }
  }, [isOpen]);

  const count = (label: string) => contacts.filter((c) => hasAssociation(c, label)).length;

  const handleAdd = () => {
    const next = addLabel(labels, newLabel);
    if (!next) return setError(t('Nama label kosong atau sudah ada.'));
    saveLabels(next);
    setLabels(next);
    setNewLabel('');
    setError('');
  };

  const handleRename = async () => {
    if (!editing) return;
    const to = editing.value.trim();
    if (to === editing.from) return setEditing(null);
    const next = renameLabel(labels, editing.from, to);
    if (!next) return setError(t('Label "{name}" kosong atau sudah ada.', { name: to }));
    saveLabels(next);
    setLabels(next);
    setEditing(null);
    setError('');
    await onRemapLabel(editing.from, to);
  };

  const handleRemove = async (label: string) => {
    const next = removeLabel(labels, label);
    saveLabels(next);
    setLabels(next);
    setConfirmDelete(null);
    await onRemapLabel(label, null);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} labelledBy="label-manager-title">
      <div className="px-4 pb-6 pt-1 overflow-y-auto">
        <h2 id="label-manager-title" className="text-center text-[17px] font-bold mb-4">
          {t("Label")}
        </h2>

        <div className="rounded-[20px] bg-white dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/[0.07] overflow-hidden">
          {labels.map((label) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2.5 min-h-[52px]">
              {editing?.from === label ? (
                <>
                  <input
                    autoFocus
                    value={editing.value}
                    aria-label={t('Nama baru untuk label {name}', { name: label })}
                    onChange={(e) => setEditing({ from: label, value: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[15px] bg-slate-100 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" aria-label={t("Simpan nama label")} onClick={handleRename} className="press w-8 h-8 rounded-full flex items-center justify-center text-blue-600 dark:text-cyan-400">
                    <Check className="w-4 h-4" />
                  </button>
                  <button type="button" aria-label={t("Batal ubah label")} onClick={() => setEditing(null)} className="press w-8 h-8 rounded-full flex items-center justify-center text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : confirmDelete === label ? (
                <>
                  <p className="flex-1 text-[13px] text-slate-600 dark:text-slate-300">
                    {t("Hapus")} <b>{label}</b>{count(label) ? ` dari ${count(label)} kontak` : ''}?
                  </p>
                  <button type="button" onClick={() => setConfirmDelete(null)} className="press px-3 py-1.5 rounded-full text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                    {t("Batal")}
                  </button>
                  <button type="button" onClick={() => handleRemove(label)} className="press px-3 py-1.5 rounded-full text-[13px] font-semibold text-white bg-rose-500">
                    {t("Hapus")}
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[15px] font-medium">{label}</span>
                  <span className="text-xs text-slate-400 mr-1">{t('{n} kontak', { n: count(label) })}</span>
                  <button type="button" aria-label={t('Ubah nama label {name}', { name: label })} onClick={() => setEditing({ from: label, value: label })} className="press w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" aria-label={t('Hapus label {name}', { name: label })} onClick={() => setConfirmDelete(label)} className="press w-8 h-8 rounded-full flex items-center justify-center text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            aria-label={t("Nama label baru")}
            placeholder={t("Label baru, misal: Tetangga")}
            className="flex-1 min-w-0 px-4 py-2.5 rounded-full text-sm bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={handleAdd} className="press inline-flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 dark:bg-blue-500">
            <Plus className="w-4 h-4" />
            {t("Tambah")}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-500 text-center">{error}</p>}
      </div>
    </Sheet>
  );
};
