import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('Daurah fiqih di Pesantren Luhur')).toBeDefined();

    // Section 2: Pembaruan Terakhir
    expect(screen.getByText(/Pembaruan Terakhir/i)).toBeDefined();
    expect(screen.getByText('Mendapat amanah baru di lembaga tahfidz')).toBeDefined();

    // Section 3: Topik Follow Up Selanjutnya
    expect(screen.getByText(/Topik Follow Up Selanjutnya/i)).toBeDefined();
    expect(screen.getByText('Kajian rutin bulanan & silaturahmi')).toBeDefined();

    // Section 4: Jadwal Follow Up Khusus
    expect(screen.getByText(/Jadwal Follow Up Khusus/i)).toBeDefined();
    expect(screen.getByText('2026-10-25')).toBeDefined();
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
