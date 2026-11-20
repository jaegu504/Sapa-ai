import React, { useEffect, useMemo, useState } from 'react';
import { getUiLanguage, t } from '../../i18n';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { Sheet, useSticky } from '../ui/Sheet';
import { applyContactsFilter } from '../../utils/contactFilters';
import { WhatsAppIcon } from './DualWhatsAppButton';
import { openWhatsApp } from '../../utils/whatsapp';
import { tapHaptic } from '../../services/haptics';
import { generateGroupGreeting, groupGreetingFallback, NAME_PLACEHOLDER, type SapaLanguage } from '../../services/aiDraftService';

export interface GroupSapaSheetProps {
  /** Label being greeted, or null when the sheet is closed. */
  label: string | null;
  /** All contacts; the sheet keeps the ones with the label. */
  contacts: Contact[];
  onClose: () => void;
  /** Called after WhatsApp opens for a contact: log the greeting. */
  onSent: (contact: Contact) => void;
}

/** "Sapa semua": one message for every contact with a label, sent one by one in WhatsApp. */
export const GroupSapaSheet: React.FC<GroupSapaSheetProps> = ({ label: liveLabel, contacts: allContacts, onClose, onSent }) => {
  const label = useSticky(liveLabel);
  const contacts = useMemo(
    () => (label ? applyContactsFilter(allContacts, { kind: 'label', label }).sort((a, b) => a.name.localeCompare(b.name, 'id')) : []),
    [allContacts, label]
  );
  const [occasion, setOccasion] = useState('');
  const [language, setLanguage] = useState<SapaLanguage>('id');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!liveLabel) return;
    const lang: SapaLanguage = getUiLanguage() === 'tr' ? 'tr' : 'id';
    setLanguage(lang);
    setOccasion('');
    setText(groupGreetingFallback('', lang));
    setSent(new Set());
  }, [liveLabel]);

  const write = async () => {
    tapHaptic();
    setLoading(true);
    try {
      setText((await generateGroupGreeting(occasion, language)).text);
    } finally {
      setLoading(false);
    }
  };

  const send = (contact: Contact) => {
    tapHaptic();
    openWhatsApp(contact.phoneNumber, text.split(NAME_PLACEHOLDER).join(contact.name));
    setSent((prev) => new Set(prev).add(contact.id));
    onSent(contact);
  };

  const field = 'w-full px-3.5 py-2.5 rounded-[14px] bg-white dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 text-[15px] text-slate-900 dark:text-white focus:outline-none';

  return (
    <Sheet isOpen={Boolean(liveLabel)} onClose={onClose} size="full" ariaLabel={t('Sapa semua {label}', { label: label ?? '' })}>
      <div className="px-4 pt-1 pb-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold">{t('Sapa semua {label}', { label: label ?? '' })}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('{n} orang. Satu pesan, dikirim satu per satu.', { n: contacts.length })}</p>
        </div>

        <div className="space-y-2">
          <input
            aria-label={t('Acara atau keperluan')}
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder={t('Contoh: Selamat Idul Fitri')}
            className={field}
          />
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-[13px] font-bold">
              {(['id', 'tr'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={language === l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-1 rounded-full ${language === l ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={write}
              disabled={loading}
              className="press flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[14px] font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t('Tulis dengan AI')}
            </button>
          </div>
          <textarea aria-label={t('Pesan')} rows={5} value={text} onChange={(e) => setText(e.target.value)} className={field} />
          <p className="px-1 text-xs text-slate-500 dark:text-slate-400">{t('{nama} diganti nama tiap orang.', { nama: NAME_PLACEHOLDER })}</p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]">
          {contacts.map((c) => {
            const done = sent.has(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="flex-1 min-w-0 text-[15px] font-semibold truncate">{c.name}</span>
                <button
                  type="button"
                  aria-label={t('Kirim ke {name}', { name: c.name })}
                  onClick={() => send(c)}
                  disabled={!text.trim()}
                  className={`press flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold ${
                    done ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300' : 'bg-[#25D366] text-white'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : <WhatsAppIcon className="w-3.5 h-3.5" />}
                  {done ? t('Terkirim') : t('Kirim')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
};
