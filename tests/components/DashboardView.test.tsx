import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardView } from '../../src/components/crm/DashboardView';
import { Contact } from '../../src/types/crm';

describe('DashboardView', () => {
  const sampleContacts: Contact[] = [
    {
      id: 'c1',
      name: 'Yılmaz Kileci Abi',
      phoneNumber: '+905321112233',
      associations: ['Hoca', 'Ihvan'],
      isProfessional: true,
      lastContactedDate: '2026-09-20', // Overdue relative to 2026-10-14
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Pertemuan di Istanbul',
      lastUpdateNotes: 'Kabar pesantren dan santri',
      possibleFollowUpTopic: 'Silaturahmi dan riset',
      createdAt: '2026-09-20T00:00:00Z',
      updatedAt: '2026-09-20T00:00:00Z',
    },
    {
      id: 'c2',
      name: 'Ahmad Fauzi',
      phoneNumber: '+6281234567890',
      associations: ['Ihvan', 'Teman'],
      isProfessional: false,
      lastContactedDate: '2026-10-10', // Aman relative to 2026-10-14 (suggested 2026-10-25)
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Daurah di Jakarta',
      lastUpdateNotes: 'Menyelesaikan tesis',
      possibleFollowUpTopic: 'Tanya kabar tesis',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    },
    {
      id: 'c3',
      name: 'Dr. Hendra Gunawan',
      phoneNumber: '+628991234567',
      associations: ['Profesional', 'Zahiri'],
      isProfessional: true,
      lastContactedDate: '2026-10-12', // Aman relative to 2026-10-14
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: 'Konferensi AI',
      lastUpdateNotes: 'Kolaborasi riset data',
      possibleFollowUpTopic: 'Proposal kerja sama',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    },
  ];

  const now = new Date('2026-10-14');

  it('renders greeting, total contacts count, and DualMetricsCard', () => {
    render(<DashboardView contacts={sampleContacts} now={now} />);

    // Total contacts indicator
    expect(screen.getByText(/3 total relasi/i)).toBeDefined();
    expect(screen.getByText(/3 Relasi Aktif/i)).toBeDefined();

    // DualMetricsCard: 1 overdue (c1), 2 safe (c2, c3) => 67% health score
    const overdueCard = screen.getByRole('button', { name: /perlu disapa/i });
    expect(overdueCard.textContent).toContain('1');
    expect(screen.getByText(/67%/)).toBeDefined();
  });

  it('renders circular quick actions and triggers action callbacks', () => {
    const handleImport = vi.fn();
    const handleAdd = vi.fn();

    render(
      <DashboardView
        contacts={sampleContacts}
        onImportClick={handleImport}
        onAddContactClick={handleAdd}
        now={now}
      />
    );

    expect(screen.getByText('Impor HP')).toBeDefined();
    expect(screen.getByText('Sapa WA')).toBeDefined();
    expect(screen.getByText('Tambah Kontak')).toBeDefined();
    expect(screen.getByText('Log Chat')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /impor hp/i }));
    expect(handleImport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /tambah kontak/i }));
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it('filters contacts by search query across name, phone, topic, and context', () => {
    render(<DashboardView contacts={sampleContacts} now={now} />);

    const searchInput = screen.getByPlaceholderText(/cari/i);
    expect(screen.getByText('Yılmaz Kileci Abi')).toBeDefined();
    expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
    expect(screen.getByText('Dr. Hendra Gunawan')).toBeDefined();

    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Ahmad' } });
    expect(screen.queryByText('Yılmaz Kileci Abi')).toBeNull();
    expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
    expect(screen.queryByText('Dr. Hendra Gunawan')).toBeNull();

    // Search by topic
    fireEvent.change(searchInput, { target: { value: 'proposal' } });
    expect(screen.queryByText('Ahmad Fauzi')).toBeNull();
    expect(screen.getByText('Dr. Hendra Gunawan')).toBeDefined();

    // Search by phone number
    fireEvent.change(searchInput, { target: { value: '+90532' } });
    expect(screen.getByText('Yılmaz Kileci Abi')).toBeDefined();
    expect(screen.queryByText('Dr. Hendra Gunawan')).toBeNull();

    // Clear search
    const clearButton = screen.getByRole('button', { name: /hapus pencarian|clear/i });
    fireEvent.click(clearButton);
    expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
    expect(screen.getByText('Dr. Hendra Gunawan')).toBeDefined();
  });

  it('filters contacts using category filter pills', () => {
    render(<DashboardView contacts={sampleContacts} now={now} />);

    // Click 'Hoca' pill
    const hocaPill = screen.getByRole('button', { name: /^hoca/i });
    fireEvent.click(hocaPill);

    expect(screen.getByText('Yılmaz Kileci Abi')).toBeDefined();
    expect(screen.queryByText('Ahmad Fauzi')).toBeNull();
    expect(screen.queryByText('Dr. Hendra Gunawan')).toBeNull();

    // Click 'Profesional' pill
    const proPill = screen.getByRole('button', { name: /^profesional/i });
    fireEvent.click(proPill);

    expect(screen.getByText('Yılmaz Kileci Abi')).toBeDefined(); // isProfessional = true
    expect(screen.getByText('Dr. Hendra Gunawan')).toBeDefined(); // isProfessional = true
    expect(screen.queryByText('Ahmad Fauzi')).toBeNull();

    // Click 'Semua' to reset
    const allPill = screen.getByRole('button', { name: /^semua/i });
    fireEvent.click(allPill);
    expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
  });

  it('toggles between Card view and Notion Table view', () => {
    const handleSelectContact = vi.fn();

    render(
      <DashboardView
        contacts={sampleContacts}
        onSelectContact={handleSelectContact}
        now={now}
      />
    );

    // Initial view is Card view: Contact cards present
    expect(screen.getByTestId('contact-card-c1')).toBeDefined();

    // Toggle to Notion Table view
    const tableToggle = screen.getByRole('button', { name: /tabel notion|mode tabel/i });
    fireEvent.click(tableToggle);

    // Should display table headers
    expect(screen.getByText('Nama')).toBeDefined();
    expect(screen.getByText('Asosiasi')).toBeDefined();
    expect(screen.getByText('Pembaruan Terakhir')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Terakhir Dihubungi')).toBeDefined();
    expect(screen.getByText('Kontak Profesional')).toBeDefined();
    expect(screen.getByText('Ketemu di mana & bagaimana')).toBeDefined();
    expect(screen.getByText('Next Follow Up')).toBeDefined();
    expect(screen.getByText('Possible Follow Up')).toBeDefined();
    expect(screen.getByText('Saran Follow Up')).toBeDefined();

    // Row selection in table
    const tableRow = screen.getByTestId('notion-row-c1');
    fireEvent.click(tableRow);
    expect(handleSelectContact).toHaveBeenCalledWith(sampleContacts[0]);
  });

  it('renders clean empty state when no contacts match search', () => {
    render(<DashboardView contacts={sampleContacts} now={now} />);

    const searchInput = screen.getByPlaceholderText(/cari/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent person' } });

    expect(screen.getByText(/tidak ada kontak/i)).toBeDefined();
  });
});
