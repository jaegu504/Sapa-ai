import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactDetailModal } from '../../src/components/crm/ContactDetailModal';
import { Contact } from '../../src/types/crm';

describe('ContactDetailModal', () => {
  const baseContact: Contact = {
    id: 'c10',
    name: 'Ustadz Ahmad Al-Habsyi',
    phoneNumber: '+6281234567890',
    associations: ['Hoca', 'Keluarga'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: '2026-10-25',
    metContext: 'Daurah fiqih di Pesantren Luhur',
    lastUpdateNotes: 'Mendapat amanah baru di lembaga tahfidz',
    possibleFollowUpTopic: 'Kajian rutin bulanan & silaturahmi',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  it('does not render when isOpen is false', () => {
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('Ustadz Ahmad Al-Habsyi')).toBeNull();
  });

  it('does not render when contact is null', () => {
    render(
      <ContactDetailModal
        contact={null}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText(/Ustadz Ahmad/i)).toBeNull();
  });

  it('renders John Carter style profile hero with avatar initials, name, and badges', () => {
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        now={new Date('2026-10-10')}
      />
    );

    // Name & Phone
    expect(screen.getByText('Ustadz Ahmad Al-Habsyi')).toBeDefined();
    expect(screen.getByText('+6281234567890')).toBeDefined();
    // 2-letter initials
    expect(screen.getByText('UA')).toBeDefined();
    // Association tags
    expect(screen.getByText('Hoca')).toBeDefined();
    expect(screen.getByText('Keluarga')).toBeDefined();
  });

  it('renders 3-Metric Strip with Siklus, Status, and Terakhir Sapa', () => {
    // With lastContactedDate '2026-10-01', cycle 15 days, nextSpecificFollowUp '2026-10-25', now '2026-10-10'
    // Status is Aman (sisa 15 hari till Oct 25)
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        now={new Date('2026-10-10')}
      />
    );

    expect(screen.getByText('Siklus')).toBeDefined();
    expect(screen.getByText('15 Hari')).toBeDefined();

    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText(/Sisa 15 hari|\bAman\b/i)).toBeDefined();

    expect(screen.getByText('Terakhir Sapa')).toBeDefined();
    expect(screen.getByText('2026-10-01')).toBeDefined();
  });

  it('renders overdue status badge in Metric Strip when past cycle', () => {
    // now is 2026-10-30, nextSpecificFollowUp was 2026-10-25 -> 5 days overdue
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        now={new Date('2026-10-30')}
      />
    );

    expect(screen.getByText(/Terlambat 5 hari/i)).toBeDefined();
  });

  it('renders Notion context sections accurately', () => {
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Section 1: Ketemu di mana & bagaimana
    expect(screen.getByText(/Ketemu di mana & bagaimana/i)).toBeDefined();
    expect(screen.getByDisplayValue('Daurah fiqih di Pesantren Luhur')).toBeDefined();

    // Section 2: Pembaruan Terakhir
    expect(screen.getByText(/Pembaruan Terakhir/i)).toBeDefined();
    expect(screen.getByDisplayValue('Mendapat amanah baru di lembaga tahfidz')).toBeDefined();

    // Section 3: Topik Follow Up Selanjutnya
    expect(screen.getByText(/Topik Follow Up Selanjutnya/i)).toBeDefined();
    expect(screen.getByDisplayValue('Kajian rutin bulanan & silaturahmi')).toBeDefined();

    // Section 4: Jadwal Follow Up Khusus
    expect(screen.getByText(/Jadwal Follow Up Khusus/i)).toBeDefined();
    expect(screen.getByDisplayValue('2026-10-25')).toBeDefined();
  });

  it('triggers onUpdateContact when possibleFollowUpTopic textarea is edited', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
      />
    );

    const topicInput = screen.getByLabelText(/Topik Follow Up Selanjutnya/i);
    fireEvent.change(topicInput, { target: { value: 'Kajian hadits Arba’in' } });

    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      possibleFollowUpTopic: 'Kajian hadits Arba’in',
    });
  });

  it('displays visual save feedback when updating contact', async () => {
    let resolveUpdate: () => void = () => {};
    const handleUpdate = vi.fn().mockImplementation(() => new Promise<void>((res) => {
      resolveUpdate = res;
    }));

    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
      />
    );

    const topicInput = screen.getByLabelText(/Topik Follow Up Selanjutnya/i);
    fireEvent.change(topicInput, { target: { value: 'Kajian fiqih' } });

    // While saving
    expect(screen.getByText(/Menyimpan.../i)).toBeDefined();

    // Resolve save
    resolveUpdate();
    await waitFor(() => {
      expect(screen.getByText(/Tersimpan/i)).toBeDefined();
    });
  });

  it('triggers onUpdateContact when lastUpdateNotes textarea is edited', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
      />
    );

    const notesInput = screen.getByLabelText(/Pembaruan Terakhir/i);
    fireEvent.change(notesInput, { target: { value: 'Sudah mutaba’ah hafalan juz 30' } });

    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      lastUpdateNotes: 'Sudah mutaba’ah hafalan juz 30',
    });
  });

  it('triggers onUpdateContact when metContext textarea is edited', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
      />
    );

    const metInput = screen.getByLabelText(/Ketemu di mana & bagaimana/i);
    fireEvent.change(metInput, { target: { value: 'Halaqah tafsir di Masjid Sunda Kelapa' } });

    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      metContext: 'Halaqah tafsir di Masjid Sunda Kelapa',
    });
  });

  it('triggers onUpdateContact when nextSpecificFollowUp date input is changed directly', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
        now={new Date('2026-10-10')}
      />
    );

    const dateInput = screen.getByLabelText(/Jadwal Follow Up Khusus/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-28' } });

    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: '2026-10-28',
    });
  });

  it('computes date and calls onUpdateContact when quick follow-up chip "+3 Hari" is clicked', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
        now={new Date('2026-10-10')}
      />
    );

    const chip3Days = screen.getByRole('button', { name: /\+3 Hari/i });
    fireEvent.click(chip3Days);

    // 2026-10-10 + 3 days = 2026-10-13
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: '2026-10-13',
    });
  });

  it('computes date and calls onUpdateContact for all quick schedule chips', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
        now={new Date('2026-10-10')}
      />
    );

    // Besok (+1 hr) -> 2026-10-11
    const chipBesok = screen.getByRole('button', { name: /Besok/i });
    fireEvent.click(chipBesok);
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: '2026-10-11',
    });

    // +1 Minggu -> 2026-10-17
    const chip1Week = screen.getByRole('button', { name: /\+1 Minggu/i });
    fireEvent.click(chip1Week);
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: '2026-10-17',
    });

    // +2 Minggu -> 2026-10-24
    const chip2Weeks = screen.getByRole('button', { name: /\+2 Minggu/i });
    fireEvent.click(chip2Weeks);
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: '2026-10-24',
    });

    // Bulan Depan -> 2026-11-09 (+30 days)
    const chipMonth = screen.getByRole('button', { name: /Bulan Depan/i });
    fireEvent.click(chipMonth);
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: '2026-11-09',
    });

    // Hapus Jadwal -> null
    const chipClear = screen.getByRole('button', { name: /Hapus Jadwal/i });
    fireEvent.click(chipClear);
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      nextSpecificFollowUp: null,
    });
  });

  it('triggers onUpdateContact when lastContactedDate and followUpCycleDays are edited', () => {
    const handleUpdate = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={handleUpdate}
      />
    );

    const lastContactedInput = screen.getByLabelText(/Tanggal Terakhir Sapa/i);
    fireEvent.change(lastContactedInput, { target: { value: '2026-10-05' } });
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      lastContactedDate: '2026-10-05',
    });

    const cycleInput = screen.getByLabelText(/Siklus Follow Up/i);
    fireEvent.change(cycleInput, { target: { value: '30' } });
    expect(handleUpdate).toHaveBeenCalledWith(baseContact.id, {
      followUpCycleDays: 30,
    });
  });

  it('triggers onOpenAiDraft when Sapa via WhatsApp button is clicked', () => {
    const handleAiDraft = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onOpenAiDraft={handleAiDraft}
      />
    );

    const waBtn = screen.getByRole('button', { name: /sapa via whatsapp/i });
    fireEvent.click(waBtn);

    expect(handleAiDraft).toHaveBeenCalledTimes(1);
    expect(handleAiDraft).toHaveBeenCalledWith(baseContact);
  });

  it('triggers onLogChat when Tandai Selesai Ngobrol button is clicked', () => {
    const handleLogChat = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onLogChat={handleLogChat}
      />
    );

    const logBtn = screen.getByRole('button', { name: /tandai selesai ngobrol/i });
    fireEvent.click(logBtn);

    expect(handleLogChat).toHaveBeenCalledTimes(1);
    expect(handleLogChat).toHaveBeenCalledWith(baseContact);
  });

  it('triggers onEditContact when Edit Relasi button is clicked', () => {
    const handleEdit = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onEditContact={handleEdit}
      />
    );

    const editBtn = screen.getByRole('button', { name: /edit relasi/i });
    fireEvent.click(editBtn);

    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(baseContact);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ContactDetailModal
        contact={baseContact}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /tutup/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
