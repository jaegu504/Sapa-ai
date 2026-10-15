import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildWhatsAppUrl, buildDualWhatsAppUrl, openWhatsApp } from '../../src/utils/whatsapp';

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

describe('buildDualWhatsAppUrl', () => {
  it('generates regular WhatsApp intent URL on Android with com.whatsapp package', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', 'regular', true);
    expect(result.url).toContain('package=com.whatsapp');
    expect(result.url).toContain('phone=628123456789');
    expect(result.fallbackUrl).toBe('https://wa.me/628123456789?text=Halo%21');
    expect(result.appType).toBe('regular');
  });

  it('generates WhatsApp Business intent URL on Android with com.whatsapp.w4b package', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', 'business', true);
    expect(result.url).toContain('package=com.whatsapp.w4b');
    expect(result.fallbackUrl).toBe('https://wa.me/628123456789?text=Halo%21');
    expect(result.appType).toBe('business');
  });

  it('generates standard wa.me URL for desktop/web platform', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', 'regular', false);
    expect(result.url).toBe('https://wa.me/628123456789?text=Halo%21');
    expect(result.fallbackUrl).toBe('https://wa.me/628123456789?text=Halo%21');
    expect(result.appType).toBe('regular');
  });

  it('defaults appType to regular when not specified', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', undefined, true);
    expect(result.url).toContain('package=com.whatsapp;');
    expect(result.appType).toBe('regular');
  });

  it('handles empty phone number gracefully', () => {
    const result = buildDualWhatsAppUrl('', 'Halo!', 'regular', true);
    expect(result.url).toBe('');
    expect(result.fallbackUrl).toBe('');
    expect(result.appType).toBe('regular');
  });

  it('handles empty message without query params on fallback and intent', () => {
    const result = buildDualWhatsAppUrl('+628123456789', '', 'regular', true);
    expect(result.url).toBe('intent://send?phone=628123456789#Intent;package=com.whatsapp;scheme=whatsapp;end');
    expect(result.fallbackUrl).toBe('https://wa.me/628123456789');
  });

  it('supports options object signature', () => {
    const result = buildDualWhatsAppUrl({
      phoneNumber: '+628123456789',
      message: 'Halo via options',
      targetApp: 'whatsapp_business',
      isAndroid: true,
    });
    expect(result.url).toContain('package=com.whatsapp.w4b');
    expect(result.appType).toBe('business');
  });
});

describe('openWhatsApp', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('opens URL in a new window on desktop/web platform', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openWhatsApp('+628123456789', 'Halo!', 'regular');

    expect(openSpy).toHaveBeenCalledWith('https://wa.me/628123456789?text=Halo%21', '_blank');
  });

  it('does nothing when phone number is empty', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openWhatsApp('', 'Halo!', 'regular');

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('supports options object dispatch format', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openWhatsApp({
      phoneNumber: '+628123456789',
      message: 'Halo options',
      targetApp: 'whatsapp',
    });

    expect(openSpy).toHaveBeenCalledWith('https://wa.me/628123456789?text=Halo%20options', '_blank');
  });

  it('assigns window.location.href with intent URL on Android', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    openWhatsApp({
      phoneNumber: '+628123456789',
      message: 'Halo!',
      targetApp: 'whatsapp',
      isAndroid: true,
    });

    expect(window.location.href).toContain('package=com.whatsapp');
    expect(window.location.href).toContain('phone=628123456789');

    (window as any).location = originalLocation;
  });

  it('falls back to window.open if window.location.href throws on Android', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const originalLocation = window.location;

    delete (window as any).location;
    (window as any).location = {
      set href(_val: string) {
        throw new Error('Navigation failed');
      },
    };

    openWhatsApp({
      phoneNumber: '+628123456789',
      message: 'Halo!',
      targetApp: 'whatsapp_business',
      isAndroid: true,
    });

    expect(openSpy).toHaveBeenCalledWith('https://wa.me/628123456789?text=Halo%21', '_blank');

    (window as any).location = originalLocation;
  });
});


