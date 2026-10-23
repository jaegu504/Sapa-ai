import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipContactDossierModal, formatFactDate } from '../../src/components/kinship/KinshipContactDossierModal';
import { Contact, InteractionLog } from '../../src/types/crm';

describe('KinshipContactDossierModal', () => {
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

  const mockInteractions: InteractionLog[] = [
    {
      id: 'log-1',
      contactId: 'contact-1',
      date: '2026-10-01',
      type: 'meetup',
      notes: 'Coffee catchup di Senopati. Bahas roadmap.',
    },
    {
      id: 'log-2',
      contactId: 'contact-1',
      date: '2026-09-15',
      type: 'whatsapp',
      notes: 'Ucapin selamat promosi jabatan baru.',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Raditya Pratama')).toBeNull();
  });

  it('does not render when contact is null', () => {
    render(
      <KinshipContactDossierModal
        contact={null}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders contact dossier hero, Notion properties, and badges', () => {
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        now={new Date('2026-10-10')}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Profil Relasi')).toBeDefined();
    expect(screen.getByText('Raditya Pratama')).toBeDefined();
    expect(screen.getByText('+6281234567890')).toBeDefined();

    // Initials "RP"
    expect(screen.getByText('RP')).toBeDefined();

    // Association badges
    expect(screen.getByText('Keluarga')).toBeDefined();
    expect(screen.getByText('Ihvan')).toBeDefined();

    // Cadence badge is rendered
    expect(screen.getByTestId('cadence-dot')).toBeDefined();
  });

  it('renders Dual WhatsApp buttons and triggers outreach', () => {
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Kirim via WhatsApp$/i)).toBeDefined();
    expect(screen.getByText(/Kirim via WhatsApp Business/i)).toBeDefined();
  });

  it('allows toggling favorite star button', () => {
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const starBtn = screen.getByLabelText(/Tandai favorit|Favorit/i);
    expect(starBtn).toBeDefined();

    fireEvent.click(starBtn);
    expect(starBtn.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(starBtn);
    expect(starBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByLabelText(/Tutup/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEditContact when edit button is clicked', () => {
    const onEditContact = vi.fn();
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onEditContact={onEditContact}
      />
    );

    const editBtn = screen.getByLabelText(/Edit Relasi|Edit/i);
    fireEvent.click(editBtn);
    expect(onEditContact).toHaveBeenCalledWith(mockContact);
  });

  it('calls onOpenLogEncounter when "+ Catat Interaksi" button is clicked', () => {
    const onOpenLogEncounter = vi.fn();
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onOpenLogEncounter={onOpenLogEncounter}
      />
    );

    const logBtns = screen.getAllByRole('button', { name: /\+ Catat Interaksi|Log Note/i });
    expect(logBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(logBtns[0]);
    expect(onOpenLogEncounter).toHaveBeenCalledWith(mockContact);
  });

  it('calls onOpenAiDraft when draft button is clicked', () => {
    const onOpenAiDraft = vi.fn();
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onOpenAiDraft={onOpenAiDraft}
      />
    );

    const aiBtn = screen.getByRole('button', { name: /Draf AI|Buat Draf/i });
    fireEvent.click(aiBtn);
    expect(onOpenAiDraft).toHaveBeenCalledWith(mockContact);
  });

  it('handles inline editing for possibleFollowUpTopic, lastUpdateNotes, and metContext', async () => {
    const onUpdateContact = vi.fn().mockResolvedValue(undefined);
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={onUpdateContact}
      />
    );

    // Edit possibleFollowUpTopic
    const topicTextarea = screen.getByLabelText(/Bahan Obrolan|Topik Follow Up/i);
    await act(async () => {
      fireEvent.change(topicTextarea, { target: { value: 'Topik baru tentang microservices' } });
      fireEvent.blur(topicTextarea);
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      possibleFollowUpTopic: 'Topik baru tentang microservices',
    });

    // Edit lastUpdateNotes
    const notesTextarea = screen.getByLabelText(/Pembaruan Kabar|Catatan Terakhir/i);
    await act(async () => {
      fireEvent.change(notesTextarea, { target: { value: 'Sudah launching fitur baru' } });
      fireEvent.blur(notesTextarea);
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      lastUpdateNotes: 'Sudah launching fitur baru',
    });

    // Edit metContext
    const metTextarea = screen.getByLabelText(/Pertama Ketemu|Konteks Pertemuan/i);
    await act(async () => {
      fireEvent.change(metTextarea, { target: { value: 'Ketemu di kafe Cikini' } });
      fireEvent.blur(metTextarea);
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      metContext: 'Ketemu di kafe Cikini',
    });
  });

  it('handles quick schedule chips for nextSpecificFollowUp', async () => {
    const onUpdateContact = vi.fn().mockResolvedValue(undefined);
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={onUpdateContact}
        now={new Date('2026-10-10')}
      />
    );

    // Click "Besok (+1 hr)"
    const besokChip = screen.getByRole('button', { name: /Besok \(\+1 hr\)/i });
    await act(async () => {
      fireEvent.click(besokChip);
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      nextSpecificFollowUp: '2026-10-11T09:00',
    });

    // Click "+1 Minggu" (+7 days from 2026-10-10 -> 2026-10-17)
    const mingguChip = screen.getByRole('button', { name: /\+1 Minggu/i });
    await act(async () => {
      fireEvent.click(mingguChip);
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      nextSpecificFollowUp: '2026-10-17T09:00',
    });

    // Change time directly via time picker
    const timeInput = screen.getByLabelText(/Jam Follow Up/i);
    await act(async () => {
      fireEvent.change(timeInput, { target: { value: '14:30' } });
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      nextSpecificFollowUp: '2026-10-17T14:30',
    });

    // Click "Hapus Jadwal"
    const hapusChip = screen.getByRole('button', { name: /Hapus Jadwal/i });
    await act(async () => {
      fireEvent.click(hapusChip);
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      nextSpecificFollowUp: null,
    });
  });

  it('handles direct date picker for lastContactedDate and cycle days number input', async () => {
    const onUpdateContact = vi.fn().mockResolvedValue(undefined);
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={onUpdateContact}
      />
    );

    // Edit lastContactedDate
    const lastContactInput = screen.getByLabelText(/Terakhir Sapa|Tanggal Terakhir/i);
    await act(async () => {
      fireEvent.change(lastContactInput, { target: { value: '2026-10-08' } });
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      lastContactedDate: '2026-10-08',
    });

    // Edit followUpCycleDays
    const cycleInput = screen.getByLabelText(/Ritme Sapa|Siklus/i);
    await act(async () => {
      fireEvent.change(cycleInput, { target: { value: '21' } });
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      followUpCycleDays: 21,
    });
  });

  it('lets the cycle days input be cleared and retyped without snapping back', async () => {
    const onUpdateContact = vi.fn().mockResolvedValue(undefined);
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={onUpdateContact}
      />
    );

    const cycleInput = screen.getByLabelText(/Ritme Sapa/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(cycleInput, { target: { value: '' } });
    });
    expect(cycleInput.value).toBe('');
    expect(onUpdateContact).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.change(cycleInput, { target: { value: '30' } });
    });
    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', { followUpCycleDays: 30 });

    // Leaving the field empty restores the saved value
    await act(async () => {
      fireEvent.change(cycleInput, { target: { value: '' } });
      fireEvent.blur(cycleInput);
    });
    expect(cycleInput.value).toBe(String(mockContact.followUpCycleDays ?? 15));
  });

  it('renders recent interaction timeline entries', () => {
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        interactions={mockInteractions}
      />
    );

    expect(screen.getByText('Interaction Timeline')).toBeDefined();
    expect(screen.getByText('Coffee catchup di Senopati. Bahas roadmap.')).toBeDefined();
    expect(screen.getByText('Ucapin selamat promosi jabatan baru.')).toBeDefined();
  });

  it('renders empty timeline message when interactions is empty', () => {
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        interactions={[]}
      />
    );

    expect(screen.getByText(/Belum ada riwayat interaksi/i)).toBeDefined();
  });

  it('allows toggling association labels and calls onUpdateContact', async () => {
    const onUpdateContact = vi.fn().mockResolvedValue(undefined);
    render(
      <KinshipContactDossierModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onUpdateContact={onUpdateContact}
      />
    );

    // Click "Ubah Label" button
    const ubahBtn = screen.getByRole('button', { name: /Ubah Asosiasi Kontak/i });
    fireEvent.click(ubahBtn);

    expect(screen.getByText(/Pilih Label \/ Hubungan:/i)).toBeDefined();

    // Toggle 'Hoca' (currently mockContact only has ['Ihvan'])
    const hocaBtn = screen.getByRole('button', { name: /\+ Hoca/i });
    await act(async () => {
      fireEvent.click(hocaBtn);
    });

    expect(onUpdateContact).toHaveBeenCalledWith('contact-1', {
      associations: ['Keluarga', 'Ihvan', 'Hoca'],
      isProfessional: true,
    });
  });
});

describe('formatFactDate', () => {
  it('shows day, month and year', () => {
    expect(formatFactDate('2026-10-24')).toBe('24 Okt 2026');
    expect(formatFactDate('2026-01-05T09:00')).toBe('5 Jan 2026');
    expect(formatFactDate('bukan tanggal')).toBe('bukan tanggal');
  });
});
