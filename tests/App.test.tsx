import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from '../src/App';
import { crmDb } from '../src/db/crmDatabase';

describe('App Integration', () => {
  beforeEach(async () => {
    await crmDb.contacts.clear();
    await crmDb.interactions.clear();
    localStorage.clear();
    localStorage.setItem('sapa_onboarding_completed', 'true');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Radar Sapa and the bottom navigation', async () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /^radar$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^kontak$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^jadwal$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^pengaturan$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /catat kabar dengan suara/i })).toBeDefined();

    expect(await screen.findByText('Radar Sapa')).toBeDefined();
    expect(screen.getByText('Denyut Sapa')).toBeDefined();
  });

  it('Kontak tab lists contacts, searches and filters by label', async () => {
    await crmDb.contacts.bulkAdd([
      {
      id: 'c-1',
      name: 'Farhan Maulana',
      phoneNumber: '+6281234545255',
      associations: ['Teman'],
      isProfessional: false,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Kampus',
      lastUpdateNotes: 'Kabar baik',
      possibleFollowUpTopic: 'Diskusi skripsi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
      {
      id: 'c-2',
      name: 'Ibu Aminah',
      phoneNumber: '+6281234593740',
            isProfessional: false,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Kampus',
      lastUpdateNotes: 'Kabar baik',
      possibleFollowUpTopic: 'Diskusi skripsi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      associations: ['Keluarga'] as string[],
    },
    ]);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^kontak$/i }));

    expect(await screen.findByTestId('kinship-card-c-1')).toBeDefined();
    expect(screen.getByTestId('kinship-card-c-2')).toBeDefined();
    expect(screen.queryByText('Tabel Notion')).toBeNull();

    fireEvent.change(screen.getByLabelText('Cari kontak'), { target: { value: 'farhan' } });
    await waitFor(() => expect(screen.queryByTestId('kinship-card-c-2')).toBeNull());
    fireEvent.change(screen.getByLabelText('Cari kontak'), { target: { value: '' } });

    fireEvent.click(within(screen.getByLabelText('Filter kontak')).getByRole('button', { name: 'Keluarga' }));
    await waitFor(() => expect(screen.queryByTestId('kinship-card-c-1')).toBeNull());
    expect(screen.getByTestId('kinship-card-c-2')).toBeDefined();
  });

  it('navigates to Jadwal without time zone labels', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^jadwal$/i }));

    expect(await screen.findByText('Pengingat harian jam 08:00')).toBeDefined();
    expect(screen.queryByText(/WIB/)).toBeNull();
  });

  it('Pengaturan saves a personal AI key under Lanjutan and has no demo data button', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^pengaturan$/i }));

    fireEvent.click(await screen.findByRole('button', { name: /Lanjutan \(kunci AI\)/i }));
    fireEvent.change(screen.getByLabelText('Kunci AI pribadi'), { target: { value: 'AIzaSyTestApiKey12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => {
      expect(localStorage.getItem('growSphere_gemini_api_key')).toBe('AIzaSyTestApiKey12345');
      expect(screen.getByText('Kunci AI pribadi disimpan')).toBeDefined();
    });
    expect(screen.queryByText(/Data Contoh/i)).toBeNull();
    expect(screen.getByText(/Sapa v\d+\.\d+\.\d+ · Data tersimpan hanya di HP ini/)).toBeDefined();
  });

  it('opens Add Contact from the + button on the Kontak tab', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^kontak$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /tambah kontak baru/i }));

    expect(await screen.findByText('Tambah Kontak Baru')).toBeDefined();
  });

  it('opens phone import from Pengaturan', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^pengaturan$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /impor dari kontak hp/i }));

    expect(await screen.findByRole('region', { name: /sinkronisasi & impor kontak/i })).toBeDefined();
  });

  it('re-sync offers new phone contacts and never removes anything in the browser', async () => {
    await crmDb.contacts.add({
      id: 'c-keep',
      name: 'Kontak Lama',
      phoneNumber: '+6281234521202',
      associations: ['Teman'],
      isProfessional: false,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Kampus',
      lastUpdateNotes: 'Kabar baik',
      possibleFollowUpTopic: 'Diskusi skripsi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'phone' as const,
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^kontak$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /sinkron ulang dengan kontak hp/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/belum ada di Sapa/)).toBeDefined();
    expect(within(dialog).queryByRole('button', { name: /^Hapus/ })).toBeNull();
    expect(await crmDb.contacts.get('c-keep')).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Pilih kontak baru' }));
    expect(await screen.findByRole('region', { name: /sinkronisasi & impor kontak/i })).toBeDefined();
  });

  it('toggles DeviceEmulatorFrame between emulator and desktop mode', async () => {
    render(<App />);

    // Toggle to emulator mode
    const emulatorBtn = screen.getByRole('button', { name: /mode emulator hp/i });
    fireEvent.click(emulatorBtn);

    await waitFor(() => {
      expect(screen.getByTestId('device-emulator-frame')).toBeDefined();
      expect(screen.getByTestId('device-emulator-viewport')).toBeDefined();
    });

    // Toggle back to desktop mode
    const desktopBtn = screen.getByRole('button', { name: /mode desktop/i });
    fireEvent.click(desktopBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('device-emulator-frame')).toBeNull();
    });
  });

  it('updates contact inline and persists to database via Kinship Dossier modal', async () => {
    const testContact = {
      id: 'c-test-update-1',
      name: 'Habib Umar Faruq',
      phoneNumber: '+6281234567800',
      associations: ['Ihvan'],
      isProfessional: false,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Pertemuan Masjid',
      lastUpdateNotes: 'Catatan awal',
      possibleFollowUpTopic: 'Topik awal diskusi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await crmDb.contacts.add(testContact);

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Habib Umar Faruq').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByText('Habib Umar Faruq')[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    const chip3Hari = screen.getByRole('button', { name: /\+3 Hari/i });
    fireEvent.click(chip3Hari);

    await waitFor(async () => {
      const updated = await crmDb.contacts.get('c-test-update-1');
      expect(updated?.nextSpecificFollowUp).toBeDefined();
      expect(updated?.nextSpecificFollowUp).not.toBeNull();
    });
  });

  it('saves a backup file from Pengaturan', async () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^pengaturan$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /simpan cadangan/i }));

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('logs an interaction from the profile Catat button', async () => {
    await crmDb.contacts.add({
      id: 'c-log',
      name: 'Ustadz Hilman Fauzi',
      phoneNumber: '+6281234510320',
      associations: ['Teman'],
      isProfessional: false,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Kampus',
      lastUpdateNotes: 'Kabar baik',
      possibleFollowUpTopic: 'Diskusi skripsi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^kontak$/i }));
    fireEvent.click(await screen.findByTestId('kinship-card-c-log'));
    fireEvent.click(await screen.findByRole('button', { name: 'Catat' }));

    const notesInput = await screen.findByLabelText(/Poin Obrolan & Catatan Penting/i);
    fireEvent.change(notesInput, { target: { value: 'Silaturahmi di serambi masjid' } });
    fireEvent.click(screen.getByRole('button', { name: /simpan catatan interaksi/i }));

    await waitFor(async () => {
      const logs = await crmDb.interactions.where('contactId').equals('c-log').toArray();
      expect(logs.length).toBe(1);
      expect(logs[0].notes).toContain('Silaturahmi di serambi masjid');
    });
  });

  it('Sapa button offers AI or WhatsApp and opens the AI draft', async () => {
    await crmDb.contacts.add({
      id: 'c-ai',
      name: 'Kang Emil',
      phoneNumber: '+6281234513475',
      associations: ['Teman'],
      isProfessional: false,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Kampus',
      lastUpdateNotes: 'Kabar baik',
      possibleFollowUpTopic: 'Diskusi skripsi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sapa Kang Emil' }));
    expect(await screen.findByRole('button', { name: /WhatsApp Business/ })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Tulis dengan AI/ }));

    expect(await screen.findByText('Draf Sapaan')).toBeDefined();
    expect(screen.getByRole('button', { name: /kirim via whatsapp$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /kirim via whatsapp business/i })).toBeDefined();
  });

  it('shows first-time onboarding modal when sapa_onboarding_completed is not set, and hides it when completed', async () => {
    localStorage.removeItem('sapa_onboarding_completed');
    render(<App />);

    expect(screen.getByTestId('onboarding-modal')).toBeDefined();
    expect(screen.getByText("Assalamu'alaikum, Selamat Datang di Sapa")).toBeDefined();

    // Click Lewati
    fireEvent.click(screen.getByText('Lewati'));

    expect(JSON.parse(localStorage.getItem('sapa_tutorial_state') || '{}').status).toBe('done');
    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-modal')).toBeNull();
    });
  });

  it('Ulangi Tutorial in Settings reopens the intro', async () => {
    render(<App />);

    const settingsTabBtn = screen.getByRole('button', { name: /^pengaturan$/i });
    fireEvent.click(settingsTabBtn);

    const tutorialBtn = await screen.findByRole('button', { name: /Ulangi Tutorial/i });
    fireEvent.click(tutorialBtn);

    expect(screen.getByTestId('onboarding-modal')).toBeDefined();
    expect(screen.getByText("Assalamu'alaikum, Selamat Datang di Sapa")).toBeDefined();
  });
});
