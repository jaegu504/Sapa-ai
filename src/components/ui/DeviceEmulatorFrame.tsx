import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Signal, Wifi, Battery } from 'lucide-react';

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
  const [internalIsEmulator, setInternalIsEmulator] = useState<boolean>(defaultMode === 'emulator');
  const isEmulatorMode = controlledIsEmulator !== undefined ? controlledIsEmulator : internalIsEmulator;

  const handleSetMode = (val: boolean) => {
    if (controlledIsEmulator === undefined) {
      setInternalIsEmulator(val);
    }
    onToggleMode?.(val);
  };

  const [clockTime, setClockTime] = useState<string>(mockTime || '09:41');

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
              <span>📱 Mode Emulator HP</span>
            </button>
            <button
              type="button"
              data-testid="toggle-desktop-mode"
              onClick={() => handleSetMode(false)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2F54EB] text-white shadow-xs cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>💻 Mode Desktop</span>
            </button>
          </div>
        </header>

        {children}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-950 py-6 px-2 sm:px-4 flex flex-col items-center justify-center relative selection:bg-[#2F54EB] selection:text-white ${className}`}
      data-testid="emulator-mode-container"
    >
      {/* Mode Toggle Controls */}
      <div className="mb-4 z-50 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full p-1 shadow-lg gap-1">
        <button
          type="button"
          data-testid="toggle-emulator-mode"
          onClick={() => handleSetMode(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2F54EB] text-white shadow-xs cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>📱 Mode Emulator HP</span>
        </button>
        <button
          type="button"
          data-testid="toggle-desktop-mode"
          onClick={() => handleSetMode(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>💻 Mode Desktop</span>
        </button>
      </div>

      {/* Realistic Smartphone Mockup Bezel */}
      <div
        data-testid="device-emulator-frame"
        className="rounded-[48px] border-4 border-slate-800 bg-slate-900 p-2.5 shadow-2xl relative max-w-[415px] w-full mx-auto"
      >
        {/* Content Viewport */}
        <div
          data-testid="device-emulator-viewport"
          className="rounded-[38px] overflow-hidden bg-[#F8F9FA] relative flex flex-col h-[780px] max-w-[395px] w-full mx-auto [transform:translateZ(0)]"
        >
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-slate-800 text-xs font-semibold select-none bg-white/90 backdrop-blur-xs shrink-0 z-20 border-b border-slate-100/50">
            <span className="font-mono tracking-tight text-xs font-bold">{clockTime}</span>
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-800">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* App Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto my-1 shrink-0 select-none" />
        </div>
      </div>
    </div>
  );
};
