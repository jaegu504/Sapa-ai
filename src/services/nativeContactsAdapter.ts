import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import type { RawPhoneContact } from '../types/crm';

export type ContactsPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface DeviceContactsResult {
  contacts: RawPhoneContact[];
  permissionStatus: ContactsPermissionStatus;
}

export interface RawContactInput {
  name?: string;
  phoneNumber?: string;
  associations?: string[];
  isProfessional?: boolean;
}

/**
 * Validates and normalizes phone contacts:
 * - Discards items without phone number or valid name.
 * - Strips leading/trailing whitespace.
 * - Validates phone number (digits >= 5).
 * - Returns clean array of RawPhoneContact.
 */
export function filterValidContacts(contacts: RawContactInput[]): RawPhoneContact[] {
  const result: RawPhoneContact[] = [];

  for (const item of contacts) {
    if (!item) continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const phoneNumber = typeof item.phoneNumber === 'string' ? item.phoneNumber.trim() : '';

    if (!name || !phoneNumber) {
      continue;
    }

    // Must have at least 5 digits in phone number
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 5) {
      continue;
    }

    const cleanContact: RawPhoneContact = {
      name,
      phoneNumber,
      ...(item.associations ? { associations: item.associations } : {}),
      ...(item.isProfessional !== undefined ? { isProfessional: item.isProfessional } : {}),
    };

    result.push(cleanContact);
  }

  return result;
}

/**
 * Realistic sample contacts for testing and desktop browser demo.
 */
export const mockSampleDeviceContacts: RawPhoneContact[] = [
  {
    name: 'Abi Syihab',
    phoneNumber: '0812-3456-7890',
    associations: ['Ihvan'],
    isProfessional: false,
  },
  {
    name: 'Ustadz Hasan',
    phoneNumber: '0813-8899-7766',
    associations: ['Hoca'],
    isProfessional: false,
  },
  {
    name: 'Farhan Maulana',
    phoneNumber: '+628170011223',
    associations: ['Ihvan', 'Zahiri'],
    isProfessional: false,
  },
  {
    name: 'Bunda Sarah',
    phoneNumber: '0811-2233-4455',
    associations: ['Keluarga'],
    isProfessional: false,
  },
  {
    name: 'Dr. Ilham Saputra',
    phoneNumber: '0812-9876-5432',
    associations: ['Teman', 'Profesional'],
    isProfessional: true,
  },
  {
    name: 'Mehmet Yilmaz',
    phoneNumber: '+90 532 999 8877',
    associations: ['Ihvan'],
    isProfessional: false,
  },
  {
    name: 'Ahmad Fauzi',
    phoneNumber: '0821-4455-6677',
    associations: ['Teman'],
    isProfessional: false,
  },
  {
    name: 'Haji Ridwan',
    phoneNumber: '0856-7788-9900',
    associations: ['Ihvan', 'Zahiri'],
    isProfessional: false,
  },
];

function isNativePlatform(): boolean {
  if (
    typeof window !== 'undefined' &&
    typeof (window as any).Capacitor?.isNativePlatform === 'function'
  ) {
    return (window as any).Capacitor.isNativePlatform();
  }
  return (
    Capacitor.isNativePlatform() ||
    Boolean(
      typeof window !== 'undefined' &&
        ((window as any).Capacitor?.Plugins?.Contacts || (window as any).Contacts)
    )
  );
}

export function getContactsPlugin(): any {
  if (typeof window !== 'undefined') {
    const custom = (window as any).Capacitor?.Plugins?.Contacts || (window as any).Contacts;
    if (custom) {
      return custom;
    }
  }
  return Contacts;
}

