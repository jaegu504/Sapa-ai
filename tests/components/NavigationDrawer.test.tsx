import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavigationDrawer } from '../../src/components/crm/NavigationDrawer';
import { Contact, InteractionLog } from '../../src/types/crm';

describe('NavigationDrawer', () => {
  const sampleContacts: Contact[] = [
    {
      id: 'c1',
      name: 'Yılmaz Kileci Abi',
      phoneNumber: '+905321112233',
      associations: ['Hoca', 'Ihvan'],
      isProfessional: true,
      lastContactedDate: '2026-09-20', // Overdue
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
      lastContactedDate: '2026-10-10', // Safe
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
      name: 'Bunda Sarah',
      phoneNumber: '+6281234567892',
      associations: ['Keluarga'],
      isProfessional: false,
      lastContactedDate: '2026-10-12', // Safe
      followUpCycleDays: 5,
      nextSpecificFollowUp: null,
      metContext: 'Keluarga besar',
      lastUpdateNotes: 'Keluarga sehat',
      possibleFollowUpTopic: 'Kabar anak-anak',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    },
    {
      id: 'c4',
      name: 'Emre Yilmaz',
      phoneNumber: '+905551234567',
      associations: ['Zahiri'],
      isProfessional: false,
      lastContactedDate: null, // Never contacted (overdue)
      followUpCycleDays: 21,
      nextSpecificFollowUp: null,
      metContext: 'Studi Istanbul',
      lastUpdateNotes: '',
      possibleFollowUpTopic: '',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  const sampleInteractions: InteractionLog[] = [
    {
      id: 'log1',
      contactId: 'c1',
      date: '2026-10-13T10:00:00Z',
      notes: 'Bahas persiapan kajian bulanan',
      type: 'whatsapp',
    },
    {
      id: 'log2',
      contactId: 'c2',
      date: '2026-10-11T14:30:00Z',
      notes: 'Telepon singkat tentang tesis',
      type: 'call',
    },
  ];

  it('does not render content when isOpen is false', () => {
    const handleClose = vi.fn();
    render(
      <NavigationDrawer
        isOpen={false}
        onClose={handleClose}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
      />
    );

    expect(screen.queryByText('Ringkasan & Analitik')).toBeNull();
  });

  it('renders header, overall health score, and total contacts count when open', () => {
    const handleClose = vi.fn();
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={handleClose}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
        now={new Date('2026-10-14T00:00:00Z')}
      />
    );

    expect(screen.getByText('Ringkasan & Analitik')).toBeDefined();
    expect(screen.getByText(/4 Total Relasi/i)).toBeDefined();

    // c1 is overdue (lastContacted Sep 20), c4 is overdue (null)
    // 2 out of 4 non-overdue => 50% health score
    expect(screen.getByText(/50%/)).toBeDefined();
  });

  it('calls onClose when close button or backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={handleClose}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /tutup menu/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('renders category distribution breakdown accurately', () => {
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={vi.fn()}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
      />
    );

    // Ihvan: c1, c2 -> 2
    // Hoca: c1 -> 1
    // Keluarga: c3 -> 1
    // Zahiri: c4 -> 1
    // Teman: c2 -> 1
    // Profesional: c1 (isProfessional=true) -> 1
    expect(screen.getByText('Ihvan')).toBeDefined();
    expect(screen.getByText('Hoca')).toBeDefined();
    expect(screen.getByText('Keluarga')).toBeDefined();
    expect(screen.getByText('Zahiri')).toBeDefined();
    expect(screen.getByText('Teman')).toBeDefined();
    expect(screen.getByText('Profesional')).toBeDefined();

    const ihvanCount = screen.getByTestId('category-count-ihvan');
    expect(ihvanCount.textContent).toBe('2');

    const hocaCount = screen.getByTestId('category-count-hoca');
    expect(hocaCount.textContent).toBe('1');

    const proCount = screen.getByTestId('category-count-profesional');
    expect(proCount.textContent).toBe('1');
  });

  it('triggers quick filter shortcut callbacks and closes drawer', () => {
    const handleSelectFilter = vi.fn();
    const handleClose = vi.fn();

    render(
      <NavigationDrawer
        isOpen={true}
        onClose={handleClose}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onSelectFilter={handleSelectFilter}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
      />
    );

    // Filter "Semua Relasi"
    fireEvent.click(screen.getByRole('button', { name: /semua relasi/i }));
    expect(handleSelectFilter).toHaveBeenCalledWith('all');
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Filter "Perlu Disapa (Overdue)"
    fireEvent.click(screen.getByRole('button', { name: /perlu disapa/i }));
    expect(handleSelectFilter).toHaveBeenCalledWith('overdue');
    expect(handleClose).toHaveBeenCalledTimes(2);

    // Filter "Jadwal Minggu Ini"
    fireEvent.click(screen.getByRole('button', { name: /jadwal minggu ini/i }));
    expect(handleSelectFilter).toHaveBeenCalledWith('week');
    expect(handleClose).toHaveBeenCalledTimes(3);

    // Filter "Belum Pernah Disapa"
    fireEvent.click(screen.getByRole('button', { name: /belum pernah disapa/i }));
    expect(handleSelectFilter).toHaveBeenCalledWith('never_contacted');
    expect(handleClose).toHaveBeenCalledTimes(4);
  });

  it('displays recent interaction logs', () => {
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={vi.fn()}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
      />
    );

    expect(screen.getByText(/Riwayat Log Interaksi/i)).toBeDefined();
    expect(screen.getByText('Bahas persiapan kajian bulanan')).toBeDefined();
    expect(screen.getByText('Telepon singkat tentang tesis')).toBeDefined();
  });

  it('displays empty state when no interaction logs exist', () => {
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={vi.fn()}
        contacts={sampleContacts}
        interactions={[]}
        onExportBackup={vi.fn()}
        onImportBackup={vi.fn()}
      />
    );

    expect(screen.getByText(/Belum ada riwayat interaksi/i)).toBeDefined();
  });

  it('triggers onExportBackup when export button is clicked', () => {
    const handleExport = vi.fn();
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={vi.fn()}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={handleExport}
        onImportBackup={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /ekspor backup json/i }));
    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('triggers onImportBackup with file content when JSON file is selected', async () => {
    const handleImport = vi.fn().mockResolvedValue(undefined);
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={vi.fn()}
        contacts={sampleContacts}
        interactions={sampleInteractions}
        onExportBackup={vi.fn()}
        onImportBackup={handleImport}
      />
    );

    const jsonContent = JSON.stringify({ contacts: sampleContacts, interactions: sampleInteractions });
    const file = new File([jsonContent], 'backup.json', { type: 'application/json' });

    const fileInput = screen.getByTestId('backup-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleImport).toHaveBeenCalledWith(jsonContent);
    });
  });
});
