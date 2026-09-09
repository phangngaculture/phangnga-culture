import React, { useState } from 'react';
import { BookingRequest, Vehicle, User } from '../types';
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
  ShieldCheck
} from 'lucide-react';
import { getUserAllowedMenus } from '../data/mockData';

interface DashboardViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  onOpenBookingForm: (date?: string) => void;
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;

  const filteredBookings = bookings.filter((b) => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.carName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      
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
              สำนักงานวัฒนธรรมจังหวัดพังงา — ระบบเขียนใบเบิก ขออนุมัติผ่านระบบอิเล็กทรอนิกส์
              ติดตามตารางภารกิจ ตรวจสอบสถานะรถยนต์ และบันทึกการใช้เชื้อเพลิงครบวงจร
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onOpenBookingForm()}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-orange-600/30 flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เขียนใบเบิกใช้รถ</span>
            </button>

            <button
              onClick={onOpenCalendar}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>ปฏิทินภารกิจ</span>
            </button>

            {onOpenDriverMissions && (
              <button
                onClick={onOpenDriverMissions}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition border border-amber-500 shadow-md shadow-amber-600/30 flex items-center space-x-1.5"
              >
                <Gauge className="w-4 h-4 text-amber-200" />
                <span>ภารกิจคนขับ & ทะเบียนคุม</span>
              </button>
            )}

            <button
              onClick={onOpenFuelForm}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
            >
              <Fuel className="w-4 h-4 text-teal-400" />
              <span>บันทึกไมล์/น้ำมัน</span>
            </button>

            {(currentUser.role === 'director' || currentUser.role === 'admin') && pendingCount > 0 && (
              <button
                onClick={onOpenDirectorApproval}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-teal-600/30 flex items-center space-x-1.5 animate-pulse"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>แผงอนุมัติ ({pendingCount})</span>
              </button>
            )}

            {(currentUser.role === 'admin' || getUserAllowedMenus(currentUser).includes('users')) && onOpenUsers && (
              <button
                onClick={onOpenUsers}
                className="px-3.5 py-2.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-medium transition border border-purple-700/50 flex items-center space-x-1.5"
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
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingCount} รายการ</h3>
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
              {vehicles.filter((v) => v.status === 'available').length} / {vehicles.length} คัน
            </h3>
            <span className="text-[11px] text-teal-700 font-medium">จอดพร้อม ณ สำนักงาน</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Fleet Vehicles Status Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Car className="w-4 h-4 text-orange-600" />
              <span>สถานะรถยนต์ราชการประจำสำนักงานวัฒนธรรมจังหวัดพังงา</span>
            </h3>
            <p className="text-[11px] text-slate-500">ตรวจสอบความพร้อมของยานพาหนะก่อนยื่นคำขอ</p>
          </div>
          <div className="flex items-center space-x-3">
            {onOpenFleet && (
              <button
                onClick={onOpenFleet}
                className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center space-x-1 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200 transition"
              >
                <span>จัดการ/แก้ไขข้อมูลรถ & บำรุงรักษา</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onOpenAnalytics}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-1"
            >
              <span>ดูรายงานเชิงลึก</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {vehicles.map((v) => {
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
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-300 transition space-y-2.5 shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{v.name}</h4>
                    <p className="text-[11px] font-mono text-orange-600 font-bold">{v.plate}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusBadge.class}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>เชื้อเพลิง:</span>
                    <span className="font-medium text-slate-800">{v.fuelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เลขไมล์สะสม:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {v.odometer.toLocaleString()} กม.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>พนักงานขับรถ:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[120px]">{v.driverName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings Table & Filter Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <span>รายการใบเบิกและสถานะคำขอทั้งหมด ({filteredBookings.length})</span>
              </h3>
              {onOpenClearAllBookings && (currentUser.role === 'admin' || currentUser.role === 'director') && bookings.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenClearAllBookings}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                  title="ลบใบคำขอทั้งหมดเพื่อเตรียมเริ่มใช้งานจริง"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>ลบใบคำขอทั้งหมด (เริ่มใช้จริง)</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">คลิกที่รายการเพื่อดูใบคำขอขอใช้รถยนต์ส่วนกลางหรือดำเนินการ</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, ปลายทาง, เลขที่..."
                className="w-full sm:w-60 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รออนุมัติ ({pendingCount})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterStatus === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                อนุมัติแล้ว
              </button>
            </div>
          </div>
        </div>

        {/* Booking Cards List */}
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-medium text-slate-500">ไม่พบรายการใบเบิกตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const isOwner = currentUser.username === b.username || currentUser.name === b.name;
              const isAdmin = currentUser.role === 'admin';
              const isDirector = currentUser.role === 'director';
              const isPending = b.status === 'pending';

              let badge = {
                text: 'รออนุมัติ',
                class: 'bg-amber-100 text-amber-800 border-amber-300'
              };
              if (b.status === 'approved') {
                badge = {
                  text: 'อนุมัติแล้ว (รอเริ่มงาน)',
                  class: 'bg-orange-100 text-orange-800 border-orange-300'
                };
              } else if (b.status === 'in_progress') {
                badge = {
                  text: 'กำลังปฏิบัติหน้าที่ (บนถนน)',
                  class: 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                };
              } else if (b.status === 'completed') {
                badge = {
                  text: 'เสร็จสิ้น & ลงคุมพัสดุแล้ว',
                  class: 'bg-emerald-100 text-emerald-800 border-emerald-300'
                };
              } else if (b.status === 'rejected') {
                badge = {
                  text: 'ไม่อนุมัติ',
                  class: 'bg-rose-100 text-rose-800 border-rose-300'
                };
              }

              return (
                <div
                  key={b.id}
                  className="p-4 bg-slate-50 hover:bg-orange-50/20 border border-slate-200 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition shadow-2xs"
                >
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">{b.id}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${badge.class}`}>
                        {badge.text}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {formatThaiDate(b.date, 'short')}
                      </span>
                      {b.startTime && (
                        <span className="text-[11px] text-slate-500 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {b.startTime} - {b.endTime || 'เสร็จสิ้น'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                      {b.purpose}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      <span className="flex items-center text-orange-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500" />
                        {b.destination}
                      </span>
                      <span className="flex items-center text-slate-700">
                        <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        ผู้ขอ: <b>{b.name}</b> ({b.department})
                      </span>
                      <span className="flex items-center text-teal-700">
                        <Car className="w-3.5 h-3.5 mr-1 text-teal-600" />
                        รถ: <b>{b.carName}</b>
                      </span>
                    </div>

                    {b.directorComment && (
                      <div className="text-[11px] italic text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                        ความเห็น ผอ.: &ldquo;{b.directorComment}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-0 border-slate-200">
                    <button
                      onClick={() => onViewMemo(b)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition shadow-2xs flex items-center space-x-1"
                      title="ดูและพิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-600" />
                      <span>ใบคำขอใช้รถ</span>
                    </button>

                    {onOpenDriverMissions && (b.status === 'approved' || b.status === 'in_progress') && (
                      <button
                        onClick={onOpenDriverMissions}
                        className={`px-3 py-2 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1 ${
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
                        onClick={() => {
                          if (onOpenSignatureModal) {
                            onOpenSignatureModal(b);
                          } else {
                            onOpenDirectorApproval();
                          }
                        }}
                        className="px-3 py-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>ลงนามอนุมัติ</span>
                      </button>
                    )}

                    {(isOwner || isAdmin) && isPending && (
                      <>
                        <button
                          onClick={() => onEditBooking(b)}
                          className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-medium transition"
                          title="แก้ไขใบเบิก"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteBooking(b.id)}
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-medium transition"
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

    </div>
  );
};
