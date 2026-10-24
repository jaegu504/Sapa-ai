import React, { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { Sheet, useSticky } from '../ui/Sheet';
import { addLabel, getLabels, hasAssociation, saveLabels, toggleAssociation } from '../../services/labelService';
import { tapHaptic } from '../../services/haptics';

export interface LabelPickerSheetProps {
  contact: Contact | null;
  onClose: () => void;
  onChange: (contactId: string, updates: Pick<Contact, 'associations' | 'isProfessional'>) => void | Promise<void>;
}

/** Pick one or more labels for a contact, or create a new one on the spot. */
export const LabelPickerSheet: React.FC<LabelPickerSheetProps> = ({ contact: liveContact, onClose, onChange }) => {
  const contact = useSticky(liveContact);
  const [labels, setLabels] = useState<string[]>(() => getLabels());
  const [draft, setDraft] = useState<{ associations: string[]; isProfessional: boolean } | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact) {
      setLabels(getLabels());
      setDraft({ associations: contact.associations || [], isProfessional: contact.isProfessional });
      setNewLabel('');
      setAdding(false);
      setError('');
    }
  }, [contact?.id]);

  const toggle = (label: string) => {
    if (!contact || !draft) return;
    tapHaptic();
    const next = toggleAssociation(draft, label);
    setDraft(next);
    onChange(contact.id, next);
  };

  const create = () => {
    const next = addLabel(labels, newLabel);
    if (!next) {
      setError('Nama label kosong atau sudah ada.');
      return;
    }
    saveLabels(next);
    setLabels(next);
    const name = newLabel.trim();
    setNewLabel('');
    setAdding(false);
    setError('');
    toggle(name);
  };

  return (
    <Sheet isOpen={Boolean(liveContact)} onClose={onClose} labelledBy="label-sheet-title" zIndex="z-[55]">
      {contact && draft && (
        <div className="px-4 pb-6 pt-1">
          <h2 id="label-sheet-title" className="text-center text-[17px] font-bold">
            Label untuk {contact.name}
          </h2>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Bisa pilih lebih dari satu</p>

          <div className="flex flex-wrap justify-center gap-2">
            {[...new Set([...labels, ...draft.associations])].map((label) => {
              const on = hasAssociation(draft, label);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(label)}
                  className={`press inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border ${
                    on
                      ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                      : 'bg-white dark:bg-white/[0.06] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5" />}
                  {label}
                </button>
              );
            })}
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="press inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border border-dashed border-blue-400/60 text-blue-600 dark:text-cyan-400"
              >
                <Plus className="w-3.5 h-3.5" />
                Label baru
              </button>
            )}
          </div>

          {adding && (
            <div className="mt-4 flex gap-2">
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                aria-label="Nama label baru"
                placeholder="Misal: Tetangga"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-full text-sm bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={create} className="press px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 dark:bg-blue-500">
                Tambah
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-rose-500 text-center">{error}</p>}

          <button
            type="button"
            onClick={onClose}
            className="press mt-5 w-full py-3 rounded-2xl text-[15px] font-semibold bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10"
          >
            Selesai
          </button>
        </div>
      )}
    </Sheet>
  );
};
