import { normalizePhoneNumber } from './phone';

/**
 * Builds a WhatsApp deep link URL (`https://wa.me/<number>?text=<encoded_text>`).
 * - Normalizes the phone number and removes all non-digit characters (including +).
 * - Omits ?text parameter if message is empty or whitespace.
 * - Returns empty string if phone number is empty.
 */
export function buildWhatsAppUrl(phoneNumber: string, message?: string): string {
  if (!phoneNumber || !phoneNumber.trim()) {
    return '';
  }

  // Normalize phone number to international E.164 first, then strip non-digits
  const normalized = normalizePhoneNumber(phoneNumber);
  const cleanDigits = normalized ? normalized.replace(/\D/g, '') : phoneNumber.replace(/\D/g, '');

  if (!cleanDigits) {
    return '';
  }

  const trimmedMessage = message ? message.trim() : '';
  if (!trimmedMessage) {
    return `https://wa.me/${cleanDigits}`;
  }

  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(trimmedMessage)}`;
}
