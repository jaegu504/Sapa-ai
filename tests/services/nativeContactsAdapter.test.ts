import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  filterValidContacts,
  getDeviceContacts,
  mockSampleDeviceContacts,
} from '../../src/services/nativeContactsAdapter';

describe('nativeContactsAdapter', () => {
  describe('filterValidContacts', () => {
    it('discards contacts with missing or empty name', () => {
      const input = [
        { name: '', phoneNumber: '+628123456789' },
        { name: '   ', phoneNumber: '+628123456789' },
        { name: undefined, phoneNumber: '+628123456789' },
        { name: 'Ahmad Fauzi', phoneNumber: '+628123456789' },
      ];

      const result = filterValidContacts(input);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ahmad Fauzi');
    });

    it('discards contacts with missing or empty phoneNumber', () => {
      const input = [
        { name: 'Ahmad', phoneNumber: '' },
        { name: 'Budi', phoneNumber: '   ' },
        { name: 'Chandra', phoneNumber: undefined },
        { name: 'Dedi', phoneNumber: '+628123456789' },
      ];

      const result = filterValidContacts(input);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dedi');
    });

    it('discards contacts with fewer than 5 phone digits', () => {
      const input = [
        { name: 'Short 1', phoneNumber: '123' },
        { name: 'Short 2', phoneNumber: '+12' },
        { name: 'No digits', phoneNumber: 'call-me-now' },
        { name: 'Valid Min 5', phoneNumber: '12345' },
        { name: 'Valid Standard', phoneNumber: '0812-3456-7890' },
      ];

      const result = filterValidContacts(input);
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(['Valid Min 5', 'Valid Standard']);
    });

    it('strips leading and trailing whitespace from name and phoneNumber', () => {
      const input = [
        { name: '  Ustadz Hasan  ', phoneNumber: '  +6281234567890  ' },
      ];

      const result = filterValidContacts(input);
      expect(result).toEqual([
        {
          name: 'Ustadz Hasan',
          phoneNumber: '+6281234567890',
        },
      ]);
    });

    it('preserves associations and isProfessional if provided', () => {
      const input = [
        {
          name: 'Dr. Ilham',
          phoneNumber: '+628199887766',
          associations: ['Teman', 'Profesional'],
          isProfessional: true,
        },
      ];

      const result = filterValidContacts(input);
      expect(result).toEqual([
        {
          name: 'Dr. Ilham',
          phoneNumber: '+628199887766',
          associations: ['Teman', 'Profesional'],
          isProfessional: true,
        },
      ]);
    });
  });

  describe('mockSampleDeviceContacts', () => {
    it('contains realistic sample contacts that all pass validation', () => {
      expect(mockSampleDeviceContacts.length).toBeGreaterThanOrEqual(5);
      const validated = filterValidContacts(mockSampleDeviceContacts);
      expect(validated.length).toBe(mockSampleDeviceContacts.length);
    });
  });

  describe('getDeviceContacts', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      // restore globals if modified
      if (typeof window !== 'undefined') {
        delete (window as any).Capacitor;
        delete (window as any).Contacts;
        delete (window as any).ContactsManager;
      }
      if (typeof navigator !== 'undefined') {
        delete (navigator as any).contacts;
      }
    });

    it('queries Capacitor Contacts when Capacitor plugin is available', async () => {
      const mockGetContacts = vi.fn().mockResolvedValue({
        contacts: [
          {
            displayName: 'Capacitor Contact',
            phones: [{ number: '081234567890' }],
          },
          {
            displayName: 'Invalid No Phone',
            phones: [],
          },
        ],
      });

      (window as any).Capacitor = {
        Plugins: {
          Contacts: {
            getContacts: mockGetContacts,
          },
        },
      };

      const result = await getDeviceContacts();
      expect(mockGetContacts).toHaveBeenCalled();
      expect(result).toEqual([
        {
          name: 'Capacitor Contact',
          phoneNumber: '081234567890',
        },
      ]);
    });

    it('queries Web Contacts API when available in navigator and window', async () => {
      const mockSelect = vi.fn().mockResolvedValue([
        {
          name: ['Web Contact 1'],
          tel: ['+6281299887766'],
        },
        {
          name: ['Web Contact 2'],
          tel: ['085611223344'],
        },
      ]);

      (window as any).ContactsManager = function () {};
      (navigator as any).contacts = {
        select: mockSelect,
      };

      const result = await getDeviceContacts();
      expect(mockSelect).toHaveBeenCalledWith(['name', 'tel'], { multiple: true });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Web Contact 1');
      expect(result[0].phoneNumber).toBe('+6281299887766');
    });

    it('returns empty array when Web Contacts API throws AbortError (user cancelled)', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      (window as any).ContactsManager = function () {};
      (navigator as any).contacts = {
        select: vi.fn().mockRejectedValue(abortError),
      };

      const result = await getDeviceContacts();
      expect(result).toEqual([]);
    });

    it('falls back to mockSampleDeviceContacts on desktop browser without native or web contact picker', async () => {
      delete (window as any).Capacitor;
      delete (window as any).Contacts;
      delete (window as any).ContactsManager;
      delete (navigator as any).contacts;

      const result = await getDeviceContacts();
      expect(result).toEqual(mockSampleDeviceContacts);
    });
  });
});
