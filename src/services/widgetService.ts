import { Capacitor } from '@capacitor/core';
import type { Contact } from '../types/crm';
import { calculateContactStatus } from '../utils/status';
import { WhatsAppLauncher } from '../utils/whatsapp';
import { t } from '../i18n';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Widget data: every contact's next due date (past dates = overdue). The widget compares them
 * with its own "today", so it stays right on later days without the app being opened.
 */
export function buildWidgetData(contacts: Contact[], now: Date = new Date()) {
  const items = contacts.map((c) => {
    const status = calculateContactStatus(c, now);
    const shift = status.isOverdue ? -status.daysOverdue : status.daysRemaining ?? 0;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + shift);
    return {
      id: c.id,
      n: c.name,
      d: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      p: c.phoneNumber,
      t: c.possibleFollowUpTopic ? `${t('Topik:')} ${c.possibleFollowUpTopic}` : '',
      ...(c.lastContactedDate === null && !c.nextSpecificFollowUp ? { nv: 1 } : {}),
    };
  });
  return {
    title: t('Perlu disapa'),
    empty: t('Semua aman hari ini'),
    // {n} is filled in by the widget, which counts days itself.
    overdue: t('Lewat {n} hari', { n: '{n}' }),
    today: t('Hari ini'),
    never: t('Belum disapa'),
    items,
  };
}

export async function syncWidget(contacts: Contact[]): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await WhatsAppLauncher.updateWidget({ data: JSON.stringify(buildWidgetData(contacts)) });
  } catch {
    // Older native build without the widget: nothing to update.
  }
}
