import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DualMetricsCard } from '../../src/components/ui/DualMetricsCard';

describe('DualMetricsCard', () => {
  it('renders overdue count and health score percentage', () => {
    render(<DualMetricsCard overdueCount={4} healthScorePercent={92} activeCount={42} />);
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('92%')).toBeDefined();
    expect(screen.getByText('Perlu Disapa')).toBeDefined();
    expect(screen.getByText('Health Score')).toBeDefined();
    expect(screen.getByText(/42 kontak/i)).toBeDefined();
  });

  it('handles clicks on overdue card when callback is provided', () => {
    const handleOverdue = vi.fn();
    render(
      <DualMetricsCard
        overdueCount={5}
        healthScorePercent={88}
        activeCount={30}
        onOverdueClick={handleOverdue}
      />
    );

    const overdueButton = screen.getByRole('button', { name: /perlu disapa/i });
    fireEvent.click(overdueButton);
    expect(handleOverdue).toHaveBeenCalledTimes(1);
  });

  it('handles clicks on health card when callback is provided', () => {
    const handleHealth = vi.fn();
    render(
      <DualMetricsCard
        overdueCount={2}
        healthScorePercent={95}
        activeCount={50}
        onHealthClick={handleHealth}
      />
    );

    const healthButton = screen.getByRole('button', { name: /health score/i });
    fireEvent.click(healthButton);
    expect(handleHealth).toHaveBeenCalledTimes(1);
  });

  it('renders without error when click callbacks are not provided', () => {
    const { container } = render(
      <DualMetricsCard overdueCount={0} healthScorePercent={100} activeCount={15} />
    );
    expect(container).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.getByText('100%')).toBeDefined();
  });
});
