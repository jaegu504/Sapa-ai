import React, { useState, useMemo } from 'react';
import {
  Bell,
  RefreshCw,
  Search,
  X,
  Flame,
  Radio,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus, getDaysLeftOrOverdue } from '../../utils/status';
import { KinshipPulseArc } from './KinshipPulseArc';
import { CadenceBadge } from './CadenceBadge';
import { DualWhatsAppButton } from './DualWhatsAppButton';
import sapaLogo from '../../assets/logo.png';

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
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'hoca':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
    case 'keluarga':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    case 'zahiri':
      return 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30';
    case 'teman':
      return 'bg-teal-500/10 text-teal-700 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30';
    case 'profesional':
      return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/15';
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
    <div className="relative w-full max-w-2xl mx-auto px-4 py-4 space-y-6 pb-28 text-slate-900 dark:text-white transition-colors">
      
      {/* Ambient Fluid Blur Blobs for Glassmorphism Depth */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-500/15 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-64 -right-16 w-72 h-72 bg-emerald-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* User profile avatar with Sapa Logo */}
          <div className="relative">
            <img
              src={sapaLogo}
              alt="Sapa Logo"
              aria-label="Profil Pengguna"
              className="w-10 h-10 rounded-2xl shadow-md ring-2 ring-white/80 dark:ring-white/20 object-cover"
            />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Sapa</span>
              <span className="text-slate-400 dark:text-slate-600 font-normal">·</span>
              <h1 className="text-xl font-bold text-slate-600 dark:text-slate-400">Radar</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Pantau & rawat ritme silaturahmi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Sync Button */}
          <button
            type="button"
            aria-label="Sinkronisasi Buku Telepon"
            onClick={onOpenSync}
            className="w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/15 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/20 shadow-xs transition-all active:scale-95 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notification Bell Button */}
          <button
            type="button"
            aria-label="Notifikasi"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/15 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/20 shadow-xs transition-all active:scale-95 flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
            {dueCount > 0 && (
              <span
                data-testid="notification-badge"
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 animate-pulse"
              >
                {dueCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Denyut Sapa Card */}
      <section aria-label="Denyut Sapa Overview" className="relative z-10">
        <KinshipPulseArc
          score={healthScore}
          activeCount={activeCount}
          dueCount={dueCount}
          pausedCount={pausedCount}
        />
      </section>

      {/* Needs Attention Today Section */}
      <section aria-label="Perlu Perhatian Hari Ini" className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
            </span>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Perlu Perhatian Hari Ini
            </h2>
          </div>
          {dueContacts.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20 dark:border-rose-500/30">
              {dueContacts.length} Urgent
            </span>
          )}
        </div>

        {dueContacts.length === 0 ? (
          <div className="p-6 text-center bg-white/70 dark:bg-[#1C1C1E]/60 backdrop-blur-xl rounded-[28px] border border-dashed border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent">
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">Semua relasi dalam ritme aman 🎉</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                  className="bg-white/80 dark:bg-[#1C1C1E]/75 backdrop-blur-2xl rounded-[28px] p-4 border border-white/80 dark:border-white/12 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:border-blue-400/50 dark:hover:border-cyan-400/50 transition-all cursor-pointer space-y-3 active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    {/* Squircle avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 dark:from-cyan-700 dark:to-blue-700 text-white font-black text-sm flex items-center justify-center shadow-md">
                        {initials}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                    </div>

                    {/* Contact header info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">
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
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {primaryAssoc}
                        </span>
                        {contact.lastContactedDate && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Terakhir sapa: {contact.lastContactedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Topic / Note preview */}
                  {(contact.possibleFollowUpTopic || contact.metContext) && (
                    <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-2.5 text-xs border border-white/80 dark:border-white/10 flex items-start gap-2 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        {contact.possibleFollowUpTopic && (
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {contact.possibleFollowUpTopic}
                          </p>
                        )}
                        {contact.metContext && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate italic mt-0.5">
                            "{contact.metContext}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Dual WhatsApp Action & Explicit Sudah Sapa Button */}
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <DualWhatsAppButton
                        phoneNumber={contact.phoneNumber}
                        draftText={draftText}
                        size="sm"
                      />
                    </div>
                    {onLogChat && (
                      <button
                        type="button"
                        aria-label={`Tandai sudah sapa ${contact.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogChat(contact);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 min-h-[34px] active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Sudah Sapa</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cadence Radar Section */}
      <section aria-label="Cadence Radar Feed" className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Cadence Radar
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {filteredRadarContacts.length} relasi
          </span>
        </div>

        {/* Search input with Apple frosted glass */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, topik, atau relasi..."
            className="w-full pl-9 pr-9 py-2.5 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500 focus:border-transparent transition-all shadow-xs"
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

        {/* Apple Segmented Control Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl no-scrollbar">
          {(['Semua', 'Mingguan (7 hr)', '2 Mingguan (14-15 hr)', 'Bulanan (30 hr)'] as CadenceFilterTab[]).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          <div className="p-8 text-center bg-white/70 dark:bg-[#1C1C1E]/60 backdrop-blur-xl rounded-[28px] border border-dashed border-slate-300 dark:border-white/15">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
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
              const daysLeftOrOverdue = getDaysLeftOrOverdue(status);

              return (
                <div
                  key={contact.id}
                  data-testid={`radar-item-${contact.id}`}
                  onClick={() => onSelectContact(contact)}
                  className="bg-white/80 dark:bg-[#1C1C1E]/60 backdrop-blur-xl rounded-2xl p-3 border border-white/80 dark:border-white/10 shadow-xs hover:border-blue-400/50 dark:hover:border-cyan-400/50 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Squircle avatar */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {contact.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {primaryAssoc}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {contact.phoneNumber}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <CadenceBadge
                      cadenceDays={cycle}
                      isOverdue={status.isOverdue}
                      daysLeftOrOverdue={daysLeftOrOverdue}
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
                      className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors shadow-2xs active:scale-95"
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
