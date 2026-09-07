import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { SYSTEM_USERS, getUserAllowedMenus } from '../data/mockData';
import { ProfilePhotoModal } from './ProfilePhotoModal';
import {
  Car,
  Bell,
  Volume2,
  VolumeX,
  UserCheck,
  LogOut,
  Menu,
  Shield,
  ChevronDown,
  Users,
  Camera,
  Cloud
} from 'lucide-react';

interface HeaderNavProps {
  currentUser: User;
  users?: User[];
  onSwitchUser?: (user: User) => void;
  onToggleSidebar: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  firestoreStatus?: 'connected' | 'syncing' | 'error' | 'idle';
  onUpdateProfilePhoto?: (userId: string, newAvatarUrl: string) => void;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentUser,
  users = SYSTEM_USERS,
  onSwitchUser,
  onToggleSidebar,
  soundEnabled,
  onToggleSound,
  notifications,
  onMarkAllNotificationsRead,
  activeTab,
  onTabChange,
  firestoreStatus = 'connected',
  onUpdateProfilePhoto,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'director':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'driver':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  return (
    <header className="px-4 md:px-8 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Left: Brand & Menu Button */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition shadow-md shadow-orange-500/20"
            title="เปิดเมนูนำทาง"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onTabChange('dashboard')}
            className="cursor-pointer select-none flex items-center space-x-2.5"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow border border-orange-500/40">
              <Car className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-sm md:text-base text-slate-900 leading-tight">
                  M-Culture Phangnga Pro
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.2 rounded-full">
                  v5.2
                </span>
              </div>
              <p className="text-[11px] text-slate-500">สำนักงานวัฒนธรรมจังหวัดพังงา</p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Google Sheets, Sound, Notifications, User Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          
          {/* Quick Mission Button for Driver & Permitted Users */}
          {(currentUser.role === 'driver' || getUserAllowedMenus(currentUser).includes('driver_mission')) && (
            <button
              onClick={() => onTabChange('driver_mission')}
              className={`h-9 px-2.5 sm:px-3 rounded-xl flex items-center space-x-1.5 transition border text-xs font-semibold shadow-xs ${
                activeTab === 'driver_mission'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
              title="เปิดหน้าภารกิจคนขับรถและทะเบียนคุมพัสดุ"
            >
              <Car className={`w-3.5 h-3.5 ${activeTab === 'driver_mission' ? 'text-white' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">ภารกิจคนขับ</span>
            </button>
          )}

          {/* Cloud Firestore Status Badge */}
          <div
            className={`h-9 px-2.5 sm:px-3 rounded-xl flex items-center space-x-1.5 border text-xs font-semibold shadow-xs select-none ${
              firestoreStatus === 'connected'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : firestoreStatus === 'syncing'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title={
              firestoreStatus === 'connected'
                ? 'เชื่อมต่อ Cloud Firestore เรียบร้อยแล้ว (อัปเดตแบบ Real-time ข้ามทุกอุปกรณ์)'
                : firestoreStatus === 'syncing'
                ? 'กำลังเชื่อมต่อและซิงค์ Cloud Firestore...'
                : 'ฐานข้อมูล Cloud Firestore พร้อมใช้งาน'
            }
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span className="hidden lg:inline">
              {firestoreStatus === 'connected' ? 'Firestore เชื่อมต่อแล้ว' : firestoreStatus === 'syncing' ? 'กำลังซิงก์...' : 'Cloud DB'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                firestoreStatus === 'connected'
                  ? 'bg-emerald-500 ring-2 ring-emerald-200'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition border ${
              soundEnabled
                ? 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200'
                : 'bg-rose-50 text-rose-500 border-rose-200'
            }`}
            title={soundEnabled ? 'เปิดเสียงแจ้งเตือนแล้ว' : 'ปิดเสียงแล้ว'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 flex items-center justify-center transition relative"
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2.5 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <h4 className="font-bold text-xs text-slate-900">การแจ้งเตือนระบบ</h4>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] text-orange-600 hover:underline font-medium"
                    >
                      อ่านทั้งหมดแล้ว
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">ไม่มีการแจ้งเตือน</div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 hover:bg-slate-50 transition text-xs space-y-1 ${
                          !item.read ? 'bg-orange-50/50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-slate-900">{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.time}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{item.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Selector Dropdown (Quick Role Switch) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition text-left group"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-orange-300">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                  {currentUser.roleTitle}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-orange-100 shrink-0">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{currentUser.department}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-orange-100 text-orange-800">
                        {currentUser.roleTitle}
                      </span>
                    </div>
                  </div>

                  {/* Profile photo change button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfilePhotoModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full mt-1.5 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-semibold border border-orange-200 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรูปโปรไฟล์ของคุณ</span>
                  </button>
                </div>

                {/* User & Permission Management Shortcut */}
                {(currentUser.role === 'admin' || getUserAllowedMenus(currentUser).includes('users')) && (
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onTabChange('users');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>จัดการผู้ใช้งาน & กำหนดสิทธิ์</span>
                    </button>
                  </div>
                )}

                {/* Logout Button */}
                {onLogout && (
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออกจากระบบ (Sign Out)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Profile Photo Modal for current user */}
            <ProfilePhotoModal
              isOpen={showProfilePhotoModal}
              user={currentUser}
              onClose={() => setShowProfilePhotoModal(false)}
              onSave={(userId, newAvatarUrl) => {
                if (onUpdateProfilePhoto) {
                  onUpdateProfilePhoto(userId, newAvatarUrl);
                }
              }}
            />
          </div>

        </div>

      </div>
    </header>
  );
};
