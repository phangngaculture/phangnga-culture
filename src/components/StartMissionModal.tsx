import React, { useState } from 'react';
import { BookingRequest, Vehicle, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import { getMissionPermissionDetails } from '../utils/driverPermissions';
import {
  X,
  Gauge,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  Lock
} from 'lucide-react';

interface StartMissionModalProps {
  booking: BookingRequest;
  vehicle?: Vehicle;
  currentUser?: User;
  allUsers?: User[];
  onClose: () => void;
  onConfirmStart: (
    bookingId: string,
    startMileage: number,
    departureTime: string,
    notes: string,
    checklist: {
      tiresChecked: boolean;
      fluidsChecked: boolean;
      brakesLightsChecked: boolean;
      cleanlinessChecked: boolean;
    }
  ) => void;
}

export const StartMissionModal: React.FC<StartMissionModalProps> = ({
  booking,
  vehicle,
  currentUser,
  allUsers,
  onClose,
  onConfirmStart
}) => {
  // Check driver execution permissions
  const permission = currentUser
    ? getMissionPermissionDetails(booking, currentUser, allUsers)
    : { canExecute: true, driverDisplayName: booking.driverName || 'ผู้ขับรถ', reason: undefined };

  // Suggested current mileage from vehicle or defaults
  const initialMileage = vehicle?.odometer || booking.startMileage || 148520;
  
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const defaultTime = booking.startTime || `${currentHours}:${currentMinutes}`;

  const [startMileage, setStartMileage] = useState<string>(String(initialMileage));
  const [departureTime, setDepartureTime] = useState<string>(defaultTime);
  const [notes, setNotes] = useState<string>('');
  const [checklist, setChecklist] = useState({
    tiresChecked: true,
    fluidsChecked: true,
    brakesLightsChecked: true,
    cleanlinessChecked: true
  });
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser && !permission.canExecute) {
      setErrorMsg(permission.reason || 'ท่านไม่มีสิทธิ์เริ่มงานสำหรับใบคำขอนี้');
      return;
    }

    const mileageNum = parseFloat(startMileage);
    if (isNaN(mileageNum) || mileageNum <= 0) {
      setErrorMsg('กรุณากรอกเลขไมล์ตอนออกเดินทางให้ถูกต้อง (ต้องมากกว่า 0)');
      return;
    }

    if (!departureTime) {
      setErrorMsg('กรุณาระบุเวลาออกเดินทาง');
      return;
    }

    onConfirmStart(booking.id, mileageNum, departureTime, notes, checklist);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-100 uppercase tracking-wider">
                ขั้นตอนที่ 1: ก่อนออกปฏิบัติหน้าที่
              </span>
              <h3 className="text-base font-bold text-white">
                เริ่มงาน & กรอกไมล์ตอนไป
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mission Brief Card */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
              {booking.id}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              วันที่ {formatThaiDate(booking.date, 'short')}
            </span>
          </div>

          <div className="font-semibold text-slate-900 text-sm">
            {booking.purpose}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
            <div className="flex items-center text-orange-700">
              <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500 shrink-0" />
              <span className="truncate">{booking.destination}</span>
            </div>
            <div className="flex items-center text-teal-700">
              <Car className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" />
              <span className="truncate">{booking.carName}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            พนักงานขับรถ: <strong className="text-slate-700">{booking.driverName}</strong> | ผู้ขอ: <strong className="text-slate-700">{booking.name}</strong> ({booking.department})
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {currentUser && !permission.canExecute && (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>จำกัดสิทธิ์การเริ่มงานเฉพาะผู้ขับขี่ที่ได้รับมอบหมาย</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {permission.reason ||
                  `สงวนสิทธิ์เฉพาะพนักงานขับรถ (${permission.driverDisplayName}) หรือผู้ขอใช้รถกรณีขับขี่ด้วยตนเอง`}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mileage Input (Prominent) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-orange-600" />
                <span>เลขไมล์ตอนไป (กิโลเมตร) <span className="text-rose-500">*</span></span>
              </span>
              {vehicle?.odometer && (
                <span className="text-[11px] text-slate-400 font-normal">
                  ไมล์ล่าสุดของรถ: {vehicle.odometer.toLocaleString()} กม.
                </span>
              )}
            </label>
            <div className="relative rounded-2xl shadow-inner">
              <input
                type="number"
                step="1"
                min="0"
                value={startMileage}
                onChange={(e) => {
                  setStartMileage(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 font-mono text-xl sm:text-2xl font-black text-slate-900 bg-orange-50/30 text-center tracking-wider"
                placeholder="เช่น 148520"
                required
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                กม. (KM)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ตรวจสอบจากเรือนไมล์หน้ารถจริงก่อนออกเดินทาง ข้อมูลนี้จะส่งเข้าสมุดทะเบียนคุมพัสดุ
            </p>
          </div>

          {/* Departure Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>เวลาออกเดินทางจริง <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm font-semibold text-slate-800 bg-white"
              required
            />
          </div>

          {/* Pre-trip Inspection Checklist */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>การตรวจความพร้อมก่อนหมุนล้อ (Pre-Trip Checklist)</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                ความปลอดภัย
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  checked={checklist.tiresChecked}
                  onChange={(e) => setChecklist({ ...checklist, tiresChecked: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-slate-700 text-[11px] font-medium">แรงดันลมยาง 4 ล้อ</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  checked={checklist.fluidsChecked}
                  onChange={(e) => setChecklist({ ...checklist, fluidsChecked: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-slate-700 text-[11px] font-medium">น้ำมันเครื่อง/หม้อน้ำ</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  checked={checklist.brakesLightsChecked}
                  onChange={(e) => setChecklist({ ...checklist, brakesLightsChecked: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-slate-700 text-[11px] font-medium">เบรก & ไฟส่องสว่าง</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  checked={checklist.cleanlinessChecked}
                  onChange={(e) => setChecklist({ ...checklist, cleanlinessChecked: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-slate-700 text-[11px] font-medium">ความสะอาด & แอร์</span>
              </label>
            </div>
          </div>

          {/* Optional Driver Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              บันทึกเพิ่มเติมของคนขับ (ถ้ามี)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ตรวจสภาพพร้อมใช้งาน, ออกเดินทางตรงเวลา"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-slate-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            {currentUser && !permission.canExecute ? (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center space-x-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ปิดหน้าต่าง (ไม่มีสิทธิ์เริ่มงาน)</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันเริ่มงาน (ออกเดินทาง)</span>
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
