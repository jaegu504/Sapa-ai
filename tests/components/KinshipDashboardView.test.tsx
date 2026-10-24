import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipDashboardView } from '../../src/components/kinship/KinshipDashboardView';
import { Contact } from '../../src/types/crm';

vi.mock('../../src/utils/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/whatsapp')>();
  return {
    ...actual,
    openWhatsApp: vi.fn(),
  };
});

const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Raditya Pratama',
    phoneNumber: '+628111111111',
    associations: ['Profesional'],
    isProfessional: true,
    lastContactedDate: '2026-09-20',
    followUpCycleDays: 14,
    nextSpecificFollowUp: null,
    metContext: 'Kopi darat di Senopati',
    lastUpdateNotes: 'Diskusi karir tech',
    possibleFollowUpTopic: 'Tanyakan progres tim baru',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  },
  {
    id: 'c2',
    name: 'Sarah Jenkins',
    phoneNumber: '+628222222222',
    associations: ['Keluarga'],
    isProfessional: false,
    lastContactedDate: '2026-09-25',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: 'Pitch deck review',
    lastUpdateNotes: 'Seed round discussion',
    possibleFollowUpTopic: 'Kabar keluarga dan anak-anak',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z',
  },
  {
    id: 'c3',
    name: 'Maya Lin',
    phoneNumber: '+628333333333',
    associations: ['Ihvan', 'Teman'],
    isProfessional: false,
    lastContactedDate: '2026-10-12',
    followUpCycleDays: 7,
    nextSpecificFollowUp: null,
    metContext: 'Art gallery meetup',
    lastUpdateNotes: 'Desain UI baru',
    possibleFollowUpTopic: 'Diskusi sistem desain',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'c4',
    name: 'Devon Vance',
    phoneNumber: '+628444444444',
    associations: ['Zahiri'],
    isProfessional: true,
    lastContactedDate: '2026-10-05',
    followUpCycleDays: 30,
    nextSpecificFollowUp: null,
    metContext: 'Founder dinner',
    lastUpdateNotes: 'Growth scaling',
    possibleFollowUpTopic: 'Kolaborasi riset',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-05T00:00:00Z',
  },
];

const referenceDate = new Date('2026-10-15T00:00:00Z');

describe('KinshipDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the Radar Sapa title and a bell that opens who needs a greeting', () => {
    const onOpenNotifications = vi.fn();
    render(<KinshipDashboardView contacts={mockContacts} onSelectContact={vi.fn()} onOpenNotifications={onOpenNotifications} now={referenceDate} />);

    expect(screen.getByText('Radar Sapa')).toBeDefined();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: /perlu disapa/i }));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('keeps the Denyut Sapa pills with active, due and paused counts', () => {
    render(<KinshipDashboardView contacts={mockContacts} onSelectContact={vi.fn()} now={referenceDate} />);

    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('Denyut Sapa')).toBeDefined();
    expect(screen.getByText('4 Aktif')).toBeDefined();
    expect(screen.getByText('2 Perlu Disapa')).toBeDefined();
    expect(screen.getByText('0 Dijeda')).toBeDefined();
  });

  it('lists overdue contacts with Sudah disapa and Sapa buttons', () => {
    const onLogChat = vi.fn();
    const onSapa = vi.fn();
    const onSelectContact = vi.fn();
    render(
      <KinshipDashboardView contacts={mockContacts} onSelectContact={onSelectContact} onLogChat={onLogChat} onSapa={onSapa} now={referenceDate} />
    );

    expect(screen.getByTestId('attention-card-c1')).toHaveTextContent('Raditya Pratama');
    expect(screen.getByTestId('attention-card-c1')).toHaveTextContent('Lewat 11 hari');
    expect(screen.getByText('Topik: Tanyakan progres tim baru')).toBeDefined();
    expect(screen.getByTestId('attention-card-c2')).toHaveTextContent('Sarah Jenkins');

    fireEvent.click(screen.getByRole('button', { name: 'Tandai sudah sapa Raditya Pratama' }));
    expect(onLogChat).toHaveBeenCalledWith(mockContacts[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Sapa Sarah Jenkins' }));
    expect(onSapa).toHaveBeenCalledWith(mockContacts[1]);
    expect(onSelectContact).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('attention-card-c1'));
    expect(onSelectContact).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('shows who is due in the next 7 days, and nobody further out', () => {
    render(<KinshipDashboardView contacts={mockContacts} onSelectContact={vi.fn()} now={referenceDate} />);

    expect(screen.getByTestId('radar-item-c3')).toHaveTextContent('Maya Lin');
    expect(screen.queryByTestId('radar-item-c4')).toBeNull();
    expect(screen.queryByTestId('radar-item-c1')).toBeNull();
  });

  it('shows a calm empty state when nobody is overdue', () => {
    render(<KinshipDashboardView contacts={[mockContacts[2], mockContacts[3]]} onSelectContact={vi.fn()} now={referenceDate} />);
    expect(screen.getByText('Semua aman hari ini')).toBeDefined();
  });

  it('invites adding the first contact when the list is empty', () => {
    const onAddContact = vi.fn();
    render(<KinshipDashboardView contacts={[]} onSelectContact={vi.fn()} onAddContact={onAddContact} now={referenceDate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah kontak' }));
    expect(onAddContact).toHaveBeenCalledTimes(1);
  });
});
