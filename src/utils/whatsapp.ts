import { Capacitor, registerPlugin } from '@capacitor/core';
import { normalizePhoneNumber } from './phone';

export interface WhatsAppLauncherPluginType {
  openWhatsApp(options: { phone: string; text?: string; appType: 'regular' | 'business' }): Promise<void>;
}

export const WhatsAppLauncher = registerPlugin<WhatsAppLauncherPluginType>('WhatsAppLauncher');

function encodeWhatsAppText(text: string): string {
  return encodeURIComponent(text).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

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

  return `https://wa.me/${cleanDigits}?text=${encodeWhatsAppText(trimmedMessage)}`;
}

export interface DualWhatsAppResult {
  url: string;
  fallbackUrl: string;
  appType: 'regular' | 'business';
}

export interface DualWhatsAppOptions {
  phoneNumber: string;
  text?: string;
  message?: string;
  appType?: 'regular' | 'business';
  targetApp?: 'whatsapp' | 'whatsapp_business';
  isAndroid?: boolean;
}

/**
 * Builds a dual WhatsApp intent or deep-link URL supporting both
 * standard WhatsApp (`com.whatsapp`) and WhatsApp Business (`com.whatsapp.w4b`).
 *
 * On Android:
 * - Regular: `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;package=com.whatsapp;scheme=whatsapp;end`
 * - Business: `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
 *
 * On Desktop / Web / Non-Android:
 * - Uses standard `https://wa.me/...` URL.
 */
export function buildDualWhatsAppUrl(
  phoneOrOptions: string | DualWhatsAppOptions,
  text?: string,
  appType: 'regular' | 'business' = 'regular',
  isAndroid?: boolean
): DualWhatsAppResult {
  let phone: string;
  let msg: string | undefined;
  let chosenAppType: 'regular' | 'business';
  let explicitAndroid: boolean | undefined;

  if (typeof phoneOrOptions === 'object' && phoneOrOptions !== null) {
    phone = phoneOrOptions.phoneNumber;
    msg = phoneOrOptions.text ?? phoneOrOptions.message;
    chosenAppType =
      phoneOrOptions.appType ??
      (phoneOrOptions.targetApp === 'whatsapp_business' ? 'business' : 'regular');
    explicitAndroid = phoneOrOptions.isAndroid;
  } else {
    phone = phoneOrOptions;
    msg = text;
    chosenAppType = appType === 'business' ? 'business' : 'regular';
    explicitAndroid = isAndroid;
  }

  if (!phone || !phone.trim()) {
    return {
      url: '',
      fallbackUrl: '',
      appType: chosenAppType,
    };
  }

  const normalized = normalizePhoneNumber(phone);
  const cleanDigits = normalized ? normalized.replace(/\D/g, '') : phone.replace(/\D/g, '');

  if (!cleanDigits) {
    return {
      url: '',
      fallbackUrl: '',
      appType: chosenAppType,
    };
  }

  const trimmedMessage = msg ? msg.trim() : '';
  const encodedText = trimmedMessage ? encodeWhatsAppText(trimmedMessage) : '';
  const fallbackUrl = buildWhatsAppUrl(phone, msg);

  const isAndroidPlatform =
    explicitAndroid !== undefined
      ? explicitAndroid
      : typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android';

  if (isAndroidPlatform) {
    const pkg = chosenAppType === 'business' ? 'com.whatsapp.w4b' : 'com.whatsapp';
    const textQuery = encodedText ? `&text=${encodedText}` : '';
    const url = `intent://send?phone=${cleanDigits}${textQuery}#Intent;package=${pkg};scheme=whatsapp;end`;

    return {
      url,
      fallbackUrl,
      appType: chosenAppType,
    };
  }

  return {
    url: fallbackUrl,
    fallbackUrl,
    appType: chosenAppType,
  };
}

/**
 * Safely opens WhatsApp via Android Intent (if on Android native) or opens
 * the web/direct link in a new window/tab, falling back safely if an error occurs.
 */
export function openWhatsApp(
  phoneOrOptions: string | DualWhatsAppOptions,
  text?: string,
  appType: 'regular' | 'business' = 'regular'
): void {
  if (typeof window === 'undefined') {
    return;
  }

  let phone: string;
  let msg: string | undefined;
  let chosenAppType: 'regular' | 'business';
  let explicitAndroid: boolean | undefined;

  if (typeof phoneOrOptions === 'object' && phoneOrOptions !== null) {
    phone = phoneOrOptions.phoneNumber;
    msg = phoneOrOptions.text ?? phoneOrOptions.message;
    chosenAppType =
      phoneOrOptions.appType ??
      (phoneOrOptions.targetApp === 'whatsapp_business' ? 'business' : 'regular');
    explicitAndroid = phoneOrOptions.isAndroid;
  } else {
    phone = phoneOrOptions;
    msg = text;
    chosenAppType = appType === 'business' ? 'business' : 'regular';
  }

  const isAndroid =
    explicitAndroid !== undefined
      ? explicitAndroid
      : typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android';

  const { url, fallbackUrl } = buildDualWhatsAppUrl(phone, msg, chosenAppType, isAndroid);

  if (!url) {
    return;
  }

  const normalized = normalizePhoneNumber(phone);
  const cleanDigits = normalized ? normalized.replace(/\D/g, '') : phone.replace(/\D/g, '');
  const trimmedMessage = msg ? msg.trim() : '';

  if (isAndroid) {
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      WhatsAppLauncher.openWhatsApp({
        phone: cleanDigits,
        text: trimmedMessage,
        appType: chosenAppType,
      }).catch((err) => {
        console.warn('[WhatsAppLauncher] Native launch failed, falling back:', err);
        try {
          window.location.href = url;
        } catch {
          window.open(fallbackUrl, '_blank');
        }
      });
      return;
    }

    try {
      window.location.href = url;
    } catch {
      window.open(fallbackUrl, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
}

