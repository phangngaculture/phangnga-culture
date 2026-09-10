import React, { useState } from 'react';
import { BookingRequest, Vehicle, User, DashboardSubView } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  Car,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Calendar,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  MapPin,
  User as UserIcon,
  Fuel,
  ArrowUpRight,
  Users,
  Gauge,
  ShieldCheck,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Building2,
  XCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getUserAllowedMenus } from '../data/mockData';

interface DashboardViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  subView?: DashboardSubView;
  onSubViewChange?: (subView: DashboardSubView) => void;
  onOpenBookingForm: (date?: string, carId?: string) => void;
  onOpenFuelForm: () => void;
  onOpenCalendar: () => void;
  onOpenAnalytics: () => void;
  onOpenFleet?: () => void;
  onOpenUsers?: () => void;
  onOpenDriverMissions?: () => void;
  onOpenAssetInspection?: () => void;
  onViewMemo: (booking: BookingRequest) => void;
  onEditBooking: (booking: BookingRequest) => void;
  onDeleteBooking: (bookingId: string) => void;
  onOpenDirectorApproval: () => void;
  onOpenSignatureModal?: (booking: BookingRequest) => void;
  onOpenClearAllBookings?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  vehicles,
  currentUser,
  subView = 'overview',
  onSubViewChange,
  onOpenBookingForm,
  onOpenFuelForm,
  onOpenCalendar,
  onOpenAnalytics,
  onOpenFleet,
  onOpenUsers,
  onOpenDriverMissions,
  onViewMemo,
  onEditBooking,
  onDeleteBooking,
  onOpenDirectorApproval,
  onOpenSignatureModal,
  onOpenClearAllBookings
}) => {
  // Local subview state fallback if not controlled externally
  const [internalSubView, setInternalSubView] = useState<DashboardSubView>(subView || 'overview');
  const currentSubView = subView !== undefined ? subView : internalSubView;

  const handleSubViewChange = (newView: DashboardSubView) => {
    setInternalSubView(newView);
    if (onSubViewChange) {
      onSubViewChange(newView);
    }
  };

  // Booking list filters and search
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Vehicle list filters and search
  const [vehicleFilterStatus, setVehicleFilterStatus] = useState<string>('all');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');

  // Calculate high-level counts and statistics
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const pendingDirectorCount = bookings.filter((b) => b.status === 'pending_director').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const inProgressCount = bookings.filter((b) => b.status === 'in_progress').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;

  const availableVehiclesCount = vehicles.filter((v) => v.status === 'available').length;
  const inMissionVehiclesCount = vehicles.filter((v) => v.status === 'in_mission').length;
  const maintenanceVehiclesCount = vehicles.filter((v) => v.status === 'maintenance').length;

  // Filter and safely sort bookings
  const filteredBookings = bookings.filter((b) => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchSearch =
      b.id.toLowerCase().includes(query) ||
      b.name.toLowerCase().includes(query) ||
      b.purpose.toLowerCase().includes(query) ||
      b.destination.toLowerCase().includes(query) ||
      b.carName.toLowerCase().includes(query) ||
      (b.memoNo && b.memoNo.toLowerCase().includes(query));
    return matchStatus && matchSearch;
  });

  // Sort filtered bookings safely without mutating original props:
  // 1. Travel date descending (latest date first)
  // 2. If same date, createdAt descending (latest createdAt first)
  // 3. If same, deterministic tie-break by memoNo/id
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    const validTimeA = Number.isNaN(timeA) ? 0 : timeA;
    const validTimeB = Number.isNaN(timeB) ? 0 : timeB;

    if (validTimeB !== validTimeA) {
      return validTimeB - validTimeA;
    }

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const validCreatedA = Number.isNaN(createdA) ? 0 : createdA;
    const validCreatedB = Number.isNaN(createdB) ? 0 : createdB;

    if (validCreatedB !== validCreatedA) {
      return validCreatedB - validCreatedA;
    }

    const keyA = (a.memoNo || a.id || '').trim();
    const keyB = (b.memoNo || b.id || '').trim();
    const keyCmp = keyB.localeCompare(keyA, 'th', { numeric: true });
    if (keyCmp !== 0) return keyCmp;

    return (b.id || '').localeCompare(a.id || '', 'th', { numeric: true });
  });

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchStatus = vehicleFilterStatus === 'all' || v.status === vehicleFilterStatus;
    const query = vehicleSearchQuery.toLowerCase();
    const matchSearch =
      v.name.toLowerCase().includes(query) ||
      v.plate.toLowerCase().includes(query) ||
      v.driverName.toLowerCase().includes(query) ||
      v.fuelType.toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  // Department statistics aggregation
  const departmentCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const dept = b.department || 'ไม่ระบุกลุ่มงาน';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });
  const sortedDepartments: Array<[string, number]> = Object.entries(departmentCounts).sort(
    (a, b) => Number(b[1]) - Number(a[1])
  );

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Sub-item 1: ภาพรวม */}
          <button
            id="subnav-btn-overview"
            type="button"
            onClick={() => handleSubViewChange('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition cursor-pointer ${
              currentSubView === 'overview'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ภาพรวม</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                currentSubView === 'overview'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              KPI & สถิติ
            </span>
          </button>

          {/* Sub-item 2: รายการใบเบิก */}
          <button
            id="subnav-btn-bookings"
            type="button"
            onClick={() => handleSubViewChange('bookings')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition cursor-pointer ${
              currentSubView === 'bookings'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>รายการใบเบิก</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentSubView === 'bookings'
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {bookings.length}
            </span>
          </button>

          {/* Sub-item 3: สถานะรถยนต์ราชการ */}
          <button
            id="subnav-btn-vehicles"
            type="button"
            onClick={() => handleSubViewChange('vehicles')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition cursor-pointer ${
              currentSubView === 'vehicles'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>สถานะรถยนต์ราชการ</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentSubView === 'vehicles'
                  ? 'bg-white/20 text-white'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {availableVehiclesCount}/{vehicles.length} คัน
            </span>
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenBookingForm()}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>เขียนใบเบิกใหม่</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW: ภาพรวม (KPI & สถิติ)                                             */}
      {/* ========================================================================= */}
      {currentSubView === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Welcome Banner Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span>{currentUser.roleTitle}</span>
                  <span className="text-slate-400">|</span>
                  <span>{currentUser.department}</span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  ศูนย์บัญชาการยานพาหนะราชการ (Fleet Management Center)
                </h1>
                <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  สำนักงานวัฒนธรรมจังหวัดพังงา — สรุปภาพรวมการใช้ยานพาหนะราชการ สถิติการเดินทาง
                  และตัวชี้วัดความพร้อมให้บริการประจำปีงบประมาณ 2569
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenBookingForm()}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-orange-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>เขียนใบเบิกใช้รถ</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenCalendar}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>ปฏิทินภารกิจ</span>
                </button>

                {onOpenDriverMissions && (
                  <button
                    type="button"
                    onClick={onOpenDriverMissions}
                    className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition border border-amber-500 shadow-md shadow-amber-600/30 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Gauge className="w-4 h-4 text-amber-200" />
                    <span>ภารกิจคนขับ & ทะเบียนคุม</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenFuelForm}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Fuel className="w-4 h-4 text-teal-400" />
                  <span>บันทึกไมล์/น้ำมัน</span>
                </button>

                {(currentUser.role === 'director' || currentUser.role === 'admin') && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={onOpenDirectorApproval}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-teal-600/30 flex items-center space-x-1.5 animate-pulse cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>แผงอนุมัติ ({pendingCount})</span>
                  </button>
                )}

                {(currentUser.role === 'admin' || getUserAllowedMenus(currentUser).includes('users')) && onOpenUsers && (
                  <button
                    type="button"
                    onClick={onOpenUsers}
                    className="px-3.5 py-2.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-medium transition border border-purple-700/50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-purple-300" />
                    <span>จัดการผู้ใช้ & สิทธิ์</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* KPI Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">ใบเบิกทั้งหมดในระบบ</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCount} รายการ</h3>
                <span className="text-[11px] text-slate-400">ประจำปีงบประมาณ 2569</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">อนุมัติเรียบร้อยแล้ว</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount} รายการ</h3>
                <span className="text-[11px] text-emerald-700 font-medium">พร้อมออกปฏิบัติภารกิจ</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">รอผู้อำนวยการอนุมัติ</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingCount + pendingDirectorCount} รายการ</h3>
                <span className="text-[11px] text-amber-700 font-medium">รอการลงนามคำสั่ง</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">ยานพาหนะพร้อมใช้</p>
                <h3 className="text-2xl font-bold text-teal-700 mt-1">
                  {availableVehiclesCount} / {vehicles.length} คัน
                </h3>
                <span className="text-[11px] text-teal-700 font-medium">จอดพร้อม ณ สำนักงาน</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* สรุปสถิติ (Rich Summary Statistics Panels) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel 1: สัดส่วนสถานะใบคำขอ */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  <h3 className="font-bold text-sm text-slate-900">สรุปสัดส่วนสถานะคำขอ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubViewChange('bookings')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-1"
                >
                  <span>ดูใบเบิก</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {/* Pending */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>รออนุมัติ</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {pendingCount} รายการ ({totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Approved */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>อนุมัติแล้ว</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {approvedCount} รายการ ({totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalCount > 0 ? (approvedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* In Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>กำลังเดินทาง</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {inProgressCount} รายการ ({totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Completed */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span>เสร็จสิ้นภารกิจ</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {completedCount} รายการ ({totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Rejected */}
                {rejectedCount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>ไม่อนุมัติ / ส่งกลับ</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {rejectedCount} รายการ ({totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: สรุปความพร้อมของรถยนต์ราชการ */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-900">สรุปความพร้อมยานพาหนะ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubViewChange('vehicles')}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1"
                >
                  <span>ดูรถทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-[11px] font-medium text-emerald-800">พร้อมใช้งาน</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{availableVehiclesCount}</p>
                  <span className="text-[10px] text-emerald-600">คัน</span>
                </div>

                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                  <p className="text-[11px] font-medium text-orange-800">ปฏิบัติภารกิจ</p>
                  <p className="text-xl font-bold text-orange-700 mt-1">{inMissionVehiclesCount}</p>
                  <span className="text-[10px] text-orange-600">คัน</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <p className="text-[11px] font-medium text-rose-800">ซ่อมบำรุง</p>
                  <p className="text-xl font-bold text-rose-700 mt-1">{maintenanceVehiclesCount}</p>
                  <span className="text-[10px] text-rose-600">คัน</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>รถยนต์ทั้งหมดในสังกัด:</span>
                  <span className="font-bold text-slate-900">{vehicles.length} คัน</span>
                </div>
                <div className="flex justify-between">
                  <span>อัตราความพร้อมใช้งาน:</span>
                  <span className="font-bold text-emerald-700">
                    {vehicles.length > 0 ? Math.round((availableVehiclesCount / vehicles.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSubViewChange('vehicles')}
                className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Car className="w-3.5 h-3.5 text-teal-600" />
                <span>เปิดดูสถานะรถยนต์ราชการรายคัน</span>
              </button>
            </div>

            {/* Panel 3: สถิติการขอใช้รถตามกลุ่มงาน/ฝ่าย */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">การใช้รถตามกลุ่มงาน/ฝ่าย</h3>
                </div>
                <button
                  type="button"
                  onClick={onOpenAnalytics}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
                >
                  <span>วิเคราะห์เต็ม</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 pt-1 max-h-[190px] overflow-y-auto pr-1">
                {sortedDepartments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีข้อมูลการเบิกใช้รถ</p>
                ) : (
                  sortedDepartments.slice(0, 5).map(([dept, count]: [string, number], idx: number) => {
                    const pct = totalCount > 0 ? Math.round((Number(count) / totalCount) * 100) : 0;
                    return (
                      <div key={dept} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 truncate font-medium">{dept}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-bold text-slate-900">{count} ครั้ง</span>
                          <span className="text-[10px] text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onOpenAnalytics}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>รายงานสถิติ & กราฟเปรียบเทียบ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Jump Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => handleSubViewChange('bookings')}
              className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80 hover:border-orange-400 transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition">
                      ไปที่รายการใบเบิกและคัดกรองสถานะ
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ดูรายการใบเบิกทั้งหมด {bookings.length} รายการ ค้นหา และตรวจสอบสถานะคำขอ
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => handleSubViewChange('vehicles')}
              className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 hover:border-teal-400 transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition">
                      ไปที่สถานะรถยนต์ราชการ
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ดูรายละเอียดยานพาหนะทั้ง {vehicles.length} คัน ตรวจสอบเลขไมล์ และความพร้อม
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW: รายการใบเบิก (แสดงเฉพาะรายการใบเบิกและตัวกรองสถานะ)                 */}
      {/* ========================================================================= */}
      {currentSubView === 'bookings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
          {/* Controls Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span>รายการใบเบิกและสถานะคำขอทั้งหมด ({sortedBookings.length} รายการ)</span>
                </h3>
                {onOpenClearAllBookings && (currentUser.role === 'admin' || currentUser.role === 'director') && bookings.length > 0 && (
                  <button
                    type="button"
                    onClick={onOpenClearAllBookings}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                    title="ลบใบคำขอทั้งหมดเพื่อเตรียมเริ่มใช้งานจริง"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>ลบคำขอทั้งหมด (เริ่มใช้จริง)</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                เรียงตามวันเดินทางล่าสุดไว้ด้านบน คัดกรองตามสถานะและค้นหาคำขอได้ทันที
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenBookingForm()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>เขียนใบเบิกใหม่</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่, ผู้ขอ, ปลายทาง, รถ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filters */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({bookings.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  filterStatus === 'pending'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                รออนุมัติ ({pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  filterStatus === 'approved'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                อนุมัติแล้ว ({approvedCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  filterStatus === 'in_progress'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                กำลังเดินทาง ({inProgressCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  filterStatus === 'completed'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}
              >
                เสร็จสิ้น ({completedCount})
              </button>
            </div>
          </div>

          {/* Bookings List Cards */}
          {sortedBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium">ไม่พบรายการใบเบิกตามเงื่อนไขที่ค้นหา</p>
              <p className="text-xs text-slate-400">
                ลองปรับตัวกรองสถานะ หรือกด &quot;เขียนใบเบิกใหม่&quot; เพื่อสร้างคำขอ
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {sortedBookings.map((b) => {
                let statusBadge = {
                  text: 'รออนุมัติ',
                  class: 'bg-amber-100 text-amber-800 border-amber-300'
                };
                if (b.status === 'approved') {
                  statusBadge = {
                    text: 'อนุมัติแล้ว',
                    class: 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  };
                } else if (b.status === 'in_progress') {
                  statusBadge = {
                    text: 'กำลังเดินทาง',
                    class: 'bg-orange-100 text-orange-800 border-orange-300'
                  };
                } else if (b.status === 'completed') {
                  statusBadge = {
                    text: 'เสร็จสิ้นภารกิจ',
                    class: 'bg-teal-100 text-teal-800 border-teal-300'
                  };
                } else if (b.status === 'rejected') {
                  statusBadge = {
                    text: 'ไม่อนุมัติ/ส่งกลับ',
                    class: 'bg-rose-100 text-rose-800 border-rose-300'
                  };
                }

                const isOwner = currentUser.username === b.username;
                const isAdmin = currentUser.role === 'admin';
                const isDirector = currentUser.role === 'director' || isAdmin;
                const isPending = b.status === 'pending' || b.status === 'pending_director';

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50/50 hover:bg-white transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          {b.id}
                        </span>
                        {b.memoNo && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            เลขที่บันทึก: {b.memoNo}
                          </span>
                        )}
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {b.purpose}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center space-x-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.name} ({b.department})</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{b.destination}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.carName}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-orange-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          <span>เดินทาง: {formatThaiDate(b.date)} ({b.startTime} - {b.endTime} น.)</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onViewMemo(b)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                        title="ดูและพิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-600" />
                        <span>ใบคำขอใช้รถ</span>
                      </button>

                      {onOpenDriverMissions && (b.status === 'approved' || b.status === 'in_progress') && (
                        <button
                          type="button"
                          onClick={onOpenDriverMissions}
                          className={`px-3 py-2 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1 cursor-pointer ${
                            b.status === 'in_progress'
                              ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                        >
                          <Gauge className="w-3.5 h-3.5" />
                          <span>{b.status === 'in_progress' ? 'กรอกไมล์กลับ' : 'เริ่มงาน (ไมล์ไป)'}</span>
                        </button>
                      )}

                      {isDirector && isPending && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenSignatureModal) {
                              onOpenSignatureModal(b);
                            } else {
                              onOpenDirectorApproval();
                            }
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>ลงนามอนุมัติ</span>
                        </button>
                      )}

                      {(isOwner || isAdmin) && isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditBooking(b)}
                            className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-medium transition cursor-pointer"
                            title="แก้ไขใบเบิก"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBooking(b.id)}
                            className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-medium transition cursor-pointer"
                            title="ลบคำขอ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW: สถานะรถยนต์ราชการ (แสดงเฉพาะรายการรถยนต์และสถานะรถ)                 */}
      {/* ========================================================================= */}
      {currentSubView === 'vehicles' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Car className="w-5 h-5 text-teal-700" />
                <span>สถานะรถยนต์ราชการประจำสำนักงานวัฒนธรรมจังหวัดพังงา</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบความพร้อมของยานพาหนะ เลขไมล์สะสม และพนักงานขับรถประจำคัน
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              {onOpenFleet && (
                <button
                  type="button"
                  onClick={onOpenFleet}
                  className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center space-x-1 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg border border-cyan-200 transition cursor-pointer"
                >
                  <span>จัดการข้อมูลรถ & ซ่อมบำรุง</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onOpenFuelForm && (
                <button
                  type="button"
                  onClick={onOpenFuelForm}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition cursor-pointer"
                >
                  <Fuel className="w-3.5 h-3.5 text-teal-600" />
                  <span>บันทึกไมล์/น้ำมัน</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Status Filters for Vehicles */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อรถ, ป้ายทะเบียน, คนขับ..."
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
              {vehicleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setVehicleSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setVehicleFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  vehicleFilterStatus === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({vehicles.length})
              </button>

              <button
                type="button"
                onClick={() => setVehicleFilterStatus('available')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  vehicleFilterStatus === 'available'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                พร้อมใช้งาน ({availableVehiclesCount})
              </button>

              <button
                type="button"
                onClick={() => setVehicleFilterStatus('in_mission')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  vehicleFilterStatus === 'in_mission'
                    ? 'bg-orange-600 text-white font-semibold'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                กำลังปฏิบัติภารกิจ ({inMissionVehiclesCount})
              </button>

              <button
                type="button"
                onClick={() => setVehicleFilterStatus('maintenance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  vehicleFilterStatus === 'maintenance'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                ซ่อมบำรุง ({maintenanceVehiclesCount})
              </button>
            </div>
          </div>

          {/* Vehicle Cards Grid */}
          {filteredVehicles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Car className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium">ไม่พบรถยนต์ตามเงื่อนไขที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {filteredVehicles.map((v) => {
                let statusBadge = {
                  text: 'พร้อมใช้งาน',
                  class: 'bg-emerald-100 text-emerald-800 border-emerald-300'
                };
                if (v.status === 'in_mission') {
                  statusBadge = {
                    text: 'กำลังปฏิบัติภารกิจ',
                    class: 'bg-orange-100 text-orange-800 border-orange-300'
                  };
                } else if (v.status === 'maintenance') {
                  statusBadge = {
                    text: 'ซ่อมบำรุง',
                    class: 'bg-rose-100 text-rose-800 border-rose-300'
                  };
                }

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 transition space-y-3.5 shadow-2xs hover:shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                          <p className="text-xs font-mono text-orange-600 font-bold mt-0.5">{v.plate}</p>
                          <span className="text-[10px] text-slate-400 capitalize">{v.type}</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ประเภทเชื้อเพลิง:</span>
                          <span className="font-semibold text-slate-800">{v.fuelType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">เลขไมล์สะสม:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {v.odometer.toLocaleString()} กม.
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">พนักงานขับรถ:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {v.driverName}
                          </span>
                        </div>
                        {v.nextServiceMileage && (
                          <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500">รอบเช็คระยะถัดไป:</span>
                            <span className="font-mono text-slate-700">
                              {v.nextServiceMileage.toLocaleString()} กม.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick action for vehicle */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenBookingForm(undefined, v.id)}
                        disabled={v.status === 'maintenance'}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 cursor-pointer ${
                          v.status === 'available'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
                            : v.status === 'in_mission'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>ขอใช้รถคันนี้</span>
                      </button>

                      {onOpenFleet && (
                        <button
                          type="button"
                          onClick={onOpenFleet}
                          className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                          title="ดูประวัติการซ่อมบำรุง & รายละเอียด"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
