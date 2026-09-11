import React, { useState, useEffect } from 'react';
import { BookingRequest } from '../types';
import { formatThaiDate, toThaiNumerals } from '../utils/thaiDate';
import { printElementById } from '../utils/printHelper';
import { exportElementToPdf } from '../utils/pdfExport';
import {
  Printer,
  X,
  Download,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Compass,
  FileText,
  PenTool,
  Loader2,
  Check,
  Gauge,
  ShieldCheck,
  Smartphone,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Calendar,
  User as UserIcon,
  Car,
  Clock,
  Building2,
  Users,
  Paperclip,
  Share2
} from 'lucide-react';

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

  // View mode: 'mobile' (digital card view tailored for phones) vs 'a4' (official paper view)
  const [viewMode, setViewMode] = useState<'mobile' | 'a4'>('mobile');
  const [a4Zoom, setA4Zoom] = useState<number>(0.65); // Default scaled down for mobile screens

  useEffect(() => {
    // Detect mobile viewport on mount
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth < 768;
      setViewMode(isSmallScreen ? 'mobile' : 'a4');
      if (window.innerWidth < 450) {
        setA4Zoom(0.46);
      } else if (window.innerWidth < 768) {
        setA4Zoom(0.60);
      } else {
        setA4Zoom(1.0);
      }
    }
  }, []);

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

  // Status Badge Configuration
  const getStatusInfo = () => {
    if (booking.status === 'approved') {
      return {
        label: 'อนุมัติเรียบร้อยแล้ว',
        sub: 'พร้อมออกปฏิบัติภารกิจราชการ',
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700',
        badgeColor: 'bg-emerald-600 text-white',
        icon: CheckCircle2
      };
    }
    if (booking.status === 'in_progress') {
      return {
        label: 'กำลังเดินทางปฏิบัติภารกิจ',
        sub: 'รถยนต์กำลังวิ่งภารกิจนอกสำนักงาน',
        bg: 'bg-amber-500/10 text-amber-800 border-amber-300 dark:border-amber-700',
        badgeColor: 'bg-amber-600 text-white animate-pulse',
        icon: Gauge
      };
    }
    if (booking.status === 'completed') {
      return {
        label: 'เสร็จสิ้นภารกิจและลงคุมแล้ว',
        sub: 'บันทึกเลขไมล์และตรวจรับสภาพเรียบร้อย',
        bg: 'bg-teal-500/10 text-teal-800 border-teal-300 dark:border-teal-700',
        badgeColor: 'bg-teal-700 text-white',
        icon: ShieldCheck
      };
    }
    if (booking.status === 'rejected') {
      return {
        label: 'ไม่อนุมัติ / ส่งกลับแก้ไข',
        sub: 'คำขอไม่ผ่านการพิจารณา',
        bg: 'bg-rose-500/10 text-rose-800 border-rose-300 dark:border-rose-700',
        badgeColor: 'bg-rose-600 text-white',
        icon: AlertCircle
      };
    }
    return {
      label: 'รอผู้อำนวยการพิจารณาอนุมัติ',
      sub: 'ส่งเรื่องเสนอวัฒนธรรมจังหวัดแล้ว',
      bg: 'bg-orange-500/10 text-orange-800 border-orange-300 dark:border-orange-700',
      badgeColor: 'bg-amber-600 text-white',
      icon: Clock
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-3 md:p-4 overflow-hidden">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-4xl h-full sm:h-[95vh] flex flex-col rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80">
        
        {/* ========================================================================= */}
        {/* Modal Top Bar - Highly Optimized for Mobile & Desktop                     */}
        {/* ========================================================================= */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center no-print gap-2 border-b border-slate-800 shrink-0">
          {/* Top Row: Title + Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-white truncate">
                    ใบคำขอใช้รถยนต์ส่วนกลาง
                  </h3>
                  <span className="font-mono text-[10px] bg-orange-600/30 text-orange-300 border border-orange-500/30 px-1.5 py-0.2 rounded shrink-0">
                    {booking.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {booking.memoNo ? `บันทึกข้อความที่ ${booking.memoNo}` : 'สำนักงานวัฒนธรรมจังหวัดพังงา'}
                </p>
              </div>
            </div>

            {/* Mobile Close Button (Top right) */}
            <div className="flex sm:hidden items-center space-x-1.5">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Switch View Mode + Switch Document Type + Close */}
          <div className="flex items-center justify-between sm:justify-end space-x-1.5 sm:space-x-2">
            
            {/* View Mode Switcher: Mobile Card vs A4 Print Paper */}
            <div className="flex bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${
                  viewMode === 'mobile'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="มุมมองการอ่านบนมือถือ สบายตา อ่านง่าย ไม่ต้องซูม"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>มุมมองมือถือ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${
                  viewMode === 'a4'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="มุมมองแบบร่างเอกสารราชการ A4"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>กระดาษ A4</span>
              </button>
            </div>

            {/* Out-of-Province Permit Switcher (if applicable) */}
            {isOutOfProvince && (
              <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveDocType('memo')}
                  className={`px-2 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeDocType === 'memo'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="ใบคำขอใช้รถยนต์ส่วนกลาง"
                >
                  <span>คำขอ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocType('out_province')}
                  className={`px-2 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
                    activeDocType === 'out_province'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="ใบอนุญาตออกนอกเขตจังหวัด"
                >
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>ออกนอกเขต</span>
                </button>
              </div>
            )}

            {/* Thai Numerals Toggle (desktop/tablet) */}
            <label className="hidden lg:flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-slate-700 text-slate-300 text-xs">
              <input
                type="checkbox"
                checked={useThaiNumerals}
                onChange={(e) => setUseThaiNumerals(e.target.checked)}
                className="rounded text-orange-500 focus:ring-0"
              />
              <span>เลขไทย</span>
            </label>

            {/* Desktop Close Button */}
            <button
              onClick={onClose}
              className="hidden sm:flex w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 items-center justify-center transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Download Toast Notification */}
        {pdfSuccessMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between no-print shadow-md shrink-0 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-100" />
              <span className="font-semibold">{pdfSuccessMessage}</span>
            </div>
            <button
              onClick={() => setPdfSuccessMessage(null)}
              className="text-emerald-200 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Approval Success Banner */}
        {booking.status === 'approved' && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-3 sm:px-5 py-2 text-xs flex items-center justify-between no-print shadow-xs border-b border-emerald-500/30 shrink-0">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span className="font-semibold truncate">
                {justApproved ? 'ลงนามอนุมัติเรียบร้อยแล้ว!' : 'คำขอนี้ได้รับการลงนามอนุมัติแล้ว'}
              </span>
            </div>
            <span className="bg-white/20 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
              มีผลสมบูรณ์
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Main Content Area: Tab 1 (Mobile Card View) vs Tab 2 (A4 Paper View)     */}
        {/* ========================================================================= */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden p-3 sm:p-6 flex flex-col items-center">
          
          {/* ===================================================================== */}
          {/* VIEW MODE 1: MOBILE APP DIGITAL PASSPORT / CARD VIEW                 */}
          {/* ===================================================================== */}
          {viewMode === 'mobile' && (
            <div className="w-full max-w-xl space-y-4 pb-4 animate-fadeIn">
              
              {/* Card 1: Official Header & Status Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500" />
                
                {/* Ministry & Document Title Header */}
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src="/logo_mculture.svg"
                      alt="กระทรวงวัฒนธรรม"
                      className="w-10 h-12 object-contain shrink-0"
                    />
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-orange-600 dark:text-orange-400 block uppercase">
                        สำนักงานวัฒนธรรมจังหวัดพังงา
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        ใบคำขอขอใช้รถยนต์ส่วนกลาง
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {memoRefDisplay}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-xl font-bold border flex items-center space-x-1 shrink-0 ${statusInfo.bg}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">วันที่ยื่นขอ</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {memoDateDisplay}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">รหัสคำขอในระบบ</span>
                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                      {booking.id}
                    </span>
                  </div>
                </div>

                {isOutOfProvince && (
                  <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-2.5 rounded-xl flex items-center space-x-2 text-xs text-teal-800 dark:text-teal-300">
                    <Compass className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-medium">
                      ภารกิจเดินทางออกนอกเขตจังหวัด (ปลายทาง: จังหวัด{booking.destProvince})
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: Mission & Travel Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                    รายละเอียดภารกิจและกำหนดการเดินทาง
                  </h5>
                </div>

                {/* Purpose */}
                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-orange-900 dark:text-orange-300 block">
                    วัตถุประสงค์การเดินทางราชการ
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {booking.purpose}
                  </p>
                </div>

                {/* Route & Destination */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">สถานที่ปลายทาง</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {booking.destination} {booking.destProvince && booking.destProvince !== 'พังงา' ? `(จ.${booking.destProvince})` : '(จ.พังงา)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Calendar className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">วันและเวลาเดินทาง</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatThaiDate(booking.date)} {booking.startTime ? `(เวลา ${booking.startTime} - ${booking.endTime || 'เสร็จภารกิจ'} น.)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Car className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">ยานพาหนะราชการ</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {booking.carName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <UserIcon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">พนักงานขับรถ / ผู้ควบคุมรถ</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {booking.driverType === 'self' ? `${booking.name} (ผู้ขอขับขี่ด้วยตนเอง)` : (booking.driverName || 'พนักงานขับรถประจำสำนักงาน')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Users className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">ผู้ร่วมเดินทาง ({booking.passengerCount || 1} คน)</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {booking.passengerNames || booking.name}
                      </span>
                    </div>
                  </div>

                  {booking.attachmentName && (
                    <div className="flex items-start space-x-2.5 pt-1">
                      <Paperclip className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">เอกสารแนบ</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 italic">
                          {booking.attachmentName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Requester Information & Signature */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <UserIcon className="w-4 h-4 text-orange-600" />
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                    ข้อมูลผู้ยื่นคำขอและการลงนาม
                  </h5>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ผู้ยื่นคำขอ</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {booking.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ตำแหน่ง</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {booking.position}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block">กลุ่มงาน / ฝ่าย</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {booking.department}
                    </span>
                  </div>
                </div>

                {/* Requester Signature Box */}
                <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <span className="text-[10px] text-slate-400 mb-1.5">ลายมือชื่อผู้ขอใช้รถยนต์</span>
                  {booking.requesterSignature ? (
                    <img
                      src={booking.requesterSignature}
                      alt={`ลายเซ็น ${booking.name}`}
                      className="h-12 max-w-[200px] object-contain mb-1"
                    />
                  ) : (
                    <div className="h-10 flex items-center justify-center text-xs text-slate-400 italic">
                      (ลงชื่อรับรองในระบบแล้ว)
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    ({booking.name})
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {booking.position}
                  </p>
                </div>
              </div>

              {/* Card 4: Director Order & Approval Signature */}
              <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs space-y-3.5 ${
                booking.status === 'approved'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : booking.status === 'rejected'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-4 h-4 ${
                      booking.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      ความเห็นและคำสั่งวัฒนธรรมจังหวัดพังงา
                    </h5>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    booking.status === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : booking.status === 'rejected'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {booking.status === 'approved' ? 'อนุมัติ' : booking.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอลงนาม'}
                  </span>
                </div>

                {/* Director's comment */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    ข้อสั่งการ / มอบหมาย:
                  </span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-black/5 dark:border-white/5 leading-relaxed">
                    &ldquo;{booking.directorComment || 'อนุมัติ มอบหมายให้ผู้ขอและพนักงานขับรถปฏิบัติหน้าที่ด้วยความระมัดระวังและปฏิบัติตามระเบียบของทางราชการ'}&rdquo;
                  </p>
                </div>

                {/* Director's Signature Box */}
                <div className="pt-1 flex flex-col items-center justify-center p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 mb-1">
                    ลายมือชื่อผู้อนุมัติ (วัฒนธรรมจังหวัดพังงา)
                  </span>
                  {booking.status === 'approved' ? (
                    <>
                      {booking.signatureData ? (
                        <img
                          src={booking.signatureData}
                          alt="ลายมือชื่อผู้อนุมัติ"
                          className="h-14 max-w-[200px] object-contain mb-1"
                        />
                      ) : (
                        <div className="font-serif italic text-blue-900 dark:text-blue-300 font-bold text-lg my-1">
                          (อุไรวรรณ แดงงาม)
                        </div>
                      )}
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        ({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        วัฒนธรรมจังหวัดพังงา
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        อนุมัติเมื่อ: {booking.approvedAt ? formatThaiDate(booking.approvedAt.split('T')[0], 'short') : memoDateDisplay}
                      </p>
                    </>
                  ) : (
                    <div className="py-2 text-center">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        อยู่ระหว่างรอการลงนามคำสั่งจากวัฒนธรรมจังหวัด
                      </p>
                      {onOpenSignatureModal && (
                        <button
                          onClick={() => onOpenSignatureModal(booking)}
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 mx-auto cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>ลงนามอนุมัติตอนนี้</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 5: Post-Mission Log & Logistics Inspection (if filled) */}
              {(booking.startMileage || booking.endMileage || booking.assetInspectionStatus === 'accepted') && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <Gauge className="w-4 h-4 text-teal-600" />
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      การบันทึกเลขไมล์และตรวจรับพัสดุ
                    </h5>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">ไมล์ออกเดินทาง</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {booking.startMileage ? `${booking.startMileage.toLocaleString()} กม.` : '-'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">ไมล์กลับถึง สนง.</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {booking.endMileage ? `${booking.endMileage.toLocaleString()} กม.` : '-'}
                      </span>
                    </div>
                    <div className="col-span-2 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl flex justify-between items-center text-teal-900 dark:text-teal-200">
                      <span className="font-medium">ระยะทางรวมทั้งสิ้น:</span>
                      <span className="font-bold text-sm font-mono">
                        {booking.totalDistance
                          ? `${booking.totalDistance.toLocaleString()} กิโลเมตร`
                          : booking.endMileage && booking.startMileage
                          ? `${(booking.endMileage - booking.startMileage).toLocaleString()} กิโลเมตร`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {booking.fuelRefilledLiters && booking.fuelRefilledLiters > 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                      การเติมน้ำมัน: {booking.fuelRefilledLiters} ลิตร ({booking.fuelRefilledCost?.toLocaleString() || 0} บาท)
                    </div>
                  )}

                  {/* Logistics Inspector Signature */}
                  {booking.assetInspectionSignature && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 mb-1">ผลการตรวจรับพัสดุ: สภาพปกติ</span>
                      <img
                        src={booking.assetInspectionSignature}
                        alt="ลายเซ็นเจ้าหน้าที่พัสดุ"
                        className="h-10 max-w-[160px] object-contain mb-1"
                      />
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        ({booking.assetInspectorName || 'เจ้าหน้าที่พัสดุ'})
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Out of Province Permit Card (if viewed) */}
              {isOutOfProvince && (
                <div className="bg-teal-50 dark:bg-teal-950/40 rounded-2xl p-4 sm:p-5 border border-teal-200 dark:border-teal-800 shadow-xs space-y-2.5 text-xs text-teal-900 dark:text-teal-200">
                  <div className="flex items-center space-x-2 pb-1.5 border-b border-teal-200 dark:border-teal-800">
                    <Compass className="w-4 h-4 text-teal-600" />
                    <h5 className="font-bold text-sm text-teal-950 dark:text-white">
                      ใบอนุญาตนำรถยนต์ส่วนกลางออกนอกเขตจังหวัด
                    </h5>
                  </div>
                  <p className="leading-relaxed">
                    อนุญาตให้ {booking.driverName || booking.name} นำรถยนต์ส่วนกลางหมายเลขทะเบียน <b>{booking.carName}</b> เดินทางไปราชการ ณ <b>{booking.destination} (จังหวัด{booking.destProvince})</b> ระหว่างวันที่ {memoDateDisplay} ถึง {booking.endDate ? formatThaiDate(booking.endDate, 'official') : memoDateDisplay}
                  </p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-300">
                    ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการใช้รถยนต์ราชการ พ.ศ. ๒๕๒๓ และที่แก้ไขเพิ่มเติม
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW MODE 2: OFFICIAL A4 PAPER VIEW (WITH RESPONSIVE AUTO-FIT)        */}
          {/* ===================================================================== */}
          <div className={`${viewMode === 'a4' ? 'flex flex-col items-center w-full' : 'absolute -left-[9999px] top-0 opacity-0 pointer-events-none'}`}>
            
            {/* A4 Zoom & Scale Bar (Visible when in A4 mode) */}
            {viewMode === 'a4' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3 mb-4 text-xs shrink-0 max-w-xl w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-medium">มุมมองกระดาษ A4:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {Math.round(a4Zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setA4Zoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="ย่อขนาด"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        if (window.innerWidth < 450) setA4Zoom(0.46);
                        else if (window.innerWidth < 768) setA4Zoom(0.60);
                        else setA4Zoom(1.0);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold cursor-pointer text-[11px]"
                    title="ปรับให้พอดีความกว้างหน้าจอ"
                  >
                    พอดีหน้าจอ
                  </button>
                  <button
                    type="button"
                    onClick={() => setA4Zoom((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="ขยายขนาด"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Scaled A4 Container */}
            <div
              className="flex justify-center transition-transform origin-top select-text"
              style={{
                transform: `scale(${a4Zoom})`,
                transformOrigin: 'top center',
                marginBottom: `${(1 - a4Zoom) * -1122}px` // Compensate height collapse when scaled
              }}
            >
              
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
                    {/* Heading */}
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

                    {/* Requester Signature */}
                    <div className="pt-2 flex justify-end text-center text-[13pt] leading-[1.35]">
                      <div className="w-[50%] flex flex-col items-center">
                        <div className="relative flex flex-col items-center justify-end h-13">
                          {booking.requesterSignature ? (
                            <img
                              src={booking.requesterSignature}
                              alt={`ลายเซ็น ${booking.name}`}
                              className="h-11 max-w-[170px] object-contain -mb-1.5 z-10"
                            />
                          ) : null}
                          <p className="font-normal text-[12pt] text-black leading-none">
                            (ลงชื่อ).......................................................
                          </p>
                        </div>
                        <p className="font-normal mt-0.5">({booking.name})</p>
                        <p className="text-[12pt] text-black/90">{booking.position}</p>
                      </div>
                    </div>
                  </div>

                  {/* Director Approval / Order Section */}
                  <div className="pt-2 border-t border-dashed border-black/70 mt-1.5 space-y-1 text-[12pt] leading-[1.3]">
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

                      {/* Director Signature Box */}
                      <div className="pt-1 flex justify-end text-center text-[12pt] leading-[1.3]">
                        <div className="w-[50%] flex flex-col items-center">
                          {booking.status === 'approved' ? (
                            <div className="flex flex-col items-center">
                              <div className="relative flex flex-col items-center justify-end h-13">
                                {booking.signatureData ? (
                                  <img
                                    src={booking.signatureData}
                                    alt="ลายมือชื่อผู้อนุมัติ"
                                    className="h-11 max-w-[170px] object-contain -mb-1.5 z-10"
                                  />
                                ) : (
                                  <div className="font-serif italic text-blue-900 font-bold text-[13pt] tracking-wider px-2 -mb-1 z-10">
                                    (อุไรวรรณ แดงงาม)
                                  </div>
                                )}
                                <p className="font-normal text-[11.5pt] text-black leading-none">
                                  (ลงชื่อ).......................................................
                                </p>
                              </div>
                              <p className="font-bold mt-0.5">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                              <p className="text-[11pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
                              <p className="text-[9pt] text-black/70 mt-0.5">
                                {booking.approvedAt ? formatThaiDate(booking.approvedAt.split('T')[0], 'short') : memoDateDisplay}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="flex flex-col items-center justify-end h-13">
                                <p className="font-normal text-[11.5pt] text-black mb-1">
                                  (ลงชื่อ).......................................................
                                </p>
                              </div>
                              <p className="font-bold mt-0.5">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                              <p className="text-[11pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Mileage & Inspection */}
                  <div className="mt-2 border border-black text-[10.5pt] leading-[1.3] bg-white">
                    <div className="bg-slate-100/80 border-b border-black px-2.5 py-1 flex items-center justify-between">
                      <span className="font-bold text-[11.5pt] text-black">
                        การบันทึกการใช้ยานพาหนะและผลการตรวจรับพัสดุ (เมื่อเสร็จสิ้นภารกิจ)
                      </span>
                      <span className="text-[9.5pt] text-black/80 font-normal">
                        {booking.assetInspectionStatus === 'accepted' ? (
                          <span className="font-bold text-black">✓ ตรวจรับพัสดุเรียบร้อยแล้ว</span>
                        ) : (
                          <span>งานพัสดุและยานพาหนะ ฝ่ายบริหารทั่วไป</span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 divide-x divide-black">
                      <div className="col-span-7 p-2 space-y-1.5 flex flex-col justify-between">
                        <div className="space-y-1 text-[10.5pt]">
                          <div className="flex justify-between items-baseline border-b border-dotted border-black/40 pb-0.5">
                            <span className="font-bold">๑. เลขไมล์เมื่อออกเดินทาง:</span>
                            <span className="font-bold font-mono text-black text-[11pt]">
                              {booking.startMileage ? `${num(booking.startMileage.toLocaleString())} กม.` : '........................ กม.'}
                            </span>
                            <span className="text-[9.5pt] text-black/70">
                              {booking.startMileageTime ? `(เวลา ${num(booking.startMileageTime)} น.)` : '(เวลา .............. น.)'}
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline border-b border-dotted border-black/40 pb-0.5">
                            <span className="font-bold">๒. เลขไมล์เมื่อกลับถึงสำนักงาน:</span>
                            <span className="font-bold font-mono text-black text-[11pt]">
                              {booking.endMileage ? `${num(booking.endMileage.toLocaleString())} กม.` : '........................ กม.'}
                            </span>
                            <span className="text-[9.5pt] text-black/70">
                              {booking.endMileageTime ? `(เวลา ${num(booking.endMileageTime)} น.)` : '(เวลา .............. น.)'}
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline pt-0.5">
                            <span className="font-bold">ระยะทางรวมทั้งสิ้น:</span>
                            <span className="font-bold font-mono text-[11pt] text-black">
                              {booking.totalDistance
                                ? `${num(booking.totalDistance.toLocaleString())} กิโลเมตร`
                                : booking.endMileage && booking.startMileage
                                ? `${num((booking.endMileage - booking.startMileage).toLocaleString())} กิโลเมตร`
                                : '........................ กิโลเมตร'}
                            </span>
                          </div>
                        </div>

                        <div className="text-[9.5pt] pt-1 border-t border-black/30 flex justify-between items-center text-black/90">
                          <span>
                            การเติมน้ำมัน:{' '}
                            {booking.fuelRefilledLiters && booking.fuelRefilledLiters > 0
                              ? `${num(booking.fuelRefilledLiters)} ลิตร (${num(booking.fuelRefilledCost?.toLocaleString() || 0)} บาท)`
                              : 'ไม่มีการเติมระหว่างทาง'}
                          </span>
                          {booking.driverNotes && (
                            <span className="italic truncate max-w-[150px]" title={booking.driverNotes}>
                              หมายเหตุ: {booking.driverNotes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-5 p-2 flex flex-col justify-between text-center">
                        <div className="text-left text-[9.5pt] space-y-0.5 pb-1 border-b border-dotted border-black/40">
                          <span className="font-bold block text-[10pt]">ผลการตรวจรับสภาพรถยนต์:</span>
                          <div className="flex items-center space-x-2 text-[9pt]">
                            <span>
                              {booking.assetInspectionVehicleCondition === 'normal' || !booking.assetInspectionVehicleCondition ? '☑' : '☐'} สภาพปกติ
                            </span>
                            <span>
                              {booking.assetInspectionVehicleCondition === 'needs_cleaning' ? '☑' : '☐'} ควรทำความสะอาด
                            </span>
                            <span>
                              {booking.assetInspectionVehicleCondition === 'needs_repair' ? '☑' : '☐'} ส่งซ่อม
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col items-center">
                          <div className="relative flex flex-col items-center justify-end h-11">
                            {booking.assetInspectionSignature ? (
                              <img
                                src={booking.assetInspectionSignature}
                                alt="ลายเซ็นผู้ตรวจรับ"
                                className="h-10 max-w-[140px] object-contain -mb-1.5 z-10"
                              />
                            ) : null}
                            <p className="font-normal text-[10.5pt] text-black leading-none">
                              (ลงชื่อ).......................................................
                            </p>
                          </div>
                          <p className="font-bold text-[10.5pt] mt-0.5">
                            ({booking.assetInspectorName || '..........................................................'})
                          </p>
                          <p className="text-[9.5pt] text-black/80">
                            {booking.assetInspectorPosition || 'เจ้าหน้าที่พัสดุ / ผู้ตรวจรับ'}
                          </p>
                          <p className="text-[9pt] text-black/60">
                            วันที่ {booking.assetInspectedAt ? formatThaiDate(booking.assetInspectedAt.split('T')[0], 'short') : '......./......./.......'}
                          </p>
                        </div>
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
                    <div className="flex flex-col items-center justify-center mb-4">
                      <h2 className="font-bold text-[18pt] leading-tight text-center">
                        ใบอนุญาตนำรถยนต์ส่วนกลางออกนอกเขตจังหวัด
                      </h2>
                      <p className="text-[12pt] text-black/80 text-center">
                        ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการใช้รถยนต์ราชการ พ.ศ. ๒๕๒๓ และที่แก้ไขเพิ่มเติม
                      </p>
                    </div>

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

                  <div className="pt-4 flex justify-end text-center text-[13pt] leading-[1.35]">
                    <div className="w-[50%] flex flex-col items-center">
                      {booking.status === 'approved' ? (
                        <div className="flex flex-col items-center">
                          <div className="relative flex flex-col items-center justify-end h-14">
                            {booking.signatureData ? (
                              <img
                                src={booking.signatureData}
                                alt="ลายมือชื่อผู้อนุญาต"
                                className="h-12 max-w-[180px] object-contain -mb-1.5 z-10"
                              />
                            ) : (
                              <div className="font-serif italic text-blue-900 font-bold text-[14pt] tracking-wider px-3 -mb-1 z-10">
                                (อุไรวรรณ แดงงาม)
                              </div>
                            )}
                            <p className="font-normal text-[12pt] text-black leading-none">
                              (ลงชื่อ).......................................................ผู้อนุญาต
                            </p>
                          </div>
                          <p className="font-bold mt-0.5">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                          <p className="text-[12pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="flex flex-col items-center justify-end h-14">
                            <p className="font-normal text-[12pt] text-black mb-1">
                              (ลงชื่อ).......................................................ผู้อนุญาต
                            </p>
                          </div>
                          <p className="font-bold mt-0.5">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                          <p className="text-[12pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* Modal Bottom Action Bar (Fixed, Touch-Optimized with Safe Area Padding)   */}
        {/* ========================================================================= */}
        <div className="px-3 sm:px-6 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center no-print gap-2 shrink-0 pb-safe">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <span>คำขอ:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{booking.id}</span>
            {isOutOfProvince && (
              <span className="hidden sm:inline-block bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ภารกิจข้ามเขตจังหวัด ({booking.destProvince})
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Quick Director Approval Button if pending */}
            {onOpenSignatureModal && booking.status === 'pending' && (
              <button
                type="button"
                onClick={() => onOpenSignatureModal(booking)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>ลงนามอนุมัติ</span>
              </button>
            )}

            {/* Quick Inspection Button if completed */}
            {onOpenInspectionModal && (booking.status === 'completed' || booking.endMileage) && (
              <button
                type="button"
                onClick={() => onOpenInspectionModal(booking)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                title="เจ้าหน้าที่พัสดุตรวจรับรถและลงชื่อ"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ตรวจรับพัสดุ</span>
              </button>
            )}

            {/* Save PDF button */}
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              title="บันทึกเอกสารเป็นไฟล์ PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>บันทึก PDF</span>
                </>
              )}
            </button>

            {/* Print document button */}
            <button
              type="button"
              id="btnPrintMemo"
              data-print-hide="true"
              onClick={handlePrint}
              className="flex-1 sm:flex-none no-print print-hide px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              title="พิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง / เอกสารราชการ (A4)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบคำขอ</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
