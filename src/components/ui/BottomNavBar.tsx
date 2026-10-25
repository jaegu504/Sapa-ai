import React from 'react';
import { t } from '../../i18n';
import { motion } from 'motion/react';
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
  /** Raised main action shown in the middle of the dock (e.g. voice note). */
  centerAction?: { label: string; icon: React.ReactNode; onClick: () => void; tourId?: string };
}

const DEFAULT_TABS: NavTabItem[] = [
  { id: 'dashboard', label: t('Beranda'), icon: <RadarNavIcon size={20} /> },
  { id: 'contacts', label: t('Kontak'), icon: <ContactsNavIcon size={20} /> },
  { id: 'schedules', label: t('Jadwal'), icon: <ScheduleNavIcon size={20} /> },
  { id: 'settings', label: t('Pengaturan'), icon: <SettingsNavIcon size={20} /> },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
  centerAction,
}) => {
  const middle = Math.ceil(tabs.length / 2);
  const columns = tabs.length + (centerAction ? 1 : 0);
  return (
    <nav
      aria-label={t("Navigasi Utama")}
      // Equal-width grid columns keep the center action exactly in the middle, whatever the label lengths.
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 max-w-md mx-auto z-40 rounded-full px-2 py-1.5 grid items-center bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-2xl border border-white/90 dark:border-white/15 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)] transition-colors"
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <React.Fragment key={tab.id}>
          {centerAction && index === middle && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={centerAction.onClick}
                aria-label={centerAction.label}
                data-tour={centerAction.tourId}
                className="press -mt-8 w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 shadow-[0_8px_24px_-4px_rgba(47,84,235,0.6)] border-4 border-[#F2F2F7] dark:border-[#090A0F]"
              >
                {centerAction.icon}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            data-tour={`nav-${tab.id}`}
            className={`press relative flex flex-col items-center justify-center py-1.5 rounded-full focus:outline-none select-none min-w-0 ${
              isActive
                ? 'text-[#2F54EB] dark:text-cyan-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-cyan-500/15"
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              />
            )}
            <div className="relative flex items-center justify-center">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-xs border border-white dark:border-slate-900">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="relative text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-full">{tab.label}</span>
          </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
