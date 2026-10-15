import React from 'react';
import { MessageCircle, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export interface ContactCardProps {
  contact: Contact;
  onSelect?: (contact: Contact) => void;
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

export function getInitials(name: string): string {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
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

function toMidnightUtc(dateInput: Date | string): number {
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    }
    const parsed = new Date(dateInput);
    return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }
  return Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onSelect,
  onQuickWhatsApp,
  onLogChat,
  now,
}) => {
  const initials = getInitials(contact.name);
  const gradient = GRADIENTS[Math.abs(stringHash(contact.id || contact.name)) % GRADIENTS.length];
  const status = calculateContactStatus(contact, now);

  // Calculate timing text (Terlambat X hari / Sisa X hari / Belum pernah disapa / Hari ini)
  let timingText = '';
  if (status.isOverdue) {
    if (status.daysOverdue > 0) {
      timingText = `Terlambat ${status.daysOverdue} hari`;
    } else if (!contact.lastContactedDate && !contact.nextSpecificFollowUp) {
      timingText = 'Belum pernah disapa';
    } else {
      timingText = 'Jatuh tempo hari ini';
    }
  } else {
    const targetDate = contact.nextSpecificFollowUp || status.suggestedDate;
    if (targetDate) {
      const currentMidnight = toMidnightUtc(now || new Date());
      const targetMidnight = toMidnightUtc(targetDate);
      const diffDays = Math.ceil((targetMidnight - currentMidnight) / (24 * 60 * 60 * 1000));
      timingText = diffDays > 0 ? `Sisa ${diffDays} hari` : 'Hari ini';
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickWhatsApp) {
      onQuickWhatsApp(contact);
    } else {
      const waUrl = buildWhatsAppUrl(contact.phoneNumber);
      if (waUrl && typeof window !== 'undefined') {
        window.open(waUrl, '_blank');
      }
    }
  };

  const handleLogChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogChat?.(contact);
  };

  return (
    <div
      data-testid={`contact-card-${contact.id}`}
      tabIndex={0}
      onClick={() => onSelect?.(contact)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(contact);
        }
      }}
      className="rounded-xl sm:rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#2F54EB] focus:ring-offset-1 select-none"
    >
      <div>
        {/* Top: Avatar, Name, Phone & Status Badge */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Dynamic Avatar */}
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${gradient} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm`}
            >
              {initials}
            </div>

            {/* Name & Phone */}
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base truncate leading-snug">
                {contact.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <Phone className="w-3 h-3 shrink-0" />
                <span>{contact.phoneNumber}</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end shrink-0">
            <span
              className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${
                status.isOverdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {status.isOverdue ? '⏰ Time to reach out!' : '👍 Aman'}
            </span>
            {timingText && (
              <span
                className={`text-[10px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 ${
                  status.isOverdue ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {timingText}
              </span>
            )}
          </div>
        </div>

        {/* Association Badges */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3">
          {contact.associations.map((assoc) => (
            <span
              key={assoc}
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border ${getAssociationBadgeStyle(
                assoc
              )}`}
            >
              {assoc}
            </span>
          ))}
          {contact.isProfessional && !contact.associations.some((a) => a.toLowerCase() === 'profesional') && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
              Profesional
            </span>
          )}
        </div>

        {/* Possible Follow-Up Topic Preview */}
        {contact.possibleFollowUpTopic && contact.possibleFollowUpTopic.trim() !== '' && (
          <div className="mt-2 sm:mt-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-[11px] sm:text-xs text-slate-600 flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div className="line-clamp-2">
              <span className="font-semibold text-slate-700">Topik: </span>
              <span>{contact.possibleFollowUpTopic}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-3 pt-2 sm:mt-4 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label="WhatsApp"
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          aria-label="Tandai Selesai Ngobrol"
          onClick={handleLogChat}
          className="flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Selesai</span>
        </button>
      </div>
    </div>
  );
};
