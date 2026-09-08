import React, { useState } from 'react';
import { BookingRequest } from '../types';
import { formatThaiDate, toThaiNumerals } from '../utils/thaiDate';
import { printElementById } from '../utils/printHelper';
import { exportElementToPdf } from '../utils/pdfExport';
import { Printer, X, Download, FileCheck, CheckCircle2, AlertCircle, Compass, FileText, PenTool, Loader2, Check, Gauge, ShieldCheck } from 'lucide-react';

interface OfficialMemoModalProps {
  booking: BookingRequest | null;
  onClose: () => void;
  justApproved?: boolean;
  onOpenSignatureModal?: (booking: BookingRequest) => void;
  onOpenInspectionModal?: (booking: BookingRequest) => void;
}

export const OfficialMemoModal: React.FC<OfficialMemoModalProps> = ({
  booking,
  onClose,
  justApproved = false,
  onOpenSignatureModal,
  onOpenInspectionModal
}) => {
  const [useThaiNumerals, setUseThaiNumerals] = useState(false);
  const [activeDocType, setActiveDocType] = useState<'memo' | 'out_province'>(
    booking && booking.destProvince && booking.destProvince !== 'พังงา' ? 'out_province' : 'memo'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  if (!booking) return null;

  const isOutOfProvince = booking.destProvince && booking.destProvince !== 'พังงา';

  const num = (val: string | number) => (useThaiNumerals ? toThaiNumerals(val) : val);

  const formattedDate = formatThaiDate(booking.date, 'official');
  const memoDateDisplay = useThaiNumerals ? toThaiNumerals(formattedDate) : formattedDate;

  // Phone number: ส่วนราชการ: สำนักงานวัฒนธรรมจังหวัดพังงา โทร. 0 7648 1596
  const phoneDisplay = useThaiNumerals ? '๐ ๗๖๔๘ ๑๕๙๖' : '0 7648 1596';

  // Memo reference: ที่: พง0032(พิเศษ)/...
  const rawMemoSeq = (booking.memoNo || booking.id)
    .replace(/^พง\s*0030\.1\//, '')
    .replace(/^พง\s*0032\(พิเศษ\)\//, '')
    .replace(/^พง\s*๐๐๓๐\.๑\//, '')
    .replace(/^พง\s*๐๐๓๒\(พิเศษ\)\//, '')
    .trim();

  const memoRefDisplay = useThaiNumerals
    ? `พง ๐๐๓๒(พิเศษ)/${toThaiNumerals(rawMemoSeq)}`
    : `พง0032(พิเศษ)/${rawMemoSeq.replace(/[๐-๙]/g, (d) => ['0','1','2','3','4','5','6','7','8','9'][['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'].indexOf(d)])}`;

  const activeDocId = activeDocType === 'memo' ? 'printMemoArea' : 'printPermitArea';
  const docTitle = activeDocType === 'memo'
    ? `ใบคำขอใช้รถยนต์ส่วนกลาง_${memoRefDisplay.replace(/[\/\\()]/g, '_')}`
    : `ใบอนุญาตออกนอกเขตจังหวัด_${memoRefDisplay.replace(/[\/\\()]/g, '_')}`;

  const handlePrint = () => {
    printElementById(activeDocId, {
      documentTitle: docTitle,
      orientation: 'portrait'
    });
  };

  const handleSavePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const safeName = `${docTitle}_${booking.id}.pdf`;
      await exportElementToPdf(activeDocId, {
        fileName: safeName,
        orientation: 'portrait'
      });
      setPdfSuccessMessage(`บันทึกไฟล์ PDF สำเร็จ: ${safeName}`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('กำลังเปิดหน้าต่างพิมพ์เพื่อให้ท่านเลือก "บันทึกเป็น PDF (Save as PDF)" ในช่องปลายทาง');
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-900 text-white flex flex-wrap justify-between items-center no-print gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">พิมพ์เอกสารราชการและบันทึก PDF</h3>
              <p className="text-[11px] text-slate-400">
                {isOutOfProvince ? 'ภารกิจเดินทางออกนอกเขตจังหวัด (ต่างจังหวัด)' : 'แบบฟอร์มมาตรฐานตามระเบียบงานสารบรรณ'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Document Selector Tabs */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveDocType('memo')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  activeDocType === 'memo'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ใบคำขอขอใช้รถยนต์ส่วนกลาง</span>
              </button>
              <button
                onClick={() => setActiveDocType('out_province')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  activeDocType === 'out_province'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>ใบอนุญาตออกนอกเขตจังหวัด</span>
                {isOutOfProvince && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>

            <label className="hidden md:flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-700 text-slate-200 text-xs">
              <input
                type="checkbox"
                checked={useThaiNumerals}
                onChange={(e) => setUseThaiNumerals(e.target.checked)}
                className="rounded text-orange-500 focus:ring-0"
              />
              <span>เลขไทย</span>
            </label>

            {onOpenSignatureModal && booking.status === 'pending' && (
              <button
                onClick={() => onOpenSignatureModal(booking)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>ลงนามอนุมัติ</span>
              </button>
            )}

            {onOpenInspectionModal && (booking.status === 'completed' || booking.endMileage) && (
              <button
                onClick={() => onOpenInspectionModal(booking)}
                className={`px-3.5 py-1.5 ${
                  booking.assetInspectionStatus === 'accepted'
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white animate-pulse'
                } text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow`}
                title="เจ้าหน้าที่พัสดุตรวจรับรถและลงชื่อ"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{booking.assetInspectionStatus === 'accepted' ? 'ดู/แก้ไขการตรวจรับพัสดุ' : 'พัสดุลงชื่อตรวจรับรถ'}</span>
              </button>
            )}

            {/* Save PDF button */}
            <button
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition flex items-center space-x-1.5 shadow"
              title="บันทึกเอกสารเป็นไฟล์ PDF ลงเครื่องคอมพิวเตอร์"
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

            {/* Print document button */}
            <button
              id="btnPrintMemo"
              data-print-hide="true"
              onClick={handlePrint}
              className="no-print print-hide px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-xl transition flex items-center space-x-1.5 shadow cursor-pointer"
              title="พิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง / เอกสารราชการ (A4)"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบคำขอ</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Download Toast Notification */}
        {pdfSuccessMessage && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs flex items-center justify-between no-print shadow-md animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-100" />
              <span className="font-semibold">{pdfSuccessMessage}</span>
            </div>
            <button
              onClick={() => setPdfSuccessMessage(null)}
              className="text-emerald-200 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Approval Success Banner (Notice) */}
        {booking.status === 'approved' && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-2.5 text-xs flex items-center justify-between no-print shadow-sm border-b border-emerald-500/30">
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="font-bold">
                  {justApproved ? 'ลงนามอนุมัติเรียบร้อยแล้ว!' : 'เอกสารได้รับการลงนามอนุมัติแล้ว'}
                </span>
                <span className="text-emerald-100 ml-1.5">
                  — ใบคำขอขอใช้รถยนต์ส่วนกลางฉบับนี้ได้รับการประทับลายมือชื่อ/ลายเซ็นอิเล็กทรอนิกส์ของวัฒนธรรมจังหวัดพังงา และมีผลทางราชการสมบูรณ์
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-800/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                {booking.signatureType === 'draw' ? 'ลายเซ็นสดดิจิทัล' : 'ลายเซ็นอิเล็กทรอนิกส์'}
              </span>
            </div>
          </div>
        )}

        {/* Paper Viewer Container */}
        <div className="flex-grow overflow-auto bg-slate-200/80 p-4 sm:p-8 flex justify-center items-start">
          
          {/* Document 1: ใบคำขอขอใช้รถยนต์ส่วนกลาง */}
          {activeDocType === 'memo' && (
            <div
              id="printMemoArea"
              className="bg-white text-black font-sarabun shadow-2xl rounded-sm border border-slate-300 box-border flex flex-col justify-between shrink-0 select-text"
              style={{
                width: '210mm',
                minWidth: '210mm',
                maxWidth: '210mm',
                height: '297mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                boxSizing: 'border-box',
                paddingTop: '2.0cm',
                paddingRight: '2.0cm',
                paddingBottom: '2.0cm',
                paddingLeft: '3.0cm',
                overflow: 'hidden',
                fontSize: '13pt',
                lineHeight: 1.45,
                fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif",
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Top and Body Section */}
              <div className="flex flex-col">
                {/* Heading (No Garuda emblem) */}
                <div className="text-center font-bold text-[18pt] leading-tight mb-3">
                  ใบคำขอขอใช้รถยนต์ส่วนกลาง
                </div>

                {/* Office & Memo Reference Block */}
                <div className="border-b border-black pb-1.5 mb-2.5 text-[13pt] leading-[1.35]">
                  <div className="mb-0.5">
                    <p>
                      <span className="font-bold">ส่วนราชการ:</span> สำนักงานวัฒนธรรมจังหวัดพังงา โทร. {phoneDisplay}
                    </p>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div className="text-left">
                      <span className="font-bold">ที่:</span> {memoRefDisplay}
                    </div>
                    <div className="text-right">
                      <span className="font-bold">วันที่:</span> {memoDateDisplay}
                    </div>
                  </div>
                </div>

                {/* Subject & Recipient */}
                <div className="space-y-1 mb-3 text-[13pt] leading-[1.35]">
                  <p>
                    <span className="font-bold">เรื่อง:</span> ขออนุมัติใช้รถยนต์ราชการเพื่อปฏิบัติภารกิจราชการ
                  </p>
                  <p>
                    <span className="font-bold">เรียน:</span> วัฒนธรรมจังหวัดพังงา
                  </p>
                </div>

                {/* Body Text */}
                <div className="space-y-2.5 text-justify text-[13pt] leading-[1.45] font-normal" style={{ textIndent: '2.5cm' }}>
                  <p>
                    ด้วยข้าพเจ้า {booking.name} ตำแหน่ง {booking.position} ฝ่าย/กลุ่มงาน {booking.department} มีความจำเป็นต้องเดินทางไปปฏิบัติภารกิจราชการเพื่อ {booking.purpose} ณ สถานที่ {booking.destination} ในวันที่ {memoDateDisplay}{' '}
                    {booking.startTime && (
                      <span>
                        เวลา {num(booking.startTime)} น. ถึง{' '}
                        {booking.endTime ? `${num(booking.endTime)} น.` : 'เสร็จสิ้นภารกิจ'}
                      </span>
                    )}
                  </p>

                  <p>
                    ในการปฏิบัติภารกิจราชการครั้งนี้ มีผู้ร่วมเดินทางรวมจำนวน {num(booking.passengerCount || 1)} คน{' '}
                    {booking.passengerNames && <span>(ได้แก่ {booking.passengerNames})</span>} โดยขออนุมัติใช้ยานพาหนะของทางราชการ คือ{' '}
                    {booking.carName} โดยมีพนักงานขับรถหรือผู้ควบคุมยานพาหนะคือ{' '}
                    {booking.driverType === 'self' ? `${booking.name} (ผู้ขอขับขี่ด้วยตนเอง)` : booking.driverName}
                  </p>

                  {booking.attachmentName && (
                    <p className="text-[12pt] text-black italic">
                      [ เอกสารประกอบ: {booking.attachmentName} ]
                    </p>
                  )}

                  <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>
                </div>

                {/* Requester Signature (Right-aligned using Flexbox according to Thai official memo format, generous signing clearance) */}
                <div className="pt-4 flex justify-end text-center text-[13pt] leading-[1.35]">
                  <div className="w-[55%] flex flex-col items-center">
                    <p className="mb-8">(ลงชื่อ).......................................................</p>
                    <p className="font-normal">({booking.name})</p>
                    <p className="text-[12pt] text-black/90 mt-0.5">{booking.position}</p>
                  </div>
                </div>
              </div>

              {/* Director Approval / Order Section */}
              <div className="pt-2 border-t border-dashed border-black/70 mt-2 space-y-1 text-[12pt] leading-[1.3]">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[12pt]">ความเห็นและคำสั่งของผู้อำนวยการสำนักงานวัฒนธรรมจังหวัดพังงา:</p>
                  {booking.status === 'approved' && (
                    <span className="text-[9pt] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-500 rounded font-bold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 inline" /> อนุมัติแล้ว
                    </span>
                  )}
                  {booking.status === 'rejected' && (
                    <span className="text-[9pt] px-1.5 py-0.2 bg-rose-50 text-rose-800 border border-rose-500 rounded font-bold flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1 text-rose-600 inline" /> ไม่อนุมัติ
                    </span>
                  )}
                </div>

                <div className="pl-2 space-y-1 text-[12pt]">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-default">
                      <span className="text-[13pt]">{booking.status === 'approved' ? '☑' : '☐'}</span>
                      <span className="font-bold">อนุมัติ</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-default">
                      <span className="text-[13pt]">{booking.status === 'rejected' ? '☑' : '☐'}</span>
                      <span>ไม่อนุมัติ</span>
                    </label>
                  </div>

                  {booking.directorComment ? (
                    <p className="text-[11pt] italic text-black bg-slate-50 p-1 rounded border border-slate-200">
                      ข้อสั่งการเพิ่มเติม: &ldquo;{booking.directorComment}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[11pt] text-black/70">
                      มอบหมายให้ผู้ขอและพนักงานขับรถปฏิบัติหน้าที่ด้วยความปลอดภัยและปฏิบัติตามระเบียบของทางราชการ
                    </p>
                  )}

                  {/* Director Signature Box (Right-aligned using Flexbox) */}
                  <div className="pt-1.5 flex justify-end text-center text-[12pt] leading-[1.3]">
                    <div className="w-[50%] flex flex-col items-center">
                      {booking.status === 'approved' ? (
                        <div className="py-0.5 flex flex-col items-center">
                          {booking.signatureData ? (
                            <div className="flex flex-col items-center my-0.5">
                              <img
                                src={booking.signatureData}
                                alt="ลายมือชื่อผู้อนุมัติ"
                                className="h-8 max-w-[180px] object-contain"
                              />
                              <p className="text-[9.5pt] text-blue-800 font-sans">
                                {booking.signatureType === 'draw'
                                  ? 'ลงนามลายมือชื่อสดดิจิทัล'
                                  : 'ลงนามอิเล็กทรอนิกส์รับรอง'}{' '}
                                • {booking.approvedAt ? formatThaiDate(booking.approvedAt.split('T')[0], 'short') : memoDateDisplay}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="font-serif italic text-blue-900 font-bold tracking-widest text-[12pt] py-0.5 border-b border-blue-400">
                                (อุไรวรรณ แดงงาม)
                              </div>
                              <p className="text-[9.5pt] text-blue-800 font-sans">
                                ลงนามอิเล็กทรอนิกส์เมื่อ: {booking.approvedAt ? formatThaiDate(booking.approvedAt.split('T')[0], 'short') : memoDateDisplay}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mb-5">(ลงชื่อ).......................................................</p>
                      )}
                      <p className="font-bold">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                      <p className="text-[11pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: ส่วนบันทึกเลขไมล์ไป-กลับ และการตรวจรับรถยนต์โดยเจ้าหน้าที่พัสดุ */}
              <div className="pt-2 border-t-2 border-black/80 mt-2 text-[11.5pt] leading-[1.3] bg-slate-50/50 p-2 rounded border border-slate-300">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[12pt] text-slate-900">
                      การบันทึกเลขไมล์ไป-กลับ และการตรวจรับรถเสร็จสิ้นภารกิจ (งานพัสดุ/ยานพาหนะ)
                    </span>
                  </div>
                  {booking.assetInspectionStatus === 'accepted' ? (
                    <span className="text-[9.5pt] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-400 px-2 py-0.2 rounded flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> ตรวจรับรถเรียบร้อยแล้ว
                    </span>
                  ) : booking.status === 'completed' ? (
                    <span className="text-[9.5pt] font-bold text-amber-800 bg-amber-100 border border-amber-400 px-2 py-0.2 rounded">
                      รอเจ้าหน้าที่พัสดุตรวจรับรถ
                    </span>
                  ) : (
                    <span className="text-[9.5pt] text-slate-500">
                      (บันทึกเมื่อเสร็จสิ้นภารกิจ)
                    </span>
                  )}
                </div>

                {/* 2-Column: Left for Mileage Table, Right for Logistics Officer Signature */}
                <div className="grid grid-cols-12 gap-3 pt-1.5 items-start">
                  
                  {/* Left Column: Start/End Mileage Data (cols 7) */}
                  <div className="col-span-7 space-y-1">
                    <div className="grid grid-cols-2 gap-2 text-[11pt]">
                      <div className="bg-white p-1.5 rounded border border-slate-300">
                        <span className="font-bold text-slate-800 block text-[10.5pt]">๑. เลขไมล์ตอนไป (Start):</span>
                        <span className="text-[12pt] font-bold text-blue-900">
                          {booking.startMileage ? `${num(booking.startMileage.toLocaleString())} กม.` : '...................... กม.'}
                        </span>
                        {booking.startMileageTime && (
                          <span className="block text-[9.5pt] text-slate-500">
                            เวลาออก: {num(booking.startMileageTime)} น.
                          </span>
                        )}
                      </div>

                      <div className="bg-white p-1.5 rounded border border-slate-300">
                        <span className="font-bold text-slate-800 block text-[10.5pt]">๒. เลขไมล์ตอนกลับ (End):</span>
                        <span className="text-[12pt] font-bold text-emerald-900">
                          {booking.endMileage ? `${num(booking.endMileage.toLocaleString())} กม.` : '...................... กม.'}
                        </span>
                        {booking.endMileageTime && (
                          <span className="block text-[9.5pt] text-slate-500">
                            เวลากลับ: {num(booking.endMileageTime)} น.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-300 text-[10.5pt]">
                      <span>
                        <span className="font-bold">ระยะทางรวมทั้งสิ้น:</span>{' '}
                        <span className="font-bold text-indigo-900">
                          {booking.totalDistance ? `${num(booking.totalDistance.toLocaleString())} กิโลเมตร` : (booking.endMileage && booking.startMileage ? `${num((booking.endMileage - booking.startMileage).toLocaleString())} กิโลเมตร` : '............... กิโลเมตร')}
                        </span>
                      </span>
                      {booking.fuelRefilledLiters && booking.fuelRefilledLiters > 0 ? (
                        <span className="text-slate-700">
                          เติมน้ำมัน: {num(booking.fuelRefilledLiters)} ลิตร ({num(booking.fuelRefilledCost?.toLocaleString() || 0)} บาท)
                        </span>
                      ) : null}
                    </div>

                    {booking.driverNotes && (
                      <p className="text-[10pt] text-slate-600 italic truncate">
                        หมายเหตุคนขับ: {booking.driverNotes}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Logistics Officer Signature (cols 5) */}
                  <div className="col-span-5 flex flex-col items-center justify-center text-center pt-0.5 bg-white p-2 rounded border border-slate-300">
                    <p className="font-bold text-[11pt] text-slate-900 mb-0.5">
                      ผู้ตรวจรับยานพาหนะ / เจ้าหน้าที่พัสดุ
                    </p>
                    
                    {booking.assetInspectionSignature ? (
                      <div className="py-0.5 flex flex-col items-center">
                        <img
                          src={booking.assetInspectionSignature}
                          alt="ลายเซ็นเจ้าหน้าที่พัสดุ"
                          className="h-9 max-w-[150px] object-contain my-0.5"
                        />
                        <p className="text-[9pt] text-emerald-800 font-sans">
                          {booking.assetInspectionSignatureType === 'draw'
                            ? 'ตรวจรับด้วยลายเซ็นสดดิจิทัล'
                            : 'ตรวจรับด้วยลายเซ็นอิเล็กทรอนิกส์'}{' '}
                          • {booking.assetInspectedAt ? formatThaiDate(booking.assetInspectedAt.split('T')[0], 'short') : memoDateDisplay}
                        </p>
                      </div>
                    ) : (
                      <div className="my-2">
                        <p className="text-slate-400 text-[11pt]">(ลงชื่อ)........................................................</p>
                      </div>
                    )}

                    <p className="font-bold text-[11pt] text-slate-900">
                      ({booking.assetInspectorName || '..........................................................'})
                    </p>
                    <p className="text-[10pt] text-slate-600 mt-0.5">
                      {booking.assetInspectorPosition || 'เจ้าหน้าที่พัสดุ / ผู้ตรวจรับรถยนต์ราชการ'}
                    </p>
                    {booking.assetInspectionVehicleCondition && (
                      <p className="text-[9pt] text-emerald-700 mt-0.5 font-medium">
                        สภาพรถ: {booking.assetInspectionVehicleCondition === 'normal' ? 'สภาพปกติเรียบร้อย' : booking.assetInspectionVehicleCondition === 'needs_cleaning' ? 'ควรล้างทำความสะอาด' : 'ต้องส่งซ่อมบำรุง'}
                      </p>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Document 2: ใบอนุญาตนำรถยนต์ราชการออกนอกเขตจังหวัด */}
          {activeDocType === 'out_province' && (
            <div
              id="printPermitArea"
              className="bg-white text-black font-sarabun shadow-2xl rounded-sm border border-slate-300 box-border flex flex-col justify-between shrink-0 select-text"
              style={{
                width: '210mm',
                minWidth: '210mm',
                maxWidth: '210mm',
                height: '297mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                boxSizing: 'border-box',
                paddingTop: '2.0cm',
                paddingRight: '2.0cm',
                paddingBottom: '2.0cm',
                paddingLeft: '3.0cm',
                overflow: 'hidden',
                fontSize: '13pt',
                lineHeight: 1.45,
                fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif",
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              <div className="flex flex-col">
                {/* Heading */}
                <div className="flex flex-col items-center justify-center mb-4">
                  <h2 className="font-bold text-[18pt] leading-tight text-center">
                    ใบอนุญาตนำรถยนต์ส่วนกลางออกนอกเขตจังหวัด
                  </h2>
                  <p className="text-[12pt] text-black/80 text-center">
                    ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการใช้รถยนต์ราชการ พ.ศ. ๒๕๒๓ และที่แก้ไขเพิ่มเติม
                  </p>
                </div>

                {/* Permit Info */}
                <div className="border-b border-black pb-1.5 mb-3 text-[13pt] leading-[1.35]">
                  <div className="mb-0.5">
                    <p>
                      <span className="font-bold">ส่วนราชการ:</span> สำนักงานวัฒนธรรมจังหวัดพังงา โทร. {phoneDisplay}
                    </p>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div className="text-left">
                      <span className="font-bold">ที่:</span> {memoRefDisplay}
                    </div>
                    <div className="text-right">
                      <span className="font-bold">วันที่:</span> {memoDateDisplay}
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-3 text-justify text-[13pt] leading-[1.45] font-normal" style={{ textIndent: '2.5cm' }}>
                  <p>
                    อนุญาตให้ {booking.driverName || booking.name} ตำแหน่ง{' '}
                    {booking.driverType === 'self' ? booking.position : 'พนักงานขับรถยนต์ประจำสำนักงาน'}{' '}
                    นำรถยนต์ส่วนกลางของสำนักงานวัฒนธรรมจังหวัดพังงา หมายเลขทะเบียน {booking.carName} ออกนอกเขตจังหวัดพังงา ไปยัง{' '}
                    {booking.destination} (จังหวัด{booking.destProvince || 'ปลายทาง'})
                  </p>

                  <p>
                    เพื่อปฏิบัติภารกิจราชการ เรื่อง {booking.purpose}{' '}
                    โดยมีผู้ร่วมเดินทางรวมจำนวน {num(booking.passengerCount || 1)} คน{' '}
                    {booking.passengerNames && <span>({booking.passengerNames})</span>}
                  </p>

                  <p>
                    มีกำหนดเวลาตั้งแต่วันที่ {memoDateDisplay} ถึงวันที่{' '}
                    {booking.endDate ? (useThaiNumerals ? toThaiNumerals(formatThaiDate(booking.endDate, 'official')) : formatThaiDate(booking.endDate, 'official')) : memoDateDisplay}{' '}
                    รวมระยะเวลา {booking.endDate && booking.endDate !== booking.date ? num(2) : num(1)} วัน
                  </p>

                  <p>
                    ทั้งนี้ ให้พนักงานขับรถและผู้ควบคุมยานพาหนะใช้ความระมัดระวังสูงสุด ขับขี่ด้วยความเร็วตามที่กฎหมายกำหนด
                    และปฏิบัติตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการใช้รถยนต์ราชการอย่างเคร่งครัด
                  </p>
                </div>
              </div>

              {/* Authority Signature (Right-aligned using Flexbox with generous signing clearance) */}
              <div className="pt-6 flex justify-end text-center text-[13pt] leading-[1.35]">
                <div className="w-[55%] flex flex-col items-center">
                  {booking.status === 'approved' ? (
                    <div className="py-1 flex flex-col items-center">
                      {booking.signatureData ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={booking.signatureData}
                            alt="ลายมือชื่อผู้อนุญาต"
                            className="h-10 max-w-[200px] object-contain"
                          />
                          <p className="text-[10pt] text-blue-800 font-sans mt-0.5">
                            อนุญาตผ่านระบบอิเล็กทรอนิกส์ ({booking.signatureType === 'draw' ? 'ลายเซ็นสดดิจิทัล' : 'ตราประทับดิจิทัล'})
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="font-serif italic text-blue-900 font-bold tracking-widest text-[13pt] py-0.5 border-b border-blue-400">
                            (อุไรวรรณ แดงงาม)
                          </div>
                          <p className="text-[10pt] text-blue-800 font-sans mt-0.5">
                            อนุญาตผ่านระบบอิเล็กทรอนิกส์
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mb-10">(ลงชื่อ).......................................................ผู้อนุญาต</p>
                  )}
                  <p className="font-bold">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                  <p className="text-[12pt] text-black mt-0.5">วัฒนธรรมจังหวัดพังงา</p>
                  <p className="text-[10.5pt] text-black/60 mt-0.5">
                    เลขที่คำขออนุมัติ: {booking.id}
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center no-print">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span>รหัสอ้างอิง:</span>
            <span className="font-mono font-bold text-slate-700">{booking.id}</span>
            {isOutOfProvince && (
              <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ภารกิจข้ามเขตจังหวัด ({booking.destProvince})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition shadow flex items-center space-x-1.5"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>บันทึกไฟล์ PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-medium transition shadow flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร A4</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
