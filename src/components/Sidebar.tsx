import React, { useState, useMemo } from 'react';
import { User, MenuKey, DashboardSubView, BookingRequest } from '../types';
import { canUserExecuteMission } from '../utils/driverPermissions';
import { playAppSound } from '../utils/thaiDate';
import {
  LayoutDashboard,
  Calendar,
  FilePlus,
  Fuel,
  BarChart3,
  Navigation,
  ShieldCheck,
  X,
  Car,
  ChevronRight,
  ChevronDown,
  Wrench,
  Users,
  Gauge,
  LogOut,
  Database,
  FileText,
  FileSpreadsheet,
  Sun,
  Moon,
  Camera,
  Search,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Shield,
  FileCheck,
  Volume2
} from 'lucide-react';
import { getUserAllowedMenus } from '../data/mockData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  dashboardSubView?: DashboardSubView;
  onSelectTab: (tab: string, subView?: DashboardSubView) => void;
  currentUser: User;
  users?: User[];
  allUsers?: User[];
  bookings?: BookingRequest[];
  onSwitchUser?: (user: User) => void;
  onLogout?: () => void;
  bookingsCount?: number;
  pendingBookingsCount?: number;
  vehiclesCount?: number;
  availableVehiclesCount?: number;
  pendingDirectorCount?: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenVoiceSettings?: () => void;
  voiceAlertsEnabled?: boolean;
  onOpenProfilePhoto?: () => void;
  onOpenGoogleSync?: () => void;
  googleUser?: any;
  isGoogleConnected?: boolean;
  soundEnabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  dashboardSubView = 'overview',
  onSelectTab,
  currentUser,
  users,
  allUsers,
  bookings,
  onSwitchUser,
  onLogout,
  bookingsCount = 0,
  pendingBookingsCount = 0,
  vehiclesCount = 0,
  availableVehiclesCount = 0,
  pendingDirectorCount = 0,
  darkMode = false,
  onToggleDarkMode,
  onOpenVoiceSettings,
  voiceAlertsEnabled = true,
  onOpenProfilePhoto,
  onOpenGoogleSync,
  isGoogleConnected = false,
  soundEnabled = true
}) => {
  const allowedMenus = getUserAllowedMenus(currentUser);
  const canAccessDirector = allowedMenus.includes('director');
  const canAccessUsers = allowedMenus.includes('users') || currentUser.role === 'admin';
  const [isDashboardExpanded, setIsDashboardExpanded] = useState<boolean>(true);
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [showUserSwitcher, setShowUserSwitcher] = useState<boolean>(false);

  const effectiveUsers = users || allUsers || [];

  // Check if current user has any mission they can execute (assigned driver or self-drive)
  const hasExecutableMission = useMemo(() => {
    if (!bookings) return false;
    return bookings.some((b) => canUserExecuteMission(b, currentUser, effectiveUsers));
  }, [bookings, currentUser, effectiveUsers]);

  // Active missions count for current user
  const myActiveMissionsCount = useMemo(() => {
    if (!bookings) return 0;
    return bookings.filter(
      (b) =>
        (b.status === 'approved' || b.status === 'in_progress') &&
        canUserExecuteMission(b, currentUser, effectiveUsers)
    ).length;
  }, [bookings, currentUser, effectiveUsers]);

  // Pending asset inspection count
  const pendingInspectionCount = useMemo(() => {
    if (!bookings) return 0;
    return bookings.filter(
      (b) =>
        (b.status === 'completed' || !!b.endMileage) &&
        !b.assetInspectedAt &&
        (b.status === 'approved' || b.status === 'completed' || !!b.approvedAt)
    ).length;
  }, [bookings]);

  // Structured Menu Items with Categories
  const coreMenuItems = useMemo(() => {
    return [
      {
        id: 'dashboard',
        category: 'core',
        label: 'หน้าหลักภาพรวม',
        subLabel: 'Dashboard & KPI',
        desc: 'สถานะคำขอ ข้อมูลสรุป และตัวชี้วัด',
        icon: LayoutDashboard,
        gradient: 'from-orange-500 to-amber-500',
        badge: pendingBookingsCount > 0 ? `${pendingBookingsCount} รอ` : undefined,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        allowed: allowedMenus.includes('dashboard')
      },
      {
        id: 'calendar',
        category: 'core',
        label: 'ปฏิทินภารกิจราชการ',
        subLabel: 'Mission Calendar',
        desc: 'ตารางนัดหมายและการใช้รถประจำวัน',
        icon: Calendar,
        gradient: 'from-blue-500 to-indigo-500',
        allowed: allowedMenus.includes('calendar')
      },
      {
        id: 'booking',
        category: 'core',
        label: 'เขียนใบเบิกใช้รถราชการ',
        subLabel: 'Create Booking Request',
        desc: 'ยื่นคำขอใหม่/พิมพ์ใบบันทึกขอใช้รถยนต์',
        icon: FilePlus,
        gradient: 'from-emerald-500 to-teal-500',
        highlight: true,
        allowed: allowedMenus.includes('booking')
      }
    ].filter((item) => item.allowed);
  }, [allowedMenus, pendingBookingsCount]);

  const operationMenuItems = useMemo(() => {
    return [
      {
        id: 'driver_mission',
        category: 'operations',
        label: 'ภารกิจคนขับรถ',
        subLabel: 'Driver Missions Hub',
        desc: 'เริ่มงาน กรอกไมล์ไป-กลับ บันทึกน้ำมัน',
        icon: Gauge,
        gradient: 'from-amber-500 to-orange-500',
        badge: myActiveMissionsCount > 0 ? `${myActiveMissionsCount} งาน` : undefined,
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse',
        allowed:
          currentUser.role === 'driver' ||
          currentUser.role === 'admin' ||
          currentUser.role === 'director' ||
          hasExecutableMission ||
          allowedMenus.includes('driver_mission')
      },
      {
        id: 'asset_register',
        category: 'operations',
        label: 'สมุดทะเบียนคุม (งานพัสดุ)',
        subLabel: 'Vehicle Register Book',
        desc: 'สมุดคุมการใช้รถยนต์ราชการ A4/Excel',
        icon: FileSpreadsheet,
        gradient: 'from-teal-500 to-emerald-600',
        allowed: allowedMenus.includes('asset_register')
      },
      {
        id: 'asset_inspection',
        category: 'operations',
        label: 'พัสดุตรวจรับรถเสร็จสิ้น',
        subLabel: 'Post-Mission Inspection',
        desc: 'ตรวจรับรถ คุมไมล์ ลงลายเซ็นตรวจรับ',
        icon: ShieldCheck,
        gradient: 'from-emerald-500 to-cyan-500',
        badge: pendingInspectionCount > 0 ? `${pendingInspectionCount} รอตรวจ` : undefined,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        allowed: allowedMenus.includes('asset_inspection')
      },
      {
        id: 'fuel',
        category: 'operations',
        label: 'บันทึกไมล์ & เชื้อเพลิง',
        subLabel: 'Fuel & Mileage Log',
        desc: 'เลขไมล์ ค่าน้ำมัน ตรวจสภาพรถ',
        icon: Fuel,
        gradient: 'from-teal-500 to-sky-500',
        allowed: allowedMenus.includes('fuel')
      },
      {
        id: 'fleet',
        category: 'operations',
        label: 'บำรุงรักษา & ทะเบียนรถ',
        subLabel: 'Fleet & Maintenance',
        desc: 'ภาษี พ.ร.บ. ประกันภัย ประวัติซ่อมบำรุง',
        icon: Wrench,
        gradient: 'from-cyan-500 to-blue-500',
        badge: availableVehiclesCount !== undefined ? `ว่าง ${availableVehiclesCount}/${vehiclesCount}` : undefined,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        allowed: allowedMenus.includes('fleet')
      },
      {
        id: 'tracking',
        category: 'operations',
        label: 'ติดตาม GPS รถยนต์สด',
        subLabel: 'Live Fleet Tracking',
        desc: 'จำลองเส้นทางพิกัดและความเร็วรถ',
        icon: Navigation,
        gradient: 'from-purple-500 to-pink-500',
        badge: 'LIVE',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        allowed: allowedMenus.includes('tracking')
      }
    ].filter((item) => item.allowed);
  }, [
    allowedMenus,
    currentUser.role,
    hasExecutableMission,
    myActiveMissionsCount,
    pendingInspectionCount,
    availableVehiclesCount,
    vehiclesCount
  ]);

  const systemMenuItems = useMemo(() => {
    return [
      {
        id: 'analytics',
        category: 'system',
        label: 'รายงานสถิติและส่งออก',
        subLabel: 'Analytics & Export',
        desc: 'สรุปงบประมาณ สถิติประจำเดือน CSV/Excel',
        icon: BarChart3,
        gradient: 'from-amber-500 to-yellow-500',
        allowed: allowedMenus.includes('analytics')
      },
      {
        id: 'director',
        category: 'system',
        label: 'แผงอนุมัติผู้บริหาร',
        subLabel: 'Executive Approval Hub',
        desc: 'พิจารณาลงนามและสั่งการใบเบิกใช้รถ',
        icon: FileCheck,
        gradient: 'from-teal-600 to-emerald-600',
        badge: pendingDirectorCount > 0 ? `${pendingDirectorCount} คำขอรอสั่งการ` : undefined,
        badgeColor: 'bg-rose-500 text-white font-bold animate-bounce shadow-xs',
        special: 'director',
        allowed: canAccessDirector
      },
      {
        id: 'users',
        category: 'system',
        label: 'จัดการผู้ใช้งาน & กำหนดสิทธิ์',
        subLabel: 'User & Permissions Control',
        desc: 'เพิ่ม/ลบ/แก้ไข และกำหนดสิทธิ์รายเมนู',
        icon: Users,
        gradient: 'from-purple-600 to-indigo-600',
        special: 'users',
        allowed: canAccessUsers
      },
      {
        id: 'backup',
        category: 'system',
        label: 'สำรอง & กู้คืนข้อมูลระบบ',
        subLabel: 'Backup & Cloud Restore',
        desc: 'ดาวน์โหลด JSON และซิงค์ Cloud Firestore',
        icon: Database,
        gradient: 'from-sky-500 to-blue-600',
        allowed: allowedMenus.includes('backup')
      }
    ].filter((item) => item.allowed);
  }, [allowedMenus, canAccessDirector, canAccessUsers, pendingDirectorCount]);

  // Combined list for search filtering
  const allFilteredItems = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return null;

    const all = [...coreMenuItems, ...operationMenuItems, ...systemMenuItems];
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subLabel.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [coreMenuItems, operationMenuItems, systemMenuItems, menuSearch]);

  const roleBadgeStyle = useMemo(() => {
    switch (currentUser.role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-purple-500/20';
      case 'director':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40 ring-teal-500/20';
      case 'driver':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 ring-blue-500/20';
      default:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40 ring-orange-500/20';
    }
  }, [currentUser.role]);

  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isDashboardItem = item.id === 'dashboard';
    const isActive = activeTab === item.id;

    if (isDashboardItem) {
      return (
        <div key={item.id} className="space-y-1">
          <div className="relative group flex items-center">
            {isActive && (
              <div className="absolute -left-2 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full shadow-lg shadow-blue-500/50" />
            )}

            <button
              onClick={() => {
                onSelectTab('dashboard', 'overview');
                setIsDashboardExpanded(true);
                onClose();
              }}
              className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all duration-300 text-left cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500/15 font-bold'
                  : darkMode
                    ? 'text-slate-400 hover:bg-[#151c2c] hover:text-white border border-transparent'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 pl-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner'
                      : darkMode
                        ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold leading-none truncate">{item.label}</span>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 mr-1 ${
                    isActive ? 'bg-white/25 text-white border-white/20' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>

            {/* Accordion toggle button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDashboardExpanded(!isDashboardExpanded);
                playAppSound('click', soundEnabled);
              }}
              className={`w-8 h-8 ml-1 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-blue-100 hover:text-white'
                  : darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-[#151c2c]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isDashboardExpanded ? 'ซ่อนเมนูย่อย' : 'แสดงเมนูย่อย'}
            >
              {isDashboardExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
              )}
            </button>
          </div>

          {/* Sub-menu accordion */}
          {isDashboardExpanded && (
            <div className={`ml-6 pl-3.5 border-l space-y-1 py-1 transition-all duration-200 ${
              darkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              {/* Sub-item 1: ภาพรวม & KPI */}
              <button
                onClick={() => {
                  onSelectTab('dashboard', 'overview');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-1.5 rounded-full text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard' && dashboardSubView === 'overview'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : darkMode
                      ? 'text-slate-400 hover:bg-[#151c2c] hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold">ภาพรวม & สรุป KPI</span>
                </div>
              </button>

              {/* Sub-item 2: รายการใบเบิก */}
              <button
                onClick={() => {
                  onSelectTab('dashboard', 'bookings');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-1.5 rounded-full text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard' && dashboardSubView === 'bookings'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : darkMode
                      ? 'text-slate-400 hover:bg-[#151c2c] hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold">รายการใบเบิกทั้งหมด</span>
                </div>
                {pendingBookingsCount > 0 ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'dashboard' && dashboardSubView === 'bookings'
                        ? 'bg-white text-blue-600'
                        : 'bg-amber-500/20 text-amber-500 dark:text-amber-400'
                    }`}
                  >
                    {pendingBookingsCount}
                  </span>
                ) : null}
              </button>

              {/* Sub-item 3: สถานะรถยนต์ราชการ */}
              <button
                onClick={() => {
                  onSelectTab('dashboard', 'vehicles');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-1.5 rounded-full text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard' && dashboardSubView === 'vehicles'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : darkMode
                      ? 'text-slate-400 hover:bg-[#151c2c] hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Car className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold">สถานะรถยนต์ราชการ</span>
                </div>
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id} className="relative group">
        {isActive && (
          <div className="absolute -left-2 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full shadow-lg shadow-blue-500/50" />
        )}

        <button
          onClick={() => {
            onSelectTab(item.id);
            onClose();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all duration-300 text-left cursor-pointer group ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500/15 font-bold'
              : darkMode
                ? 'text-slate-400 hover:bg-[#151c2c] hover:text-white border border-transparent'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0 pl-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive
                  ? 'bg-white/20 text-white shadow-inner'
                  : darkMode
                    ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold leading-none truncate">{item.label}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {item.badge && (
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                  isActive ? 'bg-white/25 text-white border-white/20' : item.badgeColor
                }`}
              >
                {item.badge}
              </span>
            )}
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isActive
                  ? 'text-white translate-x-0.5 opacity-100'
                  : 'text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`}
            />
          </div>
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => {
            onClose();
            playAppSound('click', soundEnabled);
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-84 max-w-[85vw] z-50 transform transition-all duration-300 ease-out flex flex-col shadow-2xl border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          darkMode
            ? 'bg-[#0c101b] border-slate-800/80 text-white'
            : 'bg-[#ffffff] border-slate-200 text-slate-800'
        }`}
      >
        {/* Top macOS Traffic Lights & Header Block */}
        <div className={`p-4 border-b flex flex-col space-y-3.5 shrink-0 ${
          darkMode ? 'border-slate-800/60 bg-slate-950/20' : 'border-slate-100 bg-slate-50/40'
        }`}>
          {/* macOS Style Traffic Window Controls */}
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/90 shadow-xs shadow-rose-500/10" />
            <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-xs shadow-amber-500/10" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-xs shadow-emerald-500/10" />
          </div>

          {/* User Profile Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Profile Avatar with status ring */}
              <div
                onClick={() => {
                  if (onOpenProfilePhoto) {
                    onClose();
                    onOpenProfilePhoto();
                    playAppSound('click', soundEnabled);
                  }
                }}
                className="relative cursor-pointer group shrink-0"
                title="แตะเพื่อเปลี่ยนรูปโปรไฟล์"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-500 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-orange-400/30 group-hover:ring-orange-400 shadow-md transition duration-300 transform group-hover:scale-105">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ${
                    darkMode ? 'ring-[#0c101b]' : 'ring-white'
                  }`}></span>
                </span>
              </div>

              <div className="min-w-0">
                <h3 className={`font-bold text-sm tracking-tight truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  {currentUser.name}
                </h3>
                <p className={`text-[11px] font-medium truncate mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser.roleTitle || currentUser.role}
                </p>
              </div>
            </div>

            {/* Dynamic Green Collapse Button matching mockup exactly */}
            <button
              onClick={() => {
                onClose();
                playAppSound('click', soundEnabled);
              }}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition shadow-lg shadow-emerald-500/25 border-none cursor-pointer"
              title="ปิดเมนู"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Menu Quick Search Input */}
        <div className="px-4 pt-4 pb-1 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => {
                setMenuSearch(e.target.value);
                playAppSound('type', soundEnabled);
              }}
              placeholder="ค้นหาเมนูในระบบ..."
              className={`w-full pl-10 pr-9 py-2 rounded-full text-xs transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                darkMode
                  ? 'bg-[#151c2c] border border-slate-800/80 text-white placeholder-slate-500 focus:border-blue-500/50'
                  : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500/50'
              }`}
            />
            {menuSearch && (
              <button
                type="button"
                onClick={() => {
                  setMenuSearch('');
                  playAppSound('click', soundEnabled);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 px-4 py-3 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Search Result */}
          {allFilteredItems !== null ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest px-2 pb-1.5 flex items-center justify-between border-b border-dashed border-slate-700/20">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                  ผลการค้นหา ({allFilteredItems.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMenuSearch('');
                    playAppSound('click', soundEnabled);
                  }}
                  className="text-blue-500 hover:underline font-bold text-[9px]"
                >
                  ล้างค้นหา
                </button>
              </div>
              {allFilteredItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  ไม่พบเมนูที่ตรงกับคำค้นหา
                </div>
              ) : (
                <div className="space-y-1">{allFilteredItems.map(renderMenuItem)}</div>
              )}
            </div>
          ) : (
            <>
              {/* Category 1: Core */}
              {coreMenuItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-between px-2 mb-2">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      เมนูหลัก & การขอใช้รถ
                    </span>
                    <span className="text-[9px] text-orange-500 font-bold uppercase hover:underline cursor-pointer">
                      VIEW ALL
                    </span>
                  </div>
                  <div className="space-y-1">{coreMenuItems.map(renderMenuItem)}</div>
                </div>
              )}

              {/* Category 2: Operations */}
              {operationMenuItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-between px-2 mb-2">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      งานคนขับ / พัสดุ / ยานพาหนะ
                    </span>
                    <span className="text-[9px] text-orange-500 font-bold uppercase hover:underline cursor-pointer">
                      VIEW ALL
                    </span>
                  </div>
                  <div className="space-y-1">{operationMenuItems.map(renderMenuItem)}</div>
                </div>
              )}

              {/* Category 3: System */}
              {systemMenuItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-between px-2 mb-2">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      รายงาน สถิติ & สิทธิ์ผู้ดูแล
                    </span>
                    <span className="text-[9px] text-orange-500 font-bold uppercase hover:underline cursor-pointer">
                      VIEW ALL
                    </span>
                  </div>
                  <div className="space-y-1">{systemMenuItems.map(renderMenuItem)}</div>
                </div>
              )}

              {/* Category 4: Quick Switch User (Teams) inline with mockup */}
              {onSwitchUser && effectiveUsers.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-700/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-between px-2 mb-2">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      สลับผู้ใช้งานทดสอบ (Teams)
                    </span>
                    <span className="text-[9px] text-orange-500 font-bold uppercase hover:underline cursor-pointer">
                      VIEW ALL
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {effectiveUsers.slice(0, 5).map((u) => {
                      const isSelected = u.id === currentUser.id;
                      
                      let roleIconColor = 'text-purple-400';
                      let roleLabel = u.roleTitle || u.role;
                      
                      if (u.role === 'admin') roleIconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                      else if (u.role === 'director') roleIconColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
                      else if (u.role === 'driver') roleIconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      else roleIconColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => onSwitchUser(u)}
                          className={`w-full flex items-center justify-between p-2 rounded-2xl transition duration-200 text-left border cursor-pointer ${
                            isSelected 
                              ? darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                              : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs overflow-hidden">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  u.name.charAt(0)
                                )}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ${
                                darkMode ? 'ring-[#0c101b]' : 'ring-white'
                              } ${isSelected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${
                                isSelected 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : darkMode ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {u.name}
                              </p>
                              <p className={`text-[10px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {roleLabel}
                              </p>
                            </div>
                          </div>

                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${roleIconColor}`}>
                            {u.role === 'admin' ? (
                              <Shield className="w-3.5 h-3.5" />
                            ) : u.role === 'director' ? (
                              <FileCheck className="w-3.5 h-3.5" />
                            ) : u.role === 'driver' ? (
                              <Car className="w-3.5 h-3.5" />
                            ) : (
                              <Users className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drag-n-Drop Google Sync upload box mockup */}
        {onOpenGoogleSync && (
          <div className={`px-4 py-2 shrink-0 border-t ${darkMode ? 'border-slate-800/40 bg-slate-950/20' : 'border-slate-100 bg-slate-50/40'}`}>
            <div 
              onClick={() => {
                onClose();
                onOpenGoogleSync();
              }}
              className={`p-3.5 rounded-2xl border-2 border-dashed transition cursor-pointer text-center space-y-1.5 group ${
                isGoogleConnected
                  ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : darkMode
                    ? 'border-slate-800 bg-[#121824]/30 hover:bg-[#121824]/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {isGoogleConnected ? 'Google Sheets เชื่อมต่อแล้ว' : 'ซิงค์ข้อมูล Google Sheets'}
                </h4>
                <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  e-Fleet Database Cloud Synchronization
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Preferences, Theme Toggle & Status */}
        <div className={`p-4 border-t space-y-3 shrink-0 ${
          darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/30'
        }`}>
          {/* Pill Theme Toggle */}
          {onToggleDarkMode && (
            <div className={`p-1 rounded-full flex items-center border ${
              darkMode 
                ? 'bg-[#151c2c] border-slate-800' 
                : 'bg-slate-100 border-slate-200'
            }`}>
              {/* Light Tab */}
              <button
                type="button"
                onClick={() => {
                  if (darkMode && onToggleDarkMode) {
                    onToggleDarkMode();
                    playAppSound('click', soundEnabled);
                  }
                }}
                className={`flex-1 py-1.5 rounded-full flex items-center justify-center space-x-1.5 text-xs font-bold transition cursor-pointer border-none ${
                  !darkMode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              
              {/* Dark Tab */}
              <button
                type="button"
                onClick={() => {
                  if (!darkMode && onToggleDarkMode) {
                    onToggleDarkMode();
                    playAppSound('click', soundEnabled);
                  }
                }}
                className={`flex-1 py-1.5 rounded-full flex items-center justify-center space-x-1.5 text-xs font-bold transition cursor-pointer border-none ${
                  darkMode
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>Dark</span>
              </button>
            </div>
          )}

          {/* Additional Quick Action buttons */}
          <div className="flex gap-2">
            {onOpenVoiceSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoiceSettings();
                  playAppSound('click', soundEnabled);
                }}
                className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                <span>เสียงแจ้งเตือน ({voiceAlertsEnabled ? 'เปิด' : 'ปิด'})</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                  playAppSound('click', soundEnabled);
                }}
                className="flex-1 flex items-center justify-center space-x-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกระบบ</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-2 text-center border-t select-none ${
          darkMode ? 'border-slate-800/40 bg-slate-950/80' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            สำนักงานวัฒนธรรมจังหวัดพังงา
          </div>
          <div className="text-[9px] text-slate-400/80 mt-0.5">
            e-Fleet Platform v2.6.0
          </div>
        </div>
      </aside>
    </>
  );
};
