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

  it('renders Sapa header and default Radar tab', async () => {
    render(<App />);

    // Check header title
    expect(screen.getByText('Sapa')).toBeDefined();

    // Bottom nav tabs should be rendered
    expect(screen.getByRole('button', { name: /^radar$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^kontak$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^jadwal$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^pengaturan$/i })).toBeDefined();

    // Default Radar (KinshipDashboardView) should display Denyut Sapa
    await waitFor(() => {
      expect(screen.getByLabelText(/Denyut Sapa Overview/i)).toBeDefined();
      expect(screen.getByText(/Cadence Radar/i)).toBeDefined();
    });
  });

  it('navigates to Kontak tab and toggles between Kinship cards and Notion table view', async () => {
    const testContact = {
      id: 'c-toggle-1',
      name: 'Farhan Maulana',
      phoneNumber: '+6281234567811',
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
    };
    await crmDb.contacts.add(testContact);

    render(<App />);

    const contactsTabBtn = screen.getByRole('button', { name: /^kontak$/i });
    fireEvent.click(contactsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Semua Kontak/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /tampilan kartu/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /tampilan tabel notion/i })).toBeDefined();
      // By default in cards view
      expect(screen.getByTestId('kinship-card-c-toggle-1')).toBeDefined();
    });

    // Switch to Notion table view
    const tableBtn = screen.getByRole('button', { name: /tampilan tabel notion/i });
    fireEvent.click(tableBtn);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeDefined();
      expect(screen.getAllByText('Farhan Maulana').length).toBeGreaterThanOrEqual(1);
    });

    // Switch back to Card view
    const cardsBtn = screen.getByRole('button', { name: /tampilan kartu/i });
    fireEvent.click(cardsBtn);

    await waitFor(() => {
      expect(screen.getByTestId('kinship-card-c-toggle-1')).toBeDefined();
    });
  });

  it('navigates to Jadwal tab and displays Kinship notifications', async () => {
    render(<App />);

    const calendarTabBtn = screen.getByRole('button', { name: /^jadwal$/i });
    fireEvent.click(calendarTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Jadwal & Pengingat/i)).toBeDefined();
      expect(screen.getByText(/08:00 WIB Aktif/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /jadwal sapaan/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /kotak masuk/i })).toBeDefined();
    });
  });

  it('navigates to Pengaturan tab and configures Gemini API Key', async () => {
    render(<App />);

    const settingsTabBtn = screen.getByRole('button', { name: /^pengaturan$/i });
    fireEvent.click(settingsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Pengaturan & Konfigurasi/i)).toBeDefined();
      expect(screen.getByText(/Google Gemini AI API Key/i)).toBeDefined();
    });

    const apiKeyInput = screen.getByPlaceholderText(/Masukkan Google Gemini API Key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSyTestApiKey12345' } });

    const saveKeyBtn = screen.getByRole('button', { name: /Simpan Kunci/i });
    fireEvent.click(saveKeyBtn);

    await waitFor(() => {
      expect(localStorage.getItem('growSphere_gemini_api_key')).toBe('AIzaSyTestApiKey12345');
      expect(screen.getByText(/Gemini API Key berhasil disimpan/i)).toBeDefined();
    });
  });

  it('seeds demo contacts and populates database', async () => {
    render(<App />);

    const settingsTabBtn = screen.getByRole('button', { name: /^pengaturan$/i });
    fireEvent.click(settingsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Isi Data Contoh \(Demo Seed\)/i)).toBeDefined();
    });

    const seedBtn = screen.getByRole('button', { name: /Isi Data Contoh \(Demo Seed\)/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(screen.getByText(/Data kontak contoh berhasil di-seed!/i)).toBeDefined();
    });

    // Switch back to Radar to see seeded contacts
    const radarTabBtn = screen.getByRole('button', { name: /^radar$/i });
    fireEvent.click(radarTabBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Ustadz Danu Hasan').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Bunda Sarah')).toBeDefined();
    });
  });

  it('opens Add Contact modal when Tambah Kontak button is clicked', async () => {
    render(<App />);

    const addContactBtn = screen.getByRole('button', { name: /tambah kontak baru/i });
    fireEvent.click(addContactBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Tambah Kontak Baru')).toBeDefined();
    });
  });

  it('opens Phonebook Sync modal when Impor HP button is clicked', async () => {
    render(<App />);

    const importBtn = screen.getByRole('button', { name: /impor kontak telepon/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /sinkronisasi & impor kontak/i })).toBeDefined();
    });
  });

  it('opens and closes NavigationDrawer from the hamburger menu button', async () => {
    render(<App />);

    const menuBtn = screen.getByRole('button', { name: /buka menu analitik/i });
    fireEvent.click(menuBtn);

    await waitFor(() => {
      expect(screen.getByText('Ringkasan & Analitik')).toBeDefined();
      expect(screen.getByText(/Health Score Silaturahmi/i)).toBeDefined();
    });

    const closeBtn = screen.getByRole('button', { name: /tutup menu/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Ringkasan & Analitik')).toBeNull();
    });
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

  it('exports JSON backup when triggered from NavigationDrawer', async () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App />);

    const menuBtn = screen.getByRole('button', { name: /buka menu analitik/i });
    fireEvent.click(menuBtn);

    await waitFor(() => {
      expect(screen.getByText('Ringkasan & Analitik')).toBeDefined();
    });

    const exportBtn = screen.getByRole('button', { name: /ekspor backup json/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('opens Kinship Log Interaction modal and saves encounter to database', async () => {
    const testContact = {
      id: 'c-test-log-encounter',
      name: 'Ustadz Hilman Fauzi',
      phoneNumber: '+6281234567822',
      associations: ['Hoca'],
      isProfessional: false,
      followUpCycleDays: 7,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Masjid Agung',
      lastUpdateNotes: 'Persiapan kajian',
      possibleFollowUpTopic: 'Jadwal khutbah',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await crmDb.contacts.add(testContact);

    render(<App />);

    // Go to Kontak tab
    const contactsTabBtn = screen.getByRole('button', { name: /^kontak$/i });
    fireEvent.click(contactsTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('kinship-card-c-test-log-encounter')).toBeDefined();
    });

    // Click "Catat Interaksi" button on card
    const catatBtn = screen.getByRole('button', {
      name: /catat interaksi ustadz hilman fauzi/i,
    });
    fireEvent.click(catatBtn);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/Catat Interaksi:/i)).toBeDefined();
    });

    const dialog = screen.getByRole('dialog');
    const notesInput = within(dialog).getByLabelText(/Poin Obrolan & Catatan Penting/i);
    fireEvent.change(notesInput, { target: { value: 'Silaturahmi di serambi masjid dan makan bersama' } });

    const saveBtn = within(dialog).getByRole('button', { name: /simpan catatan interaksi/i });
    fireEvent.click(saveBtn);

    await waitFor(async () => {
      const logs = await crmDb.interactions.where('contactId').equals('c-test-log-encounter').toArray();
      expect(logs.length).toBe(1);
      expect(logs[0].notes).toContain('Silaturahmi di serambi masjid dan makan bersama');
    });
  });

  it('opens AI draft modal with dual WhatsApp buttons from radar feed', async () => {
    const testContact = {
      id: 'c-test-ai-draft',
      name: 'Kang Emil',
      phoneNumber: '+6281234567833',
      associations: ['Teman'],
      isProfessional: true,
      followUpCycleDays: 14,
      lastContactedDate: '2026-10-01',
      nextSpecificFollowUp: null,
      metContext: 'Webinar',
      lastUpdateNotes: 'Proyek baru',
      possibleFollowUpTopic: 'Kolaborasi riset',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await crmDb.contacts.add(testContact);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('radar-ai-draft-c-test-ai-draft')).toBeDefined();
    });

    const aiDraftBtn = screen.getByTestId('radar-ai-draft-c-test-ai-draft');
    fireEvent.click(aiDraftBtn);

    await waitFor(() => {
      const draftModal = screen.getByRole('dialog');
      expect(within(draftModal).getByText('Sapa via WhatsApp')).toBeDefined();
      expect(within(draftModal).getByRole('button', { name: /kirim via whatsapp$/i })).toBeDefined();
      expect(within(draftModal).getByRole('button', { name: /kirim via whatsapp business/i })).toBeDefined();
    });
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
