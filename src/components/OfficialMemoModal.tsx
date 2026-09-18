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
  Share2,
  ChevronDown,
  Table,
  FileSpreadsheet,
  Layers,
  Eye
} from 'lucide-react';

export type OfficialDocType = 'memo' | 'register' | 'out_province';

interface OfficialMemoModalProps {
  booking: BookingRequest | null;
  onClose: () => void;
  justApproved?: boolean;
  onOpenSignatureModal?: (booking: BookingRequest) => void;
  onOpenInspectionModal?: (booking: BookingRequest) => void;
  allBookings?: BookingRequest[];
  initialDocType?: OfficialDocType;
}

export const OfficialMemoModal: React.FC<OfficialMemoModalProps> = ({
  booking,
  onClose,
  justApproved = false,
  onOpenSignatureModal,
  onOpenInspectionModal,
  allBookings = [],
  initialDocType
}) => {
  const [useThaiNumerals, setUseThaiNumerals] = useState(true);
  const [activeDocType, setActiveDocType] = useState<OfficialDocType>(
    initialDocType || (booking && booking.destProvince && booking.destProvince !== 'พังงา' ? 'out_province' : 'memo')
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

  const isOutOfProvince = booking?.destProvince && booking.destProvince !== 'พังงา';

  const num = (val: string | number) => (useThaiNumerals ? toThaiNumerals(val) : val);

  const formattedDate = booking ? formatThaiDate(booking.date, 'official') : '';
  const memoDateDisplay = useThaiNumerals ? toThaiNumerals(formattedDate) : formattedDate;

  // Phone number: ส่วนราชการ: สำนักงานวัฒนธรรมจังหวัดพังงา โทร. 0 7648 1596
  const phoneDisplay = useThaiNumerals ? '๐ ๗๖๔๘ ๑๕๙๖' : '0 7648 1596';

  // Memo reference: ที่: พง0032(พิเศษ)/...
  const rawMemoSeq = (booking?.memoNo || booking?.id || '')
    .replace(/^พง\s*0030\.1\//, '')
    .replace(/^พง\s*0032\(พิเศษ\)\//, '')
    .replace(/^พง\s*๐๐๓๐\.๑\//, '')
    .replace(/^พง\s*๐๐๓๒\(พิเศษ\)\//, '')
    .trim();

  const memoRefDisplay = useThaiNumerals
    ? `พง ๐๐๓๒(พิเศษ)/${toThaiNumerals(rawMemoSeq)}`
    : `พง0032(พิเศษ)/${rawMemoSeq.replace(/[๐-๙]/g, (d) => ['0','1','2','3','4','5','6','7','8','9'][['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'].indexOf(d)])}`;

  const isLandscape = activeDocType === 'register';

  // Find all mission records for this vehicle if allBookings is available
  const vehicleBookings = React.useMemo(() => {
    if (!booking) return [];
    if (!allBookings || allBookings.length === 0) return [booking];
    // Match by carId when available and fall back to a normalised car name, so a
    // renamed vehicle (or a record saved with a different name spelling) does not
    // silently drop missions from the printed ledger/memo.
    const SPACE = String.fromCharCode(32);
    const normalise = (value?: string) => (value || '').trim().split(new RegExp('\\s+')).join(SPACE);
    const targetCarId = booking.carId;
    const targetCarName = normalise(booking.carName);
    const list = allBookings.filter((b) => {
      if (targetCarId && b.carId) return b.carId === targetCarId;
      return normalise(b.carName) === targetCarName;
    });
    // The current booking must always appear, even if it does not match the filter.
    if (list.length === 0) return [booking];
    if (!list.some((b) => b.id === booking.id)) list.push(booking);
    return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allBookings, booking]);

  const totalDistanceAll = React.useMemo(() => {
    return vehicleBookings.reduce((sum, b) => {
      const dist = b.totalDistance || (b.endMileage && b.startMileage ? b.endMileage - b.startMileage : 0);
      return sum + (dist > 0 ? dist : 0);
    }, 0);
  }, [vehicleBookings]);

  const totalFuelLitersAll = React.useMemo(() => {
    return vehicleBookings.reduce((sum, b) => sum + (b.fuelRefilledLiters || 0), 0);
  }, [vehicleBookings]);

  const totalFuelCostAll = React.useMemo(() => {
    return vehicleBookings.reduce((sum, b) => sum + (b.fuelRefilledCost || 0), 0);
  }, [vehicleBookings]);

  if (!booking) return null;

  const activeDocId = activeDocType === 'memo'
    ? 'printMemoArea'
    : activeDocType === 'register'
    ? 'printRegisterSingleArea'
    : 'printPermitArea';

  const docTitle = activeDocType === 'memo'
    ? `ใบคำขอใช้รถยนต์ส่วนกลาง_${memoRefDisplay.replace(/[\/\\()]/g, '_')}`
    : activeDocType === 'register'
    ? `ทะเบียนคุมการใช้รถยนต์_${(booking.carName || 'ราชการ').replace(/[\/\\()\s]/g, '_')}_${memoRefDisplay.replace(/[\/\\()]/g, '_')}`
    : `ใบอนุญาตออกนอกเขตจังหวัด_${memoRefDisplay.replace(/[\/\\()]/g, '_')}`;

  const resetZoomToFit = () => {
    if (typeof window !== 'undefined') {
      const isLand = activeDocType === 'register';
      if (window.innerWidth < 450) setA4Zoom(isLand ? 0.35 : 0.46);
      else if (window.innerWidth < 768) setA4Zoom(isLand ? 0.48 : 0.60);
      else if (window.innerWidth < 1200) setA4Zoom(isLand ? 0.72 : 0.85);
      else setA4Zoom(isLand ? 0.85 : 1.0);
    }
  };

  const handlePrint = () => {
    printElementById(activeDocId, {
      documentTitle: docTitle,
      orientation: isLandscape ? 'landscape' : 'portrait'
    });
  };

  const handleSavePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const safeName = `${docTitle}_${booking.id}.pdf`;
      await exportElementToPdf(activeDocId, {
        fileName: safeName,
        orientation: isLandscape ? 'landscape' : 'portrait'
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
    <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-3 md:p-4 overflow-hidden">
      <div className={`bg-slate-100 dark:bg-slate-900 w-full ${activeDocType === 'register' ? 'max-w-6xl' : 'max-w-4xl'} h-full sm:h-[95vh] flex flex-col rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 transition-all duration-200`}>
        
        {/* ========================================================================= */}
        {/* Modal Top Bar - Highly Optimized for Mobile & Desktop                     */}
        {/* ========================================================================= */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center no-print gap-2 border-b border-slate-800 shrink-0">
          {/* Top Row: Title + Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                activeDocType === 'register'
                  ? 'bg-teal-500/20 text-teal-400'
                  : activeDocType === 'out_province'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {activeDocType === 'register' ? (
                  <Car className="w-4 h-4" />
                ) : activeDocType === 'out_province' ? (
                  <Compass className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-white truncate">
                    {activeDocType === 'memo'
                      ? 'ใบคำขอใช้รถยนต์ส่วนกลาง'
                      : activeDocType === 'register'
                      ? 'ทะเบียนคุมการใช้รถยนต์ราชการ'
                      : 'ใบอนุญาตออกนอกเขตจังหวัด'}
                  </h3>
                  <span className="font-mono text-[10px] bg-orange-600/30 text-orange-300 border border-orange-500/30 px-1.5 py-0.2 rounded shrink-0">
                    {activeDocType === 'register' ? (booking.carName || booking.id) : booking.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeDocType === 'register'
                    ? `งานพัสดุและยานพาหนะ ฝ่ายบริหารทั่วไป (เลขที่คำขอ: ${booking.memoNo || booking.id})`
                    : booking.memoNo
                    ? `บันทึกข้อความที่ ${booking.memoNo}`
                    : 'สำนักงานวัฒนธรรมจังหวัดพังงา'}
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

          {/* Controls Bar: Document Type Dropdown + Switch View Mode + Thai Numerals + Close */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
            
            {/* Document Type Dropdown Selector */}
            <div className="flex items-center space-x-1">
              <label htmlFor="officialDocTypeSelect" className="text-[11px] font-bold text-slate-300 shrink-0 hidden md:inline">
                รูปแบบเอกสาร:
              </label>
              <div className="relative">
                <select
                  id="officialDocTypeSelect"
                  value={activeDocType}
                  onChange={(e) => setActiveDocType(e.target.value as OfficialDocType)}
                  className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-xl pl-2.5 pr-7 py-1.5 border border-slate-700 hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none shadow-xs"
                  title="เลือกรูปแบบเอกสารที่ต้องการดูหรือพิมพ์"
                >
                  <option value="memo">📄 ใบคำขอใช้รถยนต์ (แนวตั้ง A4)</option>
                  <option value="register">📋 ทะเบียนคุมรถยนต์ (แนวนอน A4)</option>
                  {isOutOfProvince && (
                    <option value="out_province">🧭 ใบอนุญาตออกนอกเขตจังหวัด (แนวตั้ง A4)</option>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* View Mode Switcher: Mobile Card vs A4 Print Paper */}
            <div className="flex bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2 py-1.5 sm:px-2.5 rounded-lg font-semibold flex items-center space-x-1 sm:space-x-1.5 transition cursor-pointer active:scale-95 ${
                  viewMode === 'mobile'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="มุมมองการอ่านบนมือถือ สบายตา อ่านง่าย ไม่ต้องซูม"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>มือถือ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-2 py-1.5 sm:px-2.5 rounded-lg font-semibold flex items-center space-x-1 sm:space-x-1.5 transition cursor-pointer active:scale-95 ${
                  viewMode === 'a4'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="มุมมองแบบร่างเอกสารราชการ A4"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>พิมพ์ A4</span>
              </button>
            </div>

            {/* Thai Numerals Toggle (Mobile, Tablet & Desktop) */}
            <button
              type="button"
              onClick={() => setUseThaiNumerals(!useThaiNumerals)}
              className={`px-2.5 py-1 sm:py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 text-xs transition cursor-pointer active:scale-95 border ${
                useThaiNumerals
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="สลับการแสดงผลตัวเลขไทย (๐ ๑ ๒ ๓) และเลขอารบิก (0 1 2 3)"
            >
              <span className="font-bold text-xs">{useThaiNumerals ? '๑๒๓' : '123'}</span>
              <span>{useThaiNumerals ? 'เลขไทย' : 'เลขอารบิก'}</span>
            </button>

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
            activeDocType === 'register' ? (
              <div className="w-full max-w-xl space-y-4 pb-4 animate-fadeIn">
                {/* Register Header Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60 pt-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          ทะเบียนคุมการใช้ยานพาหนะราชการ
                        </span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                          {booking.carName}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                      งานพัสดุและยานพาหนะ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">เลขที่คำขอ</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{booking.memoNo || booking.id}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">วันที่ปฏิบัติภารกิจ</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formattedDate}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">ผู้ขอใช้รถ</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{booking.name}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">พนักงานขับรถ</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {booking.driverType === 'self' ? `${booking.name} (ขับเอง)` : booking.driverName || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mileage & Odometer Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <Gauge className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      บันทึกเลขไมล์และระยะทาง
                    </h5>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">เลขไมล์ก่อนเดินทาง</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
                        {booking.startMileage ? `${booking.startMileage.toLocaleString()} กม.` : 'ยังไม่บันทึก'}
                      </span>
                      {booking.startMileageTime && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">เวลา {booking.startMileageTime} น.</span>
                      )}
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">เลขไมล์หลังเดินทาง</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
                        {booking.endMileage ? `${booking.endMileage.toLocaleString()} กม.` : 'ยังไม่บันทึก'}
                      </span>
                      {booking.endMileageTime && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">เวลา {booking.endMileageTime} น.</span>
                      )}
                    </div>
                    <div className="col-span-2 p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl flex justify-between items-center text-teal-900 dark:text-teal-200 border border-teal-200/50 dark:border-teal-800/50">
                      <span className="font-medium text-xs">ระยะทางสุทธิของภารกิจนี้:</span>
                      <span className="font-bold text-base font-mono">
                        {booking.totalDistance
                          ? `${booking.totalDistance.toLocaleString()} กม.`
                          : booking.endMileage && booking.startMileage
                          ? `${(booking.endMileage - booking.startMileage).toLocaleString()} กม.`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fuel & Inspection Details */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      น้ำมันเชื้อเพลิงและการตรวจรับพัสดุ
                    </h5>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-slate-600 dark:text-slate-400">การเติมน้ำมัน:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {booking.fuelRefilledLiters
                          ? `${booking.fuelRefilledLiters} ลิตร (${booking.fuelRefilledCost?.toLocaleString() || 0} บาท)`
                          : 'ไม่มีการเติมระหว่างทาง'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <span className="text-slate-600 dark:text-slate-400">ผลตรวจรับสภาพยานพาหนะ:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {booking.assetInspectionVehicleCondition === 'normal' || !booking.assetInspectionVehicleCondition
                          ? '✓ สภาพปกติ เรียบร้อย'
                          : booking.assetInspectionVehicleCondition === 'needs_cleaning'
                          ? 'ควรทำความสะอาด'
                          : 'ต้องส่งซ่อมบำรุง'}
                      </span>
                    </div>
                    {booking.assetInspectionSignature && (
                      <div className="pt-2 flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 mb-1">ลายเซ็นเจ้าหน้าที่พัสดุผู้ตรวจรับ:</span>
                        <img
                          src={booking.assetInspectionSignature}
                          alt="ลายเซ็นเจ้าหน้าที่พัสดุ"
                          className="h-10 max-w-[160px] object-contain mb-1"
                        />
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          ({booking.assetInspectorName || 'เจ้าหน้าที่พัสดุ'})
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {booking.assetInspectorPosition || 'เจ้าพนักงานพัสดุปฏิบัติงาน'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle History List (Other missions for this car) */}
                {vehicleBookings.length > 1 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center space-x-2">
                        <Table className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                          รายการบันทึกในทะเบียนคุม ({vehicleBookings.length} เที่ยว)
                        </h5>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">รถ {booking.carName}</span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                      {vehicleBookings.map((b, idx) => (
                        <div
                          key={b.id}
                          className={`p-2.5 rounded-xl border transition ${
                            b.id === booking.id
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold flex items-center space-x-1">
                              <span>{idx + 1}. {formatThaiDate(b.date, 'short')}</span>
                              {b.id === booking.id && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                                  คำขอนี้
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                              {b.memoNo || b.id}
                            </span>
                          </div>
                          <p className="text-[11px] truncate">
                            <span className="text-slate-400">ภารกิจ: </span>{b.destination} ({b.purpose})
                          </p>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-black/5 dark:border-white/5">
                            <span>ผู้ขอ: {b.name}</span>
                            <span>ระยะทาง: {b.totalDistance ? `${b.totalDistance} กม.` : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatures Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    การลงลายมือชื่อกำกับ 3 ฝ่าย
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 block mb-1">ผู้ส่งมอบ (พนักงานขับรถ)</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-2">({booking.driverName || booking.name})</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {booking.driverType === 'self' ? 'ผู้ขอขับขี่เอง' : 'พนักงานขับรถ'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 block mb-1">ผู้ตรวจรับ (เจ้าหน้าที่พัสดุ)</span>
                      {booking.assetInspectionSignature ? (
                        <img src={booking.assetInspectionSignature} alt="ลายเซ็น" className="h-8 max-w-[120px] object-contain mx-auto my-1" />
                      ) : (
                        <div className="h-8 flex items-center justify-center text-[10px] text-slate-400">-</div>
                      )}
                      <p className="font-semibold text-slate-800 dark:text-slate-200">({booking.assetInspectorName || 'เจ้าหน้าที่พัสดุ'})</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 block mb-1">ผู้อนุมัติ (วัฒนธรรมจังหวัด)</span>
                      {booking.signatureData ? (
                        <img src={booking.signatureData} alt="ลายเซ็น" className="h-8 max-w-[120px] object-contain mx-auto my-1" />
                      ) : (
                        <div className="h-8 flex items-center justify-center text-[10px] text-slate-400">-</div>
                      )}
                      <p className="font-semibold text-slate-800 dark:text-slate-200">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )
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
                  {isLandscape && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                      แนวนอน (Landscape)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setA4Zoom((prev) => Math.max(0.35, Number((prev - 0.1).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="ย่อขนาด"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => resetZoomToFit()}
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
                marginBottom: `${(1 - a4Zoom) * (isLandscape ? -794 : -1122)}px` // Compensate height collapse when scaled
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
                    paddingTop: '2.5cm',
                    paddingRight: '2.0cm',
                    paddingBottom: '2.5cm',
                    paddingLeft: '3.0cm',
                    overflow: 'hidden',
                    fontSize: '10pt',
                    lineHeight: 1.25,
                    fontFamily: "'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', Tahoma, sans-serif",
                    color: '#000000',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Top and Body Section */}
                  <div className="flex flex-col">
                    {/* Heading */}
                    <div className="text-center font-bold text-[16pt] leading-tight mb-2">
                      ใบคำขอขอใช้รถยนต์ส่วนกลาง
                    </div>

                    {/* Office & Memo Reference Block */}
                    <div className="border-b border-black pb-1 mb-2 text-[11.5pt] leading-[1.3]">
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
                    <div className="space-y-0.5 mb-2 text-[11.5pt] leading-[1.3]">
                      <p>
                        <span className="font-bold">เรื่อง:</span> ขออนุมัติใช้รถยนต์ราชการเพื่อปฏิบัติภารกิจราชการ
                      </p>
                      <p>
                        <span className="font-bold">เรียน:</span> วัฒนธรรมจังหวัดพังงา
                      </p>
                    </div>

                    {/* Body Text */}
                    <div className="space-y-2 text-justify text-[11.5pt] leading-[1.4] font-normal" style={{ textIndent: '2.5cm' }}>
                      <p>
                        ด้วยข้าพเจ้า {booking.name} ตำแหน่ง {booking.position} มีความจำเป็นต้องเดินทางไปปฏิบัติภารกิจราชการเพื่อ {booking.purpose} ณ สถานที่ {booking.destination} ในวันที่ {memoDateDisplay}{' '}
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
                        {booking.secondaryDriverName ? ` และมี ${booking.secondaryDriverName}${booking.secondaryDriverPosition ? ` (${booking.secondaryDriverPosition})` : ''} เป็นผู้ช่วยขับขี่/ผู้ขับขี่เสริม` : ''}
                      </p>



                      <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>
                    </div>

                    {/* Requester Signature */}
                    <div className="pt-2 flex justify-end text-center text-[11.5pt] leading-[1.3] print-keep-together">
                      <div className="w-[50%] flex flex-col items-center">
                        <div className="relative flex flex-col items-center justify-end h-22">
                          {booking.requesterSignature ? (
                            <img
                              src={booking.requesterSignature}
                              alt={`ลายเซ็น ${booking.name}`}
                              className="h-[4.5rem] max-w-[240px] object-contain -mb-2 z-10"
                            />
                          ) : null}
                          <p className="font-normal text-[11pt] text-black leading-none">
                            (ลงชื่อ).......................................................
                          </p>
                        </div>
                        <p className="font-normal mt-0.5">({booking.name})</p>
                        <p className="text-[11pt] text-black/90">{booking.position}</p>
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
                      <div className="pt-1 flex justify-end text-center text-[11.5pt] leading-[1.3] print-keep-together">
                        <div className="w-[50%] flex flex-col items-center">
                          {booking.status === 'approved' ? (
                            <div className="flex flex-col items-center">
                              <div className="relative flex flex-col items-center justify-end h-22">
                                {booking.signatureData ? (
                                  <img
                                    src={booking.signatureData}
                                    alt="ลายมือชื่อผู้อนุมัติ"
                                    className="h-[4.5rem] max-w-[240px] object-contain -mb-2 z-10"
                                  />
                                ) : (
                                  <div className="font-serif italic text-blue-900 font-bold text-[12pt] tracking-wider px-2 -mb-1 z-10">
                                    (อุไรวรรณ แดงงาม)
                                  </div>
                                )}
                                <p className="font-normal text-[11pt] text-black leading-none">
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
                              <div className="flex flex-col items-center justify-end h-22">
                                <p className="font-normal text-[11pt] text-black mb-1">
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
                              {booking.assetInspectionVehicleCondition === 'needs_maintenance' ? '☑' : '☐'} ส่งซ่อม
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col items-center">
                          <div className="relative flex flex-col items-center justify-end h-22">
                            {booking.assetInspectionSignature ? (
                              <img
                                src={booking.assetInspectionSignature}
                                alt="ลายเซ็นผู้ตรวจรับ"
                                className="h-[4.5rem] max-w-[220px] object-contain -mb-2 z-10"
                              />
                            ) : null}
                            <p className="font-normal text-[11pt] text-black leading-none">
                              (ลงชื่อ).......................................................
                            </p>
                          </div>
                          <p className="font-bold text-[11pt] mt-0.5">
                            ({booking.assetInspectorName || '..........................................................'})
                          </p>
                          <p className="text-[10pt] text-black/80">
                            {booking.assetInspectorPosition || 'เจ้าหน้าที่พัสดุ / ผู้ตรวจรับ'}
                          </p>
                          <p className="text-[9.5pt] text-black/60">
                            วันที่ {booking.assetInspectedAt ? formatThaiDate(booking.assetInspectedAt.split('T')[0], 'short') : '......./......./.......'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Document 2: ทะเบียนคุมการใช้รถยนต์ส่วนกลางและรถประจำตำแหน่ง (A4 แนวนอน) */}
              {activeDocType === 'register' && (
                <div
                  id="printRegisterSingleArea"
                  className="bg-white text-black font-sarabun shadow-2xl rounded-sm border border-slate-300 box-border flex flex-col justify-between shrink-0 select-text"
                  style={{
                    width: '297mm',
                    minWidth: '297mm',
                    maxWidth: '297mm',
                    height: '210mm',
                    minHeight: '210mm',
                    maxHeight: '210mm',
                    boxSizing: 'border-box',
                    paddingTop: '1.2cm',
                    paddingRight: '1.5cm',
                    paddingBottom: '1.2cm',
                    paddingLeft: '1.5cm',
                    overflow: 'hidden',
                    fontSize: '11pt',
                    lineHeight: 1.35,
                    fontFamily: "'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', Tahoma, sans-serif",
                    color: '#000000',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div className="flex flex-col flex-grow">
                    {/* Official Document Header */}
                    <div className="text-center pb-2 mb-2 border-b-2 border-black">
                      <div className="text-[10pt] tracking-wider uppercase text-black font-bold">
                        แบบฟอร์มฝ่ายบริหารทั่วไป งานพัสดุและยานพาหนะ
                      </div>
                      <h1 className="text-[15pt] font-bold text-black tracking-tight leading-snug">
                        ทะเบียนคุมการใช้รถยนต์ส่วนกลางและรถประจำตำแหน่ง
                      </h1>
                      <h2 className="text-[12pt] font-semibold text-black leading-snug">
                        สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม
                      </h2>
                      <div className="flex justify-center items-center gap-6 text-[10pt] text-black pt-1">
                        <span>
                          ยานพาหนะ: <strong>{booking.carName}</strong>
                        </span>
                        <span>
                          เลขที่คำขออ้างอิง: <strong>{memoRefDisplay}</strong>
                        </span>
                        <span>
                          ประจำปีงบประมาณ พ.ศ. <strong>{num(new Date(booking.date).getFullYear() + 543)}</strong>
                        </span>
                        <span>
                          วันที่ออกเอกสาร: <strong>{memoDateDisplay}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Registry Table */}
                    <div className="flex-grow overflow-hidden">
                      <table className="w-full table-fixed border-collapse border border-black text-[9pt] leading-tight">
                        <colgroup>
                          <col style={{ width: '4%' }} />
                          <col style={{ width: '8.5%' }} />
                          <col style={{ width: '9%' }} />
                          <col style={{ width: '11%' }} />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '14%' }} />
                          <col style={{ width: '7.5%' }} />
                          <col style={{ width: '6.5%' }} />
                          <col style={{ width: '6.5%' }} />
                          <col style={{ width: '6%' }} />
                          <col style={{ width: '7%' }} />
                          <col style={{ width: '7%' }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-black">
                            <th className="border border-black p-1 text-center font-bold">ลำดับ</th>
                            <th className="border border-black p-1 text-center font-bold">วัน เดือน ปี</th>
                            <th className="border border-black p-1 text-center font-bold">เลขที่ใบขอรถ</th>
                            <th className="border border-black p-1 text-left font-bold pl-1.5">ผู้ขอใช้รถ / สังกัด</th>
                            <th className="border border-black p-1 text-left font-bold pl-1.5">สถานที่ไปราชการ</th>
                            <th className="border border-black p-1 text-left font-bold pl-1.5">วัตถุประสงค์ / ภารกิจ</th>
                            <th className="border border-black p-1 text-center font-bold">เวลาไป-กลับ</th>
                            <th className="border border-black p-1 text-right font-bold pr-1">ไมล์ไป</th>
                            <th className="border border-black p-1 text-right font-bold pr-1">ไมล์กลับ</th>
                            <th className="border border-black p-1 text-right font-bold pr-1">รวม (กม.)</th>
                            <th className="border border-black p-1 text-center font-bold">น้ำมัน (ลิตร/บาท)</th>
                            <th className="border border-black p-1 text-center font-bold">ลายเซ็นผู้ขับรถ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleBookings.map((b, idx) => {
                            const isCurrent = b.id === booking.id;
                            const distance = b.totalDistance
                              ? b.totalDistance
                              : (b.endMileage && b.startMileage)
                              ? (b.endMileage - b.startMileage)
                              : null;
                            return (
                              <tr
                                key={b.id}
                                className={`border-b border-black ${isCurrent ? 'bg-amber-50/80 font-medium' : ''}`}
                              >
                                <td className="border border-black p-1 text-center font-mono">
                                  {num(idx + 1)}
                                </td>
                                <td className="border border-black p-1 text-center">
                                  {formatThaiDate(b.date, 'short')}
                                </td>
                                <td className="border border-black p-1 text-center font-mono text-[8pt]">
                                  {b.memoNo || b.id}
                                  {isCurrent && (
                                    <span className="block text-[7.5pt] text-amber-700 font-bold">
                                      (คำขอนี้)
                                    </span>
                                  )}
                                </td>
                                <td className="border border-black p-1 text-left pl-1.5 truncate">
                                  {b.name}
                                </td>
                                <td className="border border-black p-1 text-left pl-1.5 truncate">
                                  {b.destination}
                                </td>
                                <td className="border border-black p-1 text-left pl-1.5 truncate">
                                  {b.purpose}
                                </td>
                                <td className="border border-black p-1 text-center text-[8pt]">
                                  {b.startTime || '08:30'} - {b.endTime || '16:30'}
                                </td>
                                <td className="border border-black p-1 text-right pr-1 font-mono text-[8.5pt]">
                                  {b.startMileage ? num(b.startMileage.toLocaleString()) : '-'}
                                </td>
                                <td className="border border-black p-1 text-right pr-1 font-mono text-[8.5pt]">
                                  {b.endMileage ? num(b.endMileage.toLocaleString()) : '-'}
                                </td>
                                <td className="border border-black p-1 text-right pr-1 font-mono font-bold text-[8.5pt]">
                                  {distance ? num(distance.toLocaleString()) : '-'}
                                </td>
                                <td className="border border-black p-1 text-center text-[8pt]">
                                  {b.fuelRefilledLiters
                                    ? `${num(b.fuelRefilledLiters)} ล. (${num(b.fuelRefilledCost || 0)} บ.)`
                                    : '-'}
                                </td>
                                <td className="border border-black p-1 text-center text-[8pt] truncate">
                                  {b.driverType === 'self' ? 'ขับเอง' : b.driverName || '-'}
                                </td>
                              </tr>
                            );
                          })}

                          {/* If fewer than 6 rows, pad with blank rows for the standard ledger
                             format. Rows are never truncated: all missions are printed. */}
                          {vehicleBookings.length < 6 &&
                            Array.from({ length: 6 - vehicleBookings.length }).map((_, fIdx) => (
                              <tr key={`blank-${fIdx}`} className="border-b border-black text-transparent select-none h-6">
                                <td className="border border-black p-1 text-center">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                                <td className="border border-black p-1">-</td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 font-bold border-t-2 border-black text-[9pt]">
                            <td colSpan={7} className="border border-black p-1.5 text-center">
                              รวมผลการใช้ยานพาหนะตามทะเบียนคุม (จำนวน {num(vehicleBookings.length)} เที่ยวภารกิจ)
                            </td>
                            <td colSpan={2} className="border border-black p-1.5 text-right pr-2">
                              ระยะทางรวม:
                            </td>
                            <td className="border border-black p-1.5 text-right pr-1 font-mono text-[9pt]">
                              {num(vehicleBookings.reduce((acc, cur) => acc + (cur.totalDistance || (cur.endMileage && cur.startMileage ? cur.endMileage - cur.startMileage : 0)), 0).toLocaleString())} กม.
                            </td>
                            <td className="border border-black p-1.5 text-center text-[8pt]">
                              {num(vehicleBookings.reduce((acc, cur) => acc + (cur.fuelRefilledLiters || 0), 0))} ลิตร
                            </td>
                            <td className="border border-black p-1.5 text-center text-[8pt]">
                              ตรวจรับเรียบร้อย
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 3-Party Signatures Footer for Official Registry */}
                  <div className="grid grid-cols-3 gap-6 pt-3 mt-1 border-t border-black text-center text-[10.5pt] leading-tight">
                    {/* Signature 1: Driver */}
                    <div className="space-y-1">
                      <p className="font-semibold text-black">ผู้รายงาน / พนักงานขับรถยนต์</p>
                      <div className="h-10 flex items-end justify-center">
                        <span className="border-b border-dotted border-black w-48 block" />
                      </div>
                      <div>
                        <p>({booking.driverName || booking.name || '..........................................................'})</p>
                        <p className="text-[9pt] text-black/70">
                          {booking.driverType === 'self' ? 'ผู้ขออนุญาตขับขี่เอง' : 'พนักงานขับรถยนต์ราชการ'}
                        </p>
                      </div>
                    </div>

                    {/* Signature 2: Asset Inspector */}
                    <div className="space-y-1">
                      <p className="font-semibold text-black">ผู้ตรวจรับพัสดุ / เจ้าหน้าที่ยานพาหนะ</p>
                      <div className="h-10 flex items-end justify-center">
                        {booking.assetInspectionSignature ? (
                          <img
                            src={booking.assetInspectionSignature}
                            alt="ลายเซ็นผู้ตรวจรับพัสดุ"
                            className="h-9 max-w-[130px] object-contain -mb-1"
                          />
                        ) : (
                          <span className="border-b border-dotted border-black w-48 block" />
                        )}
                      </div>
                      <div>
                        <p>({booking.assetInspectorName || '..........................................................'})</p>
                        <p className="text-[9pt] text-black/70">
                          {booking.assetInspectorPosition || 'เจ้าหน้าที่บริหารงานพัสดุ'}
                        </p>
                      </div>
                    </div>

                    {/* Signature 3: Provincial Culture Director */}
                    <div className="space-y-1">
                      <p className="font-semibold text-black">ผู้อนุมัติผลรายงาน / วัฒนธรรมจังหวัด</p>
                      <div className="h-10 flex items-end justify-center">
                        {booking.signatureData ? (
                          <img
                            src={booking.signatureData}
                            alt="ลายเซ็นผู้อนุมัติ"
                            className="h-9 max-w-[130px] object-contain -mb-1"
                          />
                        ) : (
                          <p className="font-bold text-black text-[9.5pt] -mb-1">(ลงนามอนุมัติในระบบ)</p>
                        )}
                      </div>
                      <div>
                        <p>({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                        <p className="text-[9pt] text-black/70">วัฒนธรรมจังหวัดพังงา</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Document 3: ใบอนุญาตนำรถยนต์ราชการออกนอกเขตจังหวัด */}
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
                    paddingTop: '2.5cm',
                    paddingRight: '2.0cm',
                    paddingBottom: '2.5cm',
                    paddingLeft: '3.0cm',
                    overflow: 'hidden',
                    fontSize: '11pt',
                    lineHeight: 1.35,
                    fontFamily: "'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', Tahoma, sans-serif",
                    color: '#000000',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex flex-col items-center justify-center mb-3">
                      <h2 className="font-bold text-[16pt] leading-tight text-center">
                        ใบอนุญาตนำรถยนต์ส่วนกลางออกนอกเขตจังหวัด
                      </h2>
                      <p className="text-[11pt] text-black/80 text-center">
                        ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการใช้รถยนต์ราชการ พ.ศ. ๒๕๒๓ และที่แก้ไขเพิ่มเติม
                      </p>
                    </div>

                    <div className="border-b border-black pb-1 mb-2 text-[11.5pt] leading-[1.3]">
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

                    <div className="space-y-2.5 text-justify text-[11.5pt] leading-[1.4] font-normal" style={{ textIndent: '2.5cm' }}>
                      <p>
                        อนุญาตให้ {booking.driverName || booking.name} ตำแหน่ง{' '}
                        {booking.driverType === 'self' ? booking.position : 'พนักงานขับรถยนต์ประจำสำนักงาน'}
                        {booking.secondaryDriverName ? ` และ ${booking.secondaryDriverName} (ผู้ช่วยขับขี่)` : ''}{' '}
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

                  <div className="pt-2 flex justify-end text-center text-[11.5pt] leading-[1.3] print-keep-together">
                    <div className="w-[50%] flex flex-col items-center">
                      {booking.status === 'approved' ? (
                        <div className="flex flex-col items-center">
                          <div className="relative flex flex-col items-center justify-end h-24">
                            {booking.signatureData ? (
                              <img
                                src={booking.signatureData}
                                alt="ลายมือชื่อผู้อนุญาต"
                                className="h-20 max-w-[260px] object-contain -mb-2 z-10"
                              />
                            ) : (
                              <div className="font-serif italic text-blue-900 font-bold text-[13pt] tracking-wider px-3 -mb-1 z-10">
                                (อุไรวรรณ แดงงาม)
                              </div>
                            )}
                            <p className="font-normal text-[11pt] text-black leading-none">
                              (ลงชื่อ).......................................................ผู้อนุญาต
                            </p>
                          </div>
                          <p className="font-bold mt-0.5">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                          <p className="text-[11pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="flex flex-col items-center justify-end h-24">
                            <p className="font-normal text-[11pt] text-black mb-1">
                              (ลงชื่อ).......................................................ผู้อนุญาต
                            </p>
                          </div>
                          <p className="font-bold mt-0.5">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                          <p className="text-[11pt] text-black">วัฒนธรรมจังหวัดพังงา</p>
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
            <span>{activeDocType === 'register' ? 'ทะเบียนคุมรถ:' : 'คำขอ:'}</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {activeDocType === 'register' ? (booking.carName || booking.id) : booking.id}
            </span>
            {activeDocType === 'register' ? (
              <span className="hidden sm:inline-block bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {vehicleBookings.length} รายการภารกิจ
              </span>
            ) : isOutOfProvince ? (
              <span className="hidden sm:inline-block bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ภารกิจข้ามเขตจังหวัด ({booking.destProvince})
              </span>
            ) : null}
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
              title={
                activeDocType === 'memo'
                  ? 'พิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง (A4 แนวตั้ง)'
                  : activeDocType === 'register'
                  ? 'พิมพ์ทะเบียนคุมการใช้รถยนต์ (A4 แนวนอน)'
                  : 'พิมพ์ใบอนุญาตนำรถออกนอกเขตจังหวัด (A4 แนวตั้ง)'
              }
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {activeDocType === 'memo'
                  ? 'พิมพ์ใบคำขอ'
                  : activeDocType === 'register'
                  ? 'พิมพ์ทะเบียนคุม'
                  : 'พิมพ์ใบอนุญาต'}
              </span>
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
