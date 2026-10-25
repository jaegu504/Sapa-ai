import React, { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { AlertCircle, Check, Compass, Loader2, MessageSquare, Phone, Plus, Smartphone, Sparkles, Trash2, User } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { getDefaultCycleDays } from '../../services/settingsService';
import { addLabel, getLabels, hasAssociation, saveLabels, toggleAssociation } from '../../services/labelService';
import { getInitials } from '../../utils/display';
import { Sheet } from '../ui/Sheet';

export interface EditContactModalProps {
  contact?: Contact | null; // null/undefined for adding new, Contact object for editing
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Partial<Contact>, options?: { saveToPhone: boolean }) => void | Promise<void>;
  onDelete?: (contactId: string) => void;
  /** Offer "Simpan juga ke kontak HP" (only on the phone, for new contacts). */
  canSaveToPhone?: boolean;
}

const CYCLE_CHIPS = [7, 15, 30, 60];
const SAVE_TO_PHONE_KEY = 'sapa_save_to_phone';

function readSaveToPhone(): boolean {
  try {
    return localStorage.getItem(SAVE_TO_PHONE_KEY) !== 'false';
  } catch {
    return true;
  }
}

const field =
  'w-full bg-transparent text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none';
const noteBox =
  'w-full text-[14.5px] leading-relaxed bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none';
const group = 'rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]';
const card = 'rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10';
const sectionTitle = 'px-3 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

