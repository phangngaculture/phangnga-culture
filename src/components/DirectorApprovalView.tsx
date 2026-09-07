import React, { useState } from 'react';
import { BookingRequest, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck,
  FileText,
  Clock,
  MapPin,
  Car,
  User as UserIcon,
  Printer,
  Sparkles,
  MessageSquare,
  PenTool,
  Stamp
} from 'lucide-react';

interface DirectorApprovalViewProps {
  bookings: BookingRequest[];
  currentUser: User;
  onApprove: (bookingId: string, comment: string) => void;
  onOpenSignatureModal?: (booking: BookingRequest, initialComment?: string) => void;
  onReject: (bookingId: string, comment: string) => void;
  onViewMemo: (booking: BookingRequest) => void;
}

const PRESET_DIRECTOR_COMMENTS = [
  'อนุมัติ ให้เดินทางโดยสวัสดิภาพและปฏิบัติตามกฎจราจรและระเบียบราชการอย่างเคร่งครัด',
  'อนุมัติ มอบหมายฝ่ายบริหารทั่วไปและพนักงานขับรถดูแลความพร้อมของยานพาหนะ',
  'อนุมัติ ให้ประสานงานหน่วยงานในพื้นที่ล่วงหน้าเพื่อให้การปฏิบัติภารกิจบรรลุผล',
  'อนุมัติ โดยให้ใช้ความระมัดระวังเป็นพิเศษในช่วงฤดูมรสุม'
];

