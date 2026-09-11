import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  Car,
  Menu,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { User, MenuKey } from '../types';

interface MobileBottomNavProps {
  activeTab: MenuKey;
  onSelectTab: (tab: MenuKey) => void;
  onOpenBookingForm: () => void;
  onToggleSidebar: () => void;
  currentUser: User;
  pendingDirectorCount?: number;
  activeMissionsCount?: number;
  onPlaySound?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenBookingForm,
  onToggleSidebar,
  currentUser,
  pendingDirectorCount = 0,
  activeMissionsCount = 0,
  onPlaySound
}) => {
  const handleTabClick = (tab: MenuKey) => {
    if (onPlaySound) onPlaySound();
    onSelectTab(tab);
  };

  const handleBookingClick = () => {
    if (onPlaySound) onPlaySound();
    onOpenBookingForm();
  };

  const handleMenuClick = () => {
    if (onPlaySound) onPlaySound();
    onToggleSidebar();
  };

  const isDirector = currentUser.role === 'director' || currentUser.role === 'admin';
  const showPendingBadge = isDirector && pendingDirectorCount > 0;

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="เมนูนำทางหลักบนมือถือ"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] select-none no-print transition-colors duration-200"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)'
      }}
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2 relative">
        
        {/* 1. หน้าหลัก (Dashboard) */}
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-xs" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">หน้าหลัก</span>
        </button>

        {/* 2. ปฏิทิน (Calendar) */}
        <button
          type="button"
          onClick={() => handleTabClick('calendar')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <CalendarDays className={`w-5 h-5 transition-transform ${activeTab === 'calendar' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {activeTab === 'calendar' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-xs" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">ปฏิทิน</span>
        </button>

        {/* 3. CENTER PRIMARY ACTION: เขียนใบเบิก (Request Car) */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            type="button"
            id="mobile-nav-book-button"
            onClick={handleBookingClick}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/35 border-3 border-white dark:border-slate-900 active:scale-90 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-orange-500/50"
            title="เขียนใบเบิกขอใช้รถราชการทันที"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-1 leading-none tracking-tight">
            ขอใช้รถ
          </span>
        </div>

        {/* 4. ภารกิจ (Missions) */}
        <button
          type="button"
          onClick={() => handleTabClick('driver_mission')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer relative ${
            activeTab === 'driver_mission'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Car className={`w-5 h-5 transition-transform ${activeTab === 'driver_mission' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {activeMissionsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-extrabold rounded-full animate-pulse shadow-xs">
                {activeMissionsCount}
              </span>
            )}
            {activeTab === 'driver_mission' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-xs" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">ภารกิจ</span>
        </button>

        {/* 5. เมนูทั้งหมด (All Menus Drawer) */}
        <button
          type="button"
          onClick={handleMenuClick}
          className="flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        >
          <div className="relative">
            <Menu className="w-5 h-5 stroke-[1.8]" />
            {showPendingBadge && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-extrabold rounded-full shadow-xs">
                {pendingDirectorCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">เมนูอื่น ๆ</span>
        </button>

      </div>
    </nav>
  );
};
