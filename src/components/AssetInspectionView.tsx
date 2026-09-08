import React, { useState, useMemo } from 'react';
import { BookingRequest, Vehicle, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  ShieldCheck,
  Search,
  Filter,
  Car,
  Gauge,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronRight,
  UserCheck,
  Check
} from 'lucide-react';

interface AssetInspectionViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  onOpenInspectionModal: (booking: BookingRequest) => void;
  onViewMemo: (booking: BookingRequest) => void;
}

export const AssetInspectionView: React.FC<AssetInspectionViewProps> = ({
  bookings,
  vehicles,
  currentUser,
  onOpenInspectionModal,
  onViewMemo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_inspection' | 'inspected'>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  // Completed missions ready for or already inspected by logistics officer
  const completedMissions = useMemo(() => {
    return bookings.filter((b) => b.status === 'completed' || b.endMileage);
  }, [bookings]);

  const filteredMissions = useMemo(() => {
    return completedMissions.filter((b) => {
      // Search
      const matchesSearch =
        (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.carName && b.carName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.purpose && b.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.destination && b.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.memoNo && b.memoNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.driverName && b.driverName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Inspection Status
      const isInspected = b.assetInspectionStatus === 'accepted';
      let matchesStatus = true;
      if (statusFilter === 'pending_inspection') {
        matchesStatus = !isInspected;
      } else if (statusFilter === 'inspected') {
        matchesStatus = isInspected;
      }

      // Vehicle
      const matchesVehicle = vehicleFilter === 'all' || b.carName === vehicleFilter;

      return matchesSearch && matchesStatus && matchesVehicle;
    });
  }, [completedMissions, searchTerm, statusFilter, vehicleFilter]);

  const stats = useMemo(() => {
    const total = completedMissions.length;
    const inspected = completedMissions.filter((b) => b.assetInspectionStatus === 'accepted').length;
    const pending = total - inspected;
    return { total, inspected, pending };
  }, [completedMissions]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ระบบงานพัสดุ & ยานพาหนะราชการ</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              ตรวจรับรถเสร็จสิ้นภารกิจ & ลงนามใบบันทึกขอใช้รถ
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 max-w-2xl">
              สำหรับเจ้าหน้าที่พัสดุตรวจสอบเลขไมล์ไป-กลับ สภาพยานพาหนะ และลงลายมือชื่อดิจิทัลรับรองการตรวจรับยานพาหนะ
              ซึ่งจะเชื่อมโยงไปประทับในใบบันทึกข้อความขอใช้รถราชการโดยอัตโนมัติ
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center min-w-[90px]">
              <span className="block text-[11px] text-emerald-200">เสร็จสิ้นภารกิจ</span>
              <span className="text-xl font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3 border border-amber-400/30 text-center min-w-[90px]">
              <span className="block text-[11px] text-amber-200">รอพัสดุตรวจรับ</span>
              <span className="text-xl font-black text-amber-300">{stats.pending}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-3 border border-emerald-400/30 text-center min-w-[90px]">
              <span className="block text-[11px] text-emerald-200">ตรวจรับแล้ว</span>
              <span className="text-xl font-black text-emerald-300">{stats.inspected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตามเลขที่บันทึก, ผู้ขอ, คนขับ, ทะเบียนรถ, ปลายทาง..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('pending_inspection')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'pending_inspection'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รอตรวจรับ ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('inspected')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'inspected'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตรวจรับแล้ว ({stats.inspected})
            </button>
          </div>

          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="all">รถทุกคัน</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mission Cards Grid */}
      {filteredMissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">ไม่พบรายการที่ต้องตรวจรับ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ขณะนี้ไม่มีภารกิจที่ตรงกับเงื่อนไขการค้นหา หรือพนักงานขับรถยังไม่ได้ส่งปิดงานภารกิจ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMissions.map((b) => {
            const isInspected = b.assetInspectionStatus === 'accepted';
            const startMile = b.startMileage || 0;
            const endMile = b.endMileage || 0;
            const dist = b.totalDistance || (endMile > startMile ? endMile - startMile : 0);

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isInspected
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : 'border-amber-300 ring-2 ring-amber-400/20 hover:border-amber-400'
                }`}
              >
                {/* Card Top */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {b.memoNo || 'พง ๐๐๓๒(พิเศษ)/-'}
                    </span>
                    {isInspected ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ตรวจรับเรียบร้อย</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>รอเจ้าหน้าที่พัสดุตรวจรับ</span>
                      </span>
                    )}
                  </div>

                  {/* Purpose & Destination */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {b.purpose}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.destination} ({b.destProvince || 'พังงา'})</span>
                    </div>
                  </div>

                  {/* Vehicle & Requester */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ยานพาหนะ:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{b.carName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ผู้ขอใช้รถ:</span>
                      <span className="font-semibold text-slate-800">{b.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">พนักงานขับรถ:</span>
                      <span className="font-semibold text-slate-800">
                        {b.driverType === 'self' ? `${b.name} (ขับเอง)` : (b.driverName || 'พนักงานขับรถ')}
                      </span>
                    </div>
                  </div>

                  {/* Mileage Strip */}
                  <div className="grid grid-cols-3 gap-1.5 bg-emerald-50/50 p-2 rounded-xl border border-emerald-200/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">ไมล์ไป</span>
                      <span className="font-bold text-xs text-blue-900">{startMile.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ไมล์กลับ</span>
                      <span className="font-bold text-xs text-emerald-900">{endMile.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ระยะทางรวม</span>
                      <span className="font-bold text-xs text-indigo-900">{dist.toLocaleString()} กม.</span>
                    </div>
                  </div>

                  {/* Inspection Inspector Details if already done */}
                  {isInspected && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ผู้ตรวจรับ:</span>
                        <span className="font-bold text-emerald-900">{b.assetInspectorName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">ตำแหน่ง:</span>
                        <span className="text-slate-700">{b.assetInspectorPosition}</span>
                      </div>
                      {b.assetInspectionSignature && (
                        <div className="pt-1 flex items-center justify-between border-t border-emerald-200">
                          <span className="text-[10px] text-slate-500">ประทับลายมือชื่อ:</span>
                          <img
                            src={b.assetInspectionSignature}
                            alt="ลายเซ็นตรวจรับ"
                            className="h-6 max-w-[100px] object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between space-x-2">
                  <button
                    onClick={() => onViewMemo(b)}
                    className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center justify-center space-x-1"
                    title="เปิดดูใบบันทึกขอใช้รถราชการฉบับเต็ม"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>ดูใบบันทึก</span>
                  </button>

                  <button
                    onClick={() => onOpenInspectionModal(b)}
                    className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-xs ${
                      isInspected
                        ? 'bg-slate-800 hover:bg-slate-900 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    }`}
                    title="เปิดหน้าตรวจรับและลงลายเซ็น"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isInspected ? 'แก้ไขการตรวจรับ' : 'ลงชื่อตรวจรับรถ'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
