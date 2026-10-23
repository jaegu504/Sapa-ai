import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const openAppSettingsMock = vi.fn();
vi.mock('../../src/utils/whatsapp', () => ({
  WhatsAppLauncher: { openAppSettings: (...args: unknown[]) => openAppSettingsMock(...args) },
}));

const checkNotif = vi.fn();
const requestNotif = vi.fn();
vi.mock('../../src/services/notificationService', () => ({
  isNativePlatform: () => Boolean((window as any).Capacitor?.isNativePlatform?.()),
  checkNotificationPermission: () => checkNotif(),
  requestNotificationPermission: () => requestNotif(),
}));

import {
  checkContactsPermission,
  requestContactsPermission,
  checkNotificationsPermission,
  requestNotificationsPermission,
  openAppSettings,
} from '../../src/services/permissionService';

function setNative(contactsPlugin?: Record<string, unknown>) {
  (window as any).Capacitor = {
    isNativePlatform: () => true,
    Plugins: contactsPlugin ? { Contacts: contactsPlugin } : {},
  };
}

describe('permissionService', () => {
  beforeEach(() => {
    openAppSettingsMock.mockReset();
    checkNotif.mockReset();
    requestNotif.mockReset();
  });
  afterEach(() => {
    delete (window as any).Capacitor;
  });

  it('returns unavailable on web for all four check/request functions', async () => {
    expect(await checkContactsPermission()).toBe('unavailable');
    expect(await requestContactsPermission()).toBe('unavailable');
    expect(await checkNotificationsPermission()).toBe('unavailable');
    expect(await requestNotificationsPermission()).toBe('unavailable');
    expect(checkNotif).not.toHaveBeenCalled();
  });

  it('requestContactsPermission returns granted when plugin grants', async () => {
    setNative({ requestPermissions: vi.fn().mockResolvedValue({ contacts: 'granted' }) });
    expect(await requestContactsPermission()).toBe('granted');
  });

  it('requestContactsPermission returns denied when plugin denies', async () => {
    setNative({ requestPermissions: vi.fn().mockResolvedValue({ contacts: 'denied' }) });
    expect(await requestContactsPermission()).toBe('denied');
  });

  it('checkContactsPermission reads plugin status without prompting', async () => {
    const requestPermissions = vi.fn();
    setNative({ checkPermissions: vi.fn().mockResolvedValue({ contacts: 'granted' }), requestPermissions });
    expect(await checkContactsPermission()).toBe('granted');
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it('notification helpers map booleans on native', async () => {
    setNative();
    checkNotif.mockResolvedValue(false);
    requestNotif.mockResolvedValue(true);
    expect(await checkNotificationsPermission()).toBe('denied');
    expect(await requestNotificationsPermission()).toBe('granted');
  });

  it('openAppSettings calls WhatsAppLauncher.openAppSettings on native', async () => {
    setNative();
    openAppSettingsMock.mockResolvedValue(undefined);
    await openAppSettings();
    expect(openAppSettingsMock).toHaveBeenCalledTimes(1);
  });

  it('openAppSettings does nothing on web', async () => {
    await openAppSettings();
    expect(openAppSettingsMock).not.toHaveBeenCalled();
  });

  it('openAppSettings swallows plugin errors', async () => {
    setNative();
    openAppSettingsMock.mockRejectedValue(new Error('boom'));
    await expect(openAppSettings()).resolves.toBeUndefined();
  });
});
