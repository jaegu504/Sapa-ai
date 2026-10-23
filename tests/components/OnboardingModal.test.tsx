import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingModal, ONBOARDING_STORAGE_KEY } from '../../src/components/onboarding/OnboardingModal';

describe('OnboardingModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <OnboardingModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the welcome slide first, then Radar & Denyut Sapa', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText("Assalamu'alaikum, Selamat Datang di Sapa")).toBeDefined();
    fireEvent.click(screen.getByText('Lanjut'));
    expect(screen.getByText('Denyut & Radar Sapa')).toBeDefined();
    expect(screen.getByText('Pantau Denyut Silaturahmi')).toBeDefined();
    expect(screen.getByText(/Sapa membantu Anda merawat hubungan penting/i)).toBeDefined();
    expect(screen.getByText('Lanjut')).toBeDefined();
    expect(screen.getByText('Lewati')).toBeDefined();
  });

  it('navigates through slides with Lanjut and Back buttons', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Lanjut'));

    // Slide 1 -> Slide 2
    fireEvent.click(screen.getByText('Lanjut'));
    expect(screen.getByText('Dual WhatsApp & AI Draft')).toBeDefined();
    expect(screen.getByText('Sapa Cepat via WhatsApp')).toBeDefined();

    // Verify back button is visible on slide 2
    const backBtn = screen.getByLabelText('Kembali');
    expect(backBtn).toBeDefined();

    // Slide 2 -> Slide 3
    fireEvent.click(screen.getByText('Lanjut'));
    expect(screen.getByText('Pengingat & 100% Privat')).toBeDefined();
    expect(screen.getByText('Pengingat Pagi & Bebas Cemas')).toBeDefined();
    expect(screen.getByText('Lanjutkan')).toBeDefined();

    // Back to Slide 2
    fireEvent.click(screen.getByLabelText('Kembali'));
    expect(screen.getByText('Dual WhatsApp & AI Draft')).toBeDefined();
  });

  it('allows jumping directly to a slide using dot indicators', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} />);

    const slide3Dot = screen.getByLabelText('Buka slide 4');
    fireEvent.click(slide3Dot);

    expect(screen.getByText('Pengingat & 100% Privat')).toBeDefined();
    expect(screen.getByText('Lanjutkan')).toBeDefined();
  });

  it('calls onClose and marks localStorage on Lewati', () => {
    const handleClose = vi.fn();
    const handleComplete = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    );

    fireEvent.click(screen.getByText('Lewati'));

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Lanjutkan on the last slide shows the permission step, and Mulai Tutorial calls onFinish', async () => {
    const handleClose = vi.fn();
    const handleFinish = vi.fn();

    render(<OnboardingModal isOpen={true} onClose={handleClose} onFinish={handleFinish} />);

    fireEvent.click(screen.getByLabelText('Buka slide 4'));
    fireEvent.click(screen.getByText('Lanjutkan'));
    expect(await screen.findByText('Izinkan Akses Penting')).toBeDefined();
    expect(screen.getByText('Lewati')).toBeDefined();

    fireEvent.click(screen.getByText('Mulai Tutorial'));
    expect(handleFinish).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