const IconBox: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${color}`}>{children}</span>
);

export const EditContactModal: React.FC<EditContactModalProps> = ({ contact, isOpen, onClose, onSave, onDelete, canSaveToPhone }) => {
  const isEditing = Boolean(contact);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [labels, setLabels] = useState<{ associations: string[]; isProfessional: boolean }>({ associations: [], isProfessional: false });
  const [labelList, setLabelList] = useState<string[]>(() => getLabels());
  const [newLabel, setNewLabel] = useState<string | null>(null);
  const [followUpCycleDays, setFollowUpCycleDays] = useState<number | ''>(() => getDefaultCycleDays());
  const [metContext, setMetContext] = useState('');
  const [lastUpdateNotes, setLastUpdateNotes] = useState('');
  const [possibleFollowUpTopic, setPossibleFollowUpTopic] = useState('');
  const [saveToPhone, setSaveToPhone] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLabelList(getLabels());
    setName(contact?.name || '');
    setPhoneNumber(contact?.phoneNumber || '');
    setLabels({
      associations: contact ? [...(contact.associations || [])] : ['Teman'],
      isProfessional: contact?.isProfessional ?? false,
    });
    setFollowUpCycleDays(contact ? contact.followUpCycleDays ?? 15 : getDefaultCycleDays());
    setMetContext(contact?.metContext || '');
    setLastUpdateNotes(contact?.lastUpdateNotes || '');
    setPossibleFollowUpTopic(contact?.possibleFollowUpTopic || '');
    setSaveToPhone(readSaveToPhone());
    setNewLabel(null);
    setErrors({});
    setConfirmDelete(false);
    setSaving(false);
  }, [isOpen, contact]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const newErrors: { name?: string; phoneNumber?: string } = {};
    if (!name.trim()) newErrors.name = t('Nama wajib diisi');
    if (!phoneNumber.trim()) newErrors.phoneNumber = t('Nomor telepon wajib diisi');
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setSaving(true);
    try {
      const payload: Partial<Contact> = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        associations: labels.associations,
        isProfessional: labels.isProfessional,
        followUpCycleDays: Number(followUpCycleDays) || getDefaultCycleDays(),
        metContext: metContext.trim(),
        lastUpdateNotes: lastUpdateNotes.trim(),
        possibleFollowUpTopic: possibleFollowUpTopic.trim(),
      };
      const toPhone = Boolean(canSaveToPhone && !isEditing && saveToPhone);
      if (canSaveToPhone && !isEditing) {
        try {
          localStorage.setItem(SAVE_TO_PHONE_KEY, String(saveToPhone));
        } catch {
          // Ignore localStorage failures
        }
      }
      await onSave(payload, { saveToPhone: toPhone });
      onClose();
    } catch (err) {
      console.error('Failed to save contact', err);
    } finally {
      setSaving(false);
    }
  };

  const createLabel = () => {
    const next = addLabel(labelList, newLabel || '');
    if (!next) return;
    saveLabels(next);
    setLabelList(next);
    setLabels((prev) => toggleAssociation(prev, (newLabel || '').trim()));
    setNewLabel(null);
  };

  const shownLabels = [...new Set([...labelList, ...labels.associations])];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} labelledBy="edit-contact-modal-title" size="full" zIndex="z-[56]">
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-4 pb-3">
          <button type="button" onClick={onClose} className="press text-[16px] text-blue-600 dark:text-cyan-400">
            {t("Batal")}
          </button>
          <h2 id="edit-contact-modal-title" className="text-[16px] font-bold">
            {isEditing ? t('Edit Kontak') : t('Tambah Kontak Baru')}
          </h2>
          <button type="submit" disabled={saving} className="press inline-flex items-center gap-1 text-[16px] font-bold text-blue-600 dark:text-cyan-400 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-5">
          <div className="flex justify-center pt-1">
            <span className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-500 shadow-[0_12px_26px_-12px_rgba(47,84,235,0.9)]">
              {name.trim() ? getInitials(name) : <User className="w-8 h-8" />}
            </span>
          </div>

          <div>
            <div className={group}>
              <label className="flex items-center gap-3 px-3.5 py-3">
                <IconBox color="bg-blue-500">
                  <User className="w-4 h-4" />
                </IconBox>
                <input
                  id="contact-name"
                  aria-label={t("Nama Lengkap")}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder={t("Nama")}
                  className={field}
                />
              </label>
              <label className="flex items-center gap-3 px-3.5 py-3">
                <IconBox color="bg-emerald-500">
                  <Phone className="w-4 h-4" />
                </IconBox>
                <input
                  id="contact-phone"
                  type="tel"
                  aria-label={t("Nomor WhatsApp / Telepon")}
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors((p) => ({ ...p, phoneNumber: undefined }));
                  }}
                  placeholder={t("Nomor HP, misal +90 532 000 11 22")}
                  className={field}
                />
              </label>
            </div>
            {(errors.name || errors.phoneNumber) && (
              <p className="mt-1.5 px-3 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name || errors.phoneNumber}
              </p>
            )}
            {canSaveToPhone && !isEditing && (
              <label className="mt-2 flex items-center gap-3 px-3.5 py-3 rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10">
                <IconBox color="bg-slate-500">
                  <Smartphone className="w-4 h-4" />
                </IconBox>
                <span className="flex-1 text-[15px]">{t("Simpan juga ke kontak HP")}</span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={t("Simpan juga ke kontak HP")}
                  checked={saveToPhone}
                  onChange={(e) => setSaveToPhone(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500"
                />
              </label>
            )}
          </div>

          <div>
            <p className={sectionTitle}>{t("Label")}</p>
            <div className={`${card} p-3`}>
              <div className="flex flex-wrap gap-1.5">
                {shownLabels.map((label) => {
                  const on = hasAssociation(labels, label);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setLabels((prev) => toggleAssociation(prev, label))}
                      className={`press inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-semibold ${
                        on ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {on && <Check className="w-3 h-3" />}
                      {label}
                    </button>
                  );
                })}
                {newLabel === null ? (
                  <button
                    type="button"
                    onClick={() => setNewLabel('')}
                    className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-semibold border border-dashed border-cyan-500/60 text-cyan-700 dark:text-cyan-300"
                  >
                    <Plus className="w-3 h-3" />
                    {t("Baru")}
                  </button>
                ) : (
                  <span className="flex gap-1.5 w-full mt-1">
                    <input
                      autoFocus
                      value={newLabel}
                      aria-label={t("Nama label baru")}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          createLabel();
                        }
                      }}
                      placeholder={t("Misal: Tetangga")}
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-full text-sm bg-slate-100 dark:bg-white/10 focus:outline-none"
                    />
                    <button type="button" onClick={createLabel} className="press px-3 py-1.5 rounded-full text-sm font-semibold text-white bg-blue-600">
                      {t("Tambah")}
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className={sectionTitle}>{t("Ritme sapa")}</p>
            <div className={`${card} p-3 flex flex-wrap items-center gap-1.5`}>
              {CYCLE_CHIPS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={followUpCycleDays === d}
                  onClick={() => setFollowUpCycleDays(d)}
                  className={`press px-3 py-1.5 rounded-full text-[13px] font-semibold ${
                    followUpCycleDays === d ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/40' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t('{n} hari', { n: d })}
                </button>
              ))}
              <span className="inline-flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400">
                {t("atau")}
                <input
                  id="contact-cycle"
                  type="number"
                  min="1"
                  aria-label={t("Siklus Follow Up (Hari)")}
                  value={followUpCycleDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFollowUpCycleDays(isNaN(val) ? '' : Math.min(365, Math.max(1, val)));
                  }}
                  className="w-14 px-2 py-1 rounded-lg text-center text-[13px] bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white focus:outline-none"
                />
                {t("hari")}
              </span>
            </div>
          </div>

          <div>
            <p className={sectionTitle}>{t("Catatan (boleh diisi nanti)")}</p>
            <div className={group}>
              <label className="block px-3.5 py-3">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  {t("Pertama Ketemu & Konteks")}
                </span>
                <textarea
                  id="contact-met-context"
                  rows={2}
                  aria-label={t("Pertama Ketemu & Konteks")}
                  value={metContext}
                  onChange={(e) => setMetContext(e.target.value)}
                  placeholder={t("Di mana dan bagaimana kalian kenal")}
                  className={noteBox}
                />
              </label>
              <label className="block px-3.5 py-3">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  {t("Pembaruan Kabar Terakhir")}
                </span>
                <textarea
                  id="contact-last-notes"
                  rows={2}
                  aria-label={t("Pembaruan Kabar Terakhir")}
                  value={lastUpdateNotes}
                  onChange={(e) => setLastUpdateNotes(e.target.value)}
                  placeholder={t("Kabar keluarga, pekerjaan, atau kesehatan")}
                  className={noteBox}
                />
              </label>
              <label className="block px-3.5 py-3 bg-emerald-500/[0.06]">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("Bahan Obrolan Follow Up")}
                </span>
                <textarea
                  id="contact-next-topic"
                  rows={2}
                  aria-label={t("Bahan Obrolan Follow Up")}
                  value={possibleFollowUpTopic}
                  onChange={(e) => setPossibleFollowUpTopic(e.target.value)}
                  placeholder={t("Yang ingin ditanyakan saat menyapa berikutnya")}
                  className={noteBox}
                />
              </label>
            </div>
          </div>

          {isEditing && contact?.id && (
            <div className={`${card} px-3.5 py-3`}>
              {confirmDelete ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-rose-600 dark:text-rose-400 font-medium">{t("Hapus kontak ini dan riwayatnya?")}</span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} className="press px-3 py-1.5 rounded-full text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                      {t("Batal")}
                    </button>
                    <button type="button" onClick={() => onDelete?.(contact.id)} className="press px-3 py-1.5 rounded-full text-[13px] font-semibold text-white bg-rose-500">
                      {t("Ya, Hapus")}
                    </button>
                  </span>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="press w-full flex items-center justify-center gap-2 text-[15px] font-semibold text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  {t("Hapus Kontak")}
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </Sheet>
  );
};
