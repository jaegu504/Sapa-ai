import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl } from '../../src/utils/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('generates correct wa.me link with URL-encoded text', () => {
    const url = buildWhatsAppUrl('+628123456789', 'Halo Bu Siti, apa kabar?');
    expect(url).toBe('https://wa.me/628123456789?text=Halo%20Bu%20Siti%2C%20apa%20kabar%3F');
  });

  it('normalizes local phone numbers without plus prefix', () => {
    const url = buildWhatsAppUrl('08123456789', 'Halo');
    expect(url).toBe('https://wa.me/628123456789?text=Halo');
  });

  it('strips formatting characters such as spaces, parentheses, and dashes', () => {
    const url = buildWhatsAppUrl('+90 (532) 123-4567', 'Merhaba');
    expect(url).toBe('https://wa.me/905321234567?text=Merhaba');
  });

  it('omits ?text query param if message is empty or whitespace', () => {
    const urlEmpty = buildWhatsAppUrl('+628123456789', '');
    expect(urlEmpty).toBe('https://wa.me/628123456789');

    const urlWhitespace = buildWhatsAppUrl('+628123456789', '   ');
    expect(urlWhitespace).toBe('https://wa.me/628123456789');
  });

  it('returns empty string if phone number is empty or invalid', () => {
    expect(buildWhatsAppUrl('', 'Halo')).toBe('');
    expect(buildWhatsAppUrl('   ', 'Halo')).toBe('');
  });

  it('encodes emojis and special characters properly', () => {
    const url = buildWhatsAppUrl('+628123456789', 'Assalamu’alaikum! ✨ Apa kabar & kabar keluarga?');
    expect(url).toContain('https://wa.me/628123456789?text=');
    expect(decodeURIComponent(url.split('?text=')[1])).toBe('Assalamu’alaikum! ✨ Apa kabar & kabar keluarga?');
  });
});
