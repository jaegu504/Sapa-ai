import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditContactModal } from '../../src/components/crm/EditContactModal';
import { Contact } from '../../src/types/crm';

describe('EditContactModal', () => {
  const existingContact: Contact = {
    id: 'c123',
    name: 'Farhan Maulana',
    phoneNumber: '+628170011223',
    associations: ['Ihvan', 'Zahiri'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 14,
    nextSpecificFollowUp: '2026-10-20',
    metContext: 'Kajian di Masjid Al-Ikhlas',
    lastUpdateNotes: 'Sedang ada proyek baru',
    possibleFollowUpTopic: 'Diskusi silaturahmi & dakwah',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  it('does not render when isOpen is false', () => {
    render(
      <EditContactModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByText(/Tambah Kontak Baru/i)).toBeNull();
    expect(screen.queryByText(/Edit Kontak/i)).toBeNull();
  });

  it('renders "Tambah Kontak Baru" when contact is null/undefined', () => {
    render(
      <EditContactModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText('Tambah Kontak Baru')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Hapus Kontak/i })).toBeNull();
  });

  it('renders "Edit Kontak" with prefilled form fields when contact is provided', () => {
    render(
      <EditContactModal
        contact={existingContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Edit Kontak')).toBeDefined();
    expect((screen.getByLabelText(/Nama Lengkap/i) as HTMLInputElement).value).toBe('Farhan Maulana');
    expect((screen.getByLabelText(/Nomor/i) as HTMLInputElement).value).toBe('+628170011223');
    expect((screen.getByLabelText(/Siklus Follow Up/i) as HTMLInputElement).value).toBe('14');
    expect(screen.getByRole('button', { name: /Hapus Kontak/i })).toBeDefined();
  });

  it('validates required fields before submitting', async () => {
    const onSave = vi.fn();
    render(
      <EditContactModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Simpan/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Nama wajib diisi/i)).toBeDefined();
    expect(onSave).not.toHaveBeenCalled();

    // Fill name but keep phone empty
    const nameInput = screen.getByLabelText(/Nama Lengkap/i);
    fireEvent.change(nameInput, { target: { value: 'Ahmad' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Nomor telepon wajib diisi/i)).toBeDefined();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits correctly with new contact data', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <EditContactModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
      target: { value: 'Ustadz Danu' },
    });
    fireEvent.change(screen.getByLabelText(/Nomor/i), {
      target: { value: '081299887766' },
    });

    // Toggle association pills
    const hocaPill = screen.getByRole('button', { name: /Hoca/i });
    fireEvent.click(hocaPill);

    // Toggle professional switch
    const proCheckbox = screen.getByLabelText(/Kontak Profesional/i);
    fireEvent.click(proCheckbox);

    // Fill notes
    fireEvent.change(screen.getByLabelText(/Ketemu di mana/i), {
      target: { value: 'Kajian Subuh' },
    });

    const submitBtn = screen.getByRole('button', { name: /Simpan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ustadz Danu',
          phoneNumber: '081299887766',
          associations: expect.arrayContaining(['Hoca']),
          isProfessional: true,
          metContext: 'Kajian Subuh',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onDelete when delete button is confirmed', async () => {
    const onDelete = vi.fn();
    render(
      <EditContactModal
        contact={existingContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Hapus Kontak/i });
    fireEvent.click(deleteBtn);

    // If confirmation is shown:
    const confirmBtn = screen.queryByRole('button', { name: /Ya, Hapus/i }) || deleteBtn;
    fireEvent.click(confirmBtn);

    expect(onDelete).toHaveBeenCalledWith('c123');
  });

  it('closes modal when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <EditContactModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
