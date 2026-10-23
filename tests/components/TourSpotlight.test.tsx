import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TourSpotlight } from '../../src/components/tutorial/TourSpotlight';
import type { TourStep } from '../../src/services/tutorialService';

const step = (overrides: Partial<TourStep> = {}): TourStep => ({
  id: 'radar-tab',
  target: 'x',
  context: 'shell',
  advance: 'next',
  title: 'Judul Langkah',
  body: 'Isi langkah',
  ...overrides,
});

describe('TourSpotlight', () => {
  afterEach(() => vi.useRealTimers());

  it('renders title, body and step counter, and Lewati calls onSkip', () => {
    const onSkip = vi.fn();
    render(<TourSpotlight step={step()} stepIndex={2} total={12} onNext={vi.fn()} onSkip={onSkip} />);
    expect(screen.getByText('Judul Langkah')).toBeDefined();
    expect(screen.getByText('Langkah 3 dari 12')).toBeDefined();
    fireEvent.click(screen.getByText('Lewati'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('Berikutnya blurs a focused textarea before calling onNext', () => {
    const calls: string[] = [];
    render(
      <>
        <textarea data-testid="ta" onBlur={() => calls.push('blur')} />
        <TourSpotlight step={step()} stepIndex={0} total={1} onNext={() => calls.push('next')} onSkip={vi.fn()} />
      </>
    );
    (screen.getByTestId('ta') as HTMLTextAreaElement).focus();
    fireEvent.click(screen.getByText('Berikutnya'));
    expect(calls).toEqual(['blur', 'next']);
  });

  it('click step advances when the real target is clicked and the target still works', () => {
    const onNext = vi.fn();
    const onTargetClick = vi.fn();
    render(
      <>
        <button data-tour="x" onClick={onTargetClick}>Target</button>
        <TourSpotlight step={step({ advance: 'click' })} stepIndex={0} total={1} onNext={onNext} onSkip={vi.fn()} />
      </>
    );
    fireEvent.click(screen.getByText('Target'));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onTargetClick).toHaveBeenCalledTimes(1);
  });

  it('shows centered fallback when target is missing after 1500ms', () => {
    vi.useFakeTimers();
    render(<TourSpotlight step={step({ target: 'missing' })} stepIndex={0} total={1} onNext={vi.fn()} onSkip={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole('dialog').getAttribute('data-fallback')).toBe('true');
    expect(screen.getByText('Berikutnya')).toBeDefined();
  });

  it('hides Berikutnya when the step says so', () => {
    render(<TourSpotlight step={step({ hideNext: true })} stepIndex={0} total={1} onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByText('Berikutnya')).toBeNull();
  });
});
