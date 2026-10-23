import { WhatsAppLauncher } from '../utils/whatsapp';
import { isNativePlatform } from './notificationService';

function getWebRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechAvailable(): boolean {
  return isNativePlatform() || Boolean(getWebRecognition());
}

/** Listens once and returns the spoken text ('' if nothing was heard). Rejects when speech input is unavailable. */
export async function listenOnce(language = 'id-ID'): Promise<string> {
  if (isNativePlatform()) {
    const res = await WhatsAppLauncher.recognizeSpeech({ language, prompt: 'Ceritakan kabarnya...' });
    return res?.text ?? '';
  }
  const Recognition = getWebRecognition();
  if (!Recognition) throw new Error('unavailable');
  return new Promise((resolve, reject) => {
    const rec = new Recognition();
    rec.lang = language;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => resolve(e.results?.[0]?.[0]?.transcript ?? '');
    rec.onerror = (e: any) => (e.error === 'no-speech' ? resolve('') : reject(new Error(e.error || 'error')));
    rec.onend = () => resolve('');
    rec.start();
  });
}
