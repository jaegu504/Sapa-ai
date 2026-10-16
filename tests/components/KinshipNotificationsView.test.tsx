import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipNotificationsView } from '../../src/components/kinship/KinshipNotificationsView';
import { Contact } from '../../src/types/crm';
import * as notificationService from '../../src/services/notificationService';
import * as whatsappUtils from '../../src/utils/whatsapp';

vi.mock('../../src/services/notificationService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/notificationService')>();
  return {
    ...actual,
    requestNotificationPermission: vi.fn().mockResolvedValue(true),
    scheduleDailyMorningDigest: vi.fn().mockResolvedValue(1),
  };
});

vi.mock('../../src/utils/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/whatsapp')>();
  return {
    ...actual,
    openWhatsApp: vi.fn(),
  };
});

const referenceDate = new Date('2026-10-15T09:00:00Z'); // Thursday

const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Raditya Pratama',
    phoneNumber: '+628111111111',
    associations: ['Sahabat Kuliah'],
    isProfessional: false,
    lastContactedDate: '2026-09-20',
    followUpCycleDays: 14, // overdue by ~11 days on Oct 15
    nextSpecificFollowUp: null,
    metContext: 'Kopi darat di Senopati',
    lastUpdateNotes: 'Diskusi karir tech',
    possibleFollowUpTopic: 'Tanyakan progres tim baru',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  },
  {
    id: 'c2',
    name: 'Maya Arisandi',
    phoneNumber: '+628222222222',
    associations: ['Design Director'],
    isProfessional: true,
    lastContactedDate: '2026-10-10',
    followUpCycleDays: 30,
    nextSpecificFollowUp: '2026-10-15T10:00:00Z', // Today alarm
    metContext: 'Project design collab',
    lastUpdateNotes: 'Hadiah favorit: kopi specialty beans',
    possibleFollowUpTopic: 'Ulang tahun dan project kolaborasi',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  },
  {
    id: 'c3',
    name: 'Budi Santoso',
    phoneNumber: '+628333333333',
    associations: ['Mentor'],
    isProfessional: true,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 30,
    nextSpecificFollowUp: '2026-10-17T10:30:00Z', // In 2 days (Saturday)
    metContext: 'Giyanti Coffee Roastery',
    lastUpdateNotes: 'Diskusi arsitektur software',
    possibleFollowUpTopic: 'Casual brunch & review roadmap',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'c4',
    name: 'Sarah Wijaya',
    phoneNumber: '+628444444444',
    associations: ['Product Manager'],
    isProfessional: true,
    lastContactedDate: '2026-10-05',
    followUpCycleDays: 14,
    nextSpecificFollowUp: '2026-10-19T15:00:00Z', // In 4 days (Monday)
    metContext: 'Virtual sync',
    lastUpdateNotes: 'Mentorship 1-on-1',
    possibleFollowUpTopic: 'Mentorship sync & okr alignment',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-05T00:00:00Z',
  },
];

