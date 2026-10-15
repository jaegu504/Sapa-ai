import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  filterValidContacts,
  getDeviceContacts,
  getDeviceContactsWithStatus,
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

  describe('getDeviceContactsWithStatus', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      if (typeof window !== 'undefined') {
        delete (window as any).Capacitor;
        delete (window as any).Contacts;
        delete (window as any).ContactsManager;
      }
      if (typeof navigator !== 'undefined') {
        delete (navigator as any).contacts;
      }
    });

    it('returns permissionStatus: granted and mapped contacts when Contacts plugin grants permission', async () => {
      const mockCheckPermissions = vi.fn().mockResolvedValue({ contacts: 'granted' });
      const mockRequestPermissions = vi.fn().mockResolvedValue({ contacts: 'granted' });
      const mockGetContacts = vi.fn().mockResolvedValue({
        contacts: [
          {
            displayName: 'Budi Native',
            phones: [{ number: '081234567890' }],
          },
          {
            name: { display: 'Siti Aminah' },
            phones: [{ number: '+6281399887766' }],
          },
        ],
      });

      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          Contacts: {
            checkPermissions: mockCheckPermissions,
            requestPermissions: mockRequestPermissions,
            getContacts: mockGetContacts,
          },
        },
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('granted');
      expect(Array.isArray(result.contacts)).toBe(true);
      expect(result.contacts).toEqual([
        {
          name: 'Budi Native',
          phoneNumber: '081234567890',
        },
        {
          name: 'Siti Aminah',
          phoneNumber: '+6281399887766',
        },
      ]);
      expect(mockCheckPermissions).toHaveBeenCalled();
      expect(mockRequestPermissions).not.toHaveBeenCalled();
      expect(mockGetContacts).toHaveBeenCalledWith({
        projection: { name: true, phones: true },
      });
    });

    it('returns permissionStatus: denied gracefully when user rejects contacts permission', async () => {
      const mockCheckPermissions = vi.fn().mockResolvedValue({ contacts: 'prompt' });
      const mockRequestPermissions = vi.fn().mockResolvedValue({ contacts: 'denied' });
      const mockGetContacts = vi.fn();

      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          Contacts: {
            checkPermissions: mockCheckPermissions,
            requestPermissions: mockRequestPermissions,
            getContacts: mockGetContacts,
          },
        },
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('denied');
      expect(result.contacts).toEqual([]);
      expect(mockCheckPermissions).toHaveBeenCalled();
      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(mockGetContacts).not.toHaveBeenCalled();
    });

    it('requests runtime permission when checkPermissions returns prompt and retrieves contacts on approval', async () => {
      const mockCheckPermissions = vi.fn().mockResolvedValue({ contacts: 'prompt' });
      const mockRequestPermissions = vi.fn().mockResolvedValue({ contacts: 'granted' });
      const mockGetContacts = vi.fn().mockResolvedValue({
        contacts: [
          {
            name: { display: 'Hasan Basri' },
            phones: [{ number: '08170011223' }],
          },
        ],
      });

      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          Contacts: {
            checkPermissions: mockCheckPermissions,
            requestPermissions: mockRequestPermissions,
            getContacts: mockGetContacts,
          },
        },
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('granted');
      expect(mockCheckPermissions).toHaveBeenCalled();
      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(mockGetContacts).toHaveBeenCalled();
      expect(result.contacts).toEqual([
        {
          name: 'Hasan Basri',
          phoneNumber: '08170011223',
        },
      ]);
    });

    it('returns permissionStatus: denied if native contacts plugin throws an error', async () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          Contacts: {
            checkPermissions: vi.fn().mockRejectedValue(new Error('Plugin failure')),
          },
        },
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('denied');
      expect(result.contacts).toEqual([]);
    });

    it('returns permissionStatus: granted and mapped contacts when Web Contacts API is available', async () => {
      const mockSelect = vi.fn().mockResolvedValue([
        {
          name: ['Web User Alpha'],
          tel: ['+628123456789'],
        },
      ]);

      (window as any).ContactsManager = function () {};
      (navigator as any).contacts = {
        select: mockSelect,
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('granted');
      expect(result.contacts).toEqual([
        {
          name: 'Web User Alpha',
          phoneNumber: '+628123456789',
        },
      ]);
    });

    it('returns permissionStatus: denied when Web Contacts API throws AbortError', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      (window as any).ContactsManager = function () {};
      (navigator as any).contacts = {
        select: vi.fn().mockRejectedValue(abortError),
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('denied');
      expect(result.contacts).toEqual([]);
    });

    it('returns permissionStatus: unsupported with mockSampleDeviceContacts on desktop browser', async () => {
      delete (window as any).Capacitor;
      delete (window as any).Contacts;
      delete (window as any).ContactsManager;
      delete (navigator as any).contacts;

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('unsupported');
      expect(result.contacts).toEqual(mockSampleDeviceContacts);
    });

    it('handles various contact payload phone and name formats correctly', async () => {
      const mockGetContacts = vi.fn().mockResolvedValue({
        contacts: [
          {
            name: { given: 'Ali', family: 'Mustafa' },
            phones: [{ number: '081299990000' }],
          },
          {
            displayName: 'Sarah',
            phoneNumbers: [{ value: '+6281122334455' }],
          },
          {
            name: 'Ridwan',
            phoneNumber: '085566778899',
          },
        ],
      });

      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          Contacts: {
            checkPermissions: vi.fn().mockResolvedValue({ contacts: 'granted' }),
            getContacts: mockGetContacts,
          },
        },
      };

      const result = await getDeviceContactsWithStatus();
      expect(result.permissionStatus).toBe('granted');
      expect(result.contacts).toEqual([
        { name: 'Ali Mustafa', phoneNumber: '081299990000' },
        { name: 'Sarah', phoneNumber: '+6281122334455' },
        { name: 'Ridwan', phoneNumber: '085566778899' },
      ]);
    });

    it('getDeviceContacts backward compatibility works seamlessly with getDeviceContactsWithStatus', async () => {
      (window as any).Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
          Contacts: {
            checkPermissions: vi.fn().mockResolvedValue({ contacts: 'granted' }),
            getContacts: vi.fn().mockResolvedValue({
              contacts: [
                {
                  name: { display: 'Zaid' },
                  phones: [{ number: '08123456789' }],
                },
              ],
            }),
          },
        },
      };

      const contacts = await getDeviceContacts();
      expect(contacts).toEqual([
        {
          name: 'Zaid',
          phoneNumber: '08123456789',
        },
      ]);
    });
  });
});

