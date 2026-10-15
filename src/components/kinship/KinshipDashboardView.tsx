import React, { useState, useMemo } from 'react';
import {
  Bell,
  RefreshCw,
  Search,
  X,
  Flame,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { KinshipPulseArc } from './KinshipPulseArc';
import { CadenceBadge } from './CadenceBadge';
import { DualWhatsAppButton } from './DualWhatsAppButton';

export interface KinshipDashboardViewProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onOpenSync?: () => void;
  onOpenNotifications?: () => void;
  onOpenAiDraft?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  now?: Date;
}

type CadenceFilterTab = 'Semua' | 'Mingguan (7 hr)' | '2 Mingguan (14-15 hr)' | 'Bulanan (30 hr)';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAssociationBadgeClass(assoc?: string): string {
  switch (assoc?.toLowerCase()) {
    case 'ihvan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'hoca':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'keluarga':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'zahiri':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'teman':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'profesional':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const KinshipDashboardView: React.FC<KinshipDashboardViewProps> = ({
  contacts,
  onSelectContact,
  onOpenSync,
  onOpenNotifications,
  onOpenAiDraft,
  onLogChat,
  now = new Date(),
}) => {
  const [activeTab, setActiveTab] = useState<CadenceFilterTab>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Health metrics calculation
  const { activeCount, dueCount, pausedCount, healthScore } = useMemo(() => {
    const active = contacts.length;
    let due = 0;
    let paused = 0;

    contacts.forEach((contact) => {
      if (typeof contact.followUpCycleDays === 'number' && contact.followUpCycleDays <= 0) {
        paused += 1;
      }
      const status = calculateContactStatus(contact, now);
      if (status.isOverdue) {
        due += 1;
      }
    });

    const score = active === 0 ? 100 : Math.round(((active - due) / active) * 100);
    return {
      activeCount: active,
      dueCount: due,
      pausedCount: paused,
      healthScore: score,
    };
  }, [contacts, now]);

  // 2. Overdue contacts for "Needs Attention Today"
  const dueContacts = useMemo(() => {
    return contacts
      .map((contact) => ({
        contact,
        status: calculateContactStatus(contact, now),
      }))
      .filter(({ status }) => status.isOverdue)
      .sort((a, b) => b.status.daysOverdue - a.status.daysOverdue);
  }, [contacts, now]);

  // 3. Cadence Radar Filtered Feed
  const filteredRadarContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const cycle = typeof contact.followUpCycleDays === 'number' ? contact.followUpCycleDays : 15;

      // Tab filter
      if (activeTab === 'Mingguan (7 hr)') {
        if (cycle > 7) return false;
      } else if (activeTab === '2 Mingguan (14-15 hr)') {
        if (cycle <= 7 || cycle > 20) return false;
      } else if (activeTab === 'Bulanan (30 hr)') {
        if (cycle <= 20) return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = contact.name.toLowerCase().includes(q);
        const matchPhone = contact.phoneNumber.toLowerCase().includes(q);
        const matchTopic = (contact.possibleFollowUpTopic || '').toLowerCase().includes(q);
        const matchContext = (contact.metContext || '').toLowerCase().includes(q);
        const matchNotes = (contact.lastUpdateNotes || '').toLowerCase().includes(q);
        const matchAssoc = contact.associations?.some((a) => a.toLowerCase().includes(q)) ?? false;

        if (!matchName && !matchPhone && !matchTopic && !matchContext && !matchNotes && !matchAssoc) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, activeTab, searchQuery]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-6 pb-28">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* User profile avatar */}
          <div
            aria-label="Profil Pengguna"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white/80"
          >
            SK
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">Kinship</span>
              <span className="text-slate-400 font-normal">·</span>
              <h1 className="text-xl font-semibold text-slate-600">Radar</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Pantau & rawat ritme silaturahmi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Sync Button */}
          <button
            type="button"
            aria-label="Sinkronisasi Buku Telepon"
            onClick={onOpenSync}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notification Bell Button */}
          <button
            type="button"
            aria-label="Notifikasi"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {dueCount > 0 && (
              <span
                data-testid="notification-badge"
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white"
              >
                {dueCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Kinship Pulse Card */}
      <section aria-label="Kinship Pulse Overview">
        <KinshipPulseArc
          score={healthScore}
          activeCount={activeCount}
          dueCount={dueCount}
          pausedCount={pausedCount}
        />
      </section>

      {/* Needs Attention Today Section */}
      <section aria-label="Perlu Perhatian Hari Ini" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Perlu Perhatian Hari Ini</h2>
          </div>
          {dueContacts.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              {dueContacts.length} Urgent
            </span>
          )}
        </div>

        {dueContacts.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-b from-emerald-50/30 to-white">
            <p className="text-base font-bold text-slate-800">Semua relasi dalam ritme aman 🎉</p>
            <p className="text-xs text-slate-500 mt-1">
              Tidak ada kontak yang mendesak untuk disapa hari ini. Silaturahmi terjaga dengan baik!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dueContacts.map(({ contact, status }) => {
              const initials = getInitials(contact.name);
              const primaryAssoc =
                contact.associations?.[0] || (contact.isProfessional ? 'Profesional' : 'Relasi');
              const badgeClass = getAssociationBadgeClass(contact.associations?.[0] || (contact.isProfessional ? 'profesional' : 'relasi'));

              const draftText = contact.possibleFollowUpTopic
                ? `Assalamu'alaikum ${contact.name}, ${contact.possibleFollowUpTopic}`
                : `Assalamu'alaikum ${contact.name}, bagaimana kabarnya?`;

              return (
                <div
                  key={contact.id}
                  data-testid={`attention-card-${contact.id}`}
                  onClick={() => onSelectContact(contact)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Squircle avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white" />
                    </div>

                    {/* Contact header info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                          {contact.name}
                        </h3>
                        <CadenceBadge
                          cadenceDays={contact.followUpCycleDays || 15}
                          isOverdue={true}
                          daysLeftOrOverdue={status.daysOverdue}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {primaryAssoc}
                        </span>
                        {contact.lastContactedDate && (
                          <span className="text-[11px] text-slate-400">
                            Terakhir sapa: {contact.lastContactedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Topic / Note preview */}
                  {(contact.possibleFollowUpTopic || contact.metContext) && (
                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs border border-slate-100 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        {contact.possibleFollowUpTopic && (
                          <p className="font-medium text-slate-700 truncate">
                            {contact.possibleFollowUpTopic}
                          </p>
                        )}
                        {contact.metContext && (
                          <p className="text-[11px] text-slate-400 truncate italic mt-0.5">
                            "{contact.metContext}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Dual WhatsApp Action */}
                  <div className="pt-1">
                    <DualWhatsAppButton
                      phoneNumber={contact.phoneNumber}
                      draftText={draftText}
                      onChatLogged={() => onLogChat?.(contact)}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cadence Radar Section */}
      <section aria-label="Cadence Radar Feed" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <Radio className="w-4 h-4 text-emerald-600" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Cadence Radar</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredRadarContacts.length} relasi
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, topik, atau relasi..."
            className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['Semua', 'Mingguan (7 hr)', '2 Mingguan (14-15 hr)', 'Bulanan (30 hr)'] as CadenceFilterTab[]).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {tab}
                </button>
              );
            }
          )}
        </div>

        {/* Filtered Contact Feed */}
        {filteredRadarContacts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada kontak yang cocok dengan filter radar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Coba ganti frekuensi atau reset kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRadarContacts.map((contact) => {
              const status = calculateContactStatus(contact, now);
              const initials = getInitials(contact.name);
              const cycle = contact.followUpCycleDays || 15;
              const primaryAssoc =
                contact.associations?.[0] || (contact.isProfessional ? 'Profesional' : 'Relasi');
              const badgeClass = getAssociationBadgeClass(contact.associations?.[0] || (contact.isProfessional ? 'profesional' : 'relasi'));

              // Approaching or days left calculation
              const daysLeft = status.isOverdue ? 0 : Math.max(0, cycle - status.daysOverdue);

              return (
                <div
                  key={contact.id}
                  data-testid={`radar-item-${contact.id}`}
                  onClick={() => onSelectContact(contact)}
                  className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Squircle avatar */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {contact.name}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {primaryAssoc}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {contact.phoneNumber}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <CadenceBadge
                      cadenceDays={cycle}
                      isOverdue={status.isOverdue}
                      daysLeftOrOverdue={status.isOverdue ? status.daysOverdue : daysLeft}
                    />

                    {/* Quick AI Draft Action Button */}
                    <button
                      type="button"
                      data-testid={`radar-ai-draft-${contact.id}`}
                      aria-label={`Buat draf pesan AI untuk ${contact.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAiDraft?.(contact);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
