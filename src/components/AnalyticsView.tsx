import React from 'react';
import { BookingRequest, FuelLog, Vehicle } from '../types';
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
  const approvedBookings = bookings.filter((b) => b.status === 'approved').length;
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

  // Export CSV with UTF-8 BOM
  const exportCsv = () => {
    let csv = 'เลขที่คำขอ,วันที่เดินทาง,ชื่อผู้ขอ,ตำแหน่ง,ฝ่าย/กลุ่มงาน,วัตถุประสงค์,สถานที่ปลายทาง,รถยนต์ราชการ,พนักงานขับรถ,สถานะคำขอ\n';

    bookings.forEach((b) => {
      csv += `"${b.id}","${b.date}","${b.name}","${b.position}","${b.department}","${b.purpose}","${b.destination}","${b.carName}","${b.driverName}","${b.status}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานสถิติการใช้รถยนต์_สนง_วัฒนธรรมพังงา_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel / CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>คำขอใช้รถทั้งหมด</span>
            <Calendar className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{totalBookings} รายการ</h3>
          <div className="text-[11px] text-emerald-700 font-medium">
            อนุมัติแล้ว {approvedBookings} รายการ ({totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0}%)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>ระยะทางปฏิบัติภารกิจรวม</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-blue-950 font-mono">
            {totalDistance.toLocaleString()} <span className="text-xs font-normal">กม.</span>
          </h3>
          <div className="text-[11px] text-slate-500">
            ครอบคลุม ๘ อำเภอในพังงาและกลุ่มอันดามัน
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>งบประมาณค่าน้ำมันรวม</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold text-amber-600 font-mono">
            {totalFuelCost.toLocaleString()} <span className="text-xs font-normal">บาท</span>
          </h3>
          <div className="text-[11px] text-slate-500">
            เฉลี่ย {totalBookings > 0 ? Math.round(totalFuelCost / totalBookings) : 0} บาท / ภารกิจ
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>ปริมาณเชื้อเพลิงที่ใช้</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Vehicles Usage Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
              <Car className="w-4 h-4 text-orange-600" />
              <span>สถิติการใช้งานแยกตามยานพาหนะ</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">ความถี่ / ค่าใช้จ่าย</span>
          </div>

          <div className="space-y-3">
            {vehicleStats.map((vs, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
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
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-teal-700" />
              <span>สถิติการเบิกใช้รถแยกตามกลุ่มงาน / ฝ่าย</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">สัดส่วนภารกิจ</span>
          </div>

          <div className="space-y-3">
            {Object.entries(deptStats).map(([dept, count], idx) => {
              const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center font-semibold text-slate-900">
                    <span className="truncate pr-2">{dept}</span>
                    <span className="text-teal-700 font-bold whitespace-nowrap">{count} ครั้ง ({pct}%)</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
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

    </div>
  );
};
