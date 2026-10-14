import type { RawPhoneContact } from '../types/crm';

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

/**
 * Detects runtime environment and retrieves device contacts:
 * 1) If Capacitor Contacts available, queries native contacts.
 * 2) Else if Web Contacts API available, selects contacts via navigator.contacts.select.
 * 3) Else returns sample/demo contacts for desktop browser testing.
 */
export async function getDeviceContacts(): Promise<RawPhoneContact[]> {
  // 1. Capacitor Contacts plugin (Android/iOS hybrid app)
  if (
    typeof window !== 'undefined' &&
    ((window as any).Capacitor?.Plugins?.Contacts || (window as any).Contacts)
  ) {
    try {
      const contactsPlugin =
        (window as any).Capacitor?.Plugins?.Contacts || (window as any).Contacts;
      if (typeof contactsPlugin.getContacts === 'function') {
        const result = await contactsPlugin.getContacts({
          projection: { name: true, phones: true },
        });
        const rawList: RawContactInput[] = [];
        const contactsArray = result?.contacts || (Array.isArray(result) ? result : []);
        for (const c of contactsArray) {
          const name =
            c.displayName ||
            c.name?.display ||
            c.name?.givenName ||
            (typeof c.name === 'string' ? c.name : '') ||
            '';
          const phone =
            c.phones?.[0]?.number ||
            c.phoneNumbers?.[0]?.number ||
            c.phoneNumbers?.[0]?.value ||
            c.phoneNumber ||
            (typeof c.phones?.[0] === 'string' ? c.phones[0] : '') ||
            '';
          rawList.push({ name, phoneNumber: phone });
        }
        return filterValidContacts(rawList);
      }
    } catch {
      // Fallback
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
      return filterValidContacts(rawList);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return [];
      }
      throw err;
    }
  }

  // 3. Desktop browser fallback / demo contacts
  return [...mockSampleDeviceContacts];
}
