import React, { useState, useMemo } from 'react';
import { FuelLog, BookingRequest, Vehicle, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  Fuel,
  Gauge,
  CheckSquare,
  History,
  FileCheck,
  PlusCircle,
  Car,
  DollarSign,
  Droplets,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

interface FuelLogViewProps {
  fuelLogs: FuelLog[];
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  onAddFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  onUpdateFuelLog?: (id: string, data: Partial<FuelLog>) => void;
  onDeleteFuelLog?: (id: string) => void;
}

export const FuelLogView: React.FC<FuelLogViewProps> = ({
  fuelLogs,
  bookings,
  vehicles,
  currentUser,
  onAddFuelLog,
  onUpdateFuelLog,
  onDeleteFuelLog
}) => {
  const approvedBookings = useMemo(() => bookings.filter((b) => b.status === 'approved'), [bookings]);

  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [bookingId, setBookingId] = useState<string>(approvedBookings[0]?.id || '');
  const [startMileage, setStartMileage] = useState<number>(89430);
  const [endMileage, setEndMileage] = useState<number>(89620);
  const [litres, setLitres] = useState<number>(18.5);
  const [cost, setCost] = useState<number>(640);
  const [fuelStation, setFuelStation] = useState<string>('ปตท. โคกกลอย (ถ.เพชรเกษม)');
  const [receiptNo, setReceiptNo] = useState<string>('RC-690901');
  const [rating, setRating] = useState<string>('ดีเยี่ยม (รถปกติ, สะอาด, ตรงเวลา)');
  const [notes, setNotes] = useState<string>('เครื่องยนต์ทำงานปกติ ไม่พบสัญญาณไฟเตือน แอร์เย็น');

  // 6-Point Vehicle Checklist
  const [checklist, setChecklist] = useState({
    tires: true,
    engineOil: true,
    coolant: true,
    brakesAndLights: true,
    cleanliness: true,
    emergencyTools: true
  });

  const distance = Math.max(0, endMileage - startMileage);
  const fuelEfficiency = litres > 0 ? (distance / litres).toFixed(2) : '0';
  const costPerKm = distance > 0 ? (cost / distance).toFixed(2) : '0';

  const handleStartEdit = (log: FuelLog) => {
    setEditingLog(log);
    setBookingId(log.bookingId);
    setStartMileage(log.startMileage);
    setEndMileage(log.endMileage);
    setLitres(log.litres);
    setCost(log.cost);
    setFuelStation(log.fuelStation);
    setReceiptNo(log.receiptNo || '');
    setRating(log.rating);
    setNotes(log.notes || '');
    if (log.checklist) {
      setChecklist(log.checklist);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setStartMileage(89430);
    setEndMileage(89620);
    setLitres(18.5);
    setCost(640);
    setReceiptNo('RC-690901');
    setNotes('เครื่องยนต์ทำงานปกติ ไม่พบสัญญาณไฟเตือน แอร์เย็น');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (endMileage <= startMileage) {
      alert('เลขไมล์สิ้นสุดต้องมากกว่าเลขไมล์เริ่มต้น');
      return;
    }

    const selectedBooking = bookings.find((b) => b.id === bookingId);

    if (editingLog && onUpdateFuelLog) {
      onUpdateFuelLog(editingLog.id, {
        bookingId: bookingId || editingLog.bookingId,
        carPlate: selectedBooking ? selectedBooking.carName : editingLog.carPlate,
        driverName: selectedBooking ? selectedBooking.driverName : editingLog.driverName,
        startMileage,
        endMileage,
        distance,
        litres,
        cost,
        fuelStation,
        receiptNo,
        rating,
        checklist,
        notes
      });
      setEditingLog(null);
    } else {
      onAddFuelLog({
        bookingId: bookingId || 'CAR-GENERAL',
        carPlate: selectedBooking ? selectedBooking.carName : 'กข 1234 พังงา',
        driverName: selectedBooking ? selectedBooking.driverName : currentUser.name,
        startMileage,
        endMileage,
        distance,
        litres,
        cost,
        fuelStation,
        receiptNo,
        rating,
        checklist,
        notes,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const totalFuelCost = fuelLogs.reduce((sum, item) => sum + item.cost, 0);
  const totalDistance = fuelLogs.reduce((sum, item) => sum + item.distance, 0);
  const totalLitres = fuelLogs.reduce((sum, item) => sum + item.litres, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-teal-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Fuel className="w-3.5 h-3.5" />
              <span>ระบบบันทึกไมล์และเชื้อเพลิง (Fuel & Mileage Management)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">
              บันทึกเลขไมล์ ค่าน้ำมัน และตรวจสภาพรถยนต์ราชการ
            </h1>
            <p className="text-xs md:text-sm text-teal-100 max-w-2xl leading-relaxed">
              สำนักงานวัฒนธรรมจังหวัดพังงา — บันทึกระยะทางก่อนและหลังภารกิจ คำนวณอัตราสิ้นเปลือง
              ตรวจสภาพ ๖ จุดหลัก และจัดเก็บข้อมูลเพื่อตรวจสอบกับใบเสร็จค่าน้ำมัน
            </p>
          </div>

          {/* Mini Totals */}
          <div className="grid grid-cols-3 gap-3 bg-teal-950/60 p-3.5 rounded-2xl border border-teal-800/60 text-center">
            <div>
              <div className="text-[10px] text-teal-300">ระยะทางรวม</div>
              <div className="text-base font-bold text-white mt-0.5">{totalDistance.toLocaleString()} กม.</div>
            </div>
            <div className="border-x border-teal-800 px-3">
              <div className="text-[10px] text-teal-300">ค่าน้ำมันรวม</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">{totalFuelCost.toLocaleString()} บ.</div>
            </div>
            <div>
              <div className="text-[10px] text-teal-300">ปริมาณรวม</div>
              <div className="text-base font-bold text-teal-200 mt-0.5">{totalLitres.toFixed(1)} ลิตร</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-teal-700" />
              <h3 className="font-bold text-xs md:text-sm text-slate-900">
                {editingLog ? 'แก้ไขข้อมูลการใช้เชื้อเพลิงและเลขไมล์' : 'แบบบันทึกการใช้เชื้อเพลิงและเลขไมล์'}
              </h3>
            </div>
            {editingLog && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-medium transition cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>ยกเลิก</span>
              </button>
            )}
          </div>

          {editingLog && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center justify-between">
              <span>กำลังแก้ไขบันทึก: <b>{editingLog.id}</b></span>
              <span className="text-[10px] text-amber-600 font-medium">กดบันทึกเพื่ออัปเดต</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Booking selector */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">เลือกใบเบิกภารกิจ *</label>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">-- เลือกภารกิจที่ได้รับอนุมัติแล้ว --</option>
                {approvedBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} - {b.purpose.slice(0, 30)}... ({b.carName.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Odometer Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">เลขไมล์เริ่มต้น (กม.) *</label>
                <input
                  type="number"
                  required
                  value={startMileage}
                  onChange={(e) => setStartMileage(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เลขไมล์สิ้นสุด (กม.) *</label>
                <input
                  type="number"
                  required
                  value={endMileage}
                  onChange={(e) => setEndMileage(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Calculated Mileage Banner */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex justify-between items-center text-teal-900">
              <span className="font-medium">ระยะทางภารกิจนี้:</span>
              <span className="text-sm font-bold font-mono">{distance} กิโลเมตร</span>
            </div>

            {/* Fuel Litres & Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">ปริมาณน้ำมัน (ลิตร)</label>
                <input
                  type="number"
                  step="0.1"
                  value={litres}
                  onChange={(e) => setLitres(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ค่าน้ำมัน (บาท)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Efficiency metrics summary */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600">
              <div>อัตราสิ้นเปลือง: <b className="text-teal-700">{fuelEfficiency} กม./ลิตร</b></div>
              <div>ค่าใช้จ่ายเฉลี่ย: <b className="text-teal-700">{costPerKm} บาท/กม.</b></div>
            </div>

            {/* Gas Station & Receipt */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">สถานีบริการน้ำมัน</label>
                <input
                  type="text"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  placeholder="ปตท. โคกกลอย"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เลขที่ใบเสร็จรับเงิน</label>
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="RC-69001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* 6-Point Vehicle Condition Checklist */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block font-bold text-slate-800 text-xs">
                รายการตรวจสภาพรถยนต์ ๖ จุด (Pre/Post Checklist):
              </label>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.tires}
                    onChange={(e) => setChecklist({ ...checklist, tires: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-0"
                  />
                  <span>แรงดันลมยาง ๔ ล้อ</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.engineOil}
                    onChange={(e) => setChecklist({ ...checklist, engineOil: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-0"
                  />
                  <span>ระดับน้ำมันเครื่อง</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.coolant}
                    onChange={(e) => setChecklist({ ...checklist, coolant: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-0"
                  />
                  <span>ระดับน้ำหล่อเย็นหม้อน้ำ</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.brakesAndLights}
                    onChange={(e) => setChecklist({ ...checklist, brakesAndLights: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-0"
                  />
                  <span>ระบบเบรกและไฟส่องสว่าง</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.cleanliness}
                    onChange={(e) => setChecklist({ ...checklist, cleanliness: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-0"
                  />
                  <span>ความสะอาดภายใน/นอก</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.emergencyTools}
                    onChange={(e) => setChecklist({ ...checklist, emergencyTools: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-0"
                  />
                  <span>แม่แรงและอุปกรณ์ฉุกเฉิน</span>
                </label>
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                การประเมินสภาพรถหลังใช้งาน & ความพึงพอใจ
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
              >
                <option value="ดีเยี่ยม (รถปกติ, สะอาด, ตรงเวลา)">
                  ⭐⭐⭐⭐⭐ ดีเยี่ยม (รถปกติ, สะอาด, ตรงเวลา)
                </option>
                <option value="ดี (ใช้งานได้เรียบร้อย สมบูรณ์)">
                  ⭐⭐⭐⭐ ดี (ใช้งานได้เรียบร้อย สมบูรณ์)
                </option>
                <option value="พอใช้ (ควรตรวจสอบเพิ่มเติม)">
                  ⭐⭐⭐ พอใช้ (ควรตรวจสอบเพิ่มเติม)
                </option>
                <option value="ต้องนำส่งซ่อมบำรุงด่วน (พบจุดบกพร่อง)">
                  ⚠️ ต้องนำส่งซ่อมบำรุงด่วน (พบจุดบกพร่อง)
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-teal-900/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
            >
              <FileCheck className="w-4 h-4" />
              <span>{editingLog ? 'บันทึกการแก้ไขข้อมูลเชื้อเพลิง' : 'บันทึกข้อมูลเชื้อเพลิงและไมล์'}</span>
            </button>
          </form>
        </div>

        {/* Log History (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
              <History className="w-4 h-4 text-teal-700" />
              <span>ประวัติการบันทึกการใช้รถและน้ำมัน ({fuelLogs.length} รายการ)</span>
            </h3>
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              อัปเดตล่าสุด
            </span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {fuelLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">ยังไม่มีประวัติการบันทึกไมล์</div>
            ) : (
              fuelLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border ${
                    editingLog?.id === log.id ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50'
                  } hover:bg-white hover:border-teal-300 transition space-y-2 text-xs shadow-2xs`}
                >
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{log.id}</span>
                      <span className="text-[11px] text-slate-500">
                        [อ้างอิง: {log.bookingId}]
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                        {formatThaiDate(log.date, 'short')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(log)}
                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteFuelLog && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`ยืนยันการลบข้อมูลการเติมน้ำมัน/ไมล์ ${log.id} ใช่หรือไม่?`)) {
                              onDeleteFuelLog(log.id);
                              if (editingLog?.id === log.id) {
                                handleCancelEdit();
                              }
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="ลบข้อมูล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center font-medium text-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <Car className="w-4 h-4 text-teal-600" />
                      <span>{log.carPlate}</span>
                    </div>
                    <div className="text-slate-600">ผู้ขับ: {log.driverName}</div>
                  </div>

                  {/* Mileage & Fuel Stats Row */}
                  <div className="grid grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ไมล์เริ่ม</span>
                      <b>{log.startMileage.toLocaleString()}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ไมล์สิ้นสุด</span>
                      <b>{log.endMileage.toLocaleString()}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ระยะทาง</span>
                      <b className="text-teal-700">{log.distance} กม.</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ค่าน้ำมัน</span>
                      <b className="text-amber-700">{log.cost} บาท</b>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>ปั๊ม: {log.fuelStation} ({log.receiptNo || '-'})</span>
                    <span className="text-emerald-700 font-semibold">{log.rating}</span>
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
