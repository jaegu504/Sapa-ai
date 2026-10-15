import React, { useState, useMemo } from 'react';
import {
  Bell,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Send,
  AlarmClock,
  X,
  Mail,
  Zap,
} from 'lucide-react';
import { Contact } from '../../types/crm';
import { calculateContactStatus } from '../../utils/status';
import {
  getDailyDigestItems,
  getUpcomingAlarms,
  requestNotificationPermission,
  scheduleDailyMorningDigest,
} from '../../services/notificationService';
import { CadenceBadge } from './CadenceBadge';
import { DualWhatsAppButton } from './DualWhatsAppButton';

export interface KinshipNotificationsViewProps {
  contacts: Contact[];
  onSelectContact?: (contact: Contact) => void;
  onOpenAiDraft?: (contact: Contact) => void;
  onLogChat?: (contact: Contact) => void;
  onSnoozeContact?: (contact: Contact, days: number) => Promise<void> | void;
  now?: Date;
}

type TabType = 'upcoming' | 'inbox' | 'cadence';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function generateIcebreaker(contact: Contact): string {
  if (contact.possibleFollowUpTopic && contact.possibleFollowUpTopic.trim()) {
    return `Hai ${contact.name}, kemarin sempat dengar cerita tentang ${contact.possibleFollowUpTopic.trim()}, gimana kabarnya sekarang?`;
  }
  if (contact.lastUpdateNotes && contact.lastUpdateNotes.trim()) {
    return `Hai ${contact.name}, ngomong-ngomong soal ${contact.lastUpdateNotes.trim()}, apa kabar minggu ini?`;
  }
  return `Hai ${contact.name}, apa kabar? Semoga harimu menyenangkan dan sehat selalu!`;
}

export function calculateDaysUntilWeekend(now: Date): number {
  const day = now.getDay(); // 0: Sunday, 1: Mon, ..., 6: Sat
  const diff = (6 - day + 7) % 7;
  return diff === 0 ? 7 : diff;
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function formatAgendaDateLabel(date: Date, now: Date): string {
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const dayName = INDONESIAN_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];

  if (isSameDay) return `Hari Ini · ${dayName}, ${dayNum} ${monthName}`;
  if (isTomorrow) return `Besok · ${dayName}, ${dayNum} ${monthName}`;
  return `${dayName}, ${dayNum} ${monthName}`;
}

