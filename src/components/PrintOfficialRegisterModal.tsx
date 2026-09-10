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

  // Sorted mission records (oldest to newest: travel date asc, start time asc, memoNo/id asc)
  // Safely creates a new array copy; does NOT mutate state or props
  const sortedMissionRecords = [...missionRecords].sort((a, b) => {
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

  const totalKm = sortedMissionRecords.reduce((acc, b) => acc + (b.totalDistance || 0), 0);
  const totalLiters = sortedMissionRecords.reduce((acc, b) => acc + (b.fuelRefilledLiters || 0), 0);
  const totalCost = sortedMissionRecords.reduce((acc, b) => acc + (b.fuelRefilledCost || 0), 0);

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
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full table-fixed border-collapse border border-slate-900 text-[10px] sm:text-[11px] print:text-[7.5pt] print:leading-tight">
              <colgroup>
                <col style={{ width: '3.5%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8.5%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '5.5%' }} />
                <col style={{ width: '7.5%' }} />
                <col style={{ width: '6.5%' }} />
                <col style={{ width: '6.5%' }} />
              </colgroup>
              <thead style={{ display: 'table-header-group' }} className="print:[display:table-header-group]">
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">ลำดับ</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">วัน เดือน ปี</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">เลขที่ใบเบิก/บันทึก</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">รถยนต์/ทะเบียน</th>
                  <th className="border border-slate-900 p-1 text-left font-bold break-words">ผู้ขอใช้รถ / สังกัดกลุ่มงาน</th>
                  <th className="border border-slate-900 p-1 text-left font-bold break-words">สถานที่ไปราชการ / ภารกิจ</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">เวลาไป-กลับ</th>
                  <th className="border border-slate-900 p-1 text-right font-bold break-words">ไมล์ไป</th>
                  <th className="border border-slate-900 p-1 text-right font-bold break-words">ไมล์กลับ</th>
                  <th className="border border-slate-900 p-1 text-right font-bold break-words">รวม (กม.)</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">น้ำมัน (ลิตร/บาท)</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">พนักงานขับรถ</th>
                  <th className="border border-slate-900 p-1 text-center font-bold break-words">สถานะคุมพัสดุ</th>
                </tr>
              </thead>
              <tbody>
                {sortedMissionRecords.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="border border-slate-900 p-6 text-center text-slate-500">
                      ยังไม่มีรายการบันทึกไมล์ในทะเบียนคุม
                    </td>
                  </tr>
                ) : (
                  sortedMissionRecords.map((b, idx) => {
                    const startKm = b.startMileage || 0;
                    const endKm = b.endMileage || 0;
                    const kmDriven = b.totalDistance || (endKm > startKm ? endKm - startKm : 0);

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-slate-400 break-inside-avoid print:break-inside-avoid"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        <td className="border border-slate-900 p-1 text-center font-mono break-words">{idx + 1}</td>
                        <td className="border border-slate-900 p-1 text-center break-words leading-tight">
                          {formatThaiDate(b.date, 'short')}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-mono break-words leading-tight">
                          {b.memoNo || b.id}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-semibold break-words leading-tight">
                          {b.carName.replace(/Toyota|Hilux|Camry|Commuter|Fortuner/gi, '').trim() || b.carName}
                        </td>
                        <td className="border border-slate-900 p-1 break-words whitespace-normal leading-tight">
                          <strong className="block text-slate-900">{b.name}</strong>
                          <div className="text-[9px] print:text-[7pt] text-slate-600 break-words">{b.department}</div>
                        </td>
                        <td className="border border-slate-900 p-1 break-words whitespace-normal leading-tight">
                          <div className="font-semibold text-slate-900 break-words">{b.destination}</div>
                          <div className="text-[9px] print:text-[7pt] text-slate-600 break-words whitespace-normal">{b.purpose}</div>
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-mono break-words leading-tight">
                          {b.actualDepartureTime || b.startTime || '-'}<br />
                          {b.actualReturnTime || b.endTime || '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-mono font-medium break-words">
                          {startKm ? startKm.toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-mono font-medium break-words">
                          {endKm ? endKm.toLocaleString() : (b.status === 'in_progress' ? 'กำลังเดินทาง' : '-')}
                        </td>
                        <td className="border border-slate-900 p-1 text-right font-mono font-bold text-slate-900 bg-slate-50 print:bg-transparent break-words">
                          {kmDriven > 0 ? kmDriven.toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center break-words leading-tight">
                          {b.fuelRefilledLiters ? (
                            <div>
                              <span>{b.fuelRefilledLiters} ล.</span>
                              <div className="text-[9px] print:text-[7pt] text-slate-600 font-mono">
                                {b.fuelRefilledCost ? `${b.fuelRefilledCost.toLocaleString()} บ.` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-medium break-words leading-tight">
                          {b.driverName || '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center text-[9px] print:text-[7pt] break-words leading-tight">
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
              <tfoot style={{ display: 'table-footer-group' }} className="print:[display:table-footer-group]">
                <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold break-inside-avoid print:break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td colSpan={9} className="border border-slate-900 p-1.5 text-right break-words">
                    รวมทั้งสิ้น ({sortedMissionRecords.length} ภารกิจ):
                  </td>
                  <td className="border border-slate-900 p-1.5 text-right font-mono text-[10px] print:text-[7.5pt] break-words">
                    {totalKm.toLocaleString()} กม.
                  </td>
                  <td className="border border-slate-900 p-1.5 text-center text-[9px] print:text-[7pt] break-words">
                    {totalLiters > 0 ? `${totalLiters} ล.` : '-'}
                    {totalCost > 0 && <div>{totalCost.toLocaleString()} บ.</div>}
                  </td>
                  <td colSpan={2} className="border border-slate-900 p-1.5 text-center text-[9px] print:text-[7pt] text-slate-600 break-words">
                    ตรวจรับถูกต้องตามระเบียบ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Thai Government Official Signatures Block */}
          <div
            className="pt-6 grid grid-cols-3 gap-8 text-center text-xs break-inside-avoid print:break-inside-avoid"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
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
