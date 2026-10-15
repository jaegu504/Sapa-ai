import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KinshipPulseArc } from '../../src/components/kinship/KinshipPulseArc';
import { CadenceBadge } from '../../src/components/kinship/CadenceBadge';
import { DualWhatsAppButton } from '../../src/components/kinship/DualWhatsAppButton';
import * as whatsappUtils from '../../src/utils/whatsapp';

vi.mock('../../src/utils/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/whatsapp')>();
  return {
    ...actual,
    openWhatsApp: vi.fn(),
  };
});

describe('Kinship UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('KinshipPulseArc', () => {
    it('renders KinshipPulseArc with score percentage and stat pills', () => {
      render(
        <KinshipPulseArc
          score={92}
          activeCount={42}
          dueCount={3}
          pausedCount={2}
        />
      );

      expect(screen.getByText('92%')).toBeDefined();
      expect(screen.getByText('Kinship Pulse')).toBeDefined();
      expect(screen.getByText('42 Active')).toBeDefined();
      expect(screen.getByText('3 Due')).toBeDefined();
      expect(screen.getByText('2 Paused')).toBeDefined();
    });

    it('calculates arc strokeDashoffset based on radius 58 and clamped score', () => {
      const { container } = render(
        <KinshipPulseArc
          score={75}
          activeCount={10}
          dueCount={0}
          pausedCount={1}
        />
      );

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);

      const foregroundCircle = circles[1];
      const radius = 58;
      const circumference = 2 * Math.PI * radius;
      const expectedOffset = circumference - (75 / 100) * circumference;

      const strokeDashoffset = parseFloat(foregroundCircle.getAttribute('stroke-dashoffset') || '0');
      expect(strokeDashoffset).toBeCloseTo(expectedOffset, 1);
      expect(foregroundCircle.getAttribute('stroke-dasharray')).toBeCloseTo(circumference, 1);
    });

    it('renders coral stroke or gradient when score is below 60', () => {
      const { container } = render(
        <KinshipPulseArc
          score={45}
          activeCount={5}
          dueCount={8}
          pausedCount={0}
        />
      );

      const circles = container.querySelectorAll('circle');
      const foregroundCircle = circles[1];
      const stroke = foregroundCircle.getAttribute('stroke');
      expect(stroke).toMatch(/coral|#F43F5E|rose/i);
    });

    it('renders emerald stroke or gradient when score is 60 or above', () => {
      const { container } = render(
        <KinshipPulseArc
          score={85}
          activeCount={20}
          dueCount={1}
          pausedCount={2}
        />
      );

      const circles = container.querySelectorAll('circle');
      const foregroundCircle = circles[1];
      const stroke = foregroundCircle.getAttribute('stroke');
      expect(stroke).toMatch(/emerald|#10B981|#059669/i);
    });

    it('highlights Due pill in coral when dueCount > 0', () => {
      render(
        <KinshipPulseArc
          score={90}
          activeCount={15}
          dueCount={4}
          pausedCount={1}
        />
      );

      const duePill = screen.getByText('4 Due');
      expect(duePill.className).toMatch(/rose|coral|red/i);
    });

    it('handles onPulseClick when clicked', () => {
      const onPulseClick = vi.fn();
      render(
        <KinshipPulseArc
          score={95}
          activeCount={10}
          dueCount={0}
          pausedCount={0}
          onPulseClick={onPulseClick}
        />
      );

      const arcContainer = screen.getByRole('button', { name: /kinship pulse/i });
      fireEvent.click(arcContainer);
      expect(onPulseClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('CadenceBadge', () => {
    it('renders CadenceBadge with on track or reach out indicator', () => {
      render(<CadenceBadge cadenceDays={15} isOverdue={true} daysLeftOrOverdue={3} />);
      expect(screen.getByText(/Perlu Disapa/i)).toBeDefined();
    });

    it('renders overdue state correctly with coral dot and text', () => {
      const { container } = render(
        <CadenceBadge cadenceDays={14} isOverdue={true} daysLeftOrOverdue={5} />
      );

      expect(screen.getByText('Perlu Disapa (5 hr)')).toBeDefined();
      const dot = container.querySelector('[data-testid="cadence-dot"]');
      expect(dot).toBeDefined();
      expect(dot?.getAttribute('data-color')).toBe('#F43F5E');
    });

    it('renders approaching state correctly with amber dot and text (daysLeft <= 3)', () => {
      const { container } = render(
        <CadenceBadge cadenceDays={7} isOverdue={false} daysLeftOrOverdue={2} />
      );

      expect(screen.getByText('Sisa 2 hr')).toBeDefined();
      const dot = container.querySelector('[data-testid="cadence-dot"]');
      expect(dot).toBeDefined();
      expect(dot?.getAttribute('data-color')).toBe('#F59E0B');
    });

    it('renders on-track state correctly with emerald dot and text (daysLeft > 3)', () => {
      const { container } = render(
        <CadenceBadge cadenceDays={30} isOverdue={false} daysLeftOrOverdue={12} />
      );

      expect(screen.getByText('Aman (12 hr lagi)')).toBeDefined();
      const dot = container.querySelector('[data-testid="cadence-dot"]');
      expect(dot).toBeDefined();
      expect(dot?.getAttribute('data-color')).toBe('#10B981');
    });
  });

  describe('DualWhatsAppButton', () => {
    it('renders DualWhatsAppButton with two separate buttons', () => {
      render(<DualWhatsAppButton phoneNumber="+628123456789" draftText="Halo!" />);
      expect(screen.getByText(/Kirim via WhatsApp$/i)).toBeDefined();
      expect(screen.getByText(/Kirim via WhatsApp Business/i)).toBeDefined();
    });

    it('clicking regular WhatsApp invokes openWhatsApp with regular and calls onChatLogged', () => {
      const onChatLogged = vi.fn();
      render(
        <DualWhatsAppButton
          phoneNumber="+628123456789"
          draftText="Halo apa kabar?"
          onChatLogged={onChatLogged}
        />
      );

      const regularBtn = screen.getByRole('button', { name: /Kirim via WhatsApp$/i });
      fireEvent.click(regularBtn);

      expect(whatsappUtils.openWhatsApp).toHaveBeenCalledWith(
        '+628123456789',
        'Halo apa kabar?',
        'regular'
      );
      expect(onChatLogged).toHaveBeenCalledTimes(1);
    });

    it('clicking WhatsApp Business invokes openWhatsApp with business and calls onChatLogged', () => {
      const onChatLogged = vi.fn();
      render(
        <DualWhatsAppButton
          phoneNumber="+628987654321"
          draftText="Prospek meeting"
          onChatLogged={onChatLogged}
        />
      );

      const businessBtn = screen.getByRole('button', { name: /Kirim via WhatsApp Business/i });
      fireEvent.click(businessBtn);

      expect(whatsappUtils.openWhatsApp).toHaveBeenCalledWith(
        '+628987654321',
        'Prospek meeting',
        'business'
      );
      expect(onChatLogged).toHaveBeenCalledTimes(1);
    });

    it('supports custom size and className props', () => {
      const { container } = render(
        <DualWhatsAppButton
          phoneNumber="+628123456789"
          size="sm"
          className="custom-container"
        />
      );

      expect(container.firstChild).toHaveClass('custom-container');
    });
  });
});
