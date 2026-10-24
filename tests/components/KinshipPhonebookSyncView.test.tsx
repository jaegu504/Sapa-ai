import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipPhonebookSyncView } from '../../src/components/kinship/KinshipPhonebookSyncView';
import * as nativeContactsAdapter from '../../src/services/nativeContactsAdapter';
import * as contactService from '../../src/services/contactService';
import type { RawPhoneContact } from '../../src/types/crm';
import { crmDb } from '../../src/db/crmDatabase';

vi.mock('../../src/services/contactService', async () => {
  const actual = await vi.importActual('../../src/services/contactService');
  return {
    ...actual,
    importContacts: vi.fn(),
  };
});

describe('KinshipPhonebookSyncView', () => {
  const mockContacts: RawPhoneContact[] = [
    { name: 'Abi Syihab', phoneNumber: '081234567890', associations: ['Ihvan'] },
    { name: 'Bunda Sarah', phoneNumber: '081122334455', associations: ['Keluarga'] },
    { name: 'Dimas Anggara', phoneNumber: '085611223344', associations: ['Teman'] },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    await crmDb.contacts.clear();
    await crmDb.interactions.clear();

    vi.spyOn(nativeContactsAdapter, 'getDeviceContactsWithStatus').mockResolvedValue({
      contacts: mockContacts,
      permissionStatus: 'granted',
    });

    vi.mocked(contactService.importContacts).mockResolvedValue({
      importedCount: 2,
      updatedCount: 0,
      totalProcessed: 2,
    });
  });

  it('does not render when isOpen is false', () => {
    render(<KinshipPhonebookSyncView isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Impor Kontak/i)).toBeNull();
  });

  it('displays native permission prompt button when contacts permission is not yet granted', async () => {
    vi.spyOn(nativeContactsAdapter, 'getDeviceContactsWithStatus').mockResolvedValueOnce({
      contacts: [],
      permissionStatus: 'prompt',
    });

    render(<KinshipPhonebookSyncView isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Akses Kontak Belum Diizinkan')).toBeDefined();
      expect(
        screen.getByText(/Diperlukan izin sistem Android agar Sapa dapat membaca kontak/i)
      ).toBeDefined();
      expect(screen.getByRole('button', { name: /Izinkan Akses Kontak/i })).toBeDefined();
    });
  });

  it('reloads and displays contacts after permission is granted via button click', async () => {
    const getStatusSpy = vi
      .spyOn(nativeContactsAdapter, 'getDeviceContactsWithStatus')
      .mockResolvedValueOnce({
        contacts: [],
        permissionStatus: 'denied',
      })
      .mockResolvedValueOnce({
        contacts: mockContacts,
        permissionStatus: 'granted',
      });

    render(<KinshipPhonebookSyncView isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Akses Kontak Belum Diizinkan')).toBeDefined();
    });

    const allowBtn = screen.getByRole('button', { name: /Izinkan Akses Kontak/i });
    fireEvent.click(allowBtn);

    await waitFor(() => {
      expect(getStatusSpy).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Akses Kontak Belum Diizinkan')).toBeNull();
      expect(screen.getByText('Abi Syihab')).toBeDefined();
      expect(screen.getByText('Bunda Sarah')).toBeDefined();
      expect(screen.getByText('Dimas Anggara')).toBeDefined();
    });
  });

  it('filters contacts via search input by name or phone', async () => {
    render(<KinshipPhonebookSyncView isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Cari nama/i);
    fireEvent.change(searchInput, { target: { value: 'Sarah' } });

    expect(screen.queryByText('Abi Syihab')).toBeNull();
    expect(screen.getByText('Bunda Sarah')).toBeDefined();
    expect(screen.queryByText('Dimas Anggara')).toBeNull();

    // Search by phone
    fireEvent.change(searchInput, { target: { value: '0856' } });
    expect(screen.queryByText('Bunda Sarah')).toBeNull();
    expect(screen.getByText('Dimas Anggara')).toBeDefined();
  });

  it('handles select all and deselect all toggling', async () => {
    render(<KinshipPhonebookSyncView isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    // Initial counter: 0 contacts selected
    expect(screen.getByText(/Dipilih: 0 dari 3 kontak/i)).toBeDefined();

    const selectAllBtn = screen.getByRole('button', { name: /Pilih Semua/i });
    fireEvent.click(selectAllBtn);

    expect(screen.getByText(/Dipilih: 3 dari 3 kontak/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sinkronkan 3 Kontak/i })).toBeDefined();

    const deselectBtn = screen.getByRole('button', { name: /Batalkan Pilihan/i });
    fireEvent.click(deselectBtn);

    expect(screen.getByText(/Dipilih: 0 dari 3 kontak/i)).toBeDefined();
  });

  it('allows multi-selecting contacts and choosing Intentional Care cadence', async () => {
    render(<KinshipPhonebookSyncView isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    // Multi-select Abi and Sarah
    const abiCheckbox = screen.getByLabelText(/Pilih Abi Syihab/i);
    const sarahCheckbox = screen.getByLabelText(/Pilih Bunda Sarah/i);
    fireEvent.click(abiCheckbox);
    fireEvent.click(sarahCheckbox);

    expect(screen.getByText(/Dipilih: 2 dari 3 kontak/i)).toBeDefined();

    // Verify cadence options are rendered
    expect(screen.getByText('Tentukan Ritme Sapaan Awal')).toBeDefined();
    expect(screen.getByText('Mingguan')).toBeDefined();
    expect(screen.getByText(/2 Mingguan/i)).toBeDefined();
    expect(screen.getByText('Bulanan')).toBeDefined();

    // Choose Mingguan (7 days)
    const weeklyOption = screen.getByTestId('cadence-7');
    fireEvent.click(weeklyOption);

    // Choose Bulanan (30 days)
    const monthlyOption = screen.getByTestId('cadence-30');
    fireEvent.click(monthlyOption);
  });

  it('imports selected contacts into Dexie database with applied cadence', async () => {
    const onImportComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <KinshipPhonebookSyncView
        isOpen={true}
        onClose={onClose}
        onImportComplete={onImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    // Select Abi and Dimas
    fireEvent.click(screen.getByLabelText(/Pilih Abi Syihab/i));
    fireEvent.click(screen.getByLabelText(/Pilih Dimas Anggara/i));

    // Choose Mingguan (7 days)
    fireEvent.click(screen.getByTestId('cadence-7'));

    // Submit sync button
    const submitBtn = screen.getByRole('button', { name: /Sinkronkan 2 Kontak/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contactService.importContacts).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Abi Syihab',
          phoneNumber: '081234567890',
          followUpCycleDays: 7,
        }),
        expect.objectContaining({
          name: 'Dimas Anggara',
          phoneNumber: '085611223344',
          followUpCycleDays: 7,
        }),
      ], '62', 'phone');
      expect(onImportComplete).toHaveBeenCalledWith({
        importedCount: 2,
        updatedCount: 0,
        totalProcessed: 2,
      });
      expect(screen.getByText(/Berhasil menyinkronkan 2 kontak/i)).toBeDefined();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<KinshipPhonebookSyncView isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    const closeBtn = screen.getByLabelText(/Tutup/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('allows switching source selector tabs', async () => {
    render(<KinshipPhonebookSyncView isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    const googleTab = screen.getByRole('button', { name: /Google Kontak/i });
    fireEvent.click(googleTab);

    expect(screen.getByText(/Sinkronisasi Google Kontak/i)).toBeDefined();

    const phonebookTab = screen.getByRole('button', { name: /Buku Telepon/i });
    fireEvent.click(phonebookTab);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });
  });

  it('allows uploading and parsing CSV/VCF file on CSV tab', async () => {
    render(<KinshipPhonebookSyncView isOpen={true} />);

    const csvTab = screen.getByRole('button', { name: /File CSV \/ VCF/i });
    fireEvent.click(csvTab);

    expect(screen.getByText(/Unggah File Kontak/i)).toBeDefined();
  });
});
