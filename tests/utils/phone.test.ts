import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber } from '../../src/utils/phone';

describe('normalizePhoneNumber', () => {
  it('converts Indonesian local 0812 to +62812', () => {
    expect(normalizePhoneNumber('0812-3456-7890', '62')).toBe('+6281234567890');
  });

  it('preserves existing + country code', () => {
    expect(normalizePhoneNumber('+90 532 123 4567')).toBe('+905321234567');
  });

  it('cleans non-numeric noise', () => {
    expect(normalizePhoneNumber('(0821) 9988-7766')).toBe('+6282199887766');
  });

  it('defaults to Indonesian country code 62 when not specified', () => {
    expect(normalizePhoneNumber('081234567890')).toBe('+6281234567890');
  });

  it('supports custom country code like Turkey (90)', () => {
    expect(normalizePhoneNumber('0532 123 4567', '90')).toBe('+905321234567');
  });

  it('handles numbers starting with country code without plus sign', () => {
    expect(normalizePhoneNumber('6281234567890', '62')).toBe('+6281234567890');
  });

  it('handles international exit code 00', () => {
    expect(normalizePhoneNumber('006281234567890')).toBe('+6281234567890');
    expect(normalizePhoneNumber('00905321234567')).toBe('+905321234567');
  });

  it('handles empty or blank string gracefully', () => {
    expect(normalizePhoneNumber('')).toBe('');
    expect(normalizePhoneNumber('   ')).toBe('');
  });
});
