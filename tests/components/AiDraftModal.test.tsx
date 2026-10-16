import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiDraftModal } from '../../src/components/crm/AiDraftModal';
import { Contact } from '../../src/types/crm';
import * as aiDraftService from '../../src/services/aiDraftService';

describe('AiDraftModal', () => {
  const baseContact: Contact = {
    id: 'c1',
    name: 'Ustadz Mansur',
    phoneNumber: '+6281234567890',
    associations: ['Hoca'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: 'Kajian Masjid Raya',
    lastUpdateNotes: 'Kabar pesantren dan santri',
    possibleFollowUpTopic: 'Silaturahmi dan wakaf buku',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<AiDraftModal contact={baseContact} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Ustadz Mansur')).toBeNull();
  });

  it('does not render when contact is null', () => {
    render(<AiDraftModal contact={null} isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText(/Ustadz Mansur/i)).toBeNull();
  });

  it('displays contact name and etiquette tone badge for Hoca', async () => {
    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue(
      'Assalamu’alaikum Ustadz Mansur, semoga sehat selalu.'
    );

    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Ustadz Mansur')).toBeDefined();
    expect(screen.getByText(/Takzim, Hormat & Santun/i)).toBeDefined();

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Assalamu’alaikum Ustadz Mansur, semoga sehat selalu.')
      ).toBeDefined();
    });
  });

  it('displays correct etiquette tone badge for Ihvan/Teman', async () => {
    const ihvanContact: Contact = {
      ...baseContact,
      id: 'c2',
      name: 'Farhan',
      associations: ['Ihvan', 'Teman'],
    };

    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue(
      'Assalamu’alaikum Farhan akhi, apa kabar?'
    );

    render(<AiDraftModal contact={ihvanContact} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Hangat & Santai/i)).toBeDefined();
  });

  it('displays correct etiquette tone badge for Keluarga', async () => {
    const familyContact: Contact = {
      ...baseContact,
      id: 'c3',
      name: 'Paman Hasan',
      associations: ['Keluarga'],
    };

    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue(
      'Assalamu’alaikum Paman Hasan, apa kabar sekeluarga?'
    );

    render(<AiDraftModal contact={familyContact} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Penuh Perhatian & Kasih/i)).toBeDefined();
  });

  it('displays correct etiquette tone badge for Profesional', async () => {
    const proContact: Contact = {
      ...baseContact,
      id: 'c4',
      name: 'Budi Santoso',
      associations: ['Profesional'],
      isProfessional: true,
    };

    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue(
      'Selamat pagi Pak Budi, semoga dalam keadaan sehat.'
    );

    render(<AiDraftModal contact={proContact} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Profesional & Sopan/i)).toBeDefined();
  });

  it('calls generateWhatsAppDraft on open and updates textarea when user edits', async () => {
    const draftSpy = vi
      .spyOn(aiDraftService, 'generateWhatsAppDraft')
      .mockResolvedValue('Draf awal dari AI');

    render(
      <AiDraftModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        apiKey="test-gemini-key"
      />
    );

    expect(draftSpy).toHaveBeenCalledWith(baseContact, 'test-gemini-key');

    const textarea = await screen.findByDisplayValue('Draf awal dari AI');
    fireEvent.change(textarea, { target: { value: 'Pesan sudah disunting oleh user' } });
    expect(screen.getByDisplayValue('Pesan sudah disunting oleh user')).toBeDefined();
  });

  it('regenerates draft when Generate Ulang button is clicked', async () => {
    const draftSpy = vi
      .spyOn(aiDraftService, 'generateWhatsAppDraft')
      .mockResolvedValueOnce('Draf Pertama')
      .mockResolvedValueOnce('Draf Kedua yang Diperbarui');

    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={vi.fn()} />);

    await screen.findByDisplayValue('Draf Pertama');

    const regenBtn = screen.getByRole('button', { name: /generate ulang/i });
    fireEvent.click(regenBtn);

    await screen.findByDisplayValue('Draf Kedua yang Diperbarui');
    expect(draftSpy).toHaveBeenCalledTimes(2);
  });

  it('opens regular WhatsApp when Kirim via WhatsApp is clicked', async () => {
    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue('Pesan tes silaturahmi');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={vi.fn()} />);

    await screen.findByDisplayValue('Pesan tes silaturahmi');

    const waBtn = screen.getByRole('button', { name: /kirim via whatsapp$/i });
    fireEvent.click(waBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://wa.me/6281234567890?text=');
    expect(calledUrl).toContain(encodeURIComponent('Pesan tes silaturahmi'));
    expect(openSpy.mock.calls[0][1]).toBe('_blank');
  });

  it('opens WhatsApp Business when Kirim via WhatsApp Business is clicked', async () => {
    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue('Pesan tes bisnis');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={vi.fn()} />);

    await screen.findByDisplayValue('Pesan tes bisnis');

    const waBizBtn = screen.getByRole('button', { name: /kirim via whatsapp business/i });
    fireEvent.click(waBizBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://wa.me/6281234567890?text=');
    expect(calledUrl).toContain(encodeURIComponent('Pesan tes bisnis'));
    expect(openSpy.mock.calls[0][1]).toBe('_blank');
  });

  it('calls onLogChatCompleted when checkbox is checked and Kirim via WhatsApp is clicked', async () => {
    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue('Pesan dengan auto mark');
    vi.spyOn(window, 'open').mockImplementation(() => null);
    const logChatSpy = vi.fn();

    render(
      <AiDraftModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onLogChatCompleted={logChatSpy}
      />
    );

    await screen.findByDisplayValue('Pesan dengan auto mark');

    // Find the checkbox for marking chat completed
    const checkbox = screen.getByRole('checkbox', { name: /tandai langsung selesai ngobrol/i });
    if (!checkbox.getAttribute('checked') && !(checkbox as HTMLInputElement).checked) {
      fireEvent.click(checkbox);
    }

    const waBtn = screen.getByRole('button', { name: /kirim via whatsapp$/i });
    fireEvent.click(waBtn);

    expect(logChatSpy).toHaveBeenCalledWith(baseContact);
  });

  it('calls onLogChatCompleted when quick Mark Done button is clicked', async () => {
    vi.spyOn(aiDraftService, 'generateWhatsAppDraft').mockResolvedValue('Pesan');
    const logChatSpy = vi.fn();

    render(
      <AiDraftModal
        contact={baseContact}
        isOpen={true}
        onClose={vi.fn()}
        onLogChatCompleted={logChatSpy}
      />
    );

    await screen.findByDisplayValue('Pesan');

    const doneBtn = screen.getByRole('button', { name: /tandai selesai/i });
    fireEvent.click(doneBtn);

    expect(logChatSpy).toHaveBeenCalledWith(baseContact);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /tutup/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('auto-detects Turkish when contact phone starts with +90 and displays Türkçe segment', async () => {
    const trContact: Contact = {
      ...baseContact,
      id: 'c_tr',
      name: 'Emre Yilmaz',
      phoneNumber: '+905551234567',
    };

    render(<AiDraftModal contact={trContact} isOpen={true} onClose={vi.fn()} />);

    // Segmented button for Türkçe should exist and be active
    const trBtn = screen.getByRole('button', { name: /türkçe|tr/i });
    expect(trBtn).toBeDefined();
  });

  it('displays 3 instant draft option cards and updates textarea when another card is clicked without re-generating', async () => {
    const sapaSpy = vi.spyOn(aiDraftService, 'generateSapaDrafts').mockResolvedValue({
      drafts: [
        { id: '1', angle: 'warm_greeting', title: 'Kabar & Doa', text: 'Teks opsi pertama' },
        { id: '2', angle: 'topic_discussion', title: 'Bahasan Topik', text: 'Teks opsi kedua topik' },
        { id: '3', angle: 'catchup_meet', title: 'Ajak Temu / Ngopi', text: 'Teks opsi ketiga temu' },
      ],
      source: 'offline_rule',
    });

    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={vi.fn()} />);

    // 3 cards rendered
    expect(await screen.findByText('Kabar & Doa')).toBeDefined();
    expect(screen.getByText('Bahasan Topik')).toBeDefined();
    expect(screen.getByText(/Ajak Temu/i)).toBeDefined();

    // Initially selected first card
    expect(screen.getByDisplayValue('Teks opsi pertama')).toBeDefined();
    expect(sapaSpy).toHaveBeenCalledTimes(1);

    // Click on 2nd card (Bahasan Topik)
    const topicCard = screen.getByText('Bahasan Topik');
    fireEvent.click(topicCard);

    // Textarea now displays second option instantly
    await waitFor(() => {
      expect(screen.getByDisplayValue('Teks opsi kedua topik')).toBeDefined();
    });

    // CRITICAL: generateSapaDrafts MUST NOT be called again on option click!
    expect(sapaSpy).toHaveBeenCalledTimes(1);
  });

  it('switches language and generates drafts in chosen language when language segment is tapped', async () => {
    const sapaSpy = vi.spyOn(aiDraftService, 'generateSapaDrafts').mockResolvedValue({
      drafts: [
        { id: '1', angle: 'warm_greeting', title: 'Kabar & Doa', text: 'Teks ID' },
        { id: '2', angle: 'topic_discussion', title: 'Bahasan Topik', text: 'Teks Topik ID' },
        { id: '3', angle: 'catchup_meet', title: 'Ajak Temu', text: 'Teks Temu ID' },
      ],
      source: 'offline_rule',
    });

    render(<AiDraftModal contact={baseContact} isOpen={true} onClose={vi.fn()} />);

    await screen.findByText('Kabar & Doa');

    // Tap Turkish segment
    const trBtn = screen.getByRole('button', { name: /türkçe|tr/i });
    fireEvent.click(trBtn);

    await waitFor(() => {
      expect(sapaSpy).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'tr' }),
        undefined,
        undefined
      );
    });
  });
});
