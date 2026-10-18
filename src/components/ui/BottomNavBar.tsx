import React from 'react';
import {
  RadarNavIcon,
  ContactsNavIcon,
  ScheduleNavIcon,
  SettingsNavIcon,
} from './NavIcons';

export interface NavTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs?: NavTabItem[];
}

const DEFAULT_TABS: NavTabItem[] = [
  { id: 'dashboard', label: 'Beranda', icon: <RadarNavIcon size={20} /> },
  { id: 'contacts', label: 'Kontak', icon: <ContactsNavIcon size={20} /> },
  { id: 'schedules', label: 'Jadwal', icon: <ScheduleNavIcon size={20} /> },
  { id: 'settings', label: 'Pengaturan', icon: <SettingsNavIcon size={20} /> },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
}) => {
  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 rounded-full px-3 py-2 flex justify-around items-center bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-2xl border border-white/90 dark:border-white/15 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)] transition-all"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            className={`relative flex flex-col items-center justify-center py-1 px-3.5 transition-all duration-200 rounded-full focus:outline-none select-none active:scale-95 ${
              isActive
                ? 'text-[#2F54EB] dark:text-cyan-400 font-bold bg-blue-500/10 dark:bg-cyan-500/15'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-xs border border-white dark:border-slate-900 animate-pulse">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
