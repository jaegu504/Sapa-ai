import React from 'react';
import { LayoutDashboard, Users, Calendar, Settings } from 'lucide-react';

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
  { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard size={20} /> },
  { id: 'contacts', label: 'Kontak', icon: <Users size={20} /> },
  { id: 'schedules', label: 'Jadwal', icon: <Calendar size={20} /> },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={20} /> },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex justify-around items-center z-40">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors rounded-lg focus:outline-none ${
              isActive
                ? 'text-[#2F54EB] font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
