import React from 'react';
import { MessageCircle, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { getInitials } from './ContactCard';

export interface NotionTableViewProps {
  contacts: Contact[];
  onSelectContact?: (contact: Contact) => void;
  onQuickWhatsApp?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  now?: Date;
}

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-purple-500 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
  'from-cyan-400 to-blue-600',
  'from-violet-500 to-purple-600',
];

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function getAssociationBadgeStyle(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower === 'hoca') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (lower === 'ihvan') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (lower === 'keluarga') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lower === 'zahiri') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (lower === 'teman') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (lower === 'profesional') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export const NotionTableView: React.FC<NotionTableViewProps> = ({
  contacts,
  onSelectContact,
  onQuickWhatsApp,
  onLogChat,
  now,
}) => {
  if (contacts.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
        Tidak ada kontak dalam tampilan tabel.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
      <table className="min-w-full text-left text-xs text-slate-700 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold select-none">
          <tr>
            <th className="py-2.5 px-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[200px]">
              Nama
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">
              Asosiasi
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[180px]">
              Pembaruan Terakhir
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[160px]">
              Status
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[130px]">
              Terakhir Dihubungi
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px] text-center">
              Kontak Profesional
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[180px]">
              Ketemu di mana & bagaimana
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[130px]">
              Next Follow Up
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[180px]">
              Possible Follow Up
            </th>
            <th className="py-2.5 px-3 border-r border-slate-200 min-w-[130px]">
              Saran Follow Up
            </th>
            <th className="py-2.5 px-3 min-w-[170px] text-center">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((contact) => {
            const status = calculateContactStatus(contact, now);
            const initials = getInitials(contact.name);
            const gradient =
              GRADIENTS[Math.abs(stringHash(contact.id || contact.name)) % GRADIENTS.length];

            return (
              <tr
                key={contact.id}
                data-testid={`notion-row-${contact.id}`}
                onClick={() => onSelectContact?.(contact)}
                className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
              >
                {/* 1. Nama (Sticky Column) */}
                <td className="py-2 px-3 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50/90 z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {contact.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {contact.phoneNumber}
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Asosiasi */}
                <td className="py-2 px-3 border-r border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {contact.associations.length > 0 ? (
                      contact.associations.map((assoc) => (
                        <span
                          key={assoc}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getAssociationBadgeStyle(
                            assoc
                          )}`}
                        >
                          {assoc}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </td>

                {/* 3. Pembaruan Terakhir */}
                <td className="py-2 px-3 border-r border-slate-100 max-w-[220px] truncate">
                  {contact.lastUpdateNotes || <span className="text-slate-400">-</span>}
                </td>

                {/* 4. Status */}
                <td className="py-2 px-3 border-r border-slate-100">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      status.isOverdue
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {status.isOverdue ? '⏰ Time to reach out!' : '👍 Aman'}
                  </span>
                </td>

                {/* 5. Terakhir Dihubungi */}
                <td className="py-2 px-3 border-r border-slate-100 font-mono text-[11px]">
                  {contact.lastContactedDate || <span className="text-slate-400 font-sans">-</span>}
                </td>

                {/* 6. Kontak Profesional */}
                <td className="py-2 px-3 border-r border-slate-100 text-center">
                  <div className="inline-flex items-center justify-center">
                    {contact.isProfessional ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </td>

                {/* 7. Ketemu di mana & bagaimana */}
                <td className="py-2 px-3 border-r border-slate-100 max-w-[200px] truncate">
                  {contact.metContext || <span className="text-slate-400">-</span>}
                </td>

                {/* 8. Next Follow Up */}
                <td className="py-2 px-3 border-r border-slate-100 font-mono text-[11px]">
                  {contact.nextSpecificFollowUp ? (
                    contact.nextSpecificFollowUp.split('T')[0]
                  ) : (
                    <span className="text-slate-400 font-sans">-</span>
                  )}
                </td>

                {/* 9. Possible Follow Up */}
                <td className="py-2 px-3 border-r border-slate-100 max-w-[200px] truncate">
                  {contact.possibleFollowUpTopic || <span className="text-slate-400">-</span>}
                </td>

                {/* 10. Saran Follow Up */}
                <td className="py-2 px-3 border-r border-slate-100 font-mono text-[11px]">
                  {status.suggestedDate || <span className="text-slate-400 font-sans">-</span>}
                </td>

                {/* 11. Quick Actions */}
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      aria-label="WhatsApp"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onQuickWhatsApp) {
                          onQuickWhatsApp(contact);
                        } else {
                          const waUrl = buildWhatsAppUrl(contact.phoneNumber);
                          if (waUrl && typeof window !== 'undefined') {
                            window.open(waUrl, '_blank');
                          }
                        }
                      }}
                      className="p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-90"
                      title="Sapa via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Tandai Selesai Ngobrol"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLogChat?.(contact);
                      }}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform active:scale-90"
                      title="Tandai Selesai Ngobrol"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
