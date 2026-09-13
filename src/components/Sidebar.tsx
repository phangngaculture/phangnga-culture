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
  Volume2,
  Palette
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
  uiStyle?: 'modern' | 'ribbon' | 'classic' | 'slim_rail' | 'double_panel' | 'eevo_sleek' | 'aurora_glass' | 'minimal_clean' | 'neumorphism_soft' | 'midnight_navy' | 'obsidian_prism' | 'ai_minimal';
  menuButtonColor?: 'orange' | 'emerald' | 'indigo' | 'rose' | 'violet';
  iconStyle?: 'gradient' | 'neon' | 'flat';
  fontSize?: 'small' | 'medium' | 'large';
  sidebarOpacity?: number;
  onOpenUiCustomizer?: () => void;
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
  soundEnabled = true,
  uiStyle = 'modern',
  menuButtonColor = 'orange',
  iconStyle = 'gradient',
  fontSize = 'medium',
  sidebarOpacity = 1.0,
  onOpenUiCustomizer
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
      },
      {
        id: 'website_customizer',
        category: 'system',
        label: 'เมนูจัดการและตกแต่งเว็บไซต์',
        subLabel: 'Website Customizer',
        desc: 'ปรับแต่งสไตล์เมนูข้าง ความโปร่งใส และดีไซน์ระบบ',
        icon: Palette,
        gradient: 'from-pink-500 to-rose-500',
        allowed: allowedMenus.includes('website_customizer')
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

  const getActiveButtonClass = (isActive: boolean) => {
    if (!isActive) {
      if (uiStyle === 'minimal_clean' || uiStyle === 'ai_minimal') {
        return darkMode ? 'text-slate-400 hover:bg-slate-800/70 hover:text-white border border-transparent' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent';
      }
      if (uiStyle === 'neumorphism_soft') {
        return darkMode ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent' : 'text-slate-600 hover:text-slate-800 border border-transparent hover:shadow-[inset_3px_3px_7px_rgba(148,163,184,0.28),inset_-3px_-3px_7px_rgba(255,255,255,0.9)]';
      }
      if (uiStyle === 'midnight_navy') {
        return 'text-blue-100/65 hover:bg-blue-900/40 hover:text-white border border-transparent';
      }
      if (uiStyle === 'obsidian_prism') {
        return 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent';
      }
      if (uiStyle === 'classic') {
        return darkMode
          ? 'text-amber-100 hover:bg-amber-900/10 hover:text-amber-300 font-serif border border-transparent'
          : 'text-amber-900 hover:bg-amber-50 hover:text-amber-950 font-serif border border-transparent';
      }
      return darkMode
        ? 'text-slate-400 hover:bg-[#151c2c] hover:text-white border border-transparent'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent';
    }

    if (uiStyle === 'minimal_clean' || uiStyle === 'ai_minimal') {
      return darkMode ? 'bg-white text-slate-900 shadow-sm border border-white font-bold' : 'bg-slate-900 text-white shadow-sm border border-slate-900 font-bold';
    }

    if (uiStyle === 'neumorphism_soft') {
      return darkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-[5px_5px_10px_rgba(2,6,23,0.45),-5px_-5px_10px_rgba(71,85,105,0.12)] font-bold' : 'bg-[#e6ebf2] text-slate-800 border border-white/70 shadow-[6px_6px_12px_rgba(148,163,184,0.35),-6px_-6px_12px_rgba(255,255,255,0.95)] font-bold';
    }

    if (uiStyle === 'midnight_navy') {
      return 'bg-blue-600/25 text-white shadow-[0_8px_24px_rgba(37,99,235,0.18)] border border-blue-400/25 font-bold';
    }

    if (uiStyle === 'obsidian_prism') {
      return 'bg-gradient-to-r from-violet-500/80 via-fuchsia-500/70 to-cyan-400/70 text-white shadow-[0_8px_28px_rgba(139,92,246,0.28)] border border-white/20 font-bold';
    }

    if (uiStyle === 'classic') {
      return 'bg-amber-950/10 text-amber-800 border-2 border-double border-amber-800 font-bold font-serif shadow-sm';
    }

    if (uiStyle === 'ribbon') {
      return 'bg-[#121824] text-white font-bold relative curved-ribbon-active shadow-md border-r-0 rounded-l-2xl rounded-r-none';
    }

    // Modern / Standard Accent colors:
    switch (menuButtonColor) {
      case 'emerald': return 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border border-emerald-500/15 font-bold';
      case 'indigo': return 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-500/15 font-bold';
      case 'rose': return 'bg-rose-600 text-white shadow-md shadow-rose-500/20 border border-rose-500/15 font-bold';
      case 'violet': return 'bg-violet-600 text-white shadow-md shadow-violet-500/20 border border-violet-500/15 font-bold';
      default: return 'bg-orange-600 text-white shadow-md shadow-orange-500/20 border border-orange-500/15 font-bold';
    }
  };

  const getIconContainerClass = (isActive: boolean, gradientStr: string) => {
    if (uiStyle === 'ai_minimal') {
      if (isActive) return 'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 text-white shadow-[0_7px_16px_rgba(112,84,238,0.35)] ring-1 ring-white/30';
      const isEmerald = gradientStr.includes('emerald') || gradientStr.includes('teal');
      const isBlue = gradientStr.includes('blue') || gradientStr.includes('sky') || gradientStr.includes('cyan');
      const isRose = gradientStr.includes('rose') || gradientStr.includes('pink');
      return isEmerald
        ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_5px_12px_rgba(16,185,129,0.25)]'
        : isBlue
          ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_5px_12px_rgba(59,130,246,0.25)]'
          : isRose
            ? 'bg-gradient-to-br from-pink-400 to-rose-600 text-white shadow-[0_5px_12px_rgba(244,63,94,0.25)]'
            : 'bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-[0_5px_12px_rgba(139,92,246,0.25)]';
    }
    if (isActive) {
      if (iconStyle === 'flat') return 'bg-white/20 text-white shadow-inner';
      if (iconStyle === 'neon') return 'bg-transparent text-white drop-shadow-[0_0_8px_currentColor] border border-current';
      return 'bg-white/20 text-white shadow-inner';
    }

    if (iconStyle === 'flat') {
      return darkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-500';
    }

    if (iconStyle === 'neon') {
      const isEmerald = gradientStr.includes('emerald') || gradientStr.includes('teal');
      const isBlue = gradientStr.includes('blue') || gradientStr.includes('sky') || gradientStr.includes('cyan');
      const isPurple = gradientStr.includes('purple') || gradientStr.includes('pink');
      const colorClass = isEmerald ? 'text-emerald-400 border-emerald-500/20' :
                         isBlue ? 'text-blue-400 border-blue-500/20' :
                         isPurple ? 'text-purple-400 border-purple-500/20' :
                         'text-orange-400 border-orange-500/20';
      return `bg-transparent border ${colorClass} drop-shadow-[0_0_4px_rgba(249,115,22,0.3)]`;
    }

    return `bg-gradient-to-tr ${gradientStr || 'from-orange-500 to-amber-500'} text-white shadow-xs`;
  };

  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isDashboardItem = item.id === 'dashboard';
    const isActive = activeTab === item.id;

    if (isDashboardItem) {
      return (
        <div key={item.id} className="space-y-1">
          <div className="relative group flex items-center">
            {isActive && uiStyle !== 'ribbon' && (
              <div className={`absolute -left-2 top-2 bottom-2 w-1 rounded-r-full shadow-lg ${
                menuButtonColor === 'emerald' ? 'bg-emerald-500' :
                menuButtonColor === 'indigo' ? 'bg-indigo-500' :
                menuButtonColor === 'rose' ? 'bg-rose-500' :
                menuButtonColor === 'violet' ? 'bg-violet-500' :
                'bg-orange-500'
              }`} />
            )}

            <button
              onClick={() => {
                onSelectTab('dashboard', 'overview');
                setIsDashboardExpanded(true);
                onClose();
              }}
              className={`app-menu-button flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all duration-300 text-left cursor-pointer active:scale-[0.98] ${
                getActiveButtonClass(isActive)
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 pl-1">
                <div
                  className={`app-icon-press ${uiStyle === 'ai_minimal' ? 'w-11 h-11 rounded-[1rem]' : 'w-9 h-9 rounded-full'} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    getIconContainerClass(isActive, item.gradient)
                  }`}
                >
                  <Icon className="w-5 h-5" />
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
                  ? 'bg-black/15 text-white hover:bg-black/25'
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
                    ? getActiveButtonClass(true)
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
                    ? getActiveButtonClass(true)
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
                    ? getActiveButtonClass(true)
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
        {isActive && uiStyle !== 'ribbon' && (
          <div className={`absolute -left-2 top-2 bottom-2 w-1 rounded-r-full shadow-lg ${
            menuButtonColor === 'emerald' ? 'bg-emerald-500' :
            menuButtonColor === 'indigo' ? 'bg-indigo-500' :
            menuButtonColor === 'rose' ? 'bg-rose-500' :
            menuButtonColor === 'violet' ? 'bg-violet-500' :
            'bg-orange-500'
          }`} />
        )}

        <button
          onClick={() => {
            onSelectTab(item.id);
            onClose();
          }}
          className={`app-menu-button w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all duration-300 text-left cursor-pointer group active:scale-[0.98] ${
            getActiveButtonClass(isActive)
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0 pl-1">
            <div
              className={`app-icon-press ${uiStyle === 'ai_minimal' ? 'w-11 h-11 rounded-[1rem]' : 'w-9 h-9 rounded-full'} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                getIconContainerClass(isActive, item.gradient)
              }`}
            >
              <Icon className="w-5 h-5" />
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
      {/* Backdrop (Only for wide sidebars on mobile or default view) */}
      {isOpen && uiStyle !== 'slim_rail' && (
        <div
          onClick={() => {
            onClose();
            playAppSound('click', soundEnabled);
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* ==========================================================================
         LAYOUT 1: Slim Icon Rail Dock (ตัวเลือกแถบไอคอนผอมจากรูปภาพที่ส่งมา)
         ========================================================================== */}
      {uiStyle === 'slim_rail' ? (
        <aside
          className={`fixed top-0 bottom-0 left-0 w-20 z-50 transform transition-all duration-300 ease-out flex flex-col shadow-2xl border-r ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } bg-[#0c101b] border-slate-800/80 text-white`}
        >
          {/* macOS Style Controls */}
          <div className="p-4 flex flex-col items-center space-y-3 border-b border-slate-800/40 shrink-0">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* User Profile Circular Avatar */}
          <div className="p-4 flex flex-col items-center shrink-0 border-b border-slate-800/20">
            <div
              onClick={() => {
                if (onOpenProfilePhoto) {
                  onOpenProfilePhoto();
                  playAppSound('click', soundEnabled);
                }
              }}
              className="relative cursor-pointer group shrink-0"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-2 ring-orange-500/40">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-1 ring-slate-900"></span>
              </span>
            </div>
          </div>

          {/* Menu Icons Scroll List */}
          <div className="flex-1 py-4 flex flex-col items-center space-y-3.5 overflow-y-auto custom-scrollbar">
            {[...coreMenuItems, ...operationMenuItems, ...systemMenuItems].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                    playAppSound('click', soundEnabled);
                  }}
                  className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                    isActive
                      ? menuButtonColor === 'emerald' ? 'bg-emerald-600 text-white shadow-lg' :
                        menuButtonColor === 'indigo' ? 'bg-indigo-600 text-white shadow-lg' :
                        menuButtonColor === 'rose' ? 'bg-rose-600 text-white shadow-lg' :
                        menuButtonColor === 'violet' ? 'bg-violet-600 text-white shadow-lg' :
                        'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  
                  {/* Floating Tooltip Label */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50 border border-slate-800">
                    {item.label}
                  </div>

                  {/* Red Dot Notification Badge */}
                  {item.badge && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900 flex items-center justify-center text-[7px] text-white font-bold" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Settings Trigger & Theme Switcher */}
          <div className="p-3 shrink-0 flex flex-col items-center space-y-3.5 border-t border-slate-800/40">
            {onOpenUiCustomizer && (
              <button
                onClick={() => {
                  onOpenUiCustomizer();
                  playAppSound('success', soundEnabled);
                }}
                className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center cursor-pointer hover:bg-amber-500/20 transition"
                title="ตกแต่งสไตล์หน้าเว็บ"
              >
                <Palette className="w-5 h-5 animate-pulse" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  playAppSound('click', soundEnabled);
                }}
                className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center cursor-pointer hover:bg-rose-500/20 transition"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </aside>

      /* ==========================================================================
         LAYOUT 2: Double Layer Grid Board (ดับเบิ้ลพาเนลสไตล์ตารางและโปรไฟล์แยกด้านข้าง)
         ========================================================================== */
      ) : uiStyle === 'double_panel' ? (
        <aside
          className={`fixed top-0 bottom-0 left-0 w-86 max-w-[90vw] z-50 transform transition-all duration-300 ease-out flex shadow-2xl border-r ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } bg-[#0c101b] border-slate-800/80 text-white`}
        >
          {/* ซีกซ้าย: Slim Avatar & User Selector Rail (เหมือนรูปภาพที่ 3 ใน Mockup) */}
          <div className="w-16 bg-slate-950 flex flex-col items-center py-6 justify-between border-r border-slate-900 shrink-0">
            <div className="flex flex-col items-center space-y-6 w-full">
              {/* macOS Style controls */}
              <div className="flex space-x-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>

              {/* Active Profile Circle */}
              <div className="relative shrink-0 mt-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 ring-2 ring-emerald-500 overflow-hidden cursor-pointer" onClick={onOpenProfilePhoto}>
                  {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              </div>

              {/* Teams Quick Users Avatar Shortcuts (เหมือนตัวเลือก A, B... ใน Mockup) */}
              <div className="flex flex-col items-center space-y-3 pt-4 w-full">
                {effectiveUsers.slice(0, 4).map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => onSwitchUser && onSwitchUser(u)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border cursor-pointer transition duration-200 ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                      title={`สลับเป็น: ${u.name}`}
                    >
                      {u.name.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition flex items-center justify-center cursor-pointer border border-rose-500/10"
                title="ออกระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ซีกขวา: Grid Board Content Menu Panel */}
          <div className="flex-1 bg-[#121824]/50 flex flex-col p-4 overflow-hidden">
            {/* Title & Brand header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 shrink-0">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">e-Fleet Teams</h2>
                <h3 className="text-[10px] text-emerald-400 font-medium tracking-tight">สำนักงานวัฒนธรรมจังหวัด</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="my-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="ค้นหาระบบงาน..."
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-8.5 pr-3 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                />
              </div>
            </div>

            {/* Category Blocks in Grid layout */}
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-0.5">
              {[...coreMenuItems, ...operationMenuItems, ...systemMenuItems]
                .filter(item => !menuSearch || item.label.toLowerCase().includes(menuSearch.toLowerCase()))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                        playAppSound('click', soundEnabled);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-start space-x-3 transition duration-200 cursor-pointer ${
                        isActive
                          ? 'border-orange-500 bg-orange-500/5 shadow-inner'
                          : 'border-slate-800/60 bg-slate-900/20 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${isActive ? 'text-orange-400' : 'text-slate-200'}`}>
                          {item.label}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Bottom Style Palette button */}
            <div className="pt-3 border-t border-slate-800/60 shrink-0">
              {onOpenUiCustomizer && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUiCustomizer();
                    playAppSound('success', soundEnabled);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                  <span>สลับดีไซน์เว็บไซต์</span>
                </button>
              )}
            </div>
          </div>
        </aside>

      /* ==========================================================================
         LAYOUT 3: Standard Modern / Ribbon / Classic (เมนูดั้งเดิม, คลาสสิกราชการ, และลอนเว้า 3D)
         ========================================================================== */
      ) : (
        <aside
          style={
            uiStyle === 'eevo_sleek' || uiStyle === 'aurora_glass' || uiStyle === 'obsidian_prism'
              ? {
                  background: uiStyle === 'obsidian_prism'
                    ? `linear-gradient(155deg, rgba(8, 10, 22, ${Math.max(sidebarOpacity, 0.92)}) 0%, rgba(30, 20, 62, ${Math.max(sidebarOpacity * 0.92, 0.84)}) 52%, rgba(8, 47, 73, ${Math.max(sidebarOpacity * 0.9, 0.82)}) 100%)`
                    : uiStyle === 'aurora_glass'
                      ? `linear-gradient(155deg, rgba(15, 23, 42, ${Math.max(sidebarOpacity, 0.88)}) 0%, rgba(30, 41, 59, ${Math.max(sidebarOpacity * 0.92, 0.8)}) 48%, rgba(49, 46, 129, ${Math.max(sidebarOpacity * 0.9, 0.78)}) 100%)`
                      : undefined,
                  backgroundColor: uiStyle === 'obsidian_prism' || uiStyle === 'aurora_glass'
                    ? undefined
                    : undefined,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: uiStyle === 'obsidian_prism' ? '0 0 55px rgba(168, 85, 247, 0.24)' : uiStyle === 'aurora_glass' ? '0 0 45px rgba(99, 102, 241, 0.18)' : undefined,
                }
              : undefined
          }
          className={`fixed top-0 bottom-0 left-0 w-84 max-w-[85vw] z-50 transform transition-all duration-300 ease-out flex flex-col shadow-2xl border-r ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            uiStyle === 'eevo_sleek' || uiStyle === 'aurora_glass' || uiStyle === 'obsidian_prism'
              ? darkMode
                ? 'border-fuchsia-400/20 text-white'
                : 'border-violet-300/40 text-slate-800'
              : uiStyle === 'minimal_clean' || uiStyle === 'ai_minimal'
                ? darkMode ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                : uiStyle === 'neumorphism_soft'
                  ? darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-[#e6ebf2] border-white/80 text-slate-700'
                  : uiStyle === 'midnight_navy'
                    ? 'bg-[#0b1730] border-blue-900/60 text-white'
              : uiStyle === 'ribbon'
                ? 'bg-[#131326] border-slate-800/40 text-white'
                : uiStyle === 'classic'
                  ? 'bg-[#fdfbf7] border-amber-800/40 text-amber-900 border-r-4 border-double'
                  : darkMode
                    ? 'bg-[#0c101b] border-slate-800/80 text-white'
                    : 'bg-[#ffffff] border-slate-200 text-slate-800'
          }`}
        >
          {/* Top macOS Traffic Lights & Header Block */}
          <div className={`p-4 border-b flex flex-col space-y-3.5 shrink-0 ${
            uiStyle === 'classic'
              ? 'border-amber-800/20 bg-amber-50/40 font-serif'
              : darkMode ? 'border-slate-800/60 bg-slate-950/20' : 'border-slate-100 bg-slate-50/40'
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
                  <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 shadow-md transition duration-300 transform group-hover:scale-105 ${
                    uiStyle === 'classic'
                      ? 'bg-amber-800 ring-amber-700/30'
                      : 'bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-500 ring-orange-400/30'
                  }`}>
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
                  <h3 className={`font-bold text-sm tracking-tight truncate ${
                    uiStyle === 'classic' ? 'text-amber-900 font-serif' : darkMode ? 'text-white' : 'text-slate-800'
                  }`}>
                    {currentUser.name}
                  </h3>
                  <p className={`text-[11px] font-medium truncate mt-0.5 ${
                    uiStyle === 'classic' ? 'text-amber-800/80' : darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
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
                className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition shadow-lg border-none cursor-pointer ${
                  uiStyle === 'classic'
                    ? 'bg-amber-800 hover:bg-amber-950 shadow-amber-800/25'
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
                }`}
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
                className={`w-full pl-10 pr-9 py-2 rounded-full text-xs transition duration-300 focus:outline-none focus:ring-2 ${
                  uiStyle === 'classic'
                    ? 'bg-amber-50/50 border border-amber-800/30 text-amber-900 placeholder-amber-800/40 focus:ring-amber-500/30 focus:border-amber-800'
                    : darkMode
                      ? 'bg-[#151c2c] border border-slate-800/80 text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30'
                      : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500/50 focus:ring-blue-500/30'
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
                      <span className={uiStyle === 'classic' ? 'text-amber-800 font-serif' : darkMode ? 'text-slate-400' : 'text-slate-500'}>
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
                      <span className={uiStyle === 'classic' ? 'text-amber-800 font-serif' : darkMode ? 'text-slate-400' : 'text-slate-500'}>
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
                      <span className={uiStyle === 'classic' ? 'text-amber-800 font-serif' : darkMode ? 'text-slate-400' : 'text-slate-500'}>
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
                      <span className={uiStyle === 'classic' ? 'text-amber-800 font-serif' : darkMode ? 'text-slate-400' : 'text-slate-500'}>
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
            <div className={`px-4 py-2 shrink-0 border-t ${
              uiStyle === 'classic'
                ? 'border-amber-800/10 bg-amber-50/10'
                : darkMode ? 'border-slate-800/40 bg-slate-950/20' : 'border-slate-100 bg-slate-50/40'
            }`}>
              <div 
                onClick={() => {
                  onClose();
                  onOpenGoogleSync();
                }}
                className={`p-3.5 rounded-2xl border-2 border-dashed transition cursor-pointer text-center space-y-1.5 group ${
                  isGoogleConnected
                    ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : uiStyle === 'classic'
                      ? 'border-amber-800/30 bg-amber-50/20 hover:bg-amber-100/50'
                      : darkMode
                        ? 'border-slate-800 bg-[#121824]/30 hover:bg-[#121824]/50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    uiStyle === 'classic' ? 'text-amber-900 font-serif' : darkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {isGoogleConnected ? 'Google Sheets เชื่อมต่อแล้ว' : 'ซิงค์ข้อมูล Google Sheets'}
                  </h4>
                  <p className={`text-[9px] mt-0.5 ${
                    uiStyle === 'classic' ? 'text-amber-800/60' : darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    e-Fleet Database Cloud Synchronization
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Preferences, Theme Toggle & Status */}
          <div className={`p-4 border-t space-y-3 shrink-0 ${
            uiStyle === 'classic'
              ? 'border-amber-800/20 bg-amber-50/10'
              : darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/30'
          }`}>
            {/* Pill Theme Toggle */}
            {onToggleDarkMode && (
              <div className={`p-1 rounded-full flex items-center border ${
                uiStyle === 'classic'
                  ? 'bg-amber-50/50 border-amber-800/20'
                  : darkMode 
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
                    uiStyle === 'classic'
                      ? 'bg-amber-50 text-amber-800 border-amber-800/20 hover:bg-amber-100/50'
                      : darkMode 
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
            uiStyle === 'classic'
              ? 'border-amber-800/20 bg-amber-50/20 font-serif'
              : darkMode ? 'border-slate-800/40 bg-slate-950/80' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <div className={`text-[10px] font-bold ${
              uiStyle === 'classic' ? 'text-amber-900' : darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              สำนักงานวัฒนธรรมจังหวัดพังงา
            </div>
            <div className="text-[9px] text-slate-400/80 mt-0.5">
              e-Fleet Platform v2.6.0
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
