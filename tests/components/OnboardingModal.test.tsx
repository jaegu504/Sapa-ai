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

  it('renders initial slide (Radar & Denyut Sapa) when isOpen is true', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Denyut & Radar Sapa')).toBeDefined();
    expect(screen.getByText('Pantau Denyut Silaturahmi')).toBeDefined();
    expect(screen.getByText(/Sapa membantu Anda merawat hubungan penting/i)).toBeDefined();
    expect(screen.getByText('Lanjut')).toBeDefined();
    expect(screen.getByText('Lewati')).toBeDefined();
  });

  it('navigates through slides with Lanjut and Back buttons', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} />);

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
    expect(screen.getByText('Mulai Bersilaturahmi')).toBeDefined();

    // Back to Slide 2
    fireEvent.click(screen.getByLabelText('Kembali'));
    expect(screen.getByText('Dual WhatsApp & AI Draft')).toBeDefined();
  });

  it('allows jumping directly to a slide using dot indicators', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} />);

    const slide3Dot = screen.getByLabelText('Buka slide 3');
    fireEvent.click(slide3Dot);

    expect(screen.getByText('Pengingat & 100% Privat')).toBeDefined();
    expect(screen.getByText('Mulai Bersilaturahmi')).toBeDefined();
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

  it('calls onClose and marks localStorage on Mulai Bersilaturahmi', () => {
    const handleClose = vi.fn();
    const handleComplete = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    );

    // Jump to slide 3
    fireEvent.click(screen.getByLabelText('Buka slide 3'));
    fireEvent.click(screen.getByText('Mulai Bersilaturahmi'));

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
