import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { Sheet, useSticky } from '../ui/Sheet';
import { WhatsAppIcon, WhatsAppBusinessIcon } from './DualWhatsAppButton';
import { openWhatsApp } from '../../utils/whatsapp';
import { tapHaptic } from '../../services/haptics';

export interface SapaActionSheetProps {
  contact: Contact | null;
  onClose: () => void;
  onWriteWithAi: (contact: Contact) => void;
}

/** "Sapa" choices: write with AI (uses the follow-up topic) or open WhatsApp / Business directly. */
export const SapaActionSheet: React.FC<SapaActionSheetProps> = ({ contact: liveContact, onClose, onWriteWithAi }) => {
  const contact = useSticky(liveContact);
  const open = (kind: 'regular' | 'business') => {
    if (!contact) return;
    tapHaptic();
    openWhatsApp(contact.phoneNumber, undefined, kind);
    onClose();
  };

  return (
    <Sheet isOpen={Boolean(liveContact)} onClose={onClose} labelledBy="sapa-sheet-title" zIndex="z-[55]">
      {contact && (
        <div className="px-4 pb-6 pt-1">
          <h2 id="sapa-sheet-title" className="text-center text-[17px] font-bold mb-4">
            Sapa {contact.name}
          </h2>

          <button
            type="button"
            onClick={() => {
              tapHaptic();
              onWriteWithAi(contact);
            }}
            className="press w-full flex items-center gap-3 p-3.5 rounded-2xl text-left bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/40"
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-cyan-500 shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold">Tulis dengan AI</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                {contact.possibleFollowUpTopic ? `Pakai topik: ${contact.possibleFollowUpTopic}` : 'Sapa menyusun pesan pembuka untuk Anda'}
              </span>
            </span>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-cyan-400">SARAN</span>
          </button>

          <button
            type="button"
            onClick={() => open('regular')}
            className="press mt-2.5 w-full flex items-center gap-3 p-3.5 rounded-2xl text-left bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10"
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#25D366] shrink-0">
              <WhatsAppIcon className="w-5 h-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">WhatsApp</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Buka chat langsung</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => open('business')}
            className="press mt-2.5 w-full flex items-center gap-3 p-3.5 rounded-2xl text-left bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10"
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#128C7E] shrink-0">
              <WhatsAppBusinessIcon className="w-5 h-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">WhatsApp Business</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Buka chat langsung</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="press mt-3 w-full py-3 rounded-2xl text-[15px] font-semibold text-blue-600 dark:text-cyan-400"
          >
            Batal
          </button>
        </div>
      )}
    </Sheet>
  );
};
