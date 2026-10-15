import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../src/App';
import { crmDb } from '../src/db/crmDatabase';

describe('App Integration', () => {
  beforeEach(async () => {
    await crmDb.contacts.clear();
    await crmDb.interactions.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders GrowSphere header and default Beranda tab', async () => {
    render(<App />);

    // Check header title
    expect(screen.getByText('GrowSphere')).toBeDefined();

    // Bottom nav tabs should be rendered
    expect(screen.getByRole('button', { name: /^beranda$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^kontak$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^jadwal$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^pengaturan$/i })).toBeDefined();

    // Default Beranda (DashboardView) should display greeting
    await waitFor(() => {
      expect(screen.getByText(/selamat (pagi|siang|sore|malam), sahabat!/i)).toBeDefined();
    });
  });

  it('navigates to Kontak tab and displays Notion table view', async () => {
    render(<App />);

    const contactsTabBtn = screen.getByRole('button', { name: /^kontak$/i });
    fireEvent.click(contactsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Semua Kontak \(Tampilan Notion\)/i)).toBeDefined();
    });
  });

  it('navigates to Jadwal tab and displays alarms and daily digest', async () => {
    render(<App />);

    const calendarTabBtn = screen.getByRole('button', { name: /^jadwal$/i });
    fireEvent.click(calendarTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Jadwal & Pengingat Silaturahmi/i)).toBeDefined();
      expect(screen.getByText(/Alarm Target Terdekat/i)).toBeDefined();
      expect(screen.getByText(/Rangkuman Silaturahmi Hari Ini/i)).toBeDefined();
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

    // Switch back to Beranda to see seeded contacts
    const homeTabBtn = screen.getByRole('button', { name: /^beranda$/i });
    fireEvent.click(homeTabBtn);

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

  it('opens Import Contact modal when Impor HP button is clicked', async () => {
    render(<App />);

    const importBtn = screen.getByRole('button', { name: /impor kontak telepon/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Impor Kontak Telepon')).toBeDefined();
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

  it('updates contact inline and persists to database', async () => {
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
});
