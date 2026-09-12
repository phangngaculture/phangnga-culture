import React, { useState, useMemo } from 'react';
import { User, MenuKey, DashboardSubView, BookingRequest } from '../types';
import { canUserExecuteMission } from '../utils/driverPermissions';
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
  isGoogleConnected = false
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
            {/* Left Active Glow Indicator */}
            {isActive && (
              <div className="absolute -left-3 top-1.5 bottom-1.5 w-1.5 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r-full shadow-lg shadow-orange-500/50" />
            )}

            <button
              onClick={() => {
                onSelectTab('dashboard', 'overview');
                setIsDashboardExpanded(true);
                onClose();
              }}
              className={`flex-1 flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 text-left cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/90 to-amber-600/90 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40 backdrop-blur-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent hover:border-slate-700/60'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner'
                      : `bg-gradient-to-tr ${item.gradient} text-white shadow-sm opacity-90 group-hover:opacity-100`
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold leading-tight truncate">{item.label}</span>
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? 'text-orange-100' : 'text-slate-400'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 mr-1 ${
                    isActive ? 'bg-white text-orange-600 border-white/40' : item.badgeColor
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
              }}
              className={`w-8 h-10 ml-1 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600/50 hover:bg-orange-600 text-orange-100 hover:text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isDashboardExpanded ? 'ซ่อนเมนูย่อย' : 'แสดงเมนูย่อย'}
            >
              {isDashboardExpanded ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
          </div>

          {/* Sub-menu accordion */}
          {isDashboardExpanded && (
            <div className="ml-5 pl-3.5 border-l-2 border-orange-500/40 space-y-1 py-1 transition-all duration-200">
              {/* Sub-item 1: ภาพรวม & KPI */}
              <button
                onClick={() => {
                  onSelectTab('dashboard', 'overview');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard' && dashboardSubView === 'overview'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 border border-orange-400/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <LayoutDashboard
                    className={`w-3.5 h-3.5 shrink-0 ${
                      activeTab === 'dashboard' && dashboardSubView === 'overview'
                        ? 'text-white'
                        : 'text-orange-400'
                    }`}
                  />
                  <span className="text-xs font-medium">ภาพรวม & สรุป KPI</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                    activeTab === 'dashboard' && dashboardSubView === 'overview'
                      ? 'bg-white/20 text-white'
                      : 'text-slate-400 bg-slate-800/90'
                  }`}
                >
                  KPI
                </span>
              </button>

              {/* Sub-item 2: รายการใบเบิก */}
              <button
                onClick={() => {
                  onSelectTab('dashboard', 'bookings');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard' && dashboardSubView === 'bookings'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 border border-orange-400/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 ${
                      activeTab === 'dashboard' && dashboardSubView === 'bookings'
                        ? 'text-white'
                        : 'text-orange-400'
                    }`}
                  />
                  <span className="text-xs font-medium">รายการใบเบิกทั้งหมด</span>
                </div>
                {pendingBookingsCount > 0 ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === 'dashboard' && dashboardSubView === 'bookings'
                        ? 'bg-white text-orange-600'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {pendingBookingsCount} รออนุมัติ
                  </span>
                ) : bookingsCount > 0 ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                      activeTab === 'dashboard' && dashboardSubView === 'bookings'
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 bg-slate-800/90'
                    }`}
                  >
                    {bookingsCount} รายการ
                  </span>
                ) : null}
              </button>

              {/* Sub-item 3: สถานะรถยนต์ราชการ */}
              <button
                onClick={() => {
                  onSelectTab('dashboard', 'vehicles');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard' && dashboardSubView === 'vehicles'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 border border-orange-400/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Car
                    className={`w-3.5 h-3.5 shrink-0 ${
                      activeTab === 'dashboard' && dashboardSubView === 'vehicles'
                        ? 'text-white'
                        : 'text-teal-400'
                    }`}
                  />
                  <span className="text-xs font-medium">สถานะรถยนต์ราชการ</span>
                </div>
                {availableVehiclesCount !== undefined && vehiclesCount > 0 ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                      activeTab === 'dashboard' && dashboardSubView === 'vehicles'
                        ? 'bg-white/20 text-white'
                        : 'text-teal-300 bg-teal-950/80 border border-teal-800/60'
                    }`}
                  >
                    ว่าง {availableVehiclesCount}/{vehiclesCount}
                  </span>
                ) : null}
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id} className="relative group">
        {/* Left Active Glow Indicator */}
        {isActive && (
          <div className="absolute -left-3 top-1.5 bottom-1.5 w-1.5 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r-full shadow-lg shadow-orange-500/50" />
        )}

        <button
          onClick={() => {
            onSelectTab(item.id);
            onClose();
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 text-left cursor-pointer group ${
            isActive
              ? item.special === 'director'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30 border border-teal-400/40'
                : item.special === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40'
              : item.special === 'director'
              ? 'bg-teal-950/30 text-teal-200 border border-teal-800/40 hover:bg-teal-900/40 hover:border-teal-700/60'
              : item.special === 'users'
              ? 'bg-purple-950/30 text-purple-200 border border-purple-800/40 hover:bg-purple-900/40 hover:border-purple-700/60'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent hover:border-slate-700/60'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive
                  ? 'bg-white/20 text-white shadow-inner'
                  : `bg-gradient-to-tr ${item.gradient} text-white shadow-sm opacity-90 group-hover:opacity-100`
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold leading-tight truncate">{item.label}</span>
              </div>
              <div
                className={`text-[10px] truncate mt-0.5 ${
                  isActive
                    ? 'text-orange-100'
                    : item.special === 'director'
                    ? 'text-teal-300/80'
                    : item.special === 'users'
                    ? 'text-purple-300/80'
                    : 'text-slate-400'
                }`}
              >
                {item.desc}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {item.badge && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                }`}
              >
                {item.badge}
              </span>
            )}
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${
                isActive
                  ? 'text-white translate-x-0.5 opacity-100'
                  : 'text-slate-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'
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
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-84 max-w-[85vw] bg-slate-900/98 backdrop-blur-xl text-white z-50 transform transition-all duration-300 ease-out flex flex-col shadow-2xl border-r border-slate-800/80 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/logo_mculture.svg"
                alt="ตรากระทรวงวัฒนธรรม"
                className="w-9 h-11 object-contain drop-shadow-md shrink-0 transition-transform duration-200 hover:scale-105"
              />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-extrabold text-xs tracking-wide text-white">สนง.วัฒนธรรมจังหวัดพังงา</h2>
              </div>
              <p className="text-[10px] text-orange-400 font-medium flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>ระบบบริหารยานพาหนะราชการ</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700/50"
            title="ปิดเมนู"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card with Switcher Dropdown */}
        <div className="p-3 bg-gradient-to-b from-slate-950/80 to-slate-900/90 border-b border-slate-800/80 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                onClick={() => {
                  if (onOpenProfilePhoto) {
                    onClose();
                    onOpenProfilePhoto();
                  }
                }}
                className="relative cursor-pointer group shrink-0"
                title="แตะเพื่อเปลี่ยนรูปโปรไฟล์"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-500 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-2 ring-orange-400/40 group-hover:ring-orange-400 shadow-md transition-transform duration-200 group-hover:scale-105">
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
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-600 text-white rounded-full flex items-center justify-center ring-1 ring-slate-900 shadow-xs">
                  <Camera className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center space-x-1.5">
                  <span className="truncate">{currentUser.name}</span>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${roleBadgeStyle}`}
                  >
                    {currentUser.roleTitle || currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Switch User Toggle */}
            {onSwitchUser && effectiveUsers.length > 1 && (
              <button
                type="button"
                onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  showUserSwitcher
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                }`}
                title="สลับบัญชีผู้ใช้งานทดสอบ"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Switcher Dropdown */}
          {showUserSwitcher && (
            <div className="mt-2.5 p-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 flex items-center justify-between">
                <span>สลับบัญชีผู้ใช้งาน ({effectiveUsers.length} ท่าน)</span>
                <span className="text-[9px] text-orange-400 font-normal">ทดสอบระบบ</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                {effectiveUsers.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (onSwitchUser) {
                          onSwitchUser(u);
                          setShowUserSwitcher(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <span className="truncate">{u.name}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium shrink-0 ml-1 ${
                        isSelected ? 'bg-white/20 text-white' : 'text-slate-400 bg-slate-900'
                      }`}>
                        {u.roleTitle || u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Menu Quick Search Input */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="ค้นหาเมนู (เช่น ไมล์, ทะเบียน, gps)..."
              className="w-full pl-8.5 pr-7 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 transition"
            />
            {menuSearch && (
              <button
                type="button"
                onClick={() => setMenuSearch('')}
                className="absolute right-2.5 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 px-3 py-2 space-y-4 overflow-y-auto custom-scrollbar">
          {/* If Search Active */}
          {allFilteredItems !== null ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
                <span>ผลการค้นหา ({allFilteredItems.length})</span>
                <button
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="text-orange-400 hover:underline"
                >
                  ล้างค้นหา
                </button>
              </div>
              {allFilteredItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  ไม่พบเมนูที่ตรงกับคำค้นหา
                </div>
              ) : (
                allFilteredItems.map(renderMenuItem)
              )}
            </div>
          ) : (
            <>
              {/* Category 1: เมนูหลัก (Core) */}
              {coreMenuItems.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span>เมนูหลัก & การขอใช้รถ</span>
                  </div>
                  <div className="space-y-1">{coreMenuItems.map(renderMenuItem)}</div>
                </div>
              )}

              {/* Category 2: ปฏิบัติการ & งานยานพาหนะ (Operations) */}
              {operationMenuItems.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>งานคนขับ / พัสดุ / ยานพาหนะ</span>
                  </div>
                  <div className="space-y-1">{operationMenuItems.map(renderMenuItem)}</div>
                </div>
              )}

              {/* Category 3: รายงาน & ผู้บริหาร & ระบบ (System & Reports) */}
              {systemMenuItems.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>รายงาน สถิติ & สิทธิ์ผู้ดูแล</span>
                  </div>
                  <div className="space-y-1">{systemMenuItems.map(renderMenuItem)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick System Status Snapshot Mini Bar */}
        <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1 text-teal-400">
            <Car className="w-3.5 h-3.5" />
            <span>รถว่าง {availableVehiclesCount}/{vehiclesCount} คัน</span>
          </div>
          <div className="flex items-center space-x-1 text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>รอ {pendingBookingsCount} รายการ</span>
          </div>
        </div>

        {/* Preferences & Quick Toggles */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 space-y-2">
          {/* Dark Mode Switch */}
          {onToggleDarkMode && (
            <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                </div>
                <span className="text-xs">{darkMode ? 'โหมดมืด (Dark)' : 'โหมดสว่าง (Light)'}</span>
              </div>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer relative ${
                  darkMode ? 'bg-amber-500 shadow-xs shadow-amber-500/30' : 'bg-slate-700'
                }`}
                title={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    darkMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Voice Alerts Settings Button */}
          {onOpenVoiceSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenVoiceSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <span>เสียงแจ้งเตือน (Voice Alerts)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                voiceAlertsEnabled ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-slate-700 text-slate-400'
              }`}>
                {voiceAlertsEnabled ? 'เปิด' : 'ปิด'}
              </span>
            </button>
          )}
          {onOpenGoogleSync && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoogleSync();
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isGoogleConnected
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>Google Sheets Sync</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                {isGoogleConnected ? 'เชื่อมต่อแล้ว' : 'แตะเพื่อซิงค์'}
              </span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 active:scale-98 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ (Sign Out)</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 text-center">
          <div className="text-[10px] text-slate-400 font-semibold">
            สำนักงานวัฒนธรรมจังหวัดพังงา
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            e-Fleet Service Platform • v2.6.0
          </div>
        </div>
      </aside>
    </>
  );
};
