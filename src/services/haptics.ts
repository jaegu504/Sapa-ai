import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Short, quiet vibrations for important taps only. Web and errors are ignored silently.
export function tapHaptic(style: 'light' | 'medium' = 'light'): void {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.impact({ style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
}

export function successHaptic(): void {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
