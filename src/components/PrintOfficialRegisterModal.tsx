import React, { useRef, useState } from 'react';
import { BookingRequest, Vehicle } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import { printElementById } from '../utils/printHelper';
import { exportElementToPdf } from '../utils/pdfExport';
import { X, Printer, Download, Car, Calendar, ShieldCheck, Loader2 } from 'lucide-react';

interface PrintOfficialRegisterModalProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  onClose: () => void;
  filterCarPlate?: string;
}

export const PrintOfficialRegisterModal: React.FC<PrintOfficialRegisterModalProps> = ({
  bookings,
  vehicles,
  onClose,
  filterCarPlate = 'all'
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Completed or in-progress missions with mileage info
  const missionRecords = bookings.filter(
    (b) => (b.status === 'completed' || b.status === 'in_progress' || b.startMileage) &&
      (filterCarPlate === 'all' || b.carName.includes(filterCarPlate))
  );

  const totalKm = missionRecords.reduce((acc, b) => acc + (b.totalDistance || 0), 0);
  const totalLiters = missionRecords.reduce((acc, b) => acc + (b.fuelRefilledLiters || 0), 0);
  const totalCost = missionRecords.reduce((acc, b) => acc + (b.fuelRefilledCost || 0), 0);

  const docTitle = `ทะเบียนคุมการใช้รถยนต์_${filterCarPlate === 'all' ? 'ทุกคัน' : filterCarPlate.replace(/\s+/g, '_')}`;

  const handlePrint = () => {
    printElementById('printRegisterArea', {
      documentTitle: docTitle,
      orientation: 'landscape'
    });
  };

  const handleSavePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportElementToPdf('printRegisterArea', {
        fileName: `${docTitle}.pdf`,
        orientation: 'landscape'
      });
    } catch (err) {
      console.error('Failed to export register PDF:', err);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden print:border-none print:shadow-none print:rounded-none max-h-[92vh] flex flex-col">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print print:hidden shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                พิมพ์แบบฟอร์มทะเบียนคุมการใช้รถยนต์ราชการ (งานพัสดุและยานพาหนะ)
              </h3>
              <p className="text-[11px] text-slate-400">
                สำนักงานวัฒนธรรมจังหวัดพังงา — มาตรฐานงานพัสดุและระเบียบยานพาหนะ พ.ศ. ๒๕๒๓
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="no-print print-hide px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>บันทึก PDF</span>
                </>
              )}
            </button>

            <button
              id="btnPrintRegister"
              data-print-hide="true"
              onClick={handlePrint}
              className="no-print print-hide px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-orange-600/30 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์เอกสาร (A4 แนวนอน)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div
          id="printRegisterArea"
          ref={printContentRef}
          className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible space-y-6 text-slate-900 font-sans text-xs bg-white flex-grow"
        >
          {/* Header */}
          <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
            <div className="text-xs tracking-wider uppercase text-slate-600 font-bold">
              แบบฟอร์มฝ่ายบริหารทั่วไป งานพัสดุและยานพาหนะ
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              ทะเบียนคุมการใช้รถยนต์ส่วนกลางและรถประจำตำแหน่ง
            </h1>
            <h2 className="text-sm font-semibold text-slate-800">
              สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม
            </h2>
            <div className="flex justify-center items-center gap-6 text-[11px] text-slate-600 pt-1">
              <span>
                ยานพาหนะ:{' '}
                <strong>
                  {filterCarPlate === 'all'
                    ? 'ทุกคันในสังกัด (Fleet Register)'
                    : filterCarPlate}
                </strong>
              </span>
              <span>
                ประจำปีงบประมาณ พ.ศ. <strong>๒๕๖๙</strong>
              </span>
              <span>
                วันที่พิมพ์เอกสาร:{' '}
                <strong>{formatThaiDate(new Date().toISOString(), 'short')}</strong>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-[10px] sm:text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900">
                  <th className="border border-slate-900 p-1.5 text-center w-8">ลำดับ</th>
                  <th className="border border-slate-900 p-1.5 text-center w-20">วัน เดือน ปี</th>
                  <th className="border border-slate-900 p-1.5 text-center w-24">เลขที่ใบเบิก/บันทึก</th>
                  <th className="border border-slate-900 p-1.5 text-center">รถยนต์/ทะเบียน</th>
                  <th className="border border-slate-900 p-1.5 text-left">ผู้ขอใช้รถ / สังกัดกลุ่มงาน</th>
                  <th className="border border-slate-900 p-1.5 text-left">สถานที่ไปราชการ / ภารกิจ</th>
                  <th className="border border-slate-900 p-1.5 text-center w-16">เวลาไป-กลับ</th>
                  <th className="border border-slate-900 p-1.5 text-right w-16">ไมล์ไป</th>
                  <th className="border border-slate-900 p-1.5 text-right w-16">ไมล์กลับ</th>
                  <th className="border border-slate-900 p-1.5 text-right w-14 font-bold">รวม (กม.)</th>
                  <th className="border border-slate-900 p-1.5 text-center w-20">น้ำมัน (ลิตร/บาท)</th>
                  <th className="border border-slate-900 p-1.5 text-center w-24">พนักงานขับรถ</th>
                  <th className="border border-slate-900 p-1.5 text-center w-20">สถานะคุมพัสดุ</th>
                </tr>
              </thead>
              <tbody>
                {missionRecords.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="border border-slate-900 p-6 text-center text-slate-500">
                      ยังไม่มีรายการบันทึกไมล์ในทะเบียนคุม
                    </td>
                  </tr>
                ) : (
                  missionRecords.map((b, idx) => {
                    const startKm = b.startMileage || 0;
                    const endKm = b.endMileage || 0;
                    const kmDriven = b.totalDistance || (endKm > startKm ? endKm - startKm : 0);

                    return (
                      <tr key={b.id} className="border-b border-slate-400">
                        <td className="border border-slate-900 p-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-center whitespace-nowrap">
                          {formatThaiDate(b.date, 'short')}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center font-mono">
                          {b.memoNo || b.id}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center font-semibold">
                          {b.carName.replace(/Toyota|Hilux|Camry|Commuter|Fortuner/gi, '').trim() || b.carName}
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <strong>{b.name}</strong>
                          <div className="text-[9px] text-slate-600">{b.department}</div>
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <div className="font-semibold">{b.destination}</div>
                          <div className="text-[9px] text-slate-600 truncate max-w-xs">{b.purpose}</div>
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center whitespace-nowrap font-mono">
                          {b.actualDepartureTime || b.startTime || '-'}<br />
                          {b.actualReturnTime || b.endTime || '-'}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono font-medium">
                          {startKm ? startKm.toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono font-medium">
                          {endKm ? endKm.toLocaleString() : (b.status === 'in_progress' ? 'กำลังเดินทาง' : '-')}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono font-bold text-slate-900 bg-slate-50">
                          {kmDriven > 0 ? kmDriven.toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center">
                          {b.fuelRefilledLiters ? (
                            <div>
                              <span>{b.fuelRefilledLiters} ล.</span>
                              <div className="text-[9px] text-slate-600 font-mono">
                                {b.fuelRefilledCost ? `${b.fuelRefilledCost.toLocaleString()} บ.` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center font-medium">
                          {b.driverName || '-'}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center text-[10px]">
                          {b.status === 'completed' || b.registeredInAssetControl ? (
                            <span className="text-emerald-800 font-bold">✓ ลงคุมแล้ว</span>
                          ) : b.status === 'in_progress' ? (
                            <span className="text-amber-800 font-bold">● กำลังปฏิบัติ</span>
                          ) : (
                            <span className="text-slate-500">รอสิ้นสุด</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Summary Totals Row */}
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={9} className="border border-slate-900 p-2 text-right">
                    รวมทั้งสิ้น ({missionRecords.length} ภารกิจ):
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono text-xs">
                    {totalKm.toLocaleString()} กม.
                  </td>
                  <td className="border border-slate-900 p-2 text-center text-[10px]">
                    {totalLiters > 0 ? `${totalLiters} ล.` : '-'}
                    {totalCost > 0 && <div>{totalCost.toLocaleString()} บ.</div>}
                  </td>
                  <td colSpan={2} className="border border-slate-900 p-2 text-center text-[10px] text-slate-600">
                    ตรวจรับถูกต้องตามระเบียบ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Thai Government Official Signatures Block */}
          <div className="pt-6 grid grid-cols-3 gap-8 text-center text-xs break-inside-avoid">
            {/* Signature 1: Driver */}
            <div className="space-y-4">
              <p className="font-semibold text-slate-800">ผู้รายงาน / พนักงานขับรถยนต์</p>
              <div className="h-10 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-800 w-48 block" />
              </div>
              <div>
                <p>(..........................................................)</p>
                <p className="text-[10px] text-slate-500 mt-1">พนักงานขับรถยนต์ราชการ</p>
                <p className="text-[10px] text-slate-500">วันที่ ........../........../..........</p>
              </div>
            </div>

            {/* Signature 2: Asset Control Officer */}
            <div className="space-y-4">
              <p className="font-semibold text-slate-800">ผู้ตรวจรับ / เจ้าหน้าที่พัสดุและยานพาหนะ</p>
              <div className="h-10 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-800 w-48 block" />
              </div>
              <div>
                <p>(..........................................................)</p>
                <p className="text-[10px] text-slate-500 mt-1">เจ้าหน้าที่งานพัสดุและยานพาหนะ</p>
                <p className="text-[10px] text-slate-500">วันที่ ........../........../..........</p>
              </div>
            </div>

            {/* Signature 3: Director */}
            <div className="space-y-4">
              <p className="font-semibold text-slate-800">ผู้อนุมัติ / วัฒนธรรมจังหวัด</p>
              <div className="h-10 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-800 w-48 block" />
              </div>
              <div>
                <p>(นางสาวอุไรวรรณ แดงงาม)</p>
                <p className="text-[10px] text-slate-500 mt-1">วัฒนธรรมจังหวัดพังงา</p>
                <p className="text-[10px] text-slate-500">วันที่ ........../........../..........</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-right pt-4 border-t border-slate-200">
            ระบบบริหารยานพาหนะราชการ สำนักงานวัฒนธรรมจังหวัดพังงา | ทะเบียนคุมงานพัสดุอัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
};
