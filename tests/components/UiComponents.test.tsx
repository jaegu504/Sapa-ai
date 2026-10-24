import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNavBar } from '../../src/components/ui/BottomNavBar';
import { Toast } from '../../src/components/ui/Toast';


describe('BottomNavBar', () => {
  it('renders default tabs and handles tab change', () => {
    const handleTabChange = vi.fn();
    render(<BottomNavBar activeTab="dashboard" onTabChange={handleTabChange} />);

    expect(screen.getByText('Beranda')).toBeDefined();
    expect(screen.getByText('Kontak')).toBeDefined();
    expect(screen.getByText('Jadwal')).toBeDefined();
    expect(screen.getByText('Pengaturan')).toBeDefined();

    fireEvent.click(screen.getByText('Kontak'));
    expect(handleTabChange).toHaveBeenCalledWith('contacts');
  });

  it('renders custom tabs and displays badges', () => {
    const customTabs = [
      { id: 'tab1', label: 'Tab Satu', icon: <span>1</span>, badge: 3 },
      { id: 'tab2', label: 'Tab Dua', icon: <span>2</span> },
    ];
    const handleTabChange = vi.fn();

    render(
      <BottomNavBar
        tabs={customTabs}
        activeTab="tab1"
        onTabChange={handleTabChange}
      />
    );

    expect(screen.getByText('Tab Satu')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('Tab Dua')).toBeDefined();

    fireEvent.click(screen.getByText('Tab Dua'));
    expect(handleTabChange).toHaveBeenCalledWith('tab2');
  });

  it('applies active styling to the selected tab', () => {
    render(<BottomNavBar activeTab="contacts" onTabChange={() => {}} />);
    const contactsBtn = screen.getByRole('button', { name: /kontak/i });
    expect(contactsBtn.className).toContain('text-[#2F54EB]');
  });
});

describe('Toast', () => {
  it('renders message when visible is true', () => {
    render(<Toast message="Pesan tersimpan" visible={true} />);
    expect(screen.getByText('Pesan tersimpan')).toBeDefined();
  });

  it('does not render when visible is false', () => {
    render(<Toast message="Pesan tersimpan" visible={false} />);
    expect(screen.queryByText('Pesan tersimpan')).toBeNull();
  });

  it('handles onClose callback', () => {
    const handleClose = vi.fn();
    render(
      <Toast
        message="Info penting"
        visible={true}
        onClose={handleClose}
        type="info"
      />
    );

    const closeButton = screen.getByRole('button', { name: /tutup|close/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders different toast types with appropriate styling', () => {
    const { rerender } = render(
      <Toast message="Berhasil" visible={true} type="success" />
    );
    expect(screen.getByText('Berhasil')).toBeDefined();

    rerender(<Toast message="Peringatan" visible={true} type="warning" />);
    expect(screen.getByText('Peringatan')).toBeDefined();

    rerender(<Toast message="Gagal" visible={true} type="error" />);
    expect(screen.getByText('Gagal')).toBeDefined();
  });
});
