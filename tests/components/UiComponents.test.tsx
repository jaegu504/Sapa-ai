import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CircularQuickAction } from '../../src/components/ui/CircularQuickAction';
import { FilterPill } from '../../src/components/ui/FilterPill';
import { MetricStrip } from '../../src/components/ui/MetricStrip';
import { BottomNavBar } from '../../src/components/ui/BottomNavBar';
import { Toast } from '../../src/components/ui/Toast';

describe('CircularQuickAction', () => {
  it('renders label and icon correctly', () => {
    const handleClick = vi.fn();
    render(
      <CircularQuickAction
        label="Sapa WA"
        icon={<span data-testid="test-icon">icon</span>}
        onClick={handleClick}
      />
    );

    expect(screen.getByText('Sapa WA')).toBeDefined();
    expect(screen.getByTestId('test-icon')).toBeDefined();

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders badge if provided', () => {
    render(
      <CircularQuickAction
        label="Pesan"
        icon={<span>✉️</span>}
        onClick={() => {}}
        badge={5}
      />
    );

    expect(screen.getByText('5')).toBeDefined();
  });

  it('disables button when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(
      <CircularQuickAction
        label="Disabled Action"
        icon={<span>⛔</span>}
        onClick={handleClick}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(
      <CircularQuickAction
        label="Primary"
        icon={<span>P</span>}
        onClick={() => {}}
        variant="primary"
      />
    );
    expect(screen.getByRole('button').className).toContain('bg-[#2F54EB]');

    rerender(
      <CircularQuickAction
        label="Secondary"
        icon={<span>S</span>}
        onClick={() => {}}
        variant="secondary"
      />
    );
    expect(screen.getByRole('button').className).toContain('bg-slate-100');

    rerender(
      <CircularQuickAction
        label="Accent"
        icon={<span>A</span>}
        onClick={() => {}}
        variant="accent"
      />
    );
    expect(screen.getByRole('button').className).toContain('bg-amber-100');
  });
});

describe('FilterPill', () => {
  it('renders label and responds to clicks', () => {
    const handleClick = vi.fn();
    render(<FilterPill label="Keluarga" active={false} onClick={handleClick} />);

    const button = screen.getByRole('button', { name: /keluarga/i });
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays active and inactive styles based on active prop', () => {
    const { rerender } = render(
      <FilterPill label="Semua" active={true} onClick={() => {}} />
    );
    const activeButton = screen.getByRole('button');
    expect(activeButton.className).toContain('bg-[#2F54EB]');
    expect(activeButton.className).toContain('text-white');

    rerender(<FilterPill label="Semua" active={false} onClick={() => {}} />);
    const inactiveButton = screen.getByRole('button');
    expect(inactiveButton.className).toContain('bg-slate-100');
    expect(inactiveButton.className).toContain('text-slate-600');
  });

  it('renders count when provided', () => {
    render(<FilterPill label="Sahabat" active={false} count={12} onClick={() => {}} />);
    expect(screen.getByText('12')).toBeDefined();
  });
});

describe('MetricStrip', () => {
  it('renders 3 metrics with labels and values', () => {
    const metrics = [
      { label: 'Total Relasi', value: 45, badgeColor: 'blue' as const },
      { label: 'Harmoni', value: '88%', badgeColor: 'green' as const },
      { label: 'Tertunda', value: 3, badgeColor: 'rose' as const },
    ];

    render(<MetricStrip metrics={metrics} />);

    expect(screen.getByText('Total Relasi')).toBeDefined();
    expect(screen.getByText('45')).toBeDefined();
    expect(screen.getByText('Harmoni')).toBeDefined();
    expect(screen.getByText('88%')).toBeDefined();
    expect(screen.getByText('Tertunda')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('handles metric badge colors', () => {
    const metrics = [
      { label: 'Amber', value: 10, badgeColor: 'amber' as const },
      { label: 'Slate', value: 20, badgeColor: 'slate' as const },
    ];

    const { container } = render(<MetricStrip metrics={metrics} />);
    expect(container).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
  });
});

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
