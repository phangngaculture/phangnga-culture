import React, { useState, useMemo } from 'react';
import { BookingRequest, Vehicle } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  MapPin,
  Car,
  User as UserIcon,
  Eye,
  Filter,
  Search,
  Grid,
  List,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  CalendarDays,
  Fuel,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

interface CalendarViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  onSelectBookingForView: (b: BookingRequest) => void;
  onOpenBookingForm: (date?: string, carId?: string) => void;
}

const THAI_MONTHS_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAY_NAMES = [
  { short: 'อา.', full: 'อาทิตย์', color: 'text-rose-600', bg: 'bg-rose-50/50' },
  { short: 'จ.', full: 'จันทร์', color: 'text-amber-600', bg: 'bg-amber-50/50' },
  { short: 'อ.', full: 'อังคาร', color: 'text-pink-600', bg: 'bg-pink-50/50' },
  { short: 'พ.', full: 'พุธ', color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
  { short: 'พฤ.', full: 'พฤหัสบดี', color: 'text-orange-600', bg: 'bg-orange-50/50' },
  { short: 'ศ.', full: 'ศุกร์', color: 'text-blue-600', bg: 'bg-blue-50/50' },
  { short: 'ส.', full: 'เสาร์', color: 'text-purple-600', bg: 'bg-purple-50/50' }
];

type CalendarViewMode = 'month' | 'timeline' | 'agenda';

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  vehicles,
  onSelectBookingForView,
  onOpenBookingForm
}) => {
  // Current month & year: default to September 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-09-05');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const setToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8);
    setSelectedDateStr('2026-09-02');
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Vehicle Filter
      if (selectedVehicleFilter !== 'all' && b.carId !== selectedVehicleFilter) {
        return false;
      }
      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'approved' && b.status !== 'approved' && b.status !== 'completed' && b.status !== 'in_progress') return false;
        if (statusFilter === 'pending' && b.status !== 'pending' && b.status !== 'pending_director') return false;
        if (statusFilter === 'in_progress' && b.status !== 'in_progress') return false;
      }
      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchPurpose = b.purpose?.toLowerCase().includes(q);
        const matchDest = b.destination?.toLowerCase().includes(q);
        const matchUser = b.name?.toLowerCase().includes(q);
        const matchCar = b.carName?.toLowerCase().includes(q);
        const matchPlate = b.carPlate?.toLowerCase().includes(q);
        if (!matchPurpose && !matchDest && !matchUser && !matchCar && !matchPlate) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, selectedVehicleFilter, statusFilter, searchQuery]);

  // Selected Day Bookings
  const selectedDayBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.date === selectedDateStr);
  }, [filteredBookings, selectedDateStr]);

  // Monthly stats
  const currentMonthBookings = useMemo(() => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const prefix = `${currentYear}-${mStr}`;
    return bookings.filter((b) => b.date.startsWith(prefix));
  }, [bookings, currentMonth, currentYear]);

  const stats = useMemo(() => {
    const total = currentMonthBookings.length;
    const approved = currentMonthBookings.filter(
      (b) => b.status === 'approved' || b.status === 'completed' || b.status === 'in_progress'
    ).length;
    const pending = currentMonthBookings.filter(
      (b) => b.status === 'pending' || b.status === 'pending_director'
    ).length;
    const activeToday = bookings.filter((b) => b.date === '2026-09-02' && (b.status === 'in_progress' || b.status === 'approved')).length;

    return { total, approved, pending, activeToday };
  }, [currentMonthBookings, bookings]);

  // Map vehicle id to vehicle object
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Header Banner & Quick Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Background Decorative Gradient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100/40 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left: Title & Subtitle */}
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>ปฏิทินตารางภารกิจ & การใช้รถยนต์ราชการ</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200/80">
                    พ.ศ. {currentYear + 543}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สำนักงานวัฒนธรรมจังหวัดพังงา — วางแผน ควบคุม และติดตามการเดินทางราชการแบบเรียลไทม์
                </p>
              </div>
            </div>
          </div>

          {/* Right: View Mode Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* View Mode Toggle */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex items-center space-x-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-orange-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>รายเดือน</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-orange-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ตารางรถ (Timeline)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white text-orange-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>รายการวาระ</span>
              </button>
            </div>

            {/* Quick Request Button */}
            <button
              type="button"
              onClick={() => onOpenBookingForm(selectedDateStr)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-orange-600/25 flex items-center space-x-2 cursor-pointer card-3d-hover"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ ยื่นขอใช้รถล่วงหน้า</span>
            </button>
          </div>
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50/80 hover:bg-white rounded-2xl p-3 border border-slate-200/80 transition-all shadow-2xs card-3d-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">ภารกิจเดือนนี้</span>
              <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                <CalendarIcon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">รวมทุกคันในสังกัด</div>
          </div>

          <div className="bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-3 border border-emerald-200/70 transition-all shadow-2xs card-3d-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800">อนุมัติแล้ว</span>
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-black text-emerald-900 mt-1 font-mono">{stats.approved}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">พร้อมเดินทางตามกำหนด</div>
          </div>

          <div className="bg-amber-50/50 hover:bg-amber-50 rounded-2xl p-3 border border-amber-200/70 transition-all shadow-2xs card-3d-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800">รออนุมัติ</span>
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-black text-amber-900 mt-1 font-mono">{stats.pending}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">รอ ผอ. ลงนาม</div>
          </div>

          <div className="bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-3 border border-blue-200/70 transition-all shadow-2xs card-3d-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-800">ภารกิจวันนี้</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
            </div>
            <div className="text-xl font-black text-blue-900 mt-1 font-mono">{stats.activeToday}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">กำลังปฏิบัติหน้าที่</div>
          </div>
        </div>
      </div>

      {/* 2. Month Selector & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Month Switcher Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl bg-white shadow-2xs hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-700 transition cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 flex items-center space-x-1.5 min-w-[150px] justify-center">
              <CalendarIcon className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-bold text-slate-900">
                {THAI_MONTHS_NAMES[currentMonth]} {currentYear + 543}
              </span>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl bg-white shadow-2xs hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-700 transition cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={setToday}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center space-x-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>วันนี้</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาภารกิจ / ปลายทาง / ผู้ขอ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Vehicle Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-xs font-medium cursor-pointer"
            >
              <option value="all">รถทุกคัน ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plate})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-xs font-medium cursor-pointer"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="approved">อนุมัติแล้ว / เสร็จสิ้น</option>
              <option value="pending">รออนุมัติ</option>
              <option value="in_progress">กำลังปฏิบัติงาน</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: Switch between View Modes */}
      
      {/* MODE A: MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Calendar Month Matrix (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4">
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {WEEKDAY_NAMES.map((wd, i) => (
                <div
                  key={i}
                  className={`py-2 rounded-xl text-xs font-bold ${wd.color} ${wd.bg} border border-slate-200/60 shadow-2xs`}
                >
                  <span className="hidden sm:inline">{wd.full}</span>
                  <span className="sm:hidden">{wd.short}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month Inactive Days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                const dayNum = prevMonthDays - firstDayOfMonth + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    className="bg-slate-50/50 rounded-2xl min-h-[100px] p-2 border border-dashed border-slate-200/60 opacity-40 select-none flex flex-col justify-between"
                  >
                    <span className="text-xs font-medium text-slate-400">{dayNum}</span>
                  </div>
                );
              })}

              {/* Current Month Active Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayStr = String(day).padStart(2, '0');
                const mStr = String(currentMonth + 1).padStart(2, '0');
                const dateKey = `${currentYear}-${mStr}-${dayStr}`;

                const isSelected = dateKey === selectedDateStr;
                const isToday = dateKey === '2026-09-02';
                const dayEvents = filteredBookings.filter((b) => b.date === dateKey);
                const hasPending = dayEvents.some((b) => b.status === 'pending' || b.status === 'pending_director');
                const hasApproved = dayEvents.some((b) => b.status === 'approved' || b.status === 'in_progress');

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[105px] relative group select-none card-3d-hover ${
                      isSelected
                        ? 'bg-gradient-to-b from-orange-50/90 to-amber-50/70 border-2 border-orange-500 shadow-md shadow-orange-500/15'
                        : isToday
                        ? 'bg-gradient-to-b from-blue-50/80 to-indigo-50/50 border-2 border-blue-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs hover:border-orange-300'
                    }`}
                  >
                    {/* Date Number and Indicators */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <span
                          className={`text-xs font-black rounded-lg px-2 py-0.5 transition ${
                            isSelected
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : isToday
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-800 group-hover:text-orange-600'
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold text-blue-700 hidden sm:inline">วันนี้</span>
                        )}
                      </div>

                      {/* Event Count Badge */}
                      {dayEvents.length > 0 && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs ${
                            hasPending
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Preview Chips */}
                    <div className="my-1.5 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const vObj = vehicleMap.get(ev.carId);
                        const carColor = vObj?.colorTag || '#f97316';
                        const isApproved = ev.status === 'approved' || ev.status === 'completed';

                        return (
                          <div
                            key={ev.id}
                            className={`text-[9.5px] px-1.5 py-0.8 rounded-lg truncate font-semibold flex items-center space-x-1 border shadow-2xs ${
                              isApproved
                                ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80'
                                : ev.status === 'in_progress'
                                ? 'bg-blue-50/90 text-blue-900 border-blue-200/80'
                                : 'bg-amber-50/90 text-amber-900 border-amber-200/80'
                            }`}
                            title={`${ev.purpose} | ${ev.destination} (${ev.carName})`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: carColor }}
                            />
                            <span className="truncate">{ev.destination || ev.purpose}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-bold text-center bg-slate-100 rounded-md py-0.5">
                          +{dayEvents.length - 2} งานเพิ่มเติม
                        </div>
                      )}
                    </div>

                    {/* Quick Add Hover Trigger */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(dateKey);
                          onOpenBookingForm(dateKey);
                        }}
                        className="text-[10px] text-orange-600 font-bold hover:text-orange-700 flex items-center space-x-0.5"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">จอง</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>อนุมัติแล้ว/พร้อมเดินทาง</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>รอการอนุมัติ</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>กำลังปฏิบัติงาน</span>
                </div>
              </div>

              <div className="text-slate-400">
                คลิกที่วันที่เพื่อตรวจสอบวาระ หรือกด <span className="font-bold text-orange-600">+ ยื่นขอใช้รถ</span>
              </div>
            </div>
          </div>

          {/* Right: Selected Day Inspector & Mission Hub (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4 sticky top-20">
              
              {/* Header with Thai Date */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>วาระภารกิจประจำวัน</span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 mt-1">
                    {formatThaiDate(selectedDateStr, 'full')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    มีภารกิจทั้งหมด <b className="text-slate-900">{selectedDayBookings.length}</b> รายการ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenBookingForm(selectedDateStr)}
                  className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer card-3d-hover"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>ขอใช้รถวันนี้</span>
                </button>
              </div>

              {/* Mission List */}
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayBookings.length === 0 ? (
                  <div className="p-8 bg-slate-50/80 rounded-2xl text-center space-y-3 border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100/60 text-orange-600 flex items-center justify-center mx-auto">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">ไม่มีการจองรถในวันนี้</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        รถยนต์ราชการทุกคันว่างและพร้อมรับคำขอใช้รถสำหรับวันดังกล่าว
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenBookingForm(selectedDateStr)}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>สร้างคำขอใช้รถในวันนี้ &rarr;</span>
                    </button>
                  </div>
                ) : (
                  selectedDayBookings.map((b) => {
                    const vObj = vehicleMap.get(b.carId);
                    const statusClass =
                      b.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-900 border-blue-300 aura-blue'
                        : b.status === 'completed'
                        ? 'bg-teal-100 text-teal-900 border-teal-300'
                        : b.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 aura-emerald'
                        : b.status === 'rejected'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300 aura-amber';

                    const statusText =
                      b.status === 'in_progress'
                        ? 'กำลังวิ่งงาน'
                        : b.status === 'completed'
                        ? 'เสร็จสิ้น/ลงคุมแล้ว'
                        : b.status === 'approved'
                        ? 'อนุมัติแล้ว'
                        : b.status === 'rejected'
                        ? 'ไม่อนุมัติ'
                        : 'รอ ผอ. อนุมัติ';

                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-orange-400 transition-all shadow-2xs hover:shadow-xs space-y-3 relative overflow-hidden card-3d-hover"
                      >
                        {/* Accent Bar */}
                        <div
                          className="absolute top-0 left-0 bottom-0 w-1.5"
                          style={{ backgroundColor: vObj?.colorTag || '#f97316' }}
                        />

                        {/* Top: ID & Status */}
                        <div className="flex justify-between items-center pl-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                              {b.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {b.name}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusClass}`}>
                            {statusText}
                          </span>
                        </div>

                        {/* Purpose & Destination */}
                        <div className="pl-1">
                          <h4 className="font-bold text-xs text-slate-900 leading-snug">{b.purpose}</h4>
                          <div className="flex items-center space-x-1.5 text-xs text-orange-700 font-semibold mt-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="truncate">{b.destination}</span>
                          </div>
                        </div>

                        {/* Vehicle & Time Grid */}
                        <div className="pl-1 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px]">ยานพาหนะ:</span>
                            <div className="mt-0.5">
                              <span className="thai-license-badge text-[10px]">
                                {b.carPlate || vObj?.plate || b.carName}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">เวลาเดินทาง:</span>
                            <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{b.startTime || '08:30'} - {b.endTime || '16:30'} น.</span>
                            </span>
                          </div>
                        </div>

                        {/* Footer Details & Action */}
                        <div className="pl-1 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{b.passengers?.length || 1} คน</span>
                            </span>
                            <span className="flex items-center space-x-1 truncate max-w-[120px]">
                              <UserIcon className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{b.driverName || 'พขร. ประจำ'}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectBookingForView(b)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-bold rounded-lg text-[11px] transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>ดูใบเบิก</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODE B: VEHICLE FLEET TIMELINE (GANTT VIEW) */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <span>ตารางไทม์ไลน์การใช้รถยนต์ราชการ (Fleet Gantt Timeline)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบความพร้อมและการติดภารกิจของรถแต่ละคันตลอดทั้งเดือน {THAI_MONTHS_NAMES[currentMonth]} {currentYear + 543}
              </p>
            </div>
          </div>

          {/* Timeline Table with Horizontal Scroll */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[1000px]">
              
              {/* Day Header Row */}
              <div className="grid grid-cols-[220px_repeat(31,_minmax(28px,_1fr))] gap-1 pb-2 border-b border-slate-200 text-center font-bold text-[11px]">
                <div className="text-left pl-3 text-slate-500 font-semibold">ยานพาหนะ</div>
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayStr = String(day).padStart(2, '0');
                  const mStr = String(currentMonth + 1).padStart(2, '0');
                  const dateKey = `${currentYear}-${mStr}-${dayStr}`;
                  const isSelected = dateKey === selectedDateStr;
                  const isToday = dateKey === '2026-09-02';

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDateStr(dateKey)}
                      className={`py-1 rounded-lg cursor-pointer transition text-xs ${
                        isSelected
                          ? 'bg-orange-600 text-white font-black shadow-2xs'
                          : isToday
                          ? 'bg-blue-600 text-white font-black'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title={formatThaiDate(dateKey, 'short')}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Vehicle Rows */}
              <div className="space-y-3 mt-3">
                {vehicles.map((v) => {
                  const vBookings = filteredBookings.filter((b) => b.carId === v.id);

                  return (
                    <div
                      key={v.id}
                      className="grid grid-cols-[220px_repeat(31,_minmax(28px,_1fr))] gap-1 items-center bg-slate-50/70 hover:bg-slate-50 p-2.5 rounded-2xl border border-slate-200 transition-all card-3d-hover"
                    >
                      {/* Vehicle Identity */}
                      <div className="text-left pr-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: v.colorTag || '#f97316' }}
                          />
                          <h4 className="font-bold text-xs text-slate-900 truncate" title={v.name}>
                            {v.name}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="thai-license-badge text-[9px] py-0.2 px-1">
                            {v.plate}
                          </span>
                          <span className="text-[10px] text-slate-400">{v.seats} ที่นั่ง</span>
                        </div>
                      </div>

                      {/* Day Cells for this Vehicle */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayStr = String(day).padStart(2, '0');
                        const mStr = String(currentMonth + 1).padStart(2, '0');
                        const dateKey = `${currentYear}-${mStr}-${dayStr}`;

                        const booking = vBookings.find((b) => b.date === dateKey);
                        const isSelected = dateKey === selectedDateStr;

                        if (booking) {
                          const isApproved = booking.status === 'approved' || booking.status === 'completed';
                          return (
                            <div
                              key={dateKey}
                              onClick={() => {
                                setSelectedDateStr(dateKey);
                                onSelectBookingForView(booking);
                              }}
                              className={`h-9 rounded-lg flex items-center justify-center cursor-pointer transition shadow-2xs ${
                                isApproved
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                  : booking.status === 'in_progress'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                              } ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
                              title={`${booking.purpose} - ${booking.destination} (${booking.name})`}
                            >
                              <Car className="w-3.5 h-3.5" />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={dateKey}
                            onClick={() => {
                              setSelectedDateStr(dateKey);
                              onOpenBookingForm(dateKey, v.id);
                            }}
                            className={`h-9 rounded-lg border border-transparent hover:border-orange-300 hover:bg-orange-50 flex items-center justify-center cursor-pointer group transition ${
                              isSelected ? 'bg-orange-100/50' : 'bg-white/60'
                            }`}
                            title={`จอง ${v.name} ในวันที่ ${day} ${THAI_MONTHS_NAMES[currentMonth]}`}
                          >
                            <span className="text-[10px] text-slate-300 group-hover:text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition">
                              +
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODE C: AGENDA / MISSION FEED VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <List className="w-5 h-5 text-orange-600" />
                <span>วาระภารกิจและกำหนดการเดินทางทั้งหมด ({filteredBookings.length} รายการ)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เรียงตามลำดับเวลาจากปัจจุบันและอนาคต
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="p-12 bg-slate-50 rounded-2xl text-center space-y-3 border border-dashed border-slate-200">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">ไม่พบภารกิจที่ตรงกับเงื่อนไขการค้นหา</h4>
                <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองยานพาหนะ</p>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const vObj = vehicleMap.get(b.carId);
                const isApproved = b.status === 'approved' || b.status === 'completed';

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-orange-400 transition shadow-2xs hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-3d-hover relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 bottom-0 w-1.5"
                      style={{ backgroundColor: vObj?.colorTag || '#f97316' }}
                    />

                    <div className="flex items-start space-x-4 pl-2">
                      {/* Date Badge */}
                      <div className="bg-slate-100 p-2.5 rounded-xl text-center min-w-[75px] border border-slate-200 shrink-0">
                        <span className="text-[10px] font-bold text-orange-600 block uppercase">
                          {b.date ? b.date.split('-')[1] : '09'}/{b.date ? b.date.split('-')[0] : '2026'}
                        </span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {b.date ? b.date.split('-')[2] : '01'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {b.id}
                          </span>
                          <span className="thai-license-badge text-[10px]">
                            {b.carPlate || vObj?.plate || b.carName}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : b.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {b.status === 'approved' ? 'อนุมัติแล้ว' : b.status === 'in_progress' ? 'กำลังวิ่งงาน' : 'รออนุมัติ'}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900">{b.purpose}</h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                          <span className="flex items-center text-orange-700 font-semibold">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500" />
                            {b.destination}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {b.startTime || '08:30'} - {b.endTime || '16:30'} น.
                          </span>
                          <span className="flex items-center">
                            <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            ผู้ขอ: <b>{b.name}</b> ({b.department})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectBookingForView(b)}
                        className="px-4 py-2 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>เปิดดูใบเบิก</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
