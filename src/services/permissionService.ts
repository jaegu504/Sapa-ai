import { WhatsAppLauncher } from '../utils/whatsapp';
import { getContactsPlugin } from './nativeContactsAdapter';
import {
  isNativePlatform,
  checkNotificationPermission,
  requestNotificationPermission,
} from './notificationService';

export type PermissionState = 'granted' | 'denied' | 'unavailable';

async function contactsStatus(method: 'checkPermissions' | 'requestPermissions'): Promise<PermissionState> {
  if (!isNativePlatform()) return 'unavailable';
  try {
    const plugin = getContactsPlugin();
    if (!plugin || typeof plugin[method] !== 'function') return 'unavailable';
    const res = await plugin[method]();
    return res?.contacts === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export const checkContactsPermission = () => contactsStatus('checkPermissions');
export const requestContactsPermission = () => contactsStatus('requestPermissions');

async function notificationsStatus(fn: () => Promise<boolean>): Promise<PermissionState> {
  if (!isNativePlatform()) return 'unavailable';
  try {
    return (await fn()) ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export const checkNotificationsPermission = () => notificationsStatus(checkNotificationPermission);
export const requestNotificationsPermission = () => notificationsStatus(requestNotificationPermission);

/** Opens Sapa's Android app-info page so the user can enable permissions manually. */
export async function openAppSettings(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await WhatsAppLauncher.openAppSettings();
  } catch {
    // Older APKs without the native method: nothing else we can do.
  }
}
