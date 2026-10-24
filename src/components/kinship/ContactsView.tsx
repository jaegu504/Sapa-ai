import React, { useMemo, useRef } from 'react';
import { motion, type PanInfo } from 'motion/react';
import { MessageCircle, Plus, RefreshCw, Search, Tag, Users, X } from 'lucide-react';
import type { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { applyContactsFilter, type ContactsFilter } from '../../utils/contactFilters';
import { avatarTone, dueLabel, getInitials } from '../../utils/display';
import { getLabels } from '../../services/labelService';
import { EmptyState } from '../ui/EmptyState';
import { rowMotion } from './KinshipDashboardView';

export interface ContactsViewProps {
  contacts: Contact[];
  filter: ContactsFilter | null;
  onFilterChange: (filter: ContactsFilter | null) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onSelectContact: (contact: Contact) => void;
  onSapa: (contact: Contact) => void;
  onEditLabels: (contact: Contact) => void;
  onAddContact: () => void;
  onResync: () => void;
  isSyncing?: boolean;
  now?: Date;
}

const QUICK_FILTERS: { label: string; filter: ContactsFilter }[] = [
  { label: 'Perlu disapa', filter: { kind: 'overdue' } },
  { label: '7 hari', filter: { kind: 'week' } },
  { label: 'Belum disapa', filter: { kind: 'never' } },
];

function sameFilter(a: ContactsFilter | null, b: ContactsFilter | null): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && (a.kind !== 'label' || (b.kind === 'label' && a.label === b.label));
}

function pillClass(status: ReturnType<typeof calculateContactStatus>): string {
  if (status.isOverdue) return 'bg-rose-500/15 text-rose-600 dark:text-rose-300';
  if ((status.daysRemaining ?? 99) <= 3) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
}

/** One contact row. Swiping it to the right reveals "Label" and opens the label picker. */
const ContactRow: React.FC<{
  contact: Contact;
  index: number;
  now?: Date;
  onSelect: () => void;
  onSapa: () => void;
  onEditLabels: () => void;
}> = ({ contact, index, now, onSelect, onSapa, onEditLabels }) => {
  const dragged = useRef(false);
  const status = calculateContactStatus(contact, now);
  const labels = [...contact.associations];
  if (contact.isProfessional && !labels.includes('Profesional')) labels.push('Profesional');

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x > 70) onEditLabels();
    // Let the click that ends a drag be ignored, then accept taps again.
    setTimeout(() => (dragged.current = false), 50);
  };

  return (
    <motion.div {...rowMotion(index)} className="relative overflow-hidden">
      <div className="absolute inset-0 flex items-center gap-2 pl-5 bg-amber-500 text-white text-sm font-bold" aria-hidden="true">
        <Tag className="w-4 h-4" />
        Label
      </div>
      <motion.div
        role="button"
        tabIndex={0}
        data-testid={`kinship-card-${contact.id}`}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.55 }}
        dragSnapToOrigin
        dragDirectionLock
        onDragStart={() => (dragged.current = true)}
        onDragEnd={handleDragEnd}
        onClick={() => !dragged.current && onSelect()}
        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        className="relative flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-[#1C1C1E] cursor-pointer active:bg-slate-50 dark:active:bg-[#232326] touch-pan-y"
      >
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${avatarTone(contact.name)}`}>
          {getInitials(contact.name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate">{contact.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{labels.join(', ') || 'Tanpa label'}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${pillClass(status)}`}>
          {dueLabel(status, contact.lastContactedDate)}
        </span>
        <button
          type="button"
          aria-label={`Sapa ${contact.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onSapa();
          }}
          className="press w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onSelectContact,
  onSapa,
  onEditLabels,
  onAddContact,
  onResync,
  isSyncing,
  now,
}) => {
  const labels = useMemo(() => getLabels(), [contacts]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = applyContactsFilter(contacts, filter, now).filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.possibleFollowUpTopic || '').toLowerCase().includes(q) ||
        c.associations.some((a) => a.toLowerCase().includes(q))
    );
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    const map = new Map<string, Contact[]>();
    for (const c of sorted) {
      const letter = /[a-z]/i.test(c.name.trim()[0] || '') ? c.name.trim()[0].toUpperCase() : '#';
      map.set(letter, [...(map.get(letter) || []), c]);
    }
    return { total: filtered.length, entries: [...map.entries()] };
  }, [contacts, filter, search, now]);

  const chip = (label: string, value: ContactsFilter | null, count?: number) => {
    const on = sameFilter(filter, value);
    return (
      <button
        key={label}
        type="button"
        aria-pressed={on}
        onClick={() => onFilterChange(on && value ? null : value)}
        className={`press shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap ${
          on ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-transparent'
        }`}
      >
        {label}
        {count !== undefined && <span className="ml-1 opacity-60">{count}</span>}
      </button>
    );
  };

  let rowIndex = 0;
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-3 pb-32 text-slate-900 dark:text-white">
      <header className="flex items-center justify-between mb-3">
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">Kontak</h1>
        <div className="flex items-center gap-2" data-tour="add-actions">
          <button
            type="button"
            onClick={onResync}
            disabled={isSyncing}
            aria-label="Sinkron ulang dengan kontak HP"
            className="press w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-white/10 border border-white/80 dark:border-white/15 text-slate-700 dark:text-slate-200 disabled:opacity-60"
          >
            <RefreshCw className={`w-[18px] h-[18px] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onAddContact}
            aria-label="Tambah Kontak Baru"
            className="press w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.9)]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama atau topik"
          aria-label="Cari kontak"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl text-[15px] bg-slate-200/60 dark:bg-white/[0.08] placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {search && (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 mb-3" aria-label="Filter kontak">
        {chip('Semua', null, contacts.length)}
        {QUICK_FILTERS.map((f) => chip(f.label, f.filter))}
        {labels.map((l) => chip(l, { kind: 'label', label: l }))}
      </div>

      <div data-tour="contact-list">
        {contacts.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Belum ada kontak"
            body="Tambah sendiri atau ambil dari kontak HP."
            actionLabel="Tambah kontak"
            onAction={onAddContact}
          />
        ) : groups.total === 0 ? (
          <EmptyState icon={<Search className="w-7 h-7" />} title="Tidak ada yang cocok" body="Coba kata lain atau pilih filter Semua." />
        ) : (
          <div className="space-y-3">
            {groups.entries.map(([letter, list]) => (
              <section key={letter}>
                <p className="px-2 mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">{letter}</p>
                <div className="rounded-[20px] overflow-hidden border border-white/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/[0.07]">
                  {list.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      index={rowIndex++}
                      now={now}
                      onSelect={() => onSelectContact(contact)}
                      onSapa={() => onSapa(contact)}
                      onEditLabels={() => onEditLabels(contact)}
                    />
                  ))}
                </div>
              </section>
            ))}
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-1">Geser kontak ke kanan untuk memberi label</p>
          </div>
        )}
      </div>
    </div>
  );
};
