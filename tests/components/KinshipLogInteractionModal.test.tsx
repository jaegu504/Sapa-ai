import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipLogInteractionModal } from '../../src/components/kinship/KinshipLogInteractionModal';
import { Contact } from '../../src/types/crm';

describe('KinshipLogInteractionModal', () => {
  const mockContact: Contact = {
    id: 'contact-1',
    name: 'Raditya Pratama',
    phoneNumber: '+6281234567890',
    associations: ['Keluarga', 'Ihvan'],
    isProfessional: true,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: '2026-10-25',
    metContext: 'Tech conference booth',
    lastUpdateNotes: 'Sharing roadmap engineering',
    possibleFollowUpTopic: 'Buku leadership & scaling tim',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(/Catat Interaksi/i)).toBeNull();
  });

  it('does not render when contact is null', () => {
    render(
      <KinshipLogInteractionModal
        contact={null}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders bottom sheet header, grabber pill, and contact details', () => {
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Catat Interaksi/i)).toBeDefined();
    expect(screen.getByText('Raditya Pratama')).toBeDefined();
  });

  it('allows selecting interaction format pills', () => {
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Formats: [☕ Kopi / Makan], [📞 Telepon], [💬 WhatsApp], [👥 Acara / Majelis]
    const phonePill = screen.getByRole('button', { name: /Telepon/i });
    const waPill = screen.getByRole('button', { name: /WhatsApp/i });
    const eventPill = screen.getByRole('button', { name: /Acara|Majelis/i });
    const coffeePill = screen.getByRole('button', { name: /Kopi|Makan/i });

    expect(phonePill).toBeDefined();
    expect(waPill).toBeDefined();
    expect(eventPill).toBeDefined();
    expect(coffeePill).toBeDefined();

    // Select Telepon
    fireEvent.click(phonePill);
    expect(phonePill.getAttribute('data-active')).toBe('true');
  });

  it('allows adding and removing personal context / facts tags', () => {
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const factInput = screen.getByPlaceholderText(/Tambah fakta baru|hobi, kabar keluarga/i);
    const addFactBtn = screen.getByRole('button', { name: /Tambah Fakta|Tambah/i });

    fireEvent.change(factInput, { target: { value: 'Minum Oat Milk' } });
    fireEvent.click(addFactBtn);

    expect(screen.getByText('Minum Oat Milk')).toBeDefined();

    // Add another tag via Enter key
    fireEvent.change(factInput, { target: { value: 'Hobi Main Padel' } });
    fireEvent.keyDown(factInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Hobi Main Padel')).toBeDefined();

    // Remove tag
    const removeBtn = screen.getByLabelText(/Hapus tag Minum Oat Milk/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Minum Oat Milk')).toBeNull();
    expect(screen.getByText('Hobi Main Padel')).toBeDefined();
  });

  it('toggles cadence reset switch', () => {
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const toggle = screen.getByRole('checkbox', { name: /Reset ritme follow-up|Reset siklus/i });
    expect((toggle as HTMLInputElement).checked).toBe(true);

    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(false);
  });

  it('submits interaction encounter with onSave', async () => {
    const onSave = vi.fn();
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    // Select WhatsApp
    const waPill = screen.getByRole('button', { name: /WhatsApp/i });
    fireEvent.click(waPill);

    // Fill date
    const dateInput = screen.getByLabelText(/Tanggal|Hari & Tanggal/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-15' } });

    // Fill location
    const locationInput = screen.getByLabelText(/Lokasi/i);
    fireEvent.change(locationInput, { target: { value: 'Online via WA Call' } });

    // Fill talking points
    const notesInput = screen.getByLabelText(/Poin Obrolan|Catatan Percakapan/i);
    fireEvent.change(notesInput, { target: { value: 'Bahas kesiapan rilis modul Kinship CRM.' } });

    // Add a fact tag
    const factInput = screen.getByPlaceholderText(/Tambah fakta baru|hobi, kabar keluarga/i);
    const addFactBtn = screen.getByRole('button', { name: /Tambah Fakta|Tambah/i });
    fireEvent.change(factInput, { target: { value: 'Mau umrah bulan Desember' } });
    fireEvent.click(addFactBtn);

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Simpan Catatan Interaksi|Simpan Catatan/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledWith({
      contactId: 'contact-1',
      type: 'whatsapp',
      date: '2026-10-15',
      location: 'Online via WA Call',
      talkingPoints: 'Bahas kesiapan rilis modul Kinship CRM.',
      newFacts: ['Mau umrah bulan Desember'],
      resetCadence: true,
    });
  });

  it('calls onClose when close or cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <KinshipLogInteractionModal
        contact={mockContact}
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    const closeBtn = screen.getByLabelText(/Tutup/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