describe('KinshipNotificationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Top Header Bar with title, subtitle, and status chip', () => {
    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        now={referenceDate}
      />
    );

    expect(screen.getByText('Jadwal & Pengingat')).toBeDefined();
    expect(screen.getByText(/Sapaan terencana & agenda minggu ini/i)).toBeDefined();
    expect(screen.getByText(/🔔 Jam 08:00 WIB Aktif/i)).toBeDefined();
  });

  it('renders Today Reminders with AI icebreaker suggestion', () => {
    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        now={referenceDate}
      />
    );

    // Hero card contact
    expect(screen.getByText('Raditya Pratama')).toBeDefined();
    // AI Icebreaker box
    expect(screen.getAllByText(/Rekomendasi Icebreaker/i)[0]).toBeDefined();
    expect(screen.getByText(/Tanyakan progres tim baru/i)).toBeDefined();
  });

  it('provides snooze buttons (+3 Hari, Akhir Pekan, Minggu Depan) and calls onSnoozeContact', async () => {
    const onSnoozeContact = vi.fn();

    const { unmount } = render(
      <KinshipNotificationsView
        contacts={mockContacts}
        onSnoozeContact={onSnoozeContact}
        now={referenceDate}
      />
    );

    const snooze3DaysBtn = screen.getAllByRole('button', { name: /\+3 Hari/i })[0];
    expect(snooze3DaysBtn).toBeDefined();
    fireEvent.click(snooze3DaysBtn);
    await waitFor(() => {
      expect(onSnoozeContact).toHaveBeenCalledWith(expect.objectContaining({ name: 'Raditya Pratama' }), 3);
    });
    unmount();

    const render2 = render(
      <KinshipNotificationsView
        contacts={mockContacts}
        onSnoozeContact={onSnoozeContact}
        now={referenceDate}
      />
    );
    const snoozeWeekBtn = screen.getAllByRole('button', { name: /Minggu Depan/i })[0];
    expect(snoozeWeekBtn).toBeDefined();
    fireEvent.click(snoozeWeekBtn);
    await waitFor(() => {
      expect(onSnoozeContact).toHaveBeenCalledWith(expect.objectContaining({ name: 'Raditya Pratama' }), 7);
    });
    render2.unmount();

    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        onSnoozeContact={onSnoozeContact}
        now={referenceDate}
      />
    );
    const snoozeWeekendBtn = screen.getAllByRole('button', { name: /Akhir Pekan/i })[0];
    expect(snoozeWeekendBtn).toBeDefined();
    fireEvent.click(snoozeWeekendBtn);
    await waitFor(() => {
      expect(onSnoozeContact).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Raditya Pratama' }),
        expect.any(Number)
      );
    });
  });

  it('renders dual WhatsApp dispatch buttons', () => {
    const onLogChat = vi.fn();

    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        onLogChat={onLogChat}
        now={referenceDate}
      />
    );

    const regularWaBtn = screen.getAllByRole('button', { name: /Kirim via WhatsApp/i })[0];
    const bizWaBtn = screen.getAllByRole('button', { name: /Kirim via WhatsApp Business/i })[0];

    expect(regularWaBtn).toBeDefined();
    expect(bizWaBtn).toBeDefined();

    fireEvent.click(regularWaBtn);
    expect(whatsappUtils.openWhatsApp).toHaveBeenCalledWith(
      '+628111111111',
      expect.stringContaining('Tanyakan progres tim baru'),
      'regular'
    );
    expect(onLogChat).toHaveBeenCalled();
  });

  it('displays Agenda Pekan Ini with upcoming scheduled contacts for the next 7 days', () => {
    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        now={referenceDate}
      />
    );

    expect(screen.getByText('Agenda Pekan Ini')).toBeDefined();
    // c3 (Budi Santoso) scheduled for Oct 17
    expect(screen.getByText('Budi Santoso')).toBeDefined();
    expect(screen.getByText(/Casual brunch & review roadmap/i)).toBeDefined();
    // c4 (Sarah Wijaya) scheduled for Oct 19
    expect(screen.getByText('Sarah Wijaya')).toBeDefined();
  });

  it('displays Queue & Dispatch Settings with Daily Morning Digest toggle and buttons', async () => {
    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        now={referenceDate}
      />
    );

    expect(screen.getByText(/Pengaturan Notifikasi & Antrean/i)).toBeDefined();
    expect(screen.getByText(/Ringkasan Sapaan Pagi \(08:00 WIB\)/i)).toBeDefined();

    const permissionBtn = screen.getByRole('button', { name: /Minta Izin Notifikasi Sistem/i });
    expect(permissionBtn).toBeDefined();

    const testNotificationBtn = screen.getByRole('button', { name: /Kirim Notifikasi Uji Coba/i });
    expect(testNotificationBtn).toBeDefined();

    // Click permission button
    fireEvent.click(permissionBtn);
    await waitFor(() => {
      expect(notificationService.requestNotificationPermission).toHaveBeenCalled();
    });

    // Click test notification button
    fireEvent.click(testNotificationBtn);
    await waitFor(() => {
      expect(notificationService.scheduleDailyMorningDigest).toHaveBeenCalled();
    });
  });

  it('shows encouraging empty state card when no catch-ups are due today', () => {
    const freshContacts: Contact[] = [
      {
        id: 'c99',
        name: 'Ahmad Faiz',
        phoneNumber: '+628999999999',
        associations: ['Teman'],
        isProfessional: false,
        lastContactedDate: '2026-10-15', // Contacted today
        followUpCycleDays: 30,
        nextSpecificFollowUp: null,
        metContext: '',
        lastUpdateNotes: '',
        possibleFollowUpTopic: '',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
    ];

    render(
      <KinshipNotificationsView
        contacts={freshContacts}
        now={referenceDate}
      />
    );

    expect(screen.getByText(/Semua hubungan dalam ritme harmonis hari ini 🌟/i)).toBeDefined();
  });

  it('allows switching segmented tabs between Upcoming, Inbox, and Cadence Rules', () => {
    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        now={referenceDate}
      />
    );

    // Initial tab: Jadwal Sapaan is shown
    expect(screen.getByText('Pengingat Hari Ini')).toBeDefined();

    // Click Inbox tab
    const inboxTab = screen.getByRole('button', { name: /Kotak Masuk/i });
    fireEvent.click(inboxTab);
    expect(screen.getByText('Pemberitahuan Sistem Terkini')).toBeDefined();

    // Click Cadence tab
    const cadenceTab = screen.getByRole('button', { name: /Aturan Ritme/i });
    fireEvent.click(cadenceTab);
    expect(screen.getByText(/Interval & Ritme Sapaan/i)).toBeDefined();
    expect(screen.getByText(/Inner Circle/i)).toBeDefined();
  });

  it('triggers onSelectContact and onOpenAiDraft callbacks when clicked', () => {
    const onSelectContact = vi.fn();
    const onOpenAiDraft = vi.fn();

    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        onSelectContact={onSelectContact}
        onOpenAiDraft={onOpenAiDraft}
        now={referenceDate}
      />
    );

    // Click contact name
    const contactName = screen.getByText('Raditya Pratama');
    fireEvent.click(contactName);
    expect(onSelectContact).toHaveBeenCalledWith(expect.objectContaining({ name: 'Raditya Pratama' }));

    // Click AI Draft button
    const aiDraftButtons = screen.getAllByRole('button', { name: /AI Draft/i });
    expect(aiDraftButtons.length).toBeGreaterThan(0);
    fireEvent.click(aiDraftButtons[0]);
    expect(onOpenAiDraft).toHaveBeenCalledWith(expect.objectContaining({ name: 'Raditya Pratama' }));
  });

  it('dismisses morning digest banner when close button is clicked', () => {
    render(
      <KinshipNotificationsView
        contacts={mockContacts}
        now={referenceDate}
      />
    );

    expect(screen.getByText('Ringkasan Sapaan Pagi Terkirim')).toBeDefined();
    const closeBtn = screen.getByRole('button', { name: /Tutup banner digest/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Ringkasan Sapaan Pagi Terkirim')).toBeNull();
  });
});
