import React, { useState, useMemo, useEffect } from 'react';
import { BookingRequest, Vehicle, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  canUserExecuteMission,
  getMissionPermissionDetails,
  isSelfDriveBooking
} from '../utils/driverPermissions';
import { StartMissionModal } from './StartMissionModal';
import { CompleteMissionModal } from './CompleteMissionModal';
import { PrintOfficialRegisterModal } from './PrintOfficialRegisterModal';
import {
  Car,
  Gauge,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Flag,
  Calendar,
  User as UserIcon,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Download,
  Eye,
  Fuel,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Users,
  Lock
} from 'lucide-react';

interface DriverMissionViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  allUsers?: User[];
  initialTargetBookingId?: string | null;
  onClearInitialTargetBooking?: () => void;
  onUpdateBooking: (updated: BookingRequest) => void;
  onUpdateVehicleOdometer?: (carId: string, newOdometer: number) => void;
  onViewMemo: (booking: BookingRequest) => void;
  onNavigateToTracking?: () => void;
}

export const DriverMissionView: React.FC<DriverMissionViewProps> = ({
  bookings,
  vehicles,
  currentUser,
  allUsers,
  initialTargetBookingId,
  onClearInitialTargetBooking,
  onUpdateBooking,
  onUpdateVehicleOdometer,
  onViewMemo,
  onNavigateToTracking
}) => {
  // Main view tabs: 'missions' | 'asset_register'
  const [activeSubTab, setActiveSubTab] = useState<'missions' | 'asset_register'>('missions');
  
  // Status filter for missions
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Missions that current user has authority to execute (as assigned driver or self-drive requester)
  const myExecutableMissions = useMemo(() => {
    return bookings.filter((b) => canUserExecuteMission(b, currentUser, allUsers));
  }, [bookings, currentUser, allUsers]);

  const hasMyMissions = myExecutableMissions.length > 0;

  // Smart initial driver filter:
  // - Driver role: default to their name or my_missions
  // - Regular officer who has executable missions: default to my_missions
  // - Admin/Director without personal mission: default to 'all'
  const initialDriverFilter = useMemo(() => {
    if (currentUser.role === 'driver') {
      return 'my_missions';
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'director' && hasMyMissions) {
      return 'my_missions';
    }
    return 'all';
  }, [currentUser.role, hasMyMissions]);

  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>(initialDriverFilter);

  // Asset register vehicle filter
  const [registerVehicleFilter, setRegisterVehicleFilter] = useState<string>('all');

  // Modals state
  const [selectedBookingForStart, setSelectedBookingForStart] = useState<BookingRequest | null>(null);
  const [selectedBookingForComplete, setSelectedBookingForComplete] = useState<BookingRequest | null>(null);
  const [isPrintRegisterOpen, setIsPrintRegisterOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-open target booking if specified from dashboard navigation
  useEffect(() => {
    if (initialTargetBookingId) {
      const target = bookings.find((b) => b.id === initialTargetBookingId);
      if (target && canUserExecuteMission(target, currentUser, allUsers)) {
        if (target.status === 'approved') {
          setSelectedBookingForStart(target);
        } else if (target.status === 'in_progress') {
          setSelectedBookingForComplete(target);
        }
      }
      onClearInitialTargetBooking?.();
    }
  }, [initialTargetBookingId, bookings, currentUser, allUsers, onClearInitialTargetBooking]);

  // Unique driver names for filter
  const availableDrivers = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.driverName && b.driverName !== 'ไม่ระบุ' && !b.driverName.includes('ยังไม่ระบุ')) {
        set.add(b.driverName);
      }
    });
    if (currentUser.role === 'driver') set.add(currentUser.name);
    return Array.from(set);
  }, [bookings, currentUser]);

  // Filtered missions for Driver view
  const driverMissions = useMemo(() => {
    return bookings.filter((b) => {
      // Driver filter
      let matchDriver = true;
      if (selectedDriverFilter === 'my_missions') {
        matchDriver = canUserExecuteMission(b, currentUser, allUsers);
      } else if (selectedDriverFilter !== 'all') {
        matchDriver =
          b.driverName === selectedDriverFilter ||
          (currentUser.role === 'driver' && b.driverName?.includes(currentUser.name));
      }

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'ready_to_start') {
        matchStatus = b.status === 'approved';
      } else if (statusFilter === 'in_progress') {
        matchStatus = b.status === 'in_progress';
      } else if (statusFilter === 'completed') {
        matchStatus = b.status === 'completed';
      } else if (statusFilter !== 'all') {
        matchStatus = b.status === statusFilter;
      }

      // Search query
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.memoNo?.toLowerCase().includes(q) ||
        b.purpose.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.carName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q);

      return matchDriver && matchStatus && matchSearch;
    });
  }, [bookings, selectedDriverFilter, statusFilter, searchQuery, currentUser, allUsers]);

  // KPIs
  const readyCount = bookings.filter((b) => b.status === 'approved').length;
  const inProgressCount = bookings.filter((b) => b.status === 'in_progress').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const totalKmSum = bookings.reduce((sum, b) => sum + (b.totalDistance || 0), 0);

  // Safe opening handlers with validation
  const handleOpenStartModal = (b: BookingRequest) => {
    const perm = getMissionPermissionDetails(b, currentUser, allUsers);
    if (!perm.canExecute) {
      alert(perm.reason || 'ท่านไม่มีสิทธิ์เริ่มงานสำหรับใบคำขอนี้');
      return;
    }
    setSelectedBookingForStart(b);
  };

  const handleOpenCompleteModal = (b: BookingRequest) => {
    const perm = getMissionPermissionDetails(b, currentUser, allUsers);
    if (!perm.canExecute) {
      alert(perm.reason || 'ท่านไม่มีสิทธิ์บันทึกจบภารกิจสำหรับใบคำขอนี้');
      return;
    }
    setSelectedBookingForComplete(b);
  };

  // Handlers for starting and completing mission
  const handleStartMission = (
    bookingId: string,
    startMileage: number,
    departureTime: string,
    notes: string
  ) => {
    const b = bookings.find((item) => item.id === bookingId);
    if (!b) return;

    if (!canUserExecuteMission(b, currentUser, allUsers)) {
      alert('ท่านไม่มีสิทธิ์เริ่มงานสำหรับใบคำขอนี้');
      return;
    }

    const updated: BookingRequest = {
      ...b,
      status: 'in_progress',
      startMileage,
      startMileageTime: departureTime,
      actualDepartureTime: departureTime,
      driverNotes: notes ? notes : b.driverNotes
    };

    onUpdateBooking(updated);
    setSelectedBookingForStart(null);

    // Show toast
    setSuccessToast(`เริ่มงานสำเร็จ! บันทึกไมล์ตอนไป ${startMileage.toLocaleString()} กม. (สถานะ: กำลังปฏิบัติภารกิจ)`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleCompleteMission = (
    bookingId: string,
    data: {
      endMileage: number;
      actualReturnTime: string;
      totalDistance: number;
      fuelRefilledLiters?: number;
      fuelRefilledCost?: number;
      fuelStation?: string;
      fuelReceiptNo?: string;
      driverNotes?: string;
      tripRating?: string;
    }
  ) => {
    const b = bookings.find((item) => item.id === bookingId);
    if (!b) return;

    if (!canUserExecuteMission(b, currentUser, allUsers)) {
      alert('ท่านไม่มีสิทธิ์บันทึกจบภารกิจสำหรับใบคำขอนี้');
      return;
    }

    const nowIso = new Date().toISOString();
    const updated: BookingRequest = {
      ...b,
      status: 'completed',
      endMileage: data.endMileage,
      endMileageTime: data.actualReturnTime,
      actualReturnTime: data.actualReturnTime,
      totalDistance: data.totalDistance,
      fuelRefilledLiters: data.fuelRefilledLiters,
      fuelRefilledCost: data.fuelRefilledCost,
      fuelStation: data.fuelStation,
      fuelReceiptNo: data.fuelReceiptNo,
      driverNotes: data.driverNotes,
      tripRating: data.tripRating,
      registeredInAssetControl: true,
      assetControlRecordedAt: nowIso
    };

    onUpdateBooking(updated);

    // Also update vehicle's odometer
    if (onUpdateVehicleOdometer && b.carId) {
      onUpdateVehicleOdometer(b.carId, data.endMileage);
    }

    setSelectedBookingForComplete(null);

    // Show toast
    setSuccessToast(
      `ภารกิจเสร็จสิ้นเรียบร้อย! ไมล์กลับ ${data.endMileage.toLocaleString()} กม. (ระยะทาง ${data.totalDistance} กม.) บันทึกเข้าสมุดทะเบียนคุมของเจ้าหน้าที่พัสดุแล้ว`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // CSV Export for Asset Control Register
  const handleExportCSV = () => {
    const registeredList = bookings.filter(
      (b) => b.status === 'completed' || b.registeredInAssetControl || b.startMileage
    );

    if (registeredList.length === 0) {
      alert('ยังไม่มีข้อมูลภารกิจที่บันทึกเลขไมล์เพื่อส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'เลขที่ใบเบิก',
      'วันที่เดินทาง',
      'รถยนต์และทะเบียน',
      'ผู้ขอใช้รถ',
      'สังกัดกลุ่มงาน',
      'สถานที่ไปราชการ',
      'วัตถุประสงค์',
      'เวลาออกเดินทาง',
      'เวลากลับถึงสำนักงาน',
      'เลขไมล์ตอนไป (กม.)',
      'เลขไมล์ตอนกลับ (กม.)',
      'ระยะทางรวม (กม.)',
      'น้ำมันเติม (ลิตร)',
      'ค่าน้ำมัน (บาท)',
      'สถานีบริการน้ำมัน',
      'พนักงานขับรถ',
      'สถานะทะเบียนคุมพัสดุ'
    ];

    const rows = registeredList.map((b, idx) => [
      idx + 1,
      `"${b.memoNo || b.id}"`,
      `"${b.date}"`,
      `"${b.carName}"`,
      `"${b.name}"`,
      `"${b.department}"`,
      `"${b.destination.replace(/"/g, '""')}"`,
      `"${b.purpose.replace(/"/g, '""')}"`,
      `"${b.actualDepartureTime || b.startTime || ''}"`,
      `"${b.actualReturnTime || b.endTime || ''}"`,
      b.startMileage || '',
      b.endMileage || '',
      b.totalDistance || '',
      b.fuelRefilledLiters || '',
      b.fuelRefilledCost || '',
      `"${b.fuelStation || ''}"`,
      `"${b.driverName || ''}"`,
      b.status === 'completed' || b.registeredInAssetControl ? 'ลงทะเบียนคุมแล้ว' : 'อยู่ระหว่างเดินทาง'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ทะเบียนคุมการใช้รถยนต์ราชการ_พังงา_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Success Toast */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-white/80 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-amber-900/30">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Car className="w-3.5 h-3.5" />
              <span>ระบบงานพนักงานขับรถยนต์ & ทะเบียนคุมงานพัสดุ</span>
              <span className="text-amber-400">|</span>
              <span>สำนักงานวัฒนธรรมจังหวัดพังงา</span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              ศูนย์ปฏิบัติภารกิจคนขับรถ & ทะเบียนคุมการใช้รถยนต์ราชการ
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              สำหรับพนักงานขับรถเริ่มงาน กรอกไมล์ตอนไป เมื่อเสร็จสิ้นภารกิจกรอกไมล์ตอนกลับ 
              ข้อมูลทั้งหมดจะถูกประมวลผลและส่งลงบันทึกใน <strong>สมุดทะเบียนคุมของเจ้าหน้าที่พัสดุ</strong> โดยอัตโนมัติตามระเบียบราชการ
            </p>
          </div>

          {/* Quick Stats Grid - Interactive Shortcut Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* Card 1: รอเริ่มงาน (อนุมัติแล้ว) */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('missions');
                setStatusFilter(statusFilter === 'ready_to_start' ? 'all' : 'ready_to_start');
              }}
              title="คลิกทางลัด: กรองดูเฉพาะรายการที่รอเริ่มงาน"
              className={`rounded-2xl p-3 border text-center transition-all cursor-pointer group hover:scale-[1.03] active:scale-95 ${
                activeSubTab === 'missions' && statusFilter === 'ready_to_start'
                  ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20'
                  : 'bg-white/10 hover:bg-white/20 border-white/10'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wide">รอเริ่มงาน</span>
                <span className="text-[9px] opacity-0 group-hover:opacity-100 transition text-amber-200">🔍</span>
              </div>
              <span className="text-xl font-bold text-white mt-0.5 block">{readyCount}</span>
              <span className="text-[9px] text-slate-300 group-hover:text-amber-200 block">
                อนุมัติแล้ว {statusFilter === 'ready_to_start' ? '✓ (กำลังกรอง)' : '• คลิกดู'}
              </span>
            </button>

            {/* Card 2: กำลังวิ่งงาน (อยู่บนถนน) */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('missions');
                setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress');
              }}
              title="คลิกทางลัด: กรองดูเฉพาะรายการที่กำลังวิ่งงานอยู่บนถนน"
              className={`rounded-2xl p-3 border text-center transition-all cursor-pointer group hover:scale-[1.03] active:scale-95 ${
                activeSubTab === 'missions' && statusFilter === 'in_progress'
                  ? 'bg-amber-500/40 border-amber-300 ring-2 ring-amber-300 shadow-lg shadow-amber-500/30 animate-none'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/30 animate-pulse'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wide">กำลังวิ่งงาน</span>
                <span className="text-[9px] opacity-0 group-hover:opacity-100 transition text-amber-200">🔍</span>
              </div>
              <span className="text-xl font-bold text-amber-300 mt-0.5 block">{inProgressCount}</span>
              <span className="text-[9px] text-amber-200/90 group-hover:text-amber-100 block">
                อยู่บนถนน {statusFilter === 'in_progress' ? '✓ (กำลังกรอง)' : '• คลิกดู'}
              </span>
            </button>

            {/* Card 3: เสร็จสิ้นแล้ว (ลงทะเบียนคุมแล้ว) */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('missions');
                setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed');
              }}
              title="คลิกทางลัด: กรองดูเฉพาะภารกิจที่เสร็จสิ้นแล้ว"
              className={`rounded-2xl p-3 border text-center transition-all cursor-pointer group hover:scale-[1.03] active:scale-95 ${
                activeSubTab === 'missions' && statusFilter === 'completed'
                  ? 'bg-emerald-500/40 border-emerald-400 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wide">เสร็จสิ้นแล้ว</span>
                <span className="text-[9px] opacity-0 group-hover:opacity-100 transition text-emerald-200">🔍</span>
              </div>
              <span className="text-xl font-bold text-emerald-300 mt-0.5 block">{completedCount}</span>
              <span className="text-[9px] text-emerald-200/90 group-hover:text-emerald-100 block">
                ลงทะเบียนคุมแล้ว {statusFilter === 'completed' ? '✓ (กำลังกรอง)' : '• คลิกดู'}
              </span>
            </button>

            {/* Card 4: ระยะทางรวม (กิโลเมตร) */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('asset_register');
              }}
              title="คลิกทางลัด: เปิดดูสมุดทะเบียนคุมของเจ้าหน้าที่พัสดุและรายการระยะทางทั้งหมด"
              className={`rounded-2xl p-3 border text-center transition-all cursor-pointer group hover:scale-[1.03] active:scale-95 ${
                activeSubTab === 'asset_register'
                  ? 'bg-teal-500/30 border-teal-400 ring-2 ring-teal-400 shadow-lg shadow-teal-500/30'
                  : 'bg-white/10 hover:bg-white/20 border-white/10'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wide">ระยะทางรวม</span>
                <span className="text-[9px] opacity-0 group-hover:opacity-100 transition text-teal-300">📖</span>
              </div>
              <span className="text-xl font-bold text-white mt-0.5 block">{totalKmSum.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 group-hover:text-teal-200 block">
                กิโลเมตร {activeSubTab === 'asset_register' ? '✓ (เปิดทะเบียนคุม)' : '• คลิกดูสมุด'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('missions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'missions'
                ? 'bg-white text-orange-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4 text-orange-600" />
            <span>ภารกิจคนขับรถ ({bookings.length})</span>
            {inProgressCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('asset_register')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'asset_register'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>สมุดทะเบียนคุมของเจ้าหน้าที่พัสดุ</span>
            <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              งานพัสดุ
            </span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPrintRegisterOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
            title="พิมพ์แบบฟอร์มทะเบียนคุมทางการ A4"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            <span>พิมพ์ทะเบียนคุม A4</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
            title="ดาวน์โหลดไฟล์ CSV สำหรับ Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DRIVER MISSIONS WORKFLOW */}
      {activeSubTab === 'missions' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({bookings.length})
              </button>

              <button
                onClick={() => setStatusFilter('ready_to_start')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1 ${
                  statusFilter === 'ready_to_start'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>รอเริ่มงาน ({readyCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1 ${
                  statusFilter === 'in_progress'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>กำลังปฏิบัติหน้าที่ ({inProgressCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>เสร็จสิ้น & ลงคุมแล้ว ({completedCount})</span>
              </button>
            </div>

            {/* Driver Filter & Search */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedDriverFilter}
                  onChange={(e) => setSelectedDriverFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none py-1"
                >
                  <option value="all">คนขับรถทุกคน (ทั้งหมด)</option>
                  {hasMyMissions && (
                    <option value="my_missions" className="font-bold text-orange-700">
                      ⭐ ภารกิจของฉัน / ขับเอง ({myExecutableMissions.length})
                    </option>
                  )}
                  {availableDrivers.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-grow md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาภารกิจ/สถานที่..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                />
              </div>
            </div>
          </div>

          {/* Missions Cards List */}
          {driverMissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Car className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">ไม่พบรายการภารกิจที่ตรงตามเงื่อนไข</h3>
              <p className="text-xs text-slate-500">
                ลองปรับตัวกรองสถานะ หรือเปลี่ยนตัวเลือกคนขับรถ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {driverMissions.map((b) => {
                const isReadyToStart = b.status === 'approved';
                const isInProgress = b.status === 'in_progress';
                const isCompleted = b.status === 'completed';
                const vehicle = vehicles.find((v) => v.id === b.carId);

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 shadow-xs hover:shadow-md ${
                      isInProgress
                        ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10'
                        : isReadyToStart
                        ? 'border-orange-200 hover:border-orange-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      
                      {/* Left: Mission Info */}
                      <div className="space-y-2 flex-grow">
                        
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {b.id}
                          </span>

                          {/* Dynamic Status Badge */}
                          {isInProgress ? (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                              <span>กำลังปฏิบัติภารกิจ (อยู่บนถนน)</span>
                            </span>
                          ) : isReadyToStart ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
                              <Play className="w-3 h-3 text-orange-600" />
                              <span>อนุมัติแล้ว — พร้อมกดเริ่มงาน</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>เสร็จสิ้นภารกิจ & ลงทะเบียนคุมแล้ว</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {b.status}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {formatThaiDate(b.date, 'short')}
                          </span>

                          {(b.startTime || b.actualDepartureTime) && (
                            <span className="text-[11px] text-slate-500 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {b.actualDepartureTime || b.startTime} - {b.actualReturnTime || b.endTime || 'เสร็จสิ้น'}
                            </span>
                          )}
                        </div>

                        {/* Title & Purpose */}
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {b.purpose}
                        </h3>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                          <div className="flex items-center text-orange-700 font-medium">
                            <MapPin className="w-4 h-4 mr-1.5 text-orange-500 shrink-0" />
                            <span className="truncate">{b.destination}</span>
                          </div>

                          <div className="flex items-center text-teal-800 font-medium">
                            <Car className="w-4 h-4 mr-1.5 text-teal-600 shrink-0" />
                            <span className="truncate">{b.carName}</span>
                          </div>

                          <div className="flex items-center text-slate-700">
                            <UserIcon className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                            <span>พนักงานขับรถ: <strong>{b.driverName || 'ไม่ระบุ'}</strong></span>
                          </div>
                        </div>

                        {/* Departure & Return Mileage Live Tag */}
                        {(b.startMileage || b.endMileage) && (
                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            {b.startMileage && (
                              <div className="inline-flex items-center space-x-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl text-xs font-semibold text-orange-900">
                                <Gauge className="w-3.5 h-3.5 text-orange-600" />
                                <span>ไมล์ตอนไป: <strong>{b.startMileage.toLocaleString()} กม.</strong></span>
                                {b.actualDepartureTime && (
                                  <span className="text-orange-600 font-normal">({b.actualDepartureTime} น.)</span>
                                )}
                              </div>
                            )}

                            {b.endMileage && (
                              <div className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-900">
                                <Flag className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ไมล์ตอนกลับ: <strong>{b.endMileage.toLocaleString()} กม.</strong></span>
                                {b.actualReturnTime && (
                                  <span className="text-emerald-600 font-normal">({b.actualReturnTime} น.)</span>
                                )}
                              </div>
                            )}

                            {b.totalDistance ? (
                              <div className="inline-flex items-center space-x-1 bg-slate-900 text-white px-2.5 py-1 rounded-xl text-xs font-bold">
                                <span>ระยะทางรวม: +{b.totalDistance} กม.</span>
                              </div>
                            ) : null}

                            {b.fuelRefilledLiters ? (
                              <div className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl text-xs">
                                <Fuel className="w-3 h-3 text-amber-600" />
                                <span>เติมน้ำมัน: {b.fuelRefilledLiters} ล. ({b.fuelRefilledCost} บ.)</span>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {b.driverNotes && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 inline-block">
                            บันทึกคนขับ: &ldquo;{b.driverNotes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Right: Driver Action Workflow Button */}
                      <div className="flex flex-row lg:flex-col items-stretch sm:items-end gap-2 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        
                        {/* CASE 1: READY TO START -> START MISSION BUTTON */}
                        {isReadyToStart && (
                          canUserExecuteMission(b, currentUser, allUsers) ? (
                            <button
                              onClick={() => handleOpenStartModal(b)}
                              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                            >
                              <Play className="w-4 h-4 fill-white" />
                              <span>กดเริ่มงาน (กรอกไมล์ไป)</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {isSelfDriveBooking(b)
                                  ? `รอผู้ขอใช้รถ (${b.name}) กดเริ่มงาน`
                                  : b.driverName && b.driverName !== 'ไม่ระบุ' && !b.driverName.includes('ยังไม่ระบุ')
                                  ? `รอ ${b.driverName} กดเริ่มงาน`
                                  : 'ยังไม่ระบุพนักงานขับรถ'}
                              </span>
                            </div>
                          )
                        )}

                        {/* CASE 2: IN PROGRESS -> COMPLETE MISSION BUTTON */}
                        {isInProgress && (
                          canUserExecuteMission(b, currentUser, allUsers) ? (
                            <button
                              onClick={() => handleOpenCompleteModal(b)}
                              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 animate-bounce cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>ขับเสร็จแล้ว (กรอกไมล์กลับ)</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                              <Car className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>
                                {isSelfDriveBooking(b)
                                  ? `กำลังขับขี่โดย ${b.name}`
                                  : `กำลังปฏิบัติงานโดย ${b.driverName || 'ผู้ขับรถ'}`}
                              </span>
                            </div>
                          )
                        )}

                        {/* CASE 3: COMPLETED -> REGISTERED BADGE */}
                        {isCompleted && (
                          <button
                            onClick={() => setActiveSubTab('asset_register')}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ดูในทะเบียนคุมพัสดุ</span>
                          </button>
                        )}

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onViewMemo(b)}
                            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition flex items-center space-x-1"
                            title="ดูใบคำขอขอใช้รถยนต์ส่วนกลาง"
                          >
                            <Eye className="w-3.5 h-3.5 text-orange-600" />
                            <span>ดูใบคำขอ</span>
                          </button>

                          {isInProgress && onNavigateToTracking && (
                            <button
                              onClick={onNavigateToTracking}
                              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-medium transition"
                              title="เปิด GPS ติดตามสด"
                            >
                              <span>GPS Live</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFICIAL ASSET CONTROL REGISTER (สมุดทะเบียนคุมของเจ้าหน้าที่พัสดุ) */}
      {activeSubTab === 'asset_register' && (
        <div className="space-y-4">
          
          {/* Header Info Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>งานพัสดุและยานพาหนะ ฝ่ายบริหารทั่วไป</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  สมุดทะเบียนคุมการใช้รถยนต์ราชการ (Official Vehicle Control Register)
                </h2>
                <p className="text-xs text-slate-500">
                  บันทึกการใช้รถยนต์ส่วนกลาง เลขไมล์ ระยะทาง และการใช้น้ำมันเชื้อเพลิง สำหรับตรวจรับงานพัสดุ
                </p>
              </div>

              {/* Filter by Vehicle */}
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
                <Car className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">เลือกรถ:</span>
                <select
                  value={registerVehicleFilter}
                  onChange={(e) => setRegisterVehicleFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="all">รถยนต์ทุกคันในสังกัด (All)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.plate}>
                      {v.name} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Register Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-3 text-center w-12">ลำดับ</th>
                    <th className="p-3">วัน เดือน ปี</th>
                    <th className="p-3">เลขที่ใบเบิก</th>
                    <th className="p-3">รถยนต์ / ทะเบียน</th>
                    <th className="p-3">ผู้ขอใช้รถ / สังกัด</th>
                    <th className="p-3">สถานที่ไปราชการ</th>
                    <th className="p-3 text-center">เวลาไป-กลับ</th>
                    <th className="p-3 text-right">ไมล์ไป</th>
                    <th className="p-3 text-right">ไมล์กลับ</th>
                    <th className="p-3 text-right">ระยะทาง (กม.)</th>
                    <th className="p-3 text-center">น้ำมันที่เติม</th>
                    <th className="p-3">พนักงานขับรถ</th>
                    <th className="p-3 text-center">สถานะตรวจรับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {bookings
                    .filter(
                      (b) =>
                        (registerVehicleFilter === 'all' || b.carName.includes(registerVehicleFilter)) &&
                        (b.status === 'completed' || b.status === 'in_progress' || b.startMileage)
                    )
                    .map((b, idx) => {
                      const kmDriven = b.totalDistance || (b.endMileage && b.startMileage ? b.endMileage - b.startMileage : 0);
                      return (
                        <tr key={b.id} className="hover:bg-teal-50/20 transition">
                          <td className="p-3 text-center font-mono font-medium text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-medium text-slate-900 whitespace-nowrap">
                            {formatThaiDate(b.date, 'short')}
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {b.memoNo || b.id}
                          </td>
                          <td className="p-3 font-semibold text-teal-900">
                            {b.carName}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 block">{b.name}</span>
                            <span className="text-[10px] text-slate-500">{b.department}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800 truncate max-w-xs">{b.destination}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">{b.purpose}</div>
                          </td>
                          <td className="p-3 text-center font-mono text-[11px] whitespace-nowrap">
                            <span className="text-slate-700">{b.actualDepartureTime || b.startTime || '-'}</span>
                            <span className="text-slate-400 mx-1">&rarr;</span>
                            <span className="text-slate-700">{b.actualReturnTime || b.endTime || '-'}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-slate-800">
                            {b.startMileage ? b.startMileage.toLocaleString() : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-slate-800">
                            {b.endMileage ? b.endMileage.toLocaleString() : (b.status === 'in_progress' ? 'กำลังวิ่ง' : '-')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50">
                            {kmDriven > 0 ? `+${kmDriven.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            {b.fuelRefilledLiters ? (
                              <span className="inline-block bg-amber-50 text-amber-900 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                                {b.fuelRefilledLiters} ลิตร ({b.fuelRefilledCost} บ.)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-700">
                            {b.driverName || '-'}
                          </td>
                          <td className="p-3 text-center">
                            {b.status === 'completed' || b.registeredInAssetControl ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>ลงคุมเรียบร้อย</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <span>อยู่ระหว่างภารกิจ</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Registry Footer Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="text-slate-600 flex items-center space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  ข้อมูลในตารางนี้อัปเดตอัตโนมัติเมื่อพนักงานขับรถกรอกไมล์ไปและไมล์กลับเสร็จสิ้น
                </span>
              </div>

              <div className="flex items-center space-x-3 font-semibold text-slate-800">
                <span>ระยะทางสะสม: <strong className="text-emerald-700 font-mono text-sm">{totalKmSum.toLocaleString()} กม.</strong></span>
                <span className="text-slate-300">|</span>
                <span>จำนวนภารกิจลงคุม: <strong className="text-teal-700 font-mono text-sm">{completedCount} รายการ</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Mission Modal */}
      {selectedBookingForStart && (
        <StartMissionModal
          booking={selectedBookingForStart}
          vehicle={vehicles.find((v) => v.id === selectedBookingForStart.carId)}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setSelectedBookingForStart(null)}
          onConfirmStart={handleStartMission}
        />
      )}

      {/* Complete Mission Modal */}
      {selectedBookingForComplete && (
        <CompleteMissionModal
          booking={selectedBookingForComplete}
          vehicle={vehicles.find((v) => v.id === selectedBookingForComplete.carId)}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setSelectedBookingForComplete(null)}
          onConfirmComplete={handleCompleteMission}
        />
      )}

      {/* Print Official Register Sheet Modal */}
      {isPrintRegisterOpen && (
        <PrintOfficialRegisterModal
          bookings={bookings}
          vehicles={vehicles}
          filterCarPlate={registerVehicleFilter}
          onClose={() => setIsPrintRegisterOpen(false)}
        />
      )}
    </div>
  );
};
