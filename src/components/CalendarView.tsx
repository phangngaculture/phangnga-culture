import React, { useState } from 'react';
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
  User,
  Eye,
  Filter
} from 'lucide-react';

interface CalendarViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  onSelectBookingForView: (b: BookingRequest) => void;
  onOpenBookingForm: (date?: string) => void;
}

const THAI_MONTHS_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  vehicles,
  onSelectBookingForView,
  onOpenBookingForm
}) => {
  // Current month & year: default to September 2026 (or today)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-09-05');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');

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
    const today = new Date();
    // Default or sync with 2026
    setCurrentYear(2026);
    setCurrentMonth(8);
    setSelectedDateStr('2026-09-02');
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const filteredBookings = bookings.filter((b) => {
    if (selectedVehicleFilter === 'all') return true;
    return b.carId === selectedVehicleFilter;
  });

  const selectedDayBookings = filteredBookings.filter((b) => b.date === selectedDateStr);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              ปฏิทินตารางภารกิจและการใช้งานรถยนต์ราชการ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            สำนักงานวัฒนธรรมจังหวัดพังงา — คลิกเลือกวันที่เพื่อดูรายละเอียดหรือยื่นคำขอใช้รถล่วงหน้า
          </p>
        </div>

        {/* Controls: Vehicle Filter & Month Navigation */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Vehicle Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-xs font-medium cursor-pointer"
            >
              <option value="all">รถทุกคันในสำนักงาน</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg bg-white shadow-2xs hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-700 transition"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 text-slate-800 min-w-[120px] text-center">
              {THAI_MONTHS_NAMES[currentMonth]} {currentYear + 543}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg bg-white shadow-2xs hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-700 transition"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={setToday}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            วันนี้
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Selected Day Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="text-rose-600">อาทิตย์</div>
            <div>จันทร์</div>
            <div>อังคาร</div>
            <div>พุธ</div>
            <div>พฤหัสบดี</div>
            <div>ศุกร์</div>
            <div className="text-blue-600">เสาร์</div>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset boxes for month start */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`blank-${idx}`} className="bg-slate-50/40 rounded-xl min-h-[90px] border border-transparent" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayStr = String(day).padStart(2, '0');
              const mStr = String(currentMonth + 1).padStart(2, '0');
              const dateKey = `${currentYear}-${mStr}-${dayStr}`;

              const isSelected = dateKey === selectedDateStr;
              const isToday = dateKey === '2026-09-02';

              const dayEvents = filteredBookings.filter((b) => b.date === dateKey);

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={`p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between min-h-[95px] relative group ${
                    isSelected
                      ? 'bg-orange-50/90 border-2 border-orange-500 shadow-sm'
                      : isToday
                      ? 'bg-blue-50/50 border-blue-400'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                        isSelected
                          ? 'bg-orange-600 text-white'
                          : isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event markers */}
                  <div className="mt-1 space-y-1 overflow-hidden max-h-[50px]">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const isApproved = ev.status === 'approved';
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium flex items-center space-x-1 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                          title={`${ev.purpose} (${ev.carName})`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span className="truncate">{ev.purpose}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-400 text-center font-medium">
                        +{dayEvents.length - 2} รายการอื่น
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Date Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 sticky top-24">
          
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">ภารกิจประจำวัน</div>
              <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                {formatThaiDate(selectedDateStr, 'full')}
              </h3>
            </div>
            <button
              onClick={() => onOpenBookingForm(selectedDateStr)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>ขอใช้รถวันนี้</span>
            </button>
          </div>

          {/* List of missions on this date */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {selectedDayBookings.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl text-center space-y-2 border border-dashed border-slate-200">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">ไม่มีรายการจองรถในวันที่เลือก</p>
                <button
                  onClick={() => onOpenBookingForm(selectedDateStr)}
                  className="text-xs text-orange-600 font-semibold hover:underline"
                >
                  คลิกเพื่อขอใช้รถในวันนี้ &rarr;
                </button>
              </div>
            ) : (
              selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs hover:border-orange-300 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-800">{b.id}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        b.status === 'in_progress'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : b.status === 'completed'
                          ? 'bg-teal-100 text-teal-800 border-teal-300'
                          : b.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : b.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {b.status === 'in_progress'
                        ? 'กำลังวิ่งงาน'
                        : b.status === 'completed'
                        ? 'เสร็จสิ้น/ลงคุมแล้ว'
                        : b.status === 'approved'
                        ? 'อนุมัติแล้ว'
                        : b.status === 'rejected'
                        ? 'ไม่อนุมัติ'
                        : 'รออนุมัติ'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-900">{b.purpose}</p>

                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center text-orange-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500 shrink-0" />
                      <span className="truncate">{b.destination}</span>
                    </div>
                    <div className="flex items-center">
                      <Car className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span>{b.carName}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span>ผู้ขอ: <b>{b.name}</b></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => onSelectBookingForView(b)}
                      className="text-orange-600 hover:text-orange-700 font-medium text-[11px] flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูใบคำขอใช้รถ</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
