import React, { useState, useMemo } from 'react';
import { BookingRequest, Vehicle } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  X,
  Gauge,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Fuel,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface CompleteMissionModalProps {
  booking: BookingRequest;
  vehicle?: Vehicle;
  onClose: () => void;
  onConfirmComplete: (
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
  ) => void;
}

export const CompleteMissionModal: React.FC<CompleteMissionModalProps> = ({
  booking,
  vehicle,
  onClose,
  onConfirmComplete
}) => {
  const startMileage = booking.startMileage || vehicle?.odometer || 148520;
  
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const defaultReturnTime = `${currentHours}:${currentMinutes}`;

  // Default suggested end mileage
  const [endMileage, setEndMileage] = useState<string>(String(startMileage + 65));
  const [returnTime, setReturnTime] = useState<string>(defaultReturnTime);
  const [hasFuelRefill, setHasFuelRefill] = useState<boolean>(false);
  const [fuelLiters, setFuelLiters] = useState<string>('');
  const [fuelCost, setFuelCost] = useState<string>('');
  const [fuelStation, setFuelStation] = useState<string>('ปตท. สาขาพังงา');
  const [fuelReceiptNo, setFuelReceiptNo] = useState<string>('');
  const [driverNotes, setDriverNotes] = useState<string>('ภารกิจเสร็จสิ้นเรียบร้อย สภาพรถยนต์ปกติ');
  const [tripRating, setTripRating] = useState<string>('ปกติเรียบร้อย');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const endMileageNum = parseFloat(endMileage);
  const totalDistance = useMemo(() => {
    if (isNaN(endMileageNum) || endMileageNum <= startMileage) {
      return 0;
    }
    return Math.round((endMileageNum - startMileage) * 10) / 10;
  }, [endMileageNum, startMileage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(endMileageNum) || endMileageNum <= 0) {
      setErrorMsg('กรุณากรอกเลขไมล์ตอนกลับให้ถูกต้อง');
      return;
    }

    if (endMileageNum <= startMileage) {
      setErrorMsg(`เลขไมล์ตอนกลับ (${endMileageNum.toLocaleString()} กม.) ต้องมากกว่าเลขไมล์ตอนไป (${startMileage.toLocaleString()} กม.)`);
      return;
    }

    if (!returnTime) {
      setErrorMsg('กรุณาระบุเวลาที่เดินทางกลับถึงสำนักงาน');
      return;
    }

    onConfirmComplete(booking.id, {
      endMileage: endMileageNum,
      actualReturnTime: returnTime,
      totalDistance,
      fuelRefilledLiters: hasFuelRefill && fuelLiters ? parseFloat(fuelLiters) : undefined,
      fuelRefilledCost: hasFuelRefill && fuelCost ? parseFloat(fuelCost) : undefined,
      fuelStation: hasFuelRefill && fuelStation ? fuelStation : undefined,
      fuelReceiptNo: hasFuelRefill && fuelReceiptNo ? fuelReceiptNo : undefined,
      driverNotes,
      tripRating
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-teal-100 uppercase tracking-wider">
                ขั้นตอนที่ 2: สิ้นสุดภารกิจ
              </span>
              <h3 className="text-base font-bold text-white">
                ขับเสร็จแล้ว & กรอกไมล์กลับ
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

        {/* Departure Summary Pill */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="text-[11px] text-teal-800 font-semibold flex items-center space-x-1.5">
              <span>ภารกิจ: {booking.id} ({booking.carName})</span>
            </div>
            <div className="text-slate-600 truncate max-w-sm">
              {booking.destination} — {booking.purpose}
            </div>
          </div>

          <div className="bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs text-right">
            <span className="text-[10px] text-slate-400 block">ไมล์ตอนออกเดินทาง</span>
            <span className="font-mono font-bold text-teal-800 text-sm">
              {startMileage.toLocaleString()} กม.
            </span>
            {booking.actualDepartureTime && (
              <span className="text-[10px] text-slate-500 block">
                เวลา {booking.actualDepartureTime} น.
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Odometer Math Preview Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                ไมล์ตอนไป
              </span>
              <span className="text-lg font-mono font-bold text-slate-300">
                {startMileage.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">กม.</span>
            </div>

            <ArrowRight className="w-5 h-5 text-orange-400 shrink-0 hidden sm:block" />

            <div className="text-center sm:text-left">
              <span className="text-[10px] text-teal-300 uppercase tracking-wider block font-semibold">
                ไมล์ตอนกลับ
              </span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {!isNaN(endMileageNum) ? endMileageNum.toLocaleString() : '---'}
              </span>
              <span className="text-[10px] text-teal-300/70 ml-1">กม.</span>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10 shrink-0">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                ระยะทางรวมที่วิ่งจริง
              </span>
              <span className="text-xl font-mono font-black text-amber-400">
                {totalDistance > 0 ? `+${totalDistance.toLocaleString()}` : '0'}
              </span>
              <span className="text-xs text-white/80 ml-1 font-semibold">กม.</span>
            </div>
          </div>

          {/* End Mileage Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>เลขไมล์ตอนกลับถึงสำนักงาน (กิโลเมตร) <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                ต้องมากกว่า {startMileage.toLocaleString()}
              </span>
            </label>
            <div className="relative rounded-2xl shadow-inner">
              <input
                type="number"
                step="1"
                min={startMileage + 1}
                value={endMileage}
                onChange={(e) => {
                  setEndMileage(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 font-mono text-xl sm:text-2xl font-black text-slate-900 bg-emerald-50/30 text-center tracking-wider"
                placeholder={`เช่น ${startMileage + 50}`}
                required
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                กม. (KM)
              </span>
            </div>
          </div>

          {/* Return Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>เวลาเดินทางกลับถึงสำนักงานจริง <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold text-slate-800 bg-white"
              required
            />
          </div>

          {/* Optional Fuel Refill Section */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFuelRefill}
                  onChange={(e) => setHasFuelRefill(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Fuel className="w-4 h-4 text-amber-500" />
                  <span>มีการเติมน้ำมันเชื้อเพลิงระหว่างปฏิบัติหน้าที่</span>
                </span>
              </label>
              {hasFuelRefill && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                  บันทึกค่าน้ำมัน
                </span>
              )}
            </div>

            {hasFuelRefill && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    ปริมาณน้ำมันที่เติม (ลิตร)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    placeholder="เช่น 25.50"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    จำนวนเงินค่าน้ำมัน (บาท)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="เช่น 850.00"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    สถานีบริการน้ำมัน
                  </label>
                  <input
                    type="text"
                    value={fuelStation}
                    onChange={(e) => setFuelStation(e.target.value)}
                    placeholder="เช่น ปตท. โคกกลอย"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    เลขที่ใบเสร็จรับเงิน (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={fuelReceiptNo}
                    onChange={(e) => setFuelReceiptNo(e.target.value)}
                    placeholder="เช่น RC-2026-991"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Condition / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              รายงานสภาพรถยนต์หลังใช้งาน / ข้อสังเกตของคนขับ
            </label>
            <input
              type="text"
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              placeholder="เช่น การขับขี่ปกติเรียบร้อย แอร์เย็น หรือแจ้งจุดที่ควรตรวจสอบ"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-800"
            />
          </div>

          {/* Official Registry Notice Box */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-200/80 flex items-start space-x-3 text-xs text-amber-900">
            <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-950">
                ระบบลงทะเบียนคุมพัสดุอัตโนมัติ (Asset Control Registry)
              </strong>
              <span>
                เมื่อกดยืนยัน ข้อมูลเลขไมล์ไป ({startMileage.toLocaleString()} กม.) ไมล์กลับ ({!isNaN(endMileageNum) ? endMileageNum.toLocaleString() : '---'} กม.) ระยะทาง {totalDistance} กม. และค่าน้ำมัน จะถูกบันทึกลงใน{' '}
                <strong>ทะเบียนคุมการใช้รถยนต์ราชการของเจ้าหน้าที่พัสดุ</strong> ทันที
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันสิ้นสุด & ลงทะเบียนคุมพัสดุ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
