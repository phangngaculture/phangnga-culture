import React from 'react';
import { BookingRequest, FuelLog, Vehicle } from '../types';
import { printElementById } from '../utils/printHelper';
import {
  BarChart3,
  Download,
  Printer,
  Car,
  Building,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Droplets,
  Calendar,
  Layers
} from 'lucide-react';

interface AnalyticsViewProps {
  bookings: BookingRequest[];
  fuelLogs: FuelLog[];
  vehicles: Vehicle[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  bookings,
  fuelLogs,
  vehicles
}) => {
  const totalBookings = bookings.length;
  const approvedBookings = bookings.filter((b) => b.status === 'approved' || b.status === 'completed').length;
  const totalDistance = fuelLogs.reduce((sum, f) => sum + f.distance, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalLitres = fuelLogs.reduce((sum, f) => sum + f.litres, 0);

  // Group by vehicle
  const vehicleStats = vehicles.map((v) => {
    const vBookings = bookings.filter((b) => b.carId === v.id || b.carName.includes(v.plate.split(' ')[0]));
    const vFuel = fuelLogs.filter((f) => f.carPlate.includes(v.plate.split(' ')[0]));
    const dist = vFuel.reduce((sum, f) => sum + f.distance, 0);
    const cost = vFuel.reduce((sum, f) => sum + f.cost, 0);

    return {
      name: v.name,
      plate: v.plate,
      count: vBookings.length,
      distance: dist || (vBookings.length * 110),
      cost: cost || (vBookings.length * 480)
    };
  });

  // Group by department
  const deptStats: Record<string, number> = {};
  bookings.forEach((b) => {
    deptStats[b.department] = (deptStats[b.department] || 0) + 1;
  });

  // Export CSV with UTF-8 BOM, sorted by travel date (oldest to newest: asc), then time, then id
  const exportCsv = () => {
    const sortedBookingsForCsv = [...bookings].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      const validTimeA = Number.isNaN(timeA) ? 0 : timeA;
      const validTimeB = Number.isNaN(timeB) ? 0 : timeB;

      if (validTimeA !== validTimeB) {
        return validTimeA - validTimeB;
      }

      const startA = (a.startTime || a.actualDepartureTime || '').trim();
      const startB = (b.startTime || b.actualDepartureTime || '').trim();
      if (startA && startB && startA !== startB) {
        return startA.localeCompare(startB);
      }
      if (startA && !startB) return -1;
      if (!startA && startB) return 1;

      const idA = (a.memoNo || a.id || '').trim();
      const idB = (b.memoNo || b.id || '').trim();
      const idCmp = idA.localeCompare(idB, 'th', { numeric: true });
      if (idCmp !== 0) return idCmp;

      return (a.id || '').localeCompare(b.id || '', 'th', { numeric: true });
    });

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    let csv = 'เลขที่คำขอ,วันที่เดินทาง,เวลา,ชื่อผู้ขอ,ตำแหน่ง,ฝ่าย/กลุ่มงาน,วัตถุประสงค์,สถานที่ปลายทาง,รถยนต์ราชการ,พนักงานขับรถ,ระยะทาง(กม.),ค่าน้ำมัน(บาท),สถานะคำขอ\n';

    sortedBookingsForCsv.forEach((b) => {
      const statusText =
        b.status === 'completed' ? 'เสร็จสิ้นภารกิจ' :
        b.status === 'approved' ? 'อนุมัติแล้ว' :
        b.status === 'in_progress' ? 'กำลังปฏิบัติภารกิจ' :
        b.status === 'pending' ? 'รออนุมัติ' :
        b.status === 'rejected' ? 'ไม่อนุมัติ' : b.status;

      csv += [
        escapeCsv(b.memoNo || b.id),
        escapeCsv(b.date),
        escapeCsv(b.startTime ? `${b.startTime} - ${b.endTime || ''}` : ''),
        escapeCsv(b.name),
        escapeCsv(b.position),
        escapeCsv(b.department),
        escapeCsv(b.purpose),
        escapeCsv(b.destination),
        escapeCsv(b.carName),
        escapeCsv(b.driverName || '-'),
        escapeCsv(b.totalDistance ? `${b.totalDistance} กม.` : ''),
        escapeCsv(b.fuelRefilledCost ? `${b.fuelRefilledCost} บาท` : ''),
        escapeCsv(statusText)
      ].join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานสถิติการใช้รถยนต์_สนง_วัฒนธรรมพังงา_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Handle Print Report for analyticsReportArea
  const handlePrintReport = () => {
    printElementById('analyticsReportArea', {
      documentTitle: `รายงานสถิติยานพาหนะ_สนง_วัฒนธรรมพังงา_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Controls & Actions - Hidden in Print) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              รายงานสถิติและการใช้จ่ายงบประมาณยานพาหนะ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            สำนักงานวัฒนธรรมจังหวัดพังงา — สรุปข้อมูลสำหรับรายงานผู้บริหารและสำนักงานการตรวจเงินแผ่นดิน (สตง.)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel / CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            <span>พิมพ์รายงานสรุป (A4 แนวนอน)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div
        id="analyticsReportArea"
        className="printable-document bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* Printable Official Header (Visible in print or preview) */}
        <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            แบบรายงานฝ่ายบริหารทั่วไป งานยานพาหนะและพัสดุ
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            รายงานสรุปสถิติการใช้งานยานพาหนะและงบประมาณเชื้อเพลิงราชการ
          </h1>
          <h2 className="text-xs font-semibold text-slate-700">
            สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม
          </h2>
          <div className="flex justify-center items-center gap-6 text-[10px] text-slate-500 pt-0.5">
            <span>ประจำปีงบประมาณ พ.ศ. <strong>๒๕๖๙</strong></span>
            <span>
              ข้อมูล ณ วันที่:{' '}
              <strong>
                {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </strong>
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="bg-slate-50 print:bg-white rounded-2xl p-5 border border-slate-200 print:border-slate-800 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span className="font-semibold text-slate-700">คำขอใช้รถทั้งหมด</span>
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{totalBookings} รายการ</h3>
            <div className="text-[11px] text-emerald-700 font-medium">
              อนุมัติ/เสร็จสิ้น {approvedBookings} รายการ ({totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0}%)
            </div>
          </div>

          <div className="bg-slate-50 print:bg-white rounded-2xl p-5 border border-slate-200 print:border-slate-800 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span className="font-semibold text-slate-700">ระยะทางปฏิบัติภารกิจรวม</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-blue-950 font-mono">
              {totalDistance.toLocaleString()} <span className="text-xs font-normal">กม.</span>
            </h3>
            <div className="text-[11px] text-slate-500">
              ครอบคลุม ๘ อำเภอในพังงาและกลุ่มอันดามัน
            </div>
          </div>

          <div className="bg-slate-50 print:bg-white rounded-2xl p-5 border border-slate-200 print:border-slate-800 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span className="font-semibold text-slate-700">งบประมาณค่าน้ำมันรวม</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-amber-600 font-mono">
              {totalFuelCost.toLocaleString()} <span className="text-xs font-normal">บาท</span>
            </h3>
            <div className="text-[11px] text-slate-500">
              เฉลี่ย {totalBookings > 0 ? Math.round(totalFuelCost / totalBookings) : 0} บาท / ภารกิจ
            </div>
          </div>

          <div className="bg-slate-50 print:bg-white rounded-2xl p-5 border border-slate-200 print:border-slate-800 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span className="font-semibold text-slate-700">ปริมาณเชื้อเพลิงที่ใช้</span>
              <Droplets className="w-4 h-4 text-teal-500" />
            </div>
            <h3 className="text-2xl font-bold text-teal-800 font-mono">
              {totalLitres.toFixed(1)} <span className="text-xs font-normal">ลิตร</span>
            </h3>
            <div className="text-[11px] text-slate-500">
              อัตราเฉลี่ย ~11.8 กม./ลิตร
            </div>
          </div>
        </div>

        {/* Grid: Vehicle Breakdown & Department Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          
          {/* Vehicles Usage Breakdown */}
          <div className="bg-slate-50 print:bg-white rounded-2xl p-5 border border-slate-200 print:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
                <Car className="w-4 h-4 text-orange-600" />
                <span>สถิติการใช้งานแยกตามยานพาหนะ</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">ความถี่ / ค่าใช้จ่าย</span>
            </div>

            <div className="space-y-2.5">
              {vehicleStats.map((vs, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 print:border-slate-400 bg-white space-y-1.5 text-xs break-inside-avoid"
                >
                  <div className="flex justify-between items-center font-semibold text-slate-900">
                    <span>{vs.name} ({vs.plate})</span>
                    <span className="text-orange-600 font-bold">{vs.count} ภารกิจ</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>ระยะทางสะสม: <b>{vs.distance.toLocaleString()} กม.</b></div>
                    <div>ค่าน้ำมันรวม: <b>{vs.cost.toLocaleString()} บาท</b></div>
                  </div>

                  {/* Visual bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden print:hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(15, vs.count * 30))}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Usage Breakdown */}
          <div className="bg-slate-50 print:bg-white rounded-2xl p-5 border border-slate-200 print:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-teal-700" />
                <span>สถิติการเบิกใช้รถแยกตามกลุ่มงาน / ฝ่าย</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">สัดส่วนภารกิจ</span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(deptStats).map(([dept, count], idx) => {
                const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 print:border-slate-400 bg-white space-y-1.5 text-xs break-inside-avoid"
                  >
                    <div className="flex justify-between items-center font-semibold text-slate-900">
                      <span className="truncate pr-2">{dept}</span>
                      <span className="text-teal-700 font-bold whitespace-nowrap">{count} ครั้ง ({pct}%)</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden print:hidden">
                      <div
                        className="bg-teal-700 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Official Report Signatures Block for Print */}
        <div
          className="pt-6 grid grid-cols-2 gap-12 text-center text-xs break-inside-avoid print:break-inside-avoid border-t border-slate-300"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <div className="space-y-3">
            <p className="font-semibold text-slate-800">ผู้จัดทำและรวบรวมรายงาน</p>
            <div className="h-9 flex items-end justify-center">
              <span className="border-b border-dotted border-slate-800 w-44 block" />
            </div>
            <div>
              <p>(..........................................................)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">เจ้าหน้าที่งานยานพาหนะและพัสดุ</p>
              <p className="text-[10px] text-slate-500">วันที่ ........../........../..........</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-slate-800">ผู้อนุมัติและรับรองข้อมูล</p>
            <div className="h-9 flex items-end justify-center">
              <span className="border-b border-dotted border-slate-800 w-44 block" />
            </div>
            <div>
              <p>(นางสาวอุไรวรรณ แดงงาม)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">วัฒนธรรมจังหวัดพังงา</p>
              <p className="text-[10px] text-slate-500">วันที่ ........../........../..........</p>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-400 text-right pt-2 border-t border-slate-100 print:border-slate-300">
          ระบบบริหารยานพาหนะราชการ สำนักงานวัฒนธรรมจังหวัดพังงา | ทะเบียนสถิติและรายงานผล
        </div>
      </div>

    </div>
  );
};
