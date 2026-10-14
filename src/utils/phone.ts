/**
 * Normalizes any raw phone number string to international E.164 format.
 * Examples:
 * - '0812-3456-7890' (with default '62') -> '+6281234567890'
 * - '+90 532 123 4567' -> '+905321234567'
 * - '(0821) 9988-7766' -> '+6282199887766'
 * - '0532 123 4567' (with '90') -> '+905321234567'
 */
export function normalizePhoneNumber(raw: string, defaultCountryCode: string = '62'): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  // Clean country code: ensure digits only
  const cleanCountry = defaultCountryCode.replace(/\D/g, '') || '62';

  // If already starts with '+', keep '+' and strip other non-digits
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  // If starts with '00' (international exit code, e.g. 0062... or 0090...)
  if (trimmed.startsWith('00')) {
    const digits = trimmed.slice(2).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  // Extract all digits from raw input
  const allDigits = trimmed.replace(/\D/g, '');
  if (!allDigits) {
    return '';
  }

  // If starts with single '0', replace leading 0 with +defaultCountryCode
  if (allDigits.startsWith('0')) {
    return `+${cleanCountry}${allDigits.slice(1)}`;
  }

  // If already starts with country code without '+', e.g. '62812...' or '90532...'
  if (allDigits.startsWith(cleanCountry)) {
    return `+${allDigits}`;
  }

  // Common Indonesian shorthand: '81234567890' without leading 0
  if (cleanCountry === '62' && allDigits.startsWith('8')) {
    return `+62${allDigits}`;
  }

  // Fallback: prepend default country code
  return `+${cleanCountry}${allDigits}`;
}