export const DirectorApprovalView: React.FC<DirectorApprovalViewProps> = ({
  bookings,
  currentUser,
  onApprove,
  onOpenSignatureModal,
  onReject,
  onViewMemo
}) => {
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    pendingBookings[0]?.id || bookings[0]?.id || ''
  );
  const [comment, setComment] = useState<string>(PRESET_DIRECTOR_COMMENTS[0]);

  const currentBooking = bookings.find((b) => b.id === selectedBookingId);

  const handleApprove = () => {
    if (!currentBooking) return;
    if (onOpenSignatureModal) {
      onOpenSignatureModal(currentBooking, comment);
    } else {
      onApprove(currentBooking.id, comment);
    }
  };

  const handleReject = () => {
    if (!currentBooking) return;
    onReject(currentBooking.id, comment || 'ไม่อนุมัติ เนื่องจากยานพาหนะไม่พร้อมหรือติดภารกิจซ้อน');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-teal-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>แผงควบคุมผู้อำนวยการสำนักงาน (Executive Approval)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">
              ระบบพิจารณาและลงนามคำขอใช้รถยนต์ราชการอิเล็กทรอนิกส์
            </h1>
            <p className="text-xs md:text-sm text-teal-100 max-w-2xl leading-relaxed">
              วัฒนธรรมจังหวัดพังงา — ตรวจสอบใบคำขอขอใช้รถยนต์ส่วนกลาง กำหนดข้อสั่งการ
              และลงนามอนุมัติคำขออย่างเป็นทางการ
            </p>
          </div>

          <div className="bg-teal-900/80 px-4 py-3 rounded-2xl border border-teal-700/60 text-right">
            <div className="text-[11px] text-teal-200">คำขอที่รอการพิจารณา</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {pendingBookings.length} <span className="text-xs font-normal text-teal-200">ฉบับ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Approval Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: List of Requests (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-teal-700" />
              <span>รายการคำขอ ({bookings.length})</span>
            </h3>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
              รออนุมัติ: {pendingBookings.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">ไม่มีรายการคำขอในระบบ</div>
            ) : (
              bookings.map((b) => {
                const isSelected = b.id === selectedBookingId;
                const isPending = b.status === 'pending';
                const isApproved = b.status === 'approved';

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBookingId(b.id);
                      if (b.directorComment) setComment(b.directorComment);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 text-xs ${
                      isSelected
                        ? 'bg-teal-900 text-white border-teal-700 shadow-md ring-2 ring-teal-500/40'
                        : isPending
                        ? 'bg-amber-50/50 hover:bg-amber-100/60 border-amber-200 text-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">{b.id}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-teal-800 text-teal-200'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPending ? 'รออนุมัติ' : isApproved ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
                      </span>
                    </div>

                    <p className="font-semibold truncate">{b.purpose}</p>

                    <div
                      className={`text-[11px] truncate ${
                        isSelected ? 'text-teal-200' : 'text-slate-500'
                      }`}
                    >
                      ผู้ขอ: <b>{b.name}</b> ({b.department})
                    </div>

                    <div
                      className={`text-[10px] flex justify-between pt-1 border-t ${
                        isSelected ? 'border-teal-800 text-teal-300' : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>วันที่เดินทาง: {formatThaiDate(b.date, 'short')}</span>
                      <span>{b.carName.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Memo Reading Pane & Approval Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!currentBooking ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium">กรุณาเลือกรายการคำขอทางด้านซ้ายเพื่อเปิดอ่านใบคำขอขอใช้รถยนต์ส่วนกลาง</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              
              {/* Reading Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {currentBooking.id}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        currentBooking.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : currentBooking.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      สถานะ: {currentBooking.status === 'approved' ? 'อนุมัติเรียบร้อย' : 'รอพิจารณา'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">
                    {currentBooking.purpose}
                  </h3>
                </div>

                <button
                  onClick={() => onViewMemo(currentBooking)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-600" />
                  <span>ดูฉบับเต็ม / พิมพ์ A4</span>
                </button>
              </div>

              {/* Memo Preview Box in Sarabun Font */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-h-[420px] overflow-y-auto font-sarabun text-[17px] leading-relaxed shadow-inner">
                <div className="text-center font-bold text-[24px] mb-2">
                  ใบคำขอขอใช้รถยนต์ส่วนกลาง
                </div>

                <div className="border-b border-slate-300 pb-2 mb-2 text-[16px]">
                  <div className="mb-1">
                    <b>ส่วนราชการ:</b> สำนักงานวัฒนธรรมจังหวัดพังงา โทร. 0 7648 1596
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div className="text-left">
                      <b>ที่:</b> พง0032(พิเศษ)/{currentBooking.memoNo ? currentBooking.memoNo.replace(/^พง\s*0030\.1\//, '').replace(/^พง\s*0032\(พิเศษ\)\//, '').replace(/^พง\s*๐๐๓๐\.๑\//, '').replace(/^พง\s*๐๐๓๒\(พิเศษ\)\//, '') : currentBooking.id}
                    </div>
                    <div className="text-right">
                      <b>วันที่:</b> {formatThaiDate(currentBooking.date, 'official')}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-justify indent-8 text-[16px]">
                  <p>
                    <b>เรียน:</b> วัฒนธรรมจังหวัดพังงา
                  </p>
                  <p>
                    ด้วยข้าพเจ้า <span className="font-bold">{currentBooking.name}</span> ตำแหน่ง{' '}
                    <span>{currentBooking.position}</span> มีความจำเป็นต้องเดินทางไปปฏิบัติภารกิจราชการเพื่อ{' '}
                    <span className="font-bold">{currentBooking.purpose}</span> ณ{' '}
                    <span className="font-bold">{currentBooking.destination}</span> ในวันที่{' '}
                    <span className="font-bold">{formatThaiDate(currentBooking.date, 'short')}</span>
                  </p>
                  <p>
                    โดยขออนุมัติใช้รถยนต์ราชการ <span className="font-bold">{currentBooking.carName}</span>{' '}
                    พนักงานขับรถคือ <span className="font-bold">{currentBooking.driverName}</span>{' '}
                    ผู้ร่วมเดินทางรวม {currentBooking.passengerCount} คน
                  </p>
                  <p className="text-right pt-2 font-medium">
                    (ลงชื่อ) {currentBooking.name} (ผู้ขอ)
                  </p>
                </div>
              </div>

              {/* Executive Order / Comment Input */}
              <div className="space-y-3 bg-teal-50/50 border border-teal-200 rounded-2xl p-5">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-teal-700" />
                  <h4 className="font-bold text-xs md:text-sm text-slate-900">
                    ความเห็นและคำสั่งการของผู้อำนวยการ
                  </h4>
                </div>

                {/* Preset Comment Chips */}
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                    เลือกข้อสั่งการมาตรฐานด่วน:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_DIRECTOR_COMMENTS.map((com, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setComment(com)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-lg transition font-medium text-left"
                      >
                        + {com.slice(0, 36)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="พิมพ์ข้อสั่งการ ความเห็น หรือคำแนะนำเพิ่มเติม..."
                    className="w-full bg-white border border-teal-300 rounded-xl p-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                {/* If already approved, show signature and memo shortcut */}
                {currentBooking.status === 'approved' ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>คำขอนี้ได้รับการลงนามอนุมัติเรียบร้อยแล้ว</span>
                      </div>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                        {currentBooking.signatureType === 'draw' ? 'ลายเซ็นสดดิจิทัล' : 'ลายเซ็นอิเล็กทรอนิกส์'}
                      </span>
                    </div>

                    {currentBooking.signatureData ? (
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block">ลายมือชื่อผู้อนุมัติ:</span>
                          <img
                            src={currentBooking.signatureData}
                            alt="ลายเซ็นผู้อนุมัติ"
                            className="h-12 max-w-[200px] object-contain"
                          />
                        </div>
                        <div className="text-right text-[11px] text-emerald-800">
                          <p className="font-bold">{currentBooking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'}</p>
                          <p className="text-[10px] text-slate-500">วัฒนธรรมจังหวัดพังงา</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600">
                        ลงนามโดย: <b>{currentBooking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'}</b>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onViewMemo(currentBooking)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>เปิดดูใบคำขอขอใช้รถยนต์ส่วนกลางฉบับเต็ม / พิมพ์</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Electronic Signature Badge */}
                    <div className="bg-white p-3 rounded-xl border border-teal-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                          อว
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">นางสาวอุไรวรรณ แดงงาม</div>
                          <div className="text-[10px] text-teal-700 font-medium">
                            วัฒนธรรมจังหวัดพังงา (เลือกลายเซ็นสด หรืออิเล็กทรอนิกส์)
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full font-semibold">
                        พร้อมประทับตรารับรอง
                      </span>
                    </div>

                    {/* Approval Action Buttons */}
                    <div className="flex justify-end items-center space-x-3 pt-2">
                      <button
                        onClick={handleReject}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ไม่อนุมัติ / ส่งกลับแก้ไข</span>
                      </button>

                      <button
                        onClick={handleApprove}
                        className="px-6 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-teal-700/25 flex items-center space-x-1.5"
                      >
                        <PenTool className="w-4 h-4" />
                        <span>เลือกลายเซ็น & ลงนามอนุมัติคำขอ</span>
                      </button>
                    </div>
                  </>
                )}

              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
