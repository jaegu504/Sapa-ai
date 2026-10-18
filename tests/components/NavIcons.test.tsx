import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  RadarNavIcon,
  ContactsNavIcon,
  ScheduleNavIcon,
  SettingsNavIcon,
} from '../../src/components/ui/NavIcons';

describe('NavIcons', () => {
  it('renders RadarNavIcon as an SVG with viewBox 0 0 24 24', () => {
    const { container } = render(<RadarNavIcon className="w-5 h-5 text-blue-500" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('class')).toContain('w-5 h-5 text-blue-500');
  });

  it('renders ContactsNavIcon as an SVG with viewBox 0 0 24 24', () => {
    const { container } = render(<ContactsNavIcon className="w-6 h-6" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('renders ScheduleNavIcon as an SVG with viewBox 0 0 24 24', () => {
    const { container } = render(<ScheduleNavIcon className="w-6 h-6" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('renders SettingsNavIcon as an SVG with viewBox 0 0 24 24', () => {
    const { container } = render(<SettingsNavIcon className="w-6 h-6" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });
});
