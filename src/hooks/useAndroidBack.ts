import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Android back button: `handler` closes the top screen and returns true, or returns
 * false when there is nothing left to close, and then the app exits as usual.
 */
export function useAndroidBack(handler: () => boolean): void {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener('backButton', () => {
      if (!ref.current()) CapacitorApp.exitApp();
    });
    return () => {
      listener.then((l) => l.remove()).catch(() => {});
    };
  }, []);
}
