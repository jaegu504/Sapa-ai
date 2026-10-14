import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactImportModal } from '../../src/components/crm/ContactImportModal';
import * as nativeContactsAdapter from '../../src/services/nativeContactsAdapter';
import * as contactService from '../../src/services/contactService';

vi.mock('../../src/services/contactService', () => ({
  importContacts: vi.fn(),
}));

describe('ContactImportModal', () => {
  const mockContacts = [
    { name: 'Abi Syihab', phoneNumber: '081234567890' },
    { name: 'Ustadz Hasan', phoneNumber: '081388997766' },
    { name: 'Bunda Sarah', phoneNumber: '081122334455' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(nativeContactsAdapter, 'getDeviceContacts').mockResolvedValue(mockContacts);
    vi.mocked(contactService.importContacts).mockResolvedValue({
      importedCount: 2,
      updatedCount: 0,
      totalProcessed: 2,
    });
  });

  it('does not render when isOpen is false', () => {
    render(<ContactImportModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Impor Kontak Telepon/i)).toBeNull();
  });

  it('renders modal and loads contacts from getDeviceContacts on open', async () => {
    render(<ContactImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Impor Kontak Telepon/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
      expect(screen.getByText('Ustadz Hasan')).toBeDefined();
      expect(screen.getByText('Bunda Sarah')).toBeDefined();
    });
  });

  it('filters contacts via search input by name or phone', async () => {
    render(<ContactImportModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Cari nama atau nomor/i);
    fireEvent.change(searchInput, { target: { value: 'Hasan' } });

    expect(screen.queryByText('Abi Syihab')).toBeNull();
    expect(screen.getByText('Ustadz Hasan')).toBeDefined();
    expect(screen.queryByText('Bunda Sarah')).toBeNull();

    // Search by phone number
    fireEvent.change(searchInput, { target: { value: '08112233' } });
    expect(screen.queryByText('Ustadz Hasan')).toBeNull();
    expect(screen.getByText('Bunda Sarah')).toBeDefined();
  });

  it('handles multi-select and toggle Select All / Deselect All', async () => {
    render(<ContactImportModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    const selectAllBtn = screen.getByRole('button', { name: /Pilih Semua/i });
    fireEvent.click(selectAllBtn);

    // Primary button should show count 3
    expect(screen.getByRole('button', { name: /Impor 3 Kontak/i })).toBeDefined();

    // Toggle button should now show Batalkan Pilihan
    const deselectBtn = screen.getByRole('button', { name: /Batalkan Pilihan/i });
    expect(deselectBtn).toBeDefined();

    // Clicking deselect clears selection
    fireEvent.click(deselectBtn);
    expect(screen.getByRole('button', { name: /Impor 0 Kontak/i })).toBeDefined();

    // Selecting individual contact
    const abiCheckbox = screen.getByLabelText(/Pilih Abi Syihab/i);
    fireEvent.click(abiCheckbox);
    expect(screen.getByRole('button', { name: /Impor 1 Kontak/i })).toBeDefined();
  });

  it('allows selecting default association tag and imports selected contacts', async () => {
    const onImportComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <ContactImportModal
        isOpen={true}
        onClose={onClose}
        onImportComplete={onImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Abi Syihab')).toBeDefined();
    });

    // Select Abi Syihab and Ustadz Hasan
    fireEvent.click(screen.getByLabelText(/Pilih Abi Syihab/i));
    fireEvent.click(screen.getByLabelText(/Pilih Ustadz Hasan/i));

    // Choose association tag "Ihvan"
    const ihvanPill = screen.getByRole('button', { name: /Ihvan/i });
    fireEvent.click(ihvanPill);

    // Click Import
    const importBtn = screen.getByRole('button', { name: /Impor 2 Kontak/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(contactService.importContacts).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Abi Syihab',
          phoneNumber: '081234567890',
          associations: expect.arrayContaining(['Ihvan']),
        }),
        expect.objectContaining({
          name: 'Ustadz Hasan',
          phoneNumber: '081388997766',
          associations: expect.arrayContaining(['Ihvan']),
        }),
      ]);
      expect(onImportComplete).toHaveBeenCalledWith({
        importedCount: 2,
        updatedCount: 0,
        totalProcessed: 2,
      });
      expect(screen.getByText(/Berhasil mengimpor 2 kontak baru/i)).toBeDefined();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<ContactImportModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText(/Tutup/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
