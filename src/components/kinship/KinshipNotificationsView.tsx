import React, { useEffect, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { motion } from 'motion/react';
import { BellRing, CalendarCheck, MessageCircle } from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { avatarTone, dateParts, dueDate, dueLabel, getInitials } from '../../utils/display';
import { checkNotificationPermission, requestNotificationPermission } from '../../services/notificationService';
import { EmptyState } from '../ui/EmptyState';
import { rowMotion } from './KinshipDashboardView';

export interface KinshipNotificationsViewProps {
  contacts: Contact[];
  onSelectContact?: (contact: Contact) => void;
  onSapa?: (contact: Contact) => void;
  now?: Date;
}

interface ScheduleItem {
  contact: Contact;
  date: string | null;
  time: string | null;
  label: string;
}

const LATER_LIMIT = 20;

function readDigestTime(): string {
  try {
    return localStorage.getItem('kinship_digest_time') || '08:00';
  } catch {
    return '08:00';
  }
}

/** Splits everyone into: due today or late, due in the next 7 days, and specific dates after that. */
export function buildSchedule(contacts: Contact[], now: Date = new Date()) {
  const today: ScheduleItem[] = [];
  const week: ScheduleItem[] = [];
  const later: ScheduleItem[] = [];
  for (const contact of contacts) {
    const status = calculateContactStatus(contact, now);
    const date = dueDate(contact.nextSpecificFollowUp, status);
    const time = contact.nextSpecificFollowUp?.includes('T') ? contact.nextSpecificFollowUp.split('T')[1].slice(0, 5) : null;
    const item = { contact, date, time, label: dueLabel(status, contact.lastContactedDate) };
    const left = status.daysRemaining ?? Infinity;
    if (status.isOverdue || left <= 0) today.push(item);
    else if (left <= 7) week.push(item);
    else if (contact.nextSpecificFollowUp) later.push(item);
  }
  const byDate = (a: ScheduleItem, b: ScheduleItem) => (a.date || '').localeCompare(b.date || '');
  return { today: today.sort(byDate), week: week.sort(byDate), later: later.sort(byDate).slice(0, LATER_LIMIT) };
}

const Row: React.FC<{ item: ScheduleItem; index: number; onSelect?: () => void; onSapa?: () => void; late?: boolean }> = ({
  item,
  index,
  onSelect,
  onSapa,
  late,
}) => {
  const parts = item.date ? dateParts(item.date) : null;
  const detail = [item.time, item.contact.possibleFollowUpTopic || (late ? null : item.label)].filter(Boolean).join(' · ');
  return (
    <motion.div
      {...rowMotion(index)}
      data-testid={`schedule-item-${item.contact.id}`}
      onClick={onSelect}
      className="flex items-center gap-3 px-3.5 py-3 cursor-pointer active:bg-slate-50 dark:active:bg-white/5"
    >
      {late ? (
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${avatarTone(item.contact.name)}`}>
          {getInitials(item.contact.name)}
        </span>
      ) : (
        <span className="w-11 text-center shrink-0">
          <span className="block text-lg font-bold leading-none">{parts?.day ?? '-'}</span>
          <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 mt-0.5">
            {parts ? `${parts.weekday}` : ''}
          </span>
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate">{item.contact.name}</p>
        {late && <p className="text-xs font-semibold text-rose-500 dark:text-rose-400">{item.label}</p>}
        {detail && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{detail}</p>}
      </div>
      {onSapa && (
        <button
          type="button"
          aria-label={t('Sapa {name}', { name: item.contact.name })}
          onClick={(e) => {
            e.stopPropagation();
            onSapa();
          }}
          className="press w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

const Group: React.FC<{ title: string; count?: number; children: React.ReactNode }> = ({ title, count, children }) => (
  <section aria-label={title} className="space-y-2">
    <div className="flex items-baseline justify-between px-1">
      <h2 className="text-[17px] font-bold">{title}</h2>
      {count !== undefined && <span className="text-xs text-slate-500 dark:text-slate-400">{t('{n} jadwal', { n: count })}</span>}
    </div>
    {children}
  </section>
);

const listClass =
  'rounded-[22px] bg-white/85 dark:bg-[#1C1C1E]/80 border border-white/80 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]';

export const KinshipNotificationsView: React.FC<KinshipNotificationsViewProps> = ({
  contacts,
  onSelectContact,
  onSapa,
  now = new Date(),
}) => {
  const [permission, setPermission] = useState<boolean | null>(null);
  const digestTime = useMemo(readDigestTime, []);
  const { today, week, later } = useMemo(() => buildSchedule(contacts, now), [contacts, now]);

  useEffect(() => {
    checkNotificationPermission().then(setPermission).catch(() => setPermission(null));
  }, []);

  const handleAllow = async () => {
    setPermission(await requestNotificationPermission());
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-3 pb-32 space-y-6 text-slate-900 dark:text-white">
      <header>
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">{t("Jadwal")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('Pengingat harian jam {time}', { time: digestTime })}</p>
      </header>

      {permission === false && (
        <div className="flex items-center gap-3 p-3.5 rounded-[20px] bg-amber-500/10 border border-amber-500/25">
          <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="flex-1 text-[13px] text-slate-700 dark:text-slate-200">{t("Notifikasi belum diizinkan, jadi pengingat tidak muncul di HP.")}</p>
          <button
            type="button"
            onClick={handleAllow}
            className="press shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-white bg-amber-500"
          >
            {t("Izinkan")}
          </button>
        </div>
      )}

      <Group title={t("Hari ini")}>
        {today.length === 0 ? (
          <EmptyState tone="success" icon={<CalendarCheck className="w-7 h-7" />} title={t("Tidak ada jadwal hari ini")} body={t('Semua kontak dalam ritme aman.')} />
        ) : (
          <div className={listClass}>
            {today.map((item, i) => (
              <Row
                key={item.contact.id}
                item={item}
                index={i}
                late
                onSelect={() => onSelectContact?.(item.contact)}
                onSapa={onSapa ? () => onSapa(item.contact) : undefined}
              />
            ))}
          </div>
        )}
      </Group>

      {week.length > 0 && (
        <Group title={t("Minggu ini")} count={week.length}>
          <div className={listClass}>
            {week.map((item, i) => (
              <Row
                key={item.contact.id}
                item={item}
                index={i}
                onSelect={() => onSelectContact?.(item.contact)}
                onSapa={onSapa ? () => onSapa(item.contact) : undefined}
              />
            ))}
          </div>
        </Group>
      )}

      {later.length > 0 && (
        <Group title={t("Nanti")}>
          <div className={listClass}>
            {later.map((item, i) => (
              <Row
                key={item.contact.id}
                item={item}
                index={i}
                onSelect={() => onSelectContact?.(item.contact)}
                onSapa={onSapa ? () => onSapa(item.contact) : undefined}
              />
            ))}
          </div>
        </Group>
      )}
    </div>
  );
};
