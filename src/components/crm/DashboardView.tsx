import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  Table,
  UserPlus,
  Download,
  MessageCircle,
  CheckCircle,
  Sparkles,
  Menu,
} from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { DualMetricsCard } from '../ui/DualMetricsCard';
import { CircularQuickAction } from '../ui/CircularQuickAction';
import { FilterPill } from '../ui/FilterPill';
import { ContactCard } from './ContactCard';
import { NotionTableView } from './NotionTableView';

export interface DashboardViewProps {
  contacts: Contact[];
  onImportClick?: () => void;
  onAddContactClick?: () => void;
  onSelectContact?: (contact: Contact) => void;
  onQuickWhatsApp?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  onOpenMenu?: () => void;
  now?: Date;
}

const CATEGORIES = ['Semua', 'Ihvan', 'Hoca', 'Keluarga', 'Profesional', 'Zahiri', 'Teman'];

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contacts,
  onImportClick,
  onAddContactClick,
  onSelectContact,
  onQuickWhatsApp,
  onLogChat,
  onOpenMenu,
  now = new Date(),
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const greeting = getGreeting(now);

  // Top due or overdue contacts for Copilot recommendation
  const dueOrOverdueContacts = useMemo(() => {
    return contacts
      .filter((c) => calculateContactStatus(c, now).isOverdue)
      .sort((a, b) => {
        const statA = calculateContactStatus(a, now).daysOverdue;
        const statB = calculateContactStatus(b, now).daysOverdue;
        return statB - statA;
      });
  }, [contacts, now]);

  const topDueContacts = useMemo(() => dueOrOverdueContacts.slice(0, 3), [dueOrOverdueContacts]);

  // Metrics calculation
  const { overdueCount, healthScorePercent, activeCount } = useMemo(() => {
    const active = contacts.length;
    let overdue = 0;
    contacts.forEach((c) => {
      if (calculateContactStatus(c, now).isOverdue) {
        overdue += 1;
      }
    });
    const health = active === 0 ? 100 : Math.round(((active - overdue) / active) * 100);
    return { overdueCount: overdue, healthScorePercent: health, activeCount: active };
  }, [contacts, now]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // 1. Overdue Only quick filter
      if (overdueOnly) {
        if (!calculateContactStatus(contact, now).isOverdue) return false;
      }

      // 2. Category Filter Pill
      if (activeFilter === 'Profesional') {
        const isPro =
          contact.isProfessional ||
          contact.associations.some((a) => a.toLowerCase() === 'profesional');
        if (!isPro) return false;
      } else if (activeFilter !== 'Semua') {
        const hasTag = contact.associations.some(
          (a) => a.toLowerCase() === activeFilter.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = contact.name.toLowerCase().includes(q);
        const matchPhone = contact.phoneNumber.toLowerCase().includes(q);
        const matchTopic = (contact.possibleFollowUpTopic || '').toLowerCase().includes(q);
        const matchContext = (contact.metContext || '').toLowerCase().includes(q);
        const matchNotes = (contact.lastUpdateNotes || '').toLowerCase().includes(q);
        const matchAssoc = contact.associations.some((a) => a.toLowerCase().includes(q));

        if (!matchName && !matchPhone && !matchTopic && !matchContext && !matchNotes && !matchAssoc) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, activeFilter, searchQuery, overdueOnly, now]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: contacts.length };
    CATEGORIES.slice(1).forEach((cat) => {
      if (cat === 'Profesional') {
        counts[cat] = contacts.filter(
          (c) => c.isProfessional || c.associations.some((a) => a.toLowerCase() === 'profesional')
        ).length;
      } else {
        counts[cat] = contacts.filter((c) =>
          c.associations.some((a) => a.toLowerCase() === cat.toLowerCase())
        ).length;
      }
    });
    return counts;
  }, [contacts]);

  // First overdue contact for Quick WhatsApp
  const firstOverdueContact = useMemo(() => {
    return contacts.find((c) => calculateContactStatus(c, now).isOverdue);
  }, [contacts, now]);

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3.5 sm:space-y-5">
      {/* Header bar */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onOpenMenu && (
            <button
              type="button"
              aria-label="Buka Menu Analitik"
              onClick={onOpenMenu}
              className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-2xl font-bold sm:font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{greeting}, Sahabat!</span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-400" />
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
              Kelola silaturahmi & hubungan bermakna ({contacts.length} total relasi)
            </p>
          </div>
        </div>

        {/* Total Badge */}
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>{contacts.length} Relasi Aktif</span>
        </div>
      </header>

      {/* DualMetricsCard */}
      <section aria-label="Metrik CRM">
        <DualMetricsCard
          overdueCount={overdueCount}
          healthScorePercent={healthScorePercent}
          activeCount={activeCount}
          onOverdueClick={() => setOverdueOnly((prev) => !prev)}
          onHealthClick={() => setOverdueOnly(false)}
        />
        {overdueOnly && (
          <div className="mt-2 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1 text-xs text-rose-700">
            <span className="text-[11px]">Hanya kontak yang perlu disapa</span>
            <button
              type="button"
              onClick={() => setOverdueOnly(false)}
              className="font-semibold underline hover:text-rose-900 ml-2 text-[11px]"
            >
              Reset filter
            </button>
          </div>
        )}
      </section>

      {/* CircularQuickActions */}
      <section
        aria-label="Aksi Cepat"
        className="relative z-10 isolate flex items-center justify-between sm:justify-start sm:gap-6 bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs overflow-x-auto"
      >
        <CircularQuickAction
          label="Impor HP"
          icon={<Download size={20} />}
          onClick={() => onImportClick?.()}
          variant="primary"
        />

        <CircularQuickAction
          label="Sapa WA"
          icon={<MessageCircle size={20} />}
          badge={overdueCount > 0 ? overdueCount : undefined}
          onClick={() => {
            if (firstOverdueContact && onQuickWhatsApp) {
              onQuickWhatsApp(firstOverdueContact);
            } else {
              setOverdueOnly(true);
            }
          }}
          variant="accent"
        />

        <CircularQuickAction
          label="Tambah Kontak"
          icon={<UserPlus size={20} />}
          onClick={() => onAddContactClick?.()}
          variant="secondary"
        />

        <CircularQuickAction
          label="Log Chat"
          icon={<CheckCircle size={20} />}
          onClick={() => {
            if (contacts.length > 0 && onLogChat) {
              onLogChat(contacts[0]);
            }
          }}
          variant="secondary"
        />
      </section>

      {/* Search Input & View Mode Controls */}
      <section className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, topik, telepon, atau asosiasi..."
              className="w-full pl-9 pr-9 py-2 rounded-full border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F54EB] focus:border-transparent transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center self-end sm:self-auto bg-slate-100 p-0.5 sm:p-1 rounded-full border border-slate-200 shrink-0">
            <button
              type="button"
              aria-label="Mode Kartu"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              aria-label="Mode Tabel Notion"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Table className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Tabel Notion</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <FilterPill
              key={cat}
              label={cat}
              active={activeFilter === cat}
              count={categoryCounts[cat]}
              onClick={() => setActiveFilter(cat)}
            />
          ))}
        </div>
      </section>

      {/* Smart Daily Copilot Card */}
      {topDueContacts.length > 0 && !searchQuery.trim() && activeFilter === 'Semua' && !overdueOnly && (
        <section
          aria-label="Rekomendasi Sapaan Hari Ini"
          className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-base font-bold sm:font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>✨ Rekomendasi Sapaan Hari Ini</span>
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-blue-700 font-medium">
              Ada {dueOrOverdueContacts.length} relasi yang perlu disapa hari ini
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {topDueContacts.map((contact) => {
              const initials =
                contact.name
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'GS';
              const badgeText =
                contact.associations?.[0] || (contact.isProfessional ? 'Profesional' : 'Relasi');

              return (
                <div
                  key={contact.id}
                  onClick={() => onSelectContact?.(contact)}
                  className="bg-white border border-blue-100 rounded-xl p-3 flex items-center justify-between shadow-2xs gap-2 cursor-pointer hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#2F54EB] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{contact.name}</p>
                      <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {badgeText}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid={`copilot-sapa-${contact.id}`}
                    onClick={() => onQuickWhatsApp?.(contact)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Sapa</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Content: Cards Grid or Notion Table */}
      <main aria-label="Daftar Relasi">
        {filteredContacts.length === 0 ? (
          <div className="w-full bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm md:text-base">
              Tidak ada kontak yang ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {searchQuery || activeFilter !== 'Semua' || overdueOnly
                ? 'Coba ganti kata kunci pencarian atau reset filter kategori untuk melihat kontak lainnya.'
                : 'Belum ada relasi yang tersimpan. Impor kontak handphone untuk memulai silaturahmi!'}
            </p>
            {(searchQuery || activeFilter !== 'Semua' || overdueOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('Semua');
                  setOverdueOnly(false);
                }}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-full bg-[#2F54EB] text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onSelect={onSelectContact}
                onQuickWhatsApp={onQuickWhatsApp}
                onLogChat={onLogChat}
                now={now}
              />
            ))}
          </div>
        ) : (
          <NotionTableView
            contacts={filteredContacts}
            onSelectContact={onSelectContact}
            onQuickWhatsApp={onQuickWhatsApp}
            onLogChat={onLogChat}
            now={now}
          />
        )}
      </main>
    </div>
  );
};
