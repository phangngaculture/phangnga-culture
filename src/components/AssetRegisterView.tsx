import React, { useState, useMemo } from 'react';
import { BookingRequest, Vehicle, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import { PrintOfficialRegisterModal } from './PrintOfficialRegisterModal';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Filter,
  Car,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  ShieldCheck,
  Info,
  Layers,
  Fuel,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface AssetRegisterViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  onViewMemo?: (booking: BookingRequest) => void;
}

export const AssetRegisterView: React.FC<AssetRegisterViewProps> = ({
  bookings,
  vehicles,
  currentUser,
  onViewMemo
}) => {
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isPrintRegisterOpen, setIsPrintRegisterOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Eligible records: completed missions or in-progress missions with start mileage
  const baseRegisterBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'completed' || b.status === 'in_progress' || b.startMileage);
  }, [bookings]);

  // Filtered records
  const filteredBookings = useMemo(() => {
    return baseRegisterBookings.filter((b) => {
      // Vehicle filter
      if (vehicleFilter !== 'all' && !b.carName.includes(vehicleFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'completed' && b.status !== 'completed' && !b.registeredInAssetControl) {
        return false;
      }
      if (statusFilter === 'in_progress' && b.status !== 'in_progress') {
        return false;
      }

      // Date range filter
      if (dateFrom && b.date < dateFrom) {
        return false;
      }
      if (dateTo && b.date > dateTo) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchMemo = (b.memoNo || '').toLowerCase().includes(query) || b.id.toLowerCase().includes(query);
        const matchName = (b.name || '').toLowerCase().includes(query);
        const matchDept = (b.department || '').toLowerCase().includes(query);
        const matchDest = (b.destination || '').toLowerCase().includes(query);
        const matchPurpose = (b.purpose || '').toLowerCase().includes(query);
        const matchDriver = (b.driverName || '').toLowerCase().includes(query);
        const matchCar = (b.carName || '').toLowerCase().includes(query);

        if (!matchMemo && !matchName && !matchDept && !matchDest && !matchPurpose && !matchDriver && !matchCar) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort newest date first, or travel date desc
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [baseRegisterBookings, vehicleFilter, statusFilter, dateFrom, dateTo, searchQuery]);

  // Summary Metrics
  const totalKmSum = useMemo(() => {
    return filteredBookings.reduce((sum, b) => {
      const dist = b.totalDistance || (b.endMileage && b.startMileage ? b.endMileage - b.startMileage : 0);
      return sum + (dist > 0 ? dist : 0);
    }, 0);
  }, [filteredBookings]);

  const totalFuelLitersSum = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + (b.fuelRefilledLiters || 0), 0);
  }, [filteredBookings]);

  const totalFuelCostSum = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + (b.fuelRefilledCost || 0), 0);
  }, [filteredBookings]);

  const completedCount = useMemo(() => {
    return filteredBookings.filter((b) => b.status === 'completed' || b.registeredInAssetControl).length;
  }, [filteredBookings]);

  const inProgressCount = useMemo(() => {
    return filteredBookings.filter((b) => b.status === 'in_progress').length;
  }, [filteredBookings]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'วันเดือนปี',
      'เลขที่ใบเบิก',
      'ยานพาหนะ',
      'ผู้ขอใช้รถ',
      'กลุ่ม/ฝ่าย',
      'สถานที่ไปราชการ',
      'วัตถุประสงค์',
      'เวลาไป',
      'เวลากลับ',
      'ไมล์ไป',
      'ไมล์กลับ',
      'ระยะทาง(กม.)',
      'น้ำมันที่เติม(ลิตร)',
      'ค่าน้ำมัน(บาท)',
      'สถานีบริการน้ำมัน',
      'พนักงานขับรถ',
      'สถานะการตรวจรับ'
    ];

    const rows = filteredBookings.map((b, idx) => {
      const km = b.totalDistance || (b.endMileage && b.startMileage ? b.endMileage - b.startMileage : 0);
      return [
        idx + 1,
        `"${formatThaiDate(b.date, 'short')}"`,
        `"${b.memoNo || b.id}"`,
        `"${b.carName}"`,
        `"${b.name}"`,
        `"${b.department}"`,
        `"${(b.destination || '').replace(/"/g, '""')}"`,
        `"${(b.purpose || '').replace(/"/g, '""')}"`,
        `"${b.actualDepartureTime || b.startTime || '-'}"`,
        `"${b.actualReturnTime || b.endTime || '-'}"`,
        b.startMileage || '',
        b.endMileage || '',
        km > 0 ? km : 0,
        b.fuelRefilledLiters || '',
        b.fuelRefilledCost || '',
        `"${b.fuelStation || '-'}"`,
        `"${b.driverName || '-'}"`,
        `"${b.status === 'completed' || b.registeredInAssetControl ? 'ลงคุมเรียบร้อย' : 'อยู่ระหว่างภารกิจ'}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `สมุดทะเบียนคุมการใช้รถยนต์ราชการ_พังงา_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessToast('ส่งออกไฟล์ CSV ทะเบียนคุมการใช้รถยนต์เรียบร้อยแล้ว');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleResetFilters = () => {
    setVehicleFilter('all');
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>สมุดทะเบียนคุมงานพัสดุและยานพาหนะ</span>
              <span className="text-teal-400">|</span>
              <span>สำนักงานวัฒนธรรมจังหวัดพังงา</span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
              <FileSpreadsheet className="w-6 h-6 text-teal-400 shrink-0" />
              <span>สมุดทะเบียนคุมการใช้รถยนต์ราชการ</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              สมุดทะเบียนคุมการใช้รถยนต์ส่วนกลาง บันทึกประวัติการใช้รถ เลขไมล์ไป-กลับ ระยะทางจริง
              การใช้น้ำมันเชื้อเพลิง และสถานะการตรวจรับงานพัสดุ ตามระเบียบกระทรวงการคลังว่าด้วยการใช้รถราชการ
            </p>
          </div>

          {/* Action Buttons: Print & CSV Export */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setIsPrintRegisterOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-teal-900/40 flex items-center justify-center space-x-2 cursor-pointer border border-teal-400/40"
            >
              <Printer className="w-4 h-4 text-teal-100" />
              <span>พิมพ์สมุดทะเบียนคุม (ราชการ)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer border border-white/20"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>ส่งออก Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-teal-800/40">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-teal-200 font-semibold mb-1">
              <span>รายการทั้งหมด</span>
              <Layers className="w-3.5 h-3.5 text-teal-300" />
            </div>
            <div className="text-xl font-bold text-white font-mono">{filteredBookings.length}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              เสร็จสิ้น {completedCount} | วิ่งอยู่ {inProgressCount}
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-teal-200 font-semibold mb-1">
              <span>ระยะทางรวมทั้งหมด</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono">
              {totalKmSum.toLocaleString()} <span className="text-xs font-normal text-slate-300">กม.</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              เฉลี่ย {filteredBookings.length > 0 ? (totalKmSum / filteredBookings.length).toFixed(1) : 0} กม./เที่ยว
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-teal-200 font-semibold mb-1">
              <span>น้ำมันที่เติมรวม</span>
              <Fuel className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono">
              {totalFuelLitersSum.toLocaleString()} <span className="text-xs font-normal text-slate-300">ลิตร</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">ตามใบเสร็จที่บันทึก</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-teal-200 font-semibold mb-1">
              <span>ค่าน้ำมันรวม</span>
              <span className="text-amber-300 font-mono text-xs">฿</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {totalFuelCostSum.toLocaleString()} <span className="text-xs font-normal text-slate-300">บาท</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">เบิกจ่ายตามจริง</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขที่ใบเบิก, ผู้ขอ, สถานที่, หรือคนขับ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Vehicle Filter */}
          <div className="relative">
            <Car className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">รถยนต์ทุกคัน (All)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.plate}>
                  {v.name} ({v.plate})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="completed">✓ ลงคุมเสร็จสิ้นแล้ว</option>
              <option value="in_progress">⚡ อยู่ระหว่างภารกิจ</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        </div>

        {/* Date Filter Range (Optional Collapsed or Inline) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>ช่วงวันที่:</span>
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400">ถึง</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          {(dateFrom || dateTo || searchQuery || vehicleFilter !== 'all' || statusFilter !== 'all') && (
            <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium ml-auto">
              พบ {filteredBookings.length} รายการจากการค้นหา
            </span>
          )}
        </div>
      </div>

      {/* Main Register Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">
              ตารางบันทึกการใช้รถยนต์ราชการ (Official Logbook)
            </h2>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredBookings.length} รายการ
            </span>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            เรียงลำดับจากภารกิจล่าสุด
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300" />
            <div className="text-sm font-semibold text-slate-700">ไม่พบรายการบันทึกในสมุดทะเบียนคุม</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ยังไม่มีข้อมูลที่ตรงกับเงื่อนไขการค้นหา หรือยังไม่มีภารกิจที่เริ่มกรอกเลขไมล์
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition"
            >
              ล้างเงื่อนไขตัวกรอง
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3 text-center w-12">ลำดับ</th>
                  <th className="p-3">วัน เดือน ปี</th>
                  <th className="p-3">เลขที่ใบเบิก</th>
                  <th className="p-3">รถยนต์ / ทะเบียน</th>
                  <th className="p-3">ผู้ขอใช้รถ / สังกัด</th>
                  <th className="p-3">สถานที่ไปราชการ & ภารกิจ</th>
                  <th className="p-3 text-center">เวลาไป-กลับ</th>
                  <th className="p-3 text-right">ไมล์ไป</th>
                  <th className="p-3 text-right">ไมล์กลับ</th>
                  <th className="p-3 text-right">ระยะทาง (กม.)</th>
                  <th className="p-3 text-center">น้ำมันที่เติม</th>
                  <th className="p-3">พนักงานขับรถ</th>
                  <th className="p-3 text-center">สถานะตรวจรับ</th>
                  <th className="p-3 text-center">เอกสาร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredBookings.map((b, idx) => {
                  const kmDriven = b.totalDistance || (b.endMileage && b.startMileage ? b.endMileage - b.startMileage : 0);
                  const isFinished = b.status === 'completed' || b.registeredInAssetControl;

                  return (
                    <tr key={b.id} className="hover:bg-teal-50/25 transition">
                      <td className="p-3 text-center font-mono font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-medium text-slate-900 whitespace-nowrap">
                        {formatThaiDate(b.date, 'short')}
                      </td>
                      <td className="p-3 font-mono text-slate-700 whitespace-nowrap">
                        {b.memoNo || b.id}
                      </td>
                      <td className="p-3 font-semibold text-teal-900 whitespace-nowrap">
                        {b.carName}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block whitespace-nowrap">{b.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{b.department}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={b.destination}>
                          {b.destination}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={b.purpose}>
                          {b.purpose}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] whitespace-nowrap">
                        <span className="text-slate-700">{b.actualDepartureTime || b.startTime || '-'}</span>
                        <span className="text-slate-400 mx-1">&rarr;</span>
                        <span className="text-slate-700">{b.actualReturnTime || b.endTime || '-'}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {b.startMileage ? b.startMileage.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {b.endMileage ? (
                          b.endMileage.toLocaleString()
                        ) : b.status === 'in_progress' ? (
                          <span className="text-amber-600 font-semibold animate-pulse">กำลังวิ่ง</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40 whitespace-nowrap">
                        {kmDriven > 0 ? `+${kmDriven.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {b.fuelRefilledLiters ? (
                          <span className="inline-block bg-amber-50 text-amber-900 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                            {b.fuelRefilledLiters} ล. ({b.fuelRefilledCost} บ.)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                        {b.driverName || '-'}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {isFinished ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ลงคุมเรียบร้อย</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>อยู่ระหว่างภารกิจ</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {onViewMemo && (
                          <button
                            type="button"
                            onClick={() => onViewMemo(b)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-orange-600 rounded-lg transition"
                            title="ดูใบคำขอขอใช้รถยนต์ส่วนกลาง"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Registry Footer Summary */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="text-slate-600 flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              ข้อมูลทะเบียนคุมเชื่อมต่อกับระบบเริ่มงานและกรอกไมล์ตอนกลับของพนักงานขับรถอัตโนมัติ
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-semibold text-slate-800">
            <span>
              ระยะทางสะสม: <strong className="text-emerald-700 font-mono text-sm">{totalKmSum.toLocaleString()} กม.</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              น้ำมันที่เติม: <strong className="text-amber-700 font-mono text-sm">{totalFuelLitersSum.toLocaleString()} ลิตร</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              ภารกิจลงคุมแล้ว: <strong className="text-teal-700 font-mono text-sm">{completedCount} รายการ</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Print Official Register Sheet Modal */}
      {isPrintRegisterOpen && (
        <PrintOfficialRegisterModal
          bookings={bookings}
          vehicles={vehicles}
          filterCarPlate={vehicleFilter}
          onClose={() => setIsPrintRegisterOpen(false)}
        />
      )}
    </div>
  );
};
