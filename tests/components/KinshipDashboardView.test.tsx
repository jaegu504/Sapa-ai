import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipDashboardView } from '../../src/components/kinship/KinshipDashboardView';
import { Contact } from '../../src/types/crm';
import * as whatsappUtils from '../../src/utils/whatsapp';

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

  it('renders top header bar with avatar, title and the overdue shortcut badge', () => {
    const onOpenNotifications = vi.fn();

    render(
      <KinshipDashboardView
        contacts={mockContacts}
        onSelectContact={vi.fn()}
        onOpenNotifications={onOpenNotifications}
        now={referenceDate}
      />
    );

    // Title & Editorial styling
    expect(screen.getByText('Sapa')).toBeDefined();
    expect(screen.getByText('Radar')).toBeDefined();

    // User avatar
    expect(screen.getByLabelText('Profil Pengguna')).toBeDefined();

    // Notification bell button with overdue count badge (2 due contacts)
    const bellBtn = screen.getByRole('button', { name: /perlu disapa/i });
    expect(bellBtn).toBeDefined();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('2');

    fireEvent.click(bellBtn);
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);

    // Duplicate sync button was removed (Impor HP lives in the app header)
    expect(screen.queryByRole('button', { name: /sinkronisasi/i })).toBeNull();
  });

  it('renders Kinship Pulse card with calculated health score and stat pills', () => {
    render(
      <KinshipDashboardView
        contacts={mockContacts}
        onSelectContact={vi.fn()}
        now={referenceDate}
      />
    );

    // 2 out of 4 overdue -> 50% health score
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('Denyut Sapa')).toBeDefined();
    expect(screen.getByText('4 Aktif')).toBeDefined();
    expect(screen.getByText('2 Perlu Disapa')).toBeDefined();
    expect(screen.getByText('0 Dijeda')).toBeDefined();
  });

  it('renders Needs Attention Today section with overdue contacts, topic preview, and Dual WhatsApp', () => {
    const onSelectContact = vi.fn();
    const onLogChat = vi.fn();

    render(
      <KinshipDashboardView
        contacts={mockContacts}
        onSelectContact={onSelectContact}
        onLogChat={onLogChat}
        now={referenceDate}
      />
    );

    expect(screen.getByText(/perlu perhatian hari ini|needs attention today/i)).toBeDefined();

    // Raditya Pratama (11d overdue)
    expect(screen.getByTestId('attention-card-c1')).toHaveTextContent('Raditya Pratama');
    expect(screen.getByText('Tanyakan progres tim baru')).toBeDefined();

    // Sarah Jenkins (5d overdue)
    expect(screen.getByTestId('attention-card-c2')).toHaveTextContent('Sarah Jenkins');
    expect(screen.getByText('Kabar keluarga dan anak-anak')).toBeDefined();

    // Tapping the card triggers onSelectContact
    const radityaCard = screen.getByTestId('attention-card-c1');
    fireEvent.click(radityaCard);
    expect(onSelectContact).toHaveBeenCalledWith(mockContacts[0]);

    // Clicking WhatsApp button invokes openWhatsApp without prematurely calling onLogChat
    const whatsappBtn = screen.getAllByRole('button', { name: /kirim via whatsapp$/i })[0];
    fireEvent.click(whatsappBtn);
    expect(whatsappUtils.openWhatsApp).toHaveBeenCalledWith(
      '+628111111111',
      "Assalamu'alaikum Raditya Pratama, Tanyakan progres tim baru",
      'regular'
    );
    expect(onLogChat).not.toHaveBeenCalled();

    // Clicking 'Sudah Sapa' marks the interaction as completed
    const sudahSapaBtn = screen.getAllByRole('button', { name: /sudah sapa/i })[0];
    fireEvent.click(sudahSapaBtn);
    expect(onLogChat).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('renders empty state when no contacts are overdue in Needs Attention Today', () => {
    // Only contacts that are not overdue
    const healthyContacts: Contact[] = [mockContacts[2], mockContacts[3]];

    render(
      <KinshipDashboardView
        contacts={healthyContacts}
        onSelectContact={vi.fn()}
        now={referenceDate}
      />
    );

    expect(screen.getByText(/Semua relasi dalam ritme aman 🎉/i)).toBeDefined();
  });

  it('filters contacts when tapping Cadence Radar segmented tabs', () => {
    render(
      <KinshipDashboardView
        contacts={mockContacts}
        onSelectContact={vi.fn()}
        now={referenceDate}
      />
    );

    // Initially "Semua" is active -> shows all 4 contacts in radar feed
    expect(screen.getByTestId('radar-item-c1')).toBeDefined();
    expect(screen.getByTestId('radar-item-c2')).toBeDefined();
    expect(screen.getByTestId('radar-item-c3')).toBeDefined();
    expect(screen.getByTestId('radar-item-c4')).toBeDefined();

    // Click "Mingguan (7 hr)" tab -> only Maya Lin (c3)
    const weeklyTab = screen.getByRole('button', { name: /^mingguan/i });
    fireEvent.click(weeklyTab);

    expect(screen.queryByTestId('radar-item-c1')).toBeNull();
    expect(screen.queryByTestId('radar-item-c2')).toBeNull();
    expect(screen.getByTestId('radar-item-c3')).toBeDefined();
    expect(screen.queryByTestId('radar-item-c4')).toBeNull();

    // Click "2 Mingguan (14-15 hr)" tab -> Raditya (c1) and Sarah (c2)
    const biWeeklyTab = screen.getByRole('button', { name: /2 mingguan/i });
    fireEvent.click(biWeeklyTab);

    expect(screen.getByTestId('radar-item-c1')).toBeDefined();
    expect(screen.getByTestId('radar-item-c2')).toBeDefined();
    expect(screen.queryByTestId('radar-item-c3')).toBeNull();
    expect(screen.queryByTestId('radar-item-c4')).toBeNull();

    // Click "Bulanan (30 hr)" tab -> Devon Vance (c4)
    const monthlyTab = screen.getByRole('button', { name: /bulanan/i });
    fireEvent.click(monthlyTab);

    expect(screen.queryByTestId('radar-item-c1')).toBeNull();
    expect(screen.queryByTestId('radar-item-c2')).toBeNull();
    expect(screen.queryByTestId('radar-item-c3')).toBeNull();
    expect(screen.getByTestId('radar-item-c4')).toBeDefined();

    // Click "Semua" tab -> all 4 contacts back
    const allTab = screen.getByRole('button', { name: /^semua/i });
    fireEvent.click(allTab);

    expect(screen.getByTestId('radar-item-c1')).toBeDefined();
    expect(screen.getByTestId('radar-item-c2')).toBeDefined();
    expect(screen.getByTestId('radar-item-c3')).toBeDefined();
    expect(screen.getByTestId('radar-item-c4')).toBeDefined();
  });

  it('filters radar feed contacts by search query', () => {
    render(
      <KinshipDashboardView
        contacts={mockContacts}
        onSelectContact={vi.fn()}
        now={referenceDate}
      />
    );

    const searchInput = screen.getByPlaceholderText(/cari nama, topik, atau relasi/i);
    fireEvent.change(searchInput, { target: { value: 'Maya' } });

    expect(screen.queryByTestId('radar-item-c1')).toBeNull();
    expect(screen.queryByTestId('radar-item-c2')).toBeNull();
    expect(screen.getByTestId('radar-item-c3')).toBeDefined();
    expect(screen.queryByTestId('radar-item-c4')).toBeNull();
  });

  it('triggers onSelectContact and onOpenAiDraft from radar feed item', () => {
    const onSelectContact = vi.fn();
    const onOpenAiDraft = vi.fn();

    render(
      <KinshipDashboardView
        contacts={mockContacts}
        onSelectContact={onSelectContact}
        onOpenAiDraft={onOpenAiDraft}
        now={referenceDate}
      />
    );

    // Tap radar item
    const mayaItem = screen.getByTestId('radar-item-c3');
    fireEvent.click(mayaItem);
    expect(onSelectContact).toHaveBeenCalledWith(mockContacts[2]);

    // Tap AI Draft quick action
    const aiDraftBtn = screen.getByTestId('radar-ai-draft-c3');
    fireEvent.click(aiDraftBtn);
    expect(onOpenAiDraft).toHaveBeenCalledWith(mockContacts[2]);
  });
});
