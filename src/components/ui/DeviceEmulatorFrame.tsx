import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Signal, Wifi, Battery } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export interface DeviceEmulatorFrameProps {
  children: React.ReactNode;
  defaultMode?: 'emulator' | 'desktop';
  isEmulator?: boolean;
  onToggleMode?: (isEmulator: boolean) => void;
  className?: string;
  mockTime?: string;
}

export const DeviceEmulatorFrame: React.FC<DeviceEmulatorFrameProps> = ({
  children,
  defaultMode = 'desktop',
  isEmulator: controlledIsEmulator,
  onToggleMode,
  className = '',
  mockTime,
}) => {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

  const [internalIsEmulator, setInternalIsEmulator] = useState<boolean>(defaultMode === 'emulator');
  const isEmulatorMode = controlledIsEmulator !== undefined ? controlledIsEmulator : internalIsEmulator;

  const handleSetMode = (val: boolean) => {
    if (controlledIsEmulator === undefined) {
      setInternalIsEmulator(val);
    }
    onToggleMode?.(val);
  };

  const [clockTime, setClockTime] = useState<string>(mockTime || '09:41');
  const [scale, setScale] = useState<number>(0.9);
  const [deviceWidth, setDeviceWidth] = useState<number>(375); // standard Android phone width

  useEffect(() => {
    if (mockTime) {
      setClockTime(mockTime);
      return;
    }
    const updateClock = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setClockTime(`${hh}:${mm}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, [mockTime]);

  if (isNative) {
    return <>{children}</>;
  }

  if (!isEmulatorMode) {
    return (
      <div
        className={`min-h-screen bg-surface flex flex-col relative ${className}`}
        data-testid="desktop-view-container"
      >
        {/* Top bar for desktop mode with mode toggle */}
        <header className="sticky top-0 z-40 bg-slate-900 text-white text-xs px-4 py-1.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-300">Tampilan Aplikasi:</span>
            <span className="text-slate-400">Desktop Luas</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-full border border-slate-700">
            <button
              type="button"
              data-testid="toggle-emulator-mode"
              onClick={() => handleSetMode(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <Smartphone className="w-3.5 h-3.5" /><span>Mode Emulator HP</span>
            </button>
            <button
              type="button"
              data-testid="toggle-desktop-mode"
              onClick={() => handleSetMode(false)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2F54EB] text-white shadow-xs cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <Monitor className="w-3.5 h-3.5" /><span>Mode Desktop</span>
            </button>
          </div>
        </header>

        {children}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-950 py-4 px-2 flex flex-col items-center justify-start relative selection:bg-[#2F54EB] selection:text-white ${className}`}
      data-testid="emulator-mode-container"
    >
      {/* Mode & Scale Controls Bar */}
      <div className="mb-3 z-50 flex flex-wrap items-center justify-center bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-full p-1.5 shadow-xl gap-2">
        {/* Toggle Mode */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="toggle-emulator-mode"
            onClick={() => handleSetMode(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2F54EB] text-white shadow-xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <Smartphone className="w-3.5 h-3.5" /><span>Mode Emulator HP</span>
          </button>
          <button
            type="button"
            data-testid="toggle-desktop-mode"
            onClick={() => handleSetMode(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <Monitor className="w-3.5 h-3.5" /><span>Mode Desktop</span>
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-slate-700 hidden sm:block" />

        {/* Device Width Selector */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span className="text-slate-500 hidden sm:inline">Ukuran:</span>
          <button
            type="button"
            onClick={() => setDeviceWidth(360)}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
              deviceWidth === 360
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Android (360px)
          </button>
          <button
            type="button"
            onClick={() => setDeviceWidth(390)}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
              deviceWidth === 390
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Plus (390px)
          </button>
        </div>

        {/* Zoom Scale Selector */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span className="text-slate-500 hidden sm:inline">Zoom:</span>
          {[0.8, 0.9, 1.0].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                scale === s
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {Math.round(s * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* Scalable Container */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease',
        }}
        className="w-full flex justify-center pb-8"
      >
        {/* Realistic Smartphone Mockup Bezel */}
        <div
          data-testid="device-emulator-frame"
          style={{ width: `${deviceWidth + 24}px` }}
          className="rounded-[48px] border-4 border-slate-800 bg-slate-900 p-2.5 shadow-2xl relative mx-auto shrink-0"
        >
          {/* Content Viewport */}
          <div
            data-testid="device-emulator-viewport"
            style={{ width: `${deviceWidth}px`, height: '740px' }}
            className="rounded-[38px] overflow-hidden bg-[#F8F9FA] relative flex flex-col mx-auto [transform:translateZ(0)] text-slate-800"
          >
            {/* Status Bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1.5 text-slate-800 text-xs font-semibold select-none bg-white/95 backdrop-blur-xs shrink-0 z-20 border-b border-slate-100/50">
              <span className="font-mono tracking-tight text-xs font-bold">{clockTime}</span>
              <div className="w-20 h-4.5 bg-black rounded-full flex items-center justify-end px-2 gap-1 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* App Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col text-sm no-scrollbar">
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto my-1.5 shrink-0 select-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
