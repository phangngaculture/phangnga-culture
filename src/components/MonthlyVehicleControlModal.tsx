import React, { useState, useMemo } from 'react';
import { Vehicle, BookingRequest, FuelLog, MaintenanceRecord, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import { printElementById } from '../utils/printHelper';
import {
  FileSpreadsheet,
  Printer,
  Download,
  X,
  Calendar,
  Car,
  Filter,
  CheckCircle2,
  TrendingUp,
  Fuel,
  Users,
  Building2,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface MonthlyVehicleControlModalProps {
  vehicles: Vehicle[];
  bookings: BookingRequest[];
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  users: User[];
  initialVehicleId?: string;
  onClose: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const MonthlyVehicleControlModal: React.FC<MonthlyVehicleControlModalProps> = ({
  vehicles,
  bookings,
  fuelLogs,
  maintenanceRecords,
  users,
  initialVehicleId,
  onClose
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYearThai, setSelectedYearThai] = useState<number>(currentDate.getFullYear() + 543);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialVehicleId && initialVehicleId !== 'all' ? initialVehicleId : (vehicles[0]?.id || '')
  );

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Filter bookings for this vehicle and month
  const targetYearCE = selectedYearThai - 543;
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (selectedVehicleId && b.vehicleId !== selectedVehicleId) return false;
        if (!b.usageDate) return false;
        const d = new Date(b.usageDate);
        return d.getMonth() === selectedMonth && d.getFullYear() === targetYearCE;
      })
      .sort((a, b) => new Date(a.usageDate).getTime() - new Date(b.usageDate).getTime());
  }, [bookings, selectedVehicleId, selectedMonth, targetYearCE]);

  // Aggregate monthly stats
  const totalTrips = filteredBookings.length;
  const totalDistanceKm = filteredBookings.reduce((sum, b) => {
    if (b.startMileage && b.endMileage && b.endMileage > b.startMileage) {
      return sum + (b.endMileage - b.startMileage);
    }
    return sum + (b.destination.includes('ตะกั่วป่า') ? 130 : 65); // default estimate
  }, 0);

  // Filter fuel logs for this vehicle and month
  const filteredFuelLogs = useMemo(() => {
    return fuelLogs.filter((f) => {
      if (selectedVehicleId && f.vehicleId !== selectedVehicleId) return false;
      const d = new Date(f.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === targetYearCE;
    });
  }, [fuelLogs, selectedVehicleId, selectedMonth, targetYearCE]);

  const totalFuelLiters = filteredFuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalFuelCost = filteredFuelLogs.reduce((sum, f) => sum + (f.cost || 0), 0);
  const avgKmPerLiter = totalFuelLiters > 0 ? (totalDistanceKm / totalFuelLiters).toFixed(2) : '-';

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'วัน เดือน ปี',
      'เลขที่ใบขอใช้รถ',
      'เวลาไป-กลับ',
      'ผู้ขอใช้รถ/กลุ่มงาน',
      'พนักงานขับรถ',
      'ไปราชการที่ใด (ภารกิจ)',
      'เลขไมล์เริ่มต้น',
      'เลขไมล์สิ้นสุด',
      'ระยะทางรวม (กม.)',
      'ปริมาณน้ำมัน (ลิตร)',
      'จำนวนเงิน (บาท)',
      'สถานะการตรวจรับ'
    ];

    const rows = filteredBookings.map((b, idx) => {
      const startKm = b.startMileage || '-';
      const endKm = b.endMileage || '-';
      const dist = (b.startMileage && b.endMileage && b.endMileage > b.startMileage)
        ? (b.endMileage - b.startMileage)
        : '-';
      const fuelMatch = filteredFuelLogs.find((f) => f.bookingId === b.id || f.date === b.usageDate);

      return [
        idx + 1,
        formatThaiDate(b.usageDate),
        b.bookingNumber || `REQ-${b.id.slice(0, 6)}`,
        `${b.startTime || '08:30'} - ${b.endTime || '16:30'}`,
        `"${b.userName} (${b.department})"`,
        `"${b.driverName || 'พนักงานขับรถ'}"`,
        `"${b.purpose} ณ ${b.destination}"`,
        startKm,
        endKm,
        dist,
        fuelMatch ? fuelMatch.liters : '0',
        fuelMatch ? fuelMatch.cost : '0',
        b.status === 'completed' ? 'เสร็จสิ้นภารกิจ' : b.status === 'approved' ? 'อนุมัติแล้ว' : 'ระหว่างดำเนินการ'
      ].join(',');
    });

    const csvContent = '\uFEFF' + [
      `"บัญชีคุมการใช้รถยนต์และน้ำมันเชื้อเพลิง ประจำเดือน ${THAI_MONTHS[selectedMonth]} พ.ศ. ${selectedYearThai}"`,
      `"สำนักงานวัฒนธรรมจังหวัดพังงา | รถยนต์หมายเลขทะเบียน ${selectedVehicle?.licensePlate || ''} ${selectedVehicle?.model || ''}"`,
      `"สรุป: จำนวน ${totalTrips} เที่ยว | ระยะทางรวม ${totalDistanceKm} กม. | น้ำมัน ${totalFuelLiters} ลิตร (${totalFuelCost.toLocaleString()} บาท) | อัตราสิ้นเปลือง ${avgKmPerLiter} กม./ลิตร"`,
      '',
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `บัญชีคุมการใช้รถ_สตง_${selectedVehicle?.licensePlate || 'all'}_${THAI_MONTHS[selectedMonth]}_${selectedYearThai}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    // พิมพ์เฉพาะโซนแบบฟอร์ม สตง. (แนวนอน) เพื่อไม่ให้ส่วนอื่นของแอปไปกินพื้นที่กระดาษ
    // ทำให้เอกสารเริ่มที่หน้า 1 และไม่ถูกตัดแบ่งหลายหน้าโดยไม่จำเป็น
    printElementById('printMonthlyControlArea', {
      documentTitle: `บัญชีคุมการใช้รถยนต์และน้ำมันเชื้อเพลิง_${THAI_MONTHS[selectedMonth]}_${selectedYearThai}`,
      orientation: 'landscape',
      addPrintableClass: false
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header - Screen only */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">
                  บัญชีคุมการใช้รถยนต์และน้ำมันเชื้อเพลิงประจำเดือน (แบบฟอร์ม สตง.)
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-md font-semibold">
                  ระเบียบราชการ
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                สำนักงานวัฒนธรรมจังหวัดพังงา — สรุปการใช้รถ เลขไมล์ ปริมาณน้ำมัน และการตรวจรับ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              title="ส่งออกเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>ส่งออก Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              title="พิมพ์แบบฟอร์ม สตง. (แนวนอน)"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แบบฟอร์ม</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls - Screen only */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">เลือกยานพาหนะ:</span>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} - {v.brand} {v.model} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">ประจำเดือน:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">พ.ศ.:</span>
              <select
                value={selectedYearThai}
                onChange={(e) => setSelectedYearThai(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                {[2567, 2568, 2569, 2570].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
            <span>พบรายการ: <strong className="text-emerald-600 font-bold">{filteredBookings.length}</strong> เที่ยว</span>
            <span>ระยะทางรวม: <strong className="text-blue-600 font-bold">{totalDistanceKm.toLocaleString()}</strong> กม.</span>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div id="printMonthlyControlArea" className="p-6 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible">
          {/* Official Government Form Heading */}
          <div className="text-center space-y-1 pb-2 border-b-2 border-slate-800 print:border-black">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white print:text-black tracking-wide">
              บัญชีคุมการใช้รถยนต์ส่วนกลางและการใช้น้ำมันเชื้อเพลิง
            </h2>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 print:text-black">
              สำนักงานวัฒนธรรมจังหวัดพังงา ประจำเดือน {THAI_MONTHS[selectedMonth]} พ.ศ. {selectedYearThai}
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-slate-600 dark:text-slate-400 print:text-black pt-1">
              <span><strong>หมายเลขทะเบียน:</strong> {selectedVehicle?.licensePlate || '-'}</span>
              <span><strong>ยี่ห้อ/รุ่น:</strong> {selectedVehicle?.brand} {selectedVehicle?.model}</span>
              <span><strong>ประเภท:</strong> {selectedVehicle?.type}</span>
              <span><strong>พนักงานขับรถประจำ:</strong> {selectedVehicle?.defaultDriver || 'นายศราวุธ เกตุรักษ์'}</span>
            </div>
          </div>

          {/* Quick Metrics Bar - Visual on Screen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">จำนวนเที่ยวภารกิจ</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-200 mt-0.5">{totalTrips} เที่ยว</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">ระยะทางรวมทั้งเดือน</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-200 mt-0.5">{totalDistanceKm.toLocaleString()} กม.</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">น้ำมันที่เติมรวม</div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-200 mt-0.5">{totalFuelLiters.toLocaleString()} ลิตร ({totalFuelCost.toLocaleString()} บ.)</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-[11px] text-purple-800 dark:text-purple-300 font-medium">อัตราสิ้นเปลืองเฉลี่ย</div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-200 mt-0.5">{avgKmPerLiter} กม./ลิตร</div>
            </div>
          </div>

          {/* Master 12-Column Table */}
          <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-xl print:border-black">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-800 dark:text-slate-200 print:text-black font-semibold border-b border-slate-300 dark:border-slate-700 print:border-black text-center">
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-8">ที่</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-20">วัน เดือน ปี</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-24">เลขที่ใบขอ</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-20">เวลาไป-กลับ</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-36">ผู้ขอใช้รถ / สังกัด</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-32">พนักงานขับรถ</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black">สถานที่ไปราชการ (ภารกิจ)</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-16">ไมล์เริ่ม</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-16">ไมล์สิ้นสุด</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-16">รวม (กม.)</th>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black w-20">น้ำมัน (ลิตร/บ.)</th>
                  <th className="p-2 w-24">ลายมือชื่อผู้ขับ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-8 text-slate-400 dark:text-slate-500">
                      ไม่พบประวัติการใช้รถในรอบเดือนที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b, idx) => {
                    const dist = (b.startMileage && b.endMileage && b.endMileage > b.startMileage)
                      ? (b.endMileage - b.startMileage)
                      : (b.destination.includes('ตะกั่วป่า') ? 130 : 65);
                    const fuelMatch = filteredFuelLogs.find((f) => f.bookingId === b.id || f.date === b.usageDate);

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200 print:text-black"
                      >
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-black font-mono">{idx + 1}</td>
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-black whitespace-nowrap">{formatThaiDate(b.usageDate).slice(0, 10)}</td>
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-black font-mono text-[10px]">{b.bookingNumber || `REQ-${b.id.slice(0, 5)}`}</td>
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-black font-mono text-[10px]">{b.startTime || '08:30'} - {b.endTime || '16:30'}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black font-medium">{b.userName} <span className="text-[9px] text-slate-500 block">({b.department})</span></td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black text-[10px]">{b.driverName || 'พนักงานขับรถ'}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black">
                          <div className="font-medium truncate max-w-xs">{b.purpose}</div>
                          <div className="text-[10px] text-slate-500 print:text-black truncate">ณ {b.destination}</div>
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 dark:border-slate-800 print:border-black font-mono">{b.startMileage ? b.startMileage.toLocaleString() : '-'}</td>
                        <td className="p-2 text-right border-r border-slate-200 dark:border-slate-800 print:border-black font-mono">{b.endMileage ? b.endMileage.toLocaleString() : '-'}</td>
                        <td className="p-2 text-right border-r border-slate-200 dark:border-slate-800 print:border-black font-mono font-bold text-blue-600 print:text-black">{dist.toLocaleString()}</td>
                        <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 print:border-black text-[10px] font-mono">
                          {fuelMatch ? `${fuelMatch.liters} ล. (${fuelMatch.cost} บ.)` : '-'}
                        </td>
                        <td className="p-2 text-center text-[10px] text-slate-400 print:text-black">
                          {b.status === 'completed' ? (
                            <span className="text-emerald-600 print:text-black font-medium">✓ ลงชื่อแล้ว</span>
                          ) : (
                            <span className="text-slate-400">..........</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-bold text-slate-900 dark:text-white print:text-black border-t-2 border-slate-300 dark:border-slate-700 print:border-black">
                  <td colSpan={9} className="p-2 text-right border-r border-slate-300 dark:border-slate-700 print:border-black">
                    รวมทั้งสิ้น ({filteredBookings.length} เที่ยว)
                  </td>
                  <td className="p-2 text-right border-r border-slate-300 dark:border-slate-700 print:border-black font-mono text-blue-700 print:text-black">
                    {totalDistanceKm.toLocaleString()} กม.
                  </td>
                  <td className="p-2 text-center border-r border-slate-300 dark:border-slate-700 print:border-black font-mono text-emerald-700 print:text-black text-[10px]">
                    {totalFuelLiters} ลิตร ({totalFuelCost.toLocaleString()} บ.)
                  </td>
                  <td className="p-2 text-center text-[10px]">
                    -
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Endorsement & Signatures Section (สตง. มาตรฐาน 3 ฝ่าย) */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-800 dark:text-slate-200 print:text-black print:pt-12">
            <div className="space-y-1">
              <div>ลงชื่อ..........................................................</div>
              <div className="font-semibold">({selectedVehicle?.defaultDriver || 'นายศราวุธ เกตุรักษ์'})</div>
              <div className="text-[11px] text-slate-500 print:text-black">พนักงานขับรถยนต์ประจำสำนักงาน</div>
              <div className="text-[10px] text-slate-400 print:text-black">วันที่ ....../....../......</div>
            </div>

            <div className="space-y-1">
              <div>ลงชื่อ..........................................................</div>
              <div className="font-semibold">(เจ้าหน้าที่ผู้ควบคุม / งานพัสดุ)</div>
              <div className="text-[11px] text-slate-500 print:text-black">เจ้าพนักงานธุรการ / พัสดุ</div>
              <div className="text-[10px] text-slate-400 print:text-black">วันที่ ....../....../......</div>
            </div>

            <div className="space-y-1">
              <div>ลงชื่อ..........................................................</div>
              <div className="font-semibold">(ผู้อำนวยการสำนักงานวัฒนธรรมจังหวัดพังงา)</div>
              <div className="text-[11px] text-slate-500 print:text-black">วัฒนธรรมจังหวัดพังงา / ผู้มีอำนาจสั่งใช้รถ</div>
              <div className="text-[10px] text-slate-400 print:text-black">วันที่ ....../....../......</div>
            </div>
          </div>
        </div>

        {/* Footer actions - Screen only */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 print:hidden text-xs">
          <span className="text-slate-500 text-[11px]">
            * เอกสารนี้จัดทำขึ้นตามแบบบัญชีคุมการใช้รถยนต์ราชการของสำนักงานการตรวจเงินแผ่นดิน (สตง.) และระเบียบกระทรวงการคลัง
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