export const KinshipNotificationsView: React.FC<KinshipNotificationsViewProps> = ({
  contacts,
  onSelectContact,
  onOpenAiDraft,
  onLogChat,
  onSnoozeContact,
  now = new Date(),
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [morningDigestEnabled, setMorningDigestEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [autoOpenWaEnabled, setAutoOpenWaEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [snoozedContactIds, setSnoozedContactIds] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 1. Calculate Today's Catch-ups
  const { todayCatchUps, overdueCount, alarmsCount } = useMemo(() => {
    const dailyDigest = getDailyDigestItems(contacts, now);
    const upcomingAlarms = getUpcomingAlarms(contacts, 24, now);

    const overdueContacts = dailyDigest.contacts;

    // Map unique contacts for today, preventing duplicate IDs or identical phone numbers
    const map = new Map<string, { contact: Contact; isAlarm: boolean; alarmTopic?: string }>();
    const seenPhones = new Set<string>();

    upcomingAlarms.forEach((alarm) => {
      const c = contacts.find((item) => item.id === alarm.contactId);
      if (c) {
        const phone = c.phoneNumber?.replace(/\D/g, '');
        if (!phone || !seenPhones.has(phone)) {
          if (phone) seenPhones.add(phone);
          map.set(c.id, { contact: c, isAlarm: true, alarmTopic: alarm.topic });
        }
      }
    });

    overdueContacts.forEach((c) => {
      const phone = c.phoneNumber?.replace(/\D/g, '');
      if (!map.has(c.id) && (!phone || !seenPhones.has(phone))) {
        if (phone) seenPhones.add(phone);
        map.set(c.id, { contact: c, isAlarm: false });
      }
    });

    const items = Array.from(map.values())
      .filter((item) => !snoozedContactIds[item.contact.id])
      .map((item) => {
        const status = calculateContactStatus(item.contact, now);
        return {
          ...item,
          status,
        };
      })
      .sort((a, b) => {
        // Prioritize by days overdue descending (most urgent cadence first), then alarms
        if (b.status.daysOverdue !== a.status.daysOverdue) {
          return b.status.daysOverdue - a.status.daysOverdue;
        }
        if (a.isAlarm && !b.isAlarm) return -1;
        if (!a.isAlarm && b.isAlarm) return 1;
        return a.contact.name.localeCompare(b.contact.name);
      });

    return {
      todayCatchUps: items,
      overdueCount: overdueContacts.length,
      alarmsCount: upcomingAlarms.length,
    };
  }, [contacts, now, snoozedContactIds]);

  // 2. Calculate This Week's Agenda (Next 7 days)
  const weeklyAgenda = useMemo(() => {
    const startMs = now.getTime();
    const endMs = startMs + 7 * 24 * 60 * 60 * 1000;
    const todayIdSet = new Set(todayCatchUps.map((i) => i.contact.id));

    interface AgendaItem {
      contact: Contact;
      targetDate: Date;
      formattedDate: string;
      topic: string;
    }

    const items: AgendaItem[] = [];

    contacts.forEach((contact) => {
      if (todayIdSet.has(contact.id)) return;

      // Check nextSpecificFollowUp
      if (contact.nextSpecificFollowUp && contact.nextSpecificFollowUp.trim()) {
        const d = new Date(contact.nextSpecificFollowUp);
        if (!isNaN(d.getTime())) {
          const t = d.getTime();
          // Check if strictly after today and within next 7 days
          if (t > startMs && t <= endMs) {
            items.push({
              contact,
              targetDate: d,
              formattedDate: formatAgendaDateLabel(d, now),
              topic:
                contact.possibleFollowUpTopic?.trim() ||
                contact.lastUpdateNotes?.trim() ||
                'Jadwal follow-up khusus',
            });
            return;
          }
        }
      }

      // Check cadence suggestedDate if not overdue
      const status = calculateContactStatus(contact, now);
      if (!status.isOverdue && status.suggestedDate) {
        const d = new Date(status.suggestedDate);
        if (!isNaN(d.getTime())) {
          const t = d.getTime();
          if (t > startMs && t <= endMs) {
            items.push({
              contact,
              targetDate: d,
              formattedDate: formatAgendaDateLabel(d, now),
              topic:
                contact.possibleFollowUpTopic?.trim() ||
                contact.lastUpdateNotes?.trim() ||
                'Siklus follow-up berkala',
            });
          }
        }
      }
    });

    items.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
    return items;
  }, [contacts, now, todayCatchUps]);

  const handleSnooze = async (contact: Contact, days: number) => {
    setSnoozedContactIds((prev) => ({ ...prev, [contact.id]: days }));
    try {
      await onSnoozeContact?.(contact, days);
      showToast(`Ditunda ${days} hari untuk ${contact.name}`);
    } catch {
      showToast(`Gagal menunda jadwal untuk ${contact.name}`);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      showToast('Izin notifikasi sistem berhasil diaktifkan');
    } else {
      showToast('Izin notifikasi belum diberikan oleh sistem');
    }
  };

  const handleTestNotification = async () => {
    try {
      await scheduleDailyMorningDigest(contacts);
      showToast('Notifikasi uji coba berhasil dikirim!');
    } catch {
      showToast('Gagal mengirim notifikasi uji coba');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* 1. Header Bar (in-flow to cleanly align below application topbar) */}
      <header className="pt-2 pb-1">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Jadwal & Pengingat</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                🔔 Jam 08:00 WIB Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Sapaan terencana & agenda minggu ini</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
              {todayCatchUps.length} Pending Hari Ini
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col gap-5 w-full">
        {/* Interactive Segmented Tabs */}
        <div className="w-full bg-slate-200/80 p-1 rounded-full flex items-center justify-between shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold text-center transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming Catch-ups
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Inbox</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cadence')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold text-center transition-all ${
              activeTab === 'cadence'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cadence Rules
          </button>
        </div>

        {/* Tab 1: Upcoming & Daily Queue */}
        {activeTab === 'upcoming' && (
          <div className="flex flex-col gap-5 w-full">
            {/* Daily Morning Digest Banner */}
            {!dismissedBanner && (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 shadow-sm relative overflow-hidden flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-700 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                      Digest Status
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Daily Morning Digest Sent</p>
                  <p className="text-xs text-slate-600 truncate">
                    Ringkasan sapaan harian dikirim setiap <span className="font-medium text-slate-800">08:00 WIB</span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup banner digest"
                  onClick={() => setDismissedBanner(true)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Section: Today's Follow-Up Notifications */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-slate-900">Today's Reminders</h2>
                </div>
                <span className="bg-slate-200/70 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {todayCatchUps.length} Pending
                </span>
              </div>

              {/* Empty State */}
              {todayCatchUps.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                    🌟
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">
                      Semua hubungan dalam ritme harmonis hari ini 🌟
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Tidak ada relasi yang terlambat disapa atau jadwal alarm mendesak untuk hari ini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {todayCatchUps.map((item, index) => {
                    const contact = item.contact;
                    const icebreaker = generateIcebreaker(contact);
                    const isTopHero = index === 0;

                    return (
                      <div
                        key={contact.id}
                        className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3.5 relative overflow-hidden transition-all ${
                          isTopHero ? 'ring-1 ring-emerald-500/20' : ''
                        }`}
                      >
                        {/* Glow bar marker on the left */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                            item.isAlarm ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />

                        {/* Top Contact Row */}
                        <div className="flex items-start justify-between gap-3 pl-1.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div
                              onClick={() => onSelectContact?.(contact)}
                              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              {getInitials(contact.name)}
                            </div>

                            {/* Contact Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3
                                  onClick={() => onSelectContact?.(contact)}
                                  className="text-base font-bold text-slate-900 truncate hover:text-emerald-700 cursor-pointer transition-colors"
                                >
                                  {contact.name}
                                </h3>
                                {contact.associations && contact.associations[0] && (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                    {contact.associations[0]}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <CadenceBadge
                                  cadenceDays={contact.followUpCycleDays}
                                  isOverdue={item.status.isOverdue}
                                  daysLeftOrOverdue={item.status.daysOverdue}
                                />
                                {item.isAlarm && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    Alarm Hari Ini
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="shrink-0 text-right text-[11px] font-bold uppercase bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200">
                            Today
                          </span>
                        </div>

                        {/* AI Icebreaker Box */}
                        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100/80 ml-1.5 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span className="uppercase tracking-wide text-[10px] font-bold text-slate-500">
                                Rekomendasi Icebreaker
                              </span>
                            </div>
                            {onOpenAiDraft && (
                              <button
                                type="button"
                                onClick={() => onOpenAiDraft(contact)}
                                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5"
                              >
                                <span>AI Draft</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 italic leading-relaxed">
                            "{icebreaker}"
                          </p>
                        </div>

                        {/* Snooze Options Bar */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 ml-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Tunda:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSnooze(contact, 3)}
                            className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-medium rounded-full transition-all border border-slate-200/60"
                          >
                            +3 Hari
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnooze(contact, calculateDaysUntilWeekend(now))}
                            className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-medium rounded-full transition-all border border-slate-200/60"
                          >
                            Akhir Pekan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnooze(contact, 7)}
                            className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-medium rounded-full transition-all border border-slate-200/60"
                          >
                            Minggu Depan (+7 hr)
                          </button>
                        </div>

                        {/* Dual WhatsApp Dispatch Action */}
                        <div className="ml-1.5 pt-1">
                          <DualWhatsAppButton
                            phoneNumber={contact.phoneNumber}
                            draftText={icebreaker}
                            onChatLogged={() => onLogChat?.(contact)}
                            size="sm"
                            layout="row"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section: Agenda Minggu Ini */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">Agenda Minggu Ini</h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {weeklyAgenda.length} Sapaan Terjadwal
                </span>
              </div>

              {weeklyAgenda.length === 0 ? (
                <div className="bg-white rounded-2xl p-5 text-center border border-slate-100 shadow-sm text-slate-500 text-xs">
                  Tidak ada jadwal follow-up khusus dalam 7 hari ke depan.
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                  {weeklyAgenda.map((item) => {
                    const contact = item.contact;
                    return (
                      <div
                        key={contact.id}
                        className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl flex items-center justify-between gap-3 border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            onClick={() => onSelectContact?.(contact)}
                            className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
                          >
                            {getInitials(contact.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                onClick={() => onSelectContact?.(contact)}
                                className="text-sm font-semibold text-slate-900 truncate hover:text-emerald-700 cursor-pointer"
                              >
                                {contact.name}
                              </h4>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                                {item.formattedDate}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{item.topic}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 w-auto">
                          <DualWhatsAppButton
                            phoneNumber={contact.phoneNumber}
                            draftText={generateIcebreaker(contact)}
                            onChatLogged={() => onLogChat?.(contact)}
                            size="sm"
                            layout="row"
                            variant="compact"
                            className="!w-auto"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section: Queue & Dispatch Settings */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-slate-600" />
                  <h3 className="text-base font-bold text-slate-900">Queue & Dispatch Settings</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Auto-sync ON
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Toggle 1: Daily Morning Digest */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        Daily Morning Digest (08:00 WIB)
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Ringkasan sapaan harian dikirim setiap jam 08:00 WIB
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={morningDigestEnabled}
                    onChange={(e) => setMorningDigestEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>

                {/* Toggle 2: Receive Push Notifications */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        Receive Push Notifications
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Pengingat langsung untuk relasi yang melewati batas siklus
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotificationsEnabled}
                    onChange={(e) => setPushNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>

                {/* Toggle 3: Auto-open WhatsApp */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        Auto-open WhatsApp
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Langsung buka template pesan saat tombol sapa ditekan
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoOpenWaEnabled}
                    onChange={(e) => setAutoOpenWaEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="flex-1 min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {permissionGranted ? 'Izin Notifikasi Aktif' : 'Minta Izin Notifikasi Sistem'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="flex-1 min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <AlarmClock className="w-4 h-4" />
                  <span>Kirim Notifikasi Uji Coba</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inbox View */}
        {activeTab === 'inbox' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent System Alerts</h3>
              <button
                type="button"
                onClick={() => showToast('Semua notifikasi ditandai telah dibaca')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Mark all read
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-3 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">Morning Digest Dispatched</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {overdueCount} relasi disarankan untuk disapa pagi ini sesuai ritme intim.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Hari ini, 08:00 WIB</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-3 border border-slate-100">
                <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">Kalender & Alarm Aktif</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {alarmsCount} jadwal alarm sapaan spesifik telah disinkronkan ke sistem lokal.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Kemarin, 21:00 WIB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cadence Rules View */}
        {activeTab === 'cadence' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cadence Intervals & Rhythms</h3>
              <p className="text-xs text-slate-500 mt-1">
                Frekuensi sapaan berkala default yang menjaga ritme silaturahmi tetap harmonis.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">Inner Circle (Keluarga & Sahabat)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Weekly nudge (Setiap 7 hari)</p>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">Key Collaborators & Mentors</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bi-weekly / Monthly (Setiap 14-21 hari)</p>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">Extended Network & Alumni</p>
                  <p className="text-xs text-slate-500 mt-0.5">Quarterly (Setiap 60-90 hari)</p>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Micro Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 pointer-events-none transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
