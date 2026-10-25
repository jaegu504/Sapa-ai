import React, { useMemo } from 'react';
import { t } from '../../i18n';
import { motion } from 'motion/react';
import { Bell, Check, ChevronRight, MessageCircle, UserPlus } from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import { avatarTone, dateParts, dueDate, dueLabel, getInitials } from '../../utils/display';
import { KinshipPulseArc } from './KinshipPulseArc';
import { EmptyState } from '../ui/EmptyState';

export interface KinshipDashboardViewProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  /** Bell and "Lihat semua": open the contacts list filtered to who needs a greeting. */
  onOpenNotifications?: () => void;
  onSapa?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  onAddContact?: () => void;
  now?: Date;
}

const DUE_PREVIEW = 5;

export const rowMotion = (index: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: Math.min(index, 8) * 0.04, type: 'spring', damping: 26, stiffness: 300 } as const,
});

export const KinshipDashboardView: React.FC<KinshipDashboardViewProps> = ({
  contacts,
  onSelectContact,
  onOpenNotifications,
  onSapa,
  onLogChat,
  onAddContact,
  now = new Date(),
}) => {
  const { activeCount, dueCount, pausedCount, healthScore, dueContacts, upcoming } = useMemo(() => {
    let paused = 0;
    const withStatus = contacts.map((contact) => {
      if (typeof contact.followUpCycleDays === 'number' && contact.followUpCycleDays <= 0) paused += 1;
      return { contact, status: calculateContactStatus(contact, now) };
    });
    const due = withStatus.filter(({ status }) => status.isOverdue).sort((a, b) => b.status.daysOverdue - a.status.daysOverdue);
    const soon = withStatus
      .filter(({ status }) => !status.isOverdue && (status.daysRemaining ?? Infinity) <= 7)
      .sort((a, b) => (a.status.daysRemaining ?? 0) - (b.status.daysRemaining ?? 0));
    const active = contacts.length;
    return {
      activeCount: active,
      dueCount: due.length,
      pausedCount: paused,
      healthScore: active === 0 ? 100 : Math.round(((active - due.length) / active) * 100),
      dueContacts: due,
      upcoming: soon,
    };
  }, [contacts, now]);

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 pt-3 pb-32 space-y-6 text-slate-900 dark:text-white">
      <header className="flex items-center justify-between">
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">{t("Radar Sapa")}</h1>
        <button
          type="button"
          aria-label={t("Lihat kontak yang perlu disapa")}
          onClick={onOpenNotifications}
          className="press relative w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 border border-white/80 dark:border-white/15 text-slate-700 dark:text-slate-200 flex items-center justify-center"
        >
          <Bell className="w-[18px] h-[18px]" />
          {dueCount > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[#F2F2F7] dark:ring-[#090A0F]"
            >
              {dueCount}
            </span>
          )}
        </button>
      </header>

      <section aria-label={t("Denyut Sapa")} data-tour="radar-pulse">
        <KinshipPulseArc score={healthScore} activeCount={activeCount} dueCount={dueCount} pausedCount={pausedCount} />
      </section>

      {contacts.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-7 h-7" />}
          title={t("Belum ada kontak")}
          body={t('Tambahkan orang-orang yang ingin Anda jaga silaturahminya.')}
          actionLabel={onAddContact ? t('Tambah kontak') : undefined}
          onAction={onAddContact}
        />
      ) : (
        <>
          <section aria-label={t("Perlu disapa")} className="space-y-2">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-[17px] font-bold">{t("Perlu disapa")}</h2>
              {dueContacts.length > 0 && (
                <button type="button" onClick={onOpenNotifications} className="text-sm font-semibold text-blue-600 dark:text-cyan-400">
                  {t("Lihat semua")}
                </button>
              )}
            </div>

            {dueContacts.length === 0 ? (
              <EmptyState
                tone="success"
                icon={<Check className="w-7 h-7" />}
                title={t("Semua aman hari ini")}
                body={t('Tidak ada yang perlu disapa sekarang.')}
              />
            ) : (
              <div className="rounded-[22px] bg-white/85 dark:bg-[#1C1C1E]/80 border border-white/80 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]">
                {dueContacts.slice(0, DUE_PREVIEW).map(({ contact, status }, i) => (
                  <motion.div
                    key={contact.id}
                    {...rowMotion(i)}
                    data-testid={`attention-card-${contact.id}`}
                    onClick={() => onSelectContact(contact)}
                    className="flex items-center gap-3 px-3.5 py-3 cursor-pointer active:bg-slate-50 dark:active:bg-white/5"
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${avatarTone(contact.name)}`}>
                      {getInitials(contact.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate">{contact.name}</p>
                      <p className="text-xs font-semibold text-rose-500 dark:text-rose-400">{dueLabel(status, contact.lastContactedDate)}</p>
                      {contact.possibleFollowUpTopic && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('Topik:')} {contact.possibleFollowUpTopic}</p>
                      )}
                    </div>
                    {onLogChat && (
                      <button
                        type="button"
                        aria-label={t('Tandai sudah sapa {name}', { name: contact.name })}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogChat(contact);
                        }}
                        className="press w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200 shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {onSapa && (
                      <button
                        type="button"
                        aria-label={t('Sapa {name}', { name: contact.name })}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSapa(contact);
                        }}
                        className="press w-9 h-9 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-[0_6px_14px_-6px_rgba(37,211,102,0.8)] shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {upcoming.length > 0 && (
            <section aria-label={t("7 hari ke depan")} className="space-y-2">
              <h2 className="text-[17px] font-bold px-1">{t("7 hari ke depan")}</h2>
              <div className="rounded-[22px] bg-white/85 dark:bg-[#1C1C1E]/80 border border-white/80 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.07]">
                {upcoming.map(({ contact, status }, i) => {
                  const date = dueDate(contact.nextSpecificFollowUp, status);
                  const parts = date ? dateParts(date) : null;
                  return (
                    <motion.button
                      type="button"
                      key={contact.id}
                      {...rowMotion(i)}
                      data-testid={`radar-item-${contact.id}`}
                      onClick={() => onSelectContact(contact)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-slate-50 dark:active:bg-white/5"
                    >
                      <span className="w-11 text-center shrink-0">
                        <span className="block text-lg font-bold leading-none">{parts?.day ?? '-'}</span>
                        <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 mt-0.5">{parts?.weekday}</span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold truncate">{contact.name}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                          {contact.possibleFollowUpTopic || dueLabel(status, contact.lastContactedDate)}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
