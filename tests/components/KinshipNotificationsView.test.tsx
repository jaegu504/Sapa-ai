import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipNotificationsView, buildSchedule } from '../../src/components/kinship/KinshipNotificationsView';
import { Contact } from '../../src/types/crm';
import * as notificationService from '../../src/services/notificationService';

vi.mock('../../src/services/notificationService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/notificationService')>();
  return {
    ...actual,
    requestNotificationPermission: vi.fn().mockResolvedValue(true),
    checkNotificationPermission: vi.fn().mockResolvedValue(false),
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

const laterContact: Contact = {
  ...mockContacts[3],
  id: 'c5',
  name: 'Zeynep',
  nextSpecificFollowUp: '2026-11-04T09:00',
  possibleFollowUpTopic: 'Selamat wisuda',
};

describe('KinshipNotificationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('kinship_digest_time');
  });

  it('shows the Jadwal title with the daily reminder time and no time zone label', () => {
    render(<KinshipNotificationsView contacts={mockContacts} now={referenceDate} />);
    expect(screen.getByText('Jadwal')).toBeDefined();
    expect(screen.getByText('Pengingat harian jam 08:00')).toBeDefined();
    expect(screen.queryByText(/WIB/)).toBeNull();
  });

  it('groups contacts into Hari ini, Minggu ini and Nanti', () => {
    const { today, week, later } = buildSchedule([...mockContacts, laterContact], referenceDate);
    expect(today.map((i) => i.contact.id).sort()).toEqual(['c1', 'c2']);
    expect(week.map((i) => i.contact.id)).toEqual(['c3', 'c4']);
    expect(later.map((i) => i.contact.id)).toEqual(['c5']);

    render(<KinshipNotificationsView contacts={[...mockContacts, laterContact]} now={referenceDate} />);
    expect(screen.getByRole('region', { name: 'Hari ini' })).toHaveTextContent('Raditya Pratama');
    expect(screen.getByRole('region', { name: 'Minggu ini' })).toHaveTextContent('Budi Santoso');
    expect(screen.getByRole('region', { name: 'Nanti' })).toHaveTextContent('Zeynep');
  });

  it('opens the profile on tap and the Sapa choices from the green button', () => {
    const onSelectContact = vi.fn();
    const onSapa = vi.fn();
    render(<KinshipNotificationsView contacts={mockContacts} onSelectContact={onSelectContact} onSapa={onSapa} now={referenceDate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sapa Budi Santoso' }));
    expect(onSapa).toHaveBeenCalledWith(mockContacts[2]);
    expect(onSelectContact).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('schedule-item-c3'));
    expect(onSelectContact).toHaveBeenCalledWith(mockContacts[2]);
  });

  it('shows an empty state when nothing is due today', () => {
    render(<KinshipNotificationsView contacts={[mockContacts[3]]} now={referenceDate} />);
    expect(screen.getByText('Tidak ada jadwal hari ini')).toBeDefined();
  });

  it('asks for notification permission when it is missing', async () => {
    render(<KinshipNotificationsView contacts={mockContacts} now={referenceDate} />);
    const allow = await screen.findByRole('button', { name: 'Izinkan' });
    fireEvent.click(allow);
    await waitFor(() => expect(notificationService.requestNotificationPermission).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Izinkan' })).toBeNull());
  });
});
