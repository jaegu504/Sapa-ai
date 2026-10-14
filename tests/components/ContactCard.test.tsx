import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactCard } from '../../src/components/crm/ContactCard';
import { Contact } from '../../src/types/crm';

describe('ContactCard', () => {
  const baseContact: Contact = {
    id: 'c1',
    name: 'Ahmad Fauzi',
    phoneNumber: '+6281234567890',
    associations: ['Ihvan', 'Teman'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: 'Daurah di Jakarta',
    lastUpdateNotes: 'Sedang menyelesaikan riset',
    possibleFollowUpTopic: 'Tanya progres tesis',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  it('renders contact name, phone number, and avatar initials', () => {
    render(<ContactCard contact={baseContact} now={new Date('2026-10-10')} />);

    expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
    expect(screen.getByText('+6281234567890')).toBeDefined();
    // Avatar initials "AF"
    expect(screen.getByText('AF')).toBeDefined();
  });

  it('renders association tags', () => {
    render(<ContactCard contact={baseContact} now={new Date('2026-10-10')} />);

    expect(screen.getByText('Ihvan')).toBeDefined();
    expect(screen.getByText('Teman')).toBeDefined();
  });

  it('renders healthy status badge "👍 Aman" and days left when within cycle', () => {
    // 2026-10-01 + 15 days = 2026-10-16. Now is 2026-10-10 -> 6 days left.
    render(<ContactCard contact={baseContact} now={new Date('2026-10-10')} />);

    expect(screen.getByText(/Aman/i)).toBeDefined();
    expect(screen.getByText(/Sisa 6 hari/i)).toBeDefined();
  });

  it('renders overdue status badge "⏰ Time to reach out!" and days overdue when past cycle', () => {
    // 2026-10-01 + 15 days = 2026-10-16. Now is 2026-10-19 -> 3 days overdue.
    render(<ContactCard contact={baseContact} now={new Date('2026-10-19')} />);

    expect(screen.getByText(/Time to reach out!/i)).toBeDefined();
    expect(screen.getByText(/Terlambat 3 hari/i)).toBeDefined();
  });

  it('handles fresh contact without lastContactedDate gracefully as overdue', () => {
    const freshContact: Contact = {
      ...baseContact,
      id: 'fresh-1',
      name: 'Umar Khalid',
      lastContactedDate: null,
      nextSpecificFollowUp: null,
    };

    render(<ContactCard contact={freshContact} now={new Date('2026-10-10')} />);

    expect(screen.getByText('Umar Khalid')).toBeDefined();
    expect(screen.getByText('UK')).toBeDefined();
    expect(screen.getByText(/Time to reach out!/i)).toBeDefined();
    expect(screen.getByText(/Belum pernah disapa/i)).toBeDefined();
  });

  it('displays possible follow-up topic preview', () => {
    render(<ContactCard contact={baseContact} now={new Date('2026-10-10')} />);

    expect(screen.getByText(/Tanya progres tesis/i)).toBeDefined();
  });

  it('calls onSelect when card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ContactCard
        contact={baseContact}
        onSelect={handleSelect}
        now={new Date('2026-10-10')}
      />
    );

    const card = screen.getByTestId('contact-card-c1');
    fireEvent.click(card);
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(baseContact);
  });

  it('triggers onQuickWhatsApp and stops propagation when WhatsApp button is clicked', () => {
    const handleSelect = vi.fn();
    const handleQuickWhatsApp = vi.fn();

    render(
      <ContactCard
        contact={baseContact}
        onSelect={handleSelect}
        onQuickWhatsApp={handleQuickWhatsApp}
        now={new Date('2026-10-10')}
      />
    );

    const waBtn = screen.getByRole('button', { name: /whatsapp/i });
    fireEvent.click(waBtn);

    expect(handleQuickWhatsApp).toHaveBeenCalledTimes(1);
    expect(handleQuickWhatsApp).toHaveBeenCalledWith(baseContact);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('triggers onLogChat and stops propagation when Log Chat button is clicked', () => {
    const handleSelect = vi.fn();
    const handleLogChat = vi.fn();

    render(
      <ContactCard
        contact={baseContact}
        onSelect={handleSelect}
        onLogChat={handleLogChat}
        now={new Date('2026-10-10')}
      />
    );

    const logBtn = screen.getByRole('button', { name: /selesai ngobrol/i });
    fireEvent.click(logBtn);

    expect(handleLogChat).toHaveBeenCalledTimes(1);
    expect(handleLogChat).toHaveBeenCalledWith(baseContact);
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