function parseContactsPayload(contactsArray: any[]): RawPhoneContact[] {
  const rawList: RawContactInput[] = [];
  for (const c of contactsArray) {
    if (!c) continue;
    const name =
      c.displayName ||
      c.name?.display ||
      c.name?.givenName ||
      (c.name?.given ? [c.name.given, c.name.family].filter(Boolean).join(' ') : '') ||
      (typeof c.name === 'string' ? c.name : '') ||
      '';

    let phone = '';
    if (Array.isArray(c.phones) && c.phones.length > 0) {
      const validPhoneObj = c.phones.find((p: any) => p && (p.number || typeof p === 'string'));
      phone = validPhoneObj
        ? validPhoneObj.number || (typeof validPhoneObj === 'string' ? validPhoneObj : '')
        : '';
    } else if (Array.isArray(c.phoneNumbers) && c.phoneNumbers.length > 0) {
      phone = c.phoneNumbers[0]?.number || c.phoneNumbers[0]?.value || '';
    } else if (typeof c.phoneNumber === 'string') {
      phone = c.phoneNumber;
    }

    rawList.push({ name, phoneNumber: phone });
  }
  return filterValidContacts(rawList);
}

/**
 * Detects runtime environment and retrieves device contacts with permission status:
 * 1) If Capacitor Contacts available (native Android / iOS):
 *    - Checks permission via plugin.checkPermissions().
 *    - If not 'granted', requests permission via plugin.requestPermissions().
 *    - If user denies permission, returns { contacts: [], permissionStatus: 'denied' }.
 *    - If granted, calls plugin.getContacts({ projection: { name: true, phones: true } }).
 * 2) Else if Web Contacts API available:
 *    - Queries navigator.contacts.select(['name', 'tel'], { multiple: true }).
 *    - If user cancels (AbortError), returns { contacts: [], permissionStatus: 'denied' }.
 * 3) Else (Desktop browser / unsupported):
 *    - Returns mockSampleDeviceContacts with permissionStatus: 'unsupported'.
 */
export async function getDeviceContactsWithStatus(): Promise<DeviceContactsResult> {
  // 1. Capacitor Contacts plugin (Android / iOS hybrid app)
  if (isNativePlatform()) {
    try {
      const contactsPlugin = getContactsPlugin();
      if (contactsPlugin) {
        let contactGranted = true;

        if (typeof contactsPlugin.checkPermissions === 'function') {
          const checkRes = await contactsPlugin.checkPermissions();
          let status = checkRes?.contacts;

          if (status !== 'granted') {
            if (typeof contactsPlugin.requestPermissions === 'function') {
              const reqRes = await contactsPlugin.requestPermissions();
              status = reqRes?.contacts;
            }
          }

          contactGranted = status === 'granted';
        }

        if (!contactGranted) {
          return { contacts: [], permissionStatus: 'denied' };
        }

        if (typeof contactsPlugin.getContacts === 'function') {
          const result = await contactsPlugin.getContacts({
            projection: { name: true, phones: true },
          });
          const contactsArray = result?.contacts || (Array.isArray(result) ? result : []);
          return {
            contacts: parseContactsPayload(contactsArray),
            permissionStatus: 'granted',
          };
        }
      }
    } catch {
      return { contacts: [], permissionStatus: 'denied' };
    }
  }

  // 2. Web Contacts Picker API (Chrome Android / modern browsers with support)
  if (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    typeof window !== 'undefined' &&
    'ContactsManager' in window
  ) {
    try {
      const selected = await (navigator as any).contacts.select(['name', 'tel'], {
        multiple: true,
      });
      const rawList: RawContactInput[] = [];
      if (Array.isArray(selected)) {
        for (const item of selected) {
          const name = Array.isArray(item.name) ? item.name[0] : item.name;
          const phone = Array.isArray(item.tel) ? item.tel[0] : item.tel;
          rawList.push({ name, phoneNumber: phone });
        }
      }
      return {
        contacts: filterValidContacts(rawList),
        permissionStatus: 'granted',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { contacts: [], permissionStatus: 'denied' };
      }
      throw err;
    }
  }

  // 3. Desktop browser fallback / demo contacts
  return {
    contacts: [...mockSampleDeviceContacts],
    permissionStatus: 'unsupported',
  };
}

/**
 * Backward-compatible helper returning contacts list directly.
 */
export async function getDeviceContacts(): Promise<RawPhoneContact[]> {
  const result = await getDeviceContactsWithStatus();
  return result.contacts;
}

