import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { MetricStrip } from '../ui/MetricStrip';

export interface ContactDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEditContact?: (contact: Contact) => void;
  onOpenAiDraft?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  now?: Date;
}

export function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  onEditContact,
  onOpenAiDraft,
  onLogChat,
  now,
}: ContactDetailModalProps) {
  if (!isOpen || !contact) return null;

  const status = calculateContactStatus(contact, now);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getAvatarGradient = (name: string): string => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-emerald-500 to-teal-700',
      'from-violet-600 to-purple-800',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-700',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Build 3-Metric Strip items
  let statusDisplay = '';
  if (status.isOverdue) {
    statusDisplay =
      status.daysOverdue > 0
        ? `Terlambat ${status.daysOverdue} hari`
        : 'Jatuh tempo hari ini';
  } else {
    const targetDateStr = contact.nextSpecificFollowUp || status.suggestedDate;
    if (targetDateStr) {
      const ref = now ? new Date(now) : new Date();
      const currentUtc = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
      const targetParts = targetDateStr.split('T')[0].split('-').map(Number);
      const targetUtc = Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2]);
      const diffDays = Math.ceil((targetUtc - currentUtc) / (24 * 60 * 60 * 1000));
      statusDisplay = diffDays > 0 ? `Sisa ${diffDays} hari` : 'Aman';
    } else {
      statusDisplay = 'Aman';
    }
  }

  const metrics = [
    {
      label: 'Siklus',
      value: `${contact.followUpCycleDays} Hari`,
      badgeColor: 'blue' as const,
    },
    {
      label: 'Status',
      value: statusDisplay,
      badgeColor: status.isOverdue ? ('rose' as const) : ('green' as const),
    },
    {
      label: 'Terakhir Sapa',
      value: contact.lastContactedDate || 'Belum Pernah',
      badgeColor: 'slate' as const,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-detail-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top App Bar inside modal */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Profil Relasi
          </span>
          <div className="flex items-center gap-1.5">
            {onEditContact && (
              <button
                type="button"
                onClick={() => onEditContact(contact)}
                aria-label="Edit Relasi"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#2F54EB] hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>Edit Relasi</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* John Carter Hero Section */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                contact.name
              )} text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3`}
            >
              {getInitials(contact.name)}
            </div>

            <h2 id="contact-detail-name" className="text-xl font-bold text-slate-900">
              {contact.name}
            </h2>

            <p className="text-xs font-mono text-slate-500 mt-1 mb-3">
              {contact.phoneNumber}
            </p>

            {/* Association Badges */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {contact.associations.map((assoc) => (
                <span
                  key={assoc}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                >
                  {assoc}
                </span>
              ))}
              {contact.isProfessional && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Kontak Profesional
                </span>
              )}
            </div>
          </div>

          {/* 3-Metric Strip */}
          <div className="pt-1">
            <MetricStrip metrics={metrics} />
          </div>

          {/* Notion Context & Follow Up Details Cards */}
          <div className="space-y-3 pt-1">
            {/* Section 1: Ketemu di mana & bagaimana */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                Ketemu di mana & bagaimana
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {contact.metContext || '-'}
              </p>
            </div>

            {/* Section 2: Pembaruan Terakhir */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                Pembaruan Terakhir
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {contact.lastUpdateNotes || '-'}
              </p>
            </div>

            {/* Section 3: Topik Follow Up Selanjutnya */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
              <span className="text-xs font-bold text-[#2F54EB] block mb-1">
                Topik Follow Up Selanjutnya
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {contact.possibleFollowUpTopic || '-'}
              </p>
            </div>

            {/* Section 4: Jadwal Follow Up Khusus */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                Jadwal Follow Up Khusus
              </span>
              <p className="text-xs font-mono text-slate-800">
                {contact.nextSpecificFollowUp || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5">
          {onOpenAiDraft && (
            <button
              type="button"
              onClick={() => onOpenAiDraft(contact)}
              aria-label="Sapa via WhatsApp"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-bold text-white bg-[#2F54EB] hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>✨</span>
              <span>Sapa via WhatsApp</span>
            </button>
          )}

          {onLogChat && (
            <button
              type="button"
              onClick={() => onLogChat(contact)}
              aria-label="Tandai Selesai Ngobrol"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            >
              <span>✓</span>
              <span>Tandai Selesai Ngobrol</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
