import React, { useRef, useState, useMemo } from 'react';
import { BookingRequest, Vehicle } from '../types';
import { formatThaiDate, toThaiNumerals } from '../utils/thaiDate';
import { printElementById } from '../utils/printHelper';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  X, 
  Printer, 
  Download, 
  Car, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  FileText, 
  Settings, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  SlidersHorizontal,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { OfficialMemoModal } from './OfficialMemoModal';

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

  // UI Visibility & Zoom states to prevent menus from obscuring content
  const [showToolbar, setShowToolbar] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [floatingMemoBooking, setFloatingMemoBooking] = useState<BookingRequest | null>(null);
  const [useThaiNumerals, setUseThaiNumerals] = useState<boolean>(true);

  const num = (val: string | number | null | undefined) =>
    useThaiNumerals ? toThaiNumerals(val ?? '') : (val ?? '');

  // Advanced Printing Configurations
  const [docType, setDocType] = useState<'register' | 'request_form'>('register');
  const [periodMode, setPeriodMode] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Track selected individual booking ID for 'request_form'
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [isBulkPrint, setIsBulkPrint] = useState<boolean>(false);

  // 1. Completed or in-progress missions with mileage info for the registry book
  const baseMissionRecords = useMemo(() => {
    return bookings.filter(
      (b) => (b.status === 'completed' || b.status === 'in_progress' || b.startMileage) &&
        (filterCarPlate === 'all' || b.carName.includes(filterCarPlate))
    );
  }, [bookings, filterCarPlate]);

  // Apply daily, monthly, yearly filter for the Registry Book
  const filteredMissionRecords = useMemo(() => {
    return baseMissionRecords.filter((b) => {
      if (periodMode === 'daily') {
        return b.date === selectedDate;
      }
      if (periodMode === 'monthly') {
        const yearMonth = `${selectedYear}-${selectedMonth}`;
        return b.date.startsWith(yearMonth);
      }
      if (periodMode === 'yearly') {
        return b.date.startsWith(selectedYear);
      }
      return true; // 'all'
    });
  }, [baseMissionRecords, periodMode, selectedDate, selectedMonth, selectedYear]);

  // Sort registry missions (oldest to newest for bookkeeping chronological order)
  const sortedMissionRecords = useMemo(() => {
    return [...filteredMissionRecords].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;

      const startA = (a.startTime || a.actualDepartureTime || '').trim();
      const startB = (b.startTime || b.actualDepartureTime || '').trim();
      if (startA && startB && startA !== startB) return startA.localeCompare(startB);

      return (a.id || '').localeCompare(b.id || '', 'th', { numeric: true });
    });
  }, [filteredMissionRecords]);

  // 2. All bookings of selected period for "Individual Request Forms" (including approved, pending etc.)
  const periodBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchCar = filterCarPlate === 'all' || b.carName.includes(filterCarPlate);
      if (!matchCar) return false;

      if (periodMode === 'daily') {
        return b.date === selectedDate;
      }
      if (periodMode === 'monthly') {
        const yearMonth = `${selectedYear}-${selectedMonth}`;
        return b.date.startsWith(yearMonth);
      }
      if (periodMode === 'yearly') {
        return b.date.startsWith(selectedYear);
      }
      return true; // 'all'
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [bookings, periodMode, selectedDate, selectedMonth, selectedYear, filterCarPlate]);

  // Autoselect active booking when list changes
  const activeRequestBooking = useMemo(() => {
    if (periodBookings.length === 0) return null;
    const found = periodBookings.find((b) => b.id === selectedBookingId);
    if (found) return found;
    return periodBookings[0];
  }, [periodBookings, selectedBookingId]);

  // Sort period bookings chronologically for printing (from 1st to 31st of the month / period)
  const sortedPeriodBookingsForPrint = useMemo(() => {
    return [...periodBookings].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [periodBookings]);

  // Registry book totals
  const totalKm = useMemo(() => sortedMissionRecords.reduce((acc, b) => acc + (b.totalDistance || 0), 0), [sortedMissionRecords]);
  const totalLiters = useMemo(() => sortedMissionRecords.reduce((acc, b) => acc + (b.fuelRefilledLiters || 0), 0), [sortedMissionRecords]);
  const totalCost = useMemo(() => sortedMissionRecords.reduce((acc, b) => acc + (b.fuelRefilledCost || 0), 0), [sortedMissionRecords]);

  // Orientation and printable target configuration
  const printAreaId = 'printRegisterArea';
  const orientation = docType === 'register' ? 'landscape' : 'portrait';

  const docTitle = useMemo(() => {
    const carTag = filterCarPlate === 'all' ? 'ทุกคัน' : filterCarPlate.replace(/\s+/g, '_');
    if (docType === 'register') {
      return `ทะเบียนคุมการใช้รถยนต์_${carTag}_${periodMode}`;
    } else {
      if (isBulkPrint) {
        return `ใบขออนุญาตใช้รถยนต์_รวม_${periodMode}_${carTag}`;
      }
      return `ใบขออนุญาตใช้รถยนต์_${activeRequestBooking?.id || 'ว่าง'}`;
    }
  }, [docType, filterCarPlate, periodMode, activeRequestBooking, isBulkPrint]);

  const handlePrint = () => {
    printElementById(printAreaId, {
      documentTitle: docTitle,
      orientation: orientation
    });
  };

  const handleSavePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportElementToPdf(printAreaId, {
        fileName: `${docTitle}.pdf`,
        orientation: orientation
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const thaiMonths = [
    { value: '01', name: 'มกราคม' },
    { value: '02', name: 'กุมภาพันธ์' },
    { value: '03', name: 'มีนาคม' },
    { value: '04', name: 'เมษายน' },
    { value: '05', name: 'พฤษภาคม' },
    { value: '06', name: 'มิถุนายน' },
    { value: '07', name: 'กรกฎาคม' },
    { value: '08', name: 'สิงหาคม' },
    { value: '09', name: 'กันยายน' },
    { value: '10', name: 'ตุลาคม' },
    { value: '11', name: 'พฤศจิกายน' },
    { value: '12', name: 'ธันวาคม' }
  ];

  const currentYearInt = new Date().getFullYear();
  const yearOptions = [
    (currentYearInt - 2).toString(),
    (currentYearInt - 1).toString(),
    currentYearInt.toString(),
    (currentYearInt + 1).toString()
  ];



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[96vw] xl:max-w-7xl overflow-hidden print:border-none print:shadow-none print:rounded-none h-[95vh] max-h-[96vh] flex flex-col">
        
        {/* Modal Header Controls (Hidden in Print) */}
        <div className="bg-slate-950 text-white px-4 py-3 sm:px-5 sm:py-3 flex flex-col md:flex-row gap-3 md:items-center justify-between no-print print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                  พิมพ์ฟอร์มขอใช้รถและทะเบียนคุมรถยนต์ (สำหรับเจ้าหน้าที่พัสดุ)
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-orange-400 border border-slate-700">
                  {docType === 'register' ? 'สมุดคุมรถ (แนวนอน)' : 'ใบคำขอ (แนวตั้ง)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                สำนักงานวัฒนธรรมจังหวัดพังงา — รายงานพัสดุและยานพาหนะตามระเบียบราชการ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {/* Toggle Toolbar Button (Solves "เมนูปิดบังหมด") */}
            <button
              type="button"
              onClick={() => setShowToolbar(!showToolbar)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer border shrink-0 ${
                showToolbar
                  ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  : 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/30 hover:bg-orange-500'
              }`}
              title={showToolbar ? 'ซ่อนเมนูตัวกรองเพื่อขยายพื้นที่ดูเอกสาร' : 'แสดงเมนูตั้งค่าและตัวกรอง'}
            >
              {showToolbar ? <ChevronUp className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
              <span>{showToolbar ? 'ซ่อนแถบเมนู' : 'เปิดเมนูตัวกรอง'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="hidden lg:flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 text-xs text-slate-300 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
                title="ย่อขนาดดูภาพรวม"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] select-none text-slate-200 font-bold min-w-[36px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
                title="ขยายขนาด"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel !== 100 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 hover:text-orange-400 rounded hover:bg-slate-700 transition border-l border-slate-700 ml-0.5 cursor-pointer"
                  title="คืนค่าขนาดปกติ 100%"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Thai Numerals Toggle */}
            <button
              type="button"
              onClick={() => setUseThaiNumerals(!useThaiNumerals)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer border shrink-0 ${
                useThaiNumerals
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="สลับการแสดงผลตัวเลขไทย (๐ ๑ ๒ ๓) และเลขอารบิก (0 1 2 3)"
            >
              <span className="font-bold text-xs">{useThaiNumerals ? '๑๒๓' : '123'}</span>
              <span>{useThaiNumerals ? 'เลขไทย' : 'เลขอารบิก'}</span>
            </button>

            {/* Launch Portrait Memo as Pop-up Window */}
            <button
              type="button"
              onClick={() => setFloatingMemoBooking(activeRequestBooking || periodBookings[0] || bookings[0] || null)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-orange-600/20 cursor-pointer shrink-0"
              title="เปิดใบคำขอใช้รถยนต์เป็นหน้าต่าง Pop-up ลอย (A4 Portrait)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pop-up ใบคำขอ</span>
            </button>

            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer shrink-0"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>บันทึก PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-orange-600/30 cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>สั่งพิมพ์ A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition shrink-0 ml-auto md:ml-0 cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COLLAPSED STATUS RIBBON (Shows when toolbar is hidden, leaves 100% space for viewing) */}
        {!showToolbar && (
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-slate-300 no-print print:hidden text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-orange-950 text-orange-400 border border-orange-800/60">
                {docType === 'register' ? 'สมุดทะเบียนคุมรถ (แนวนอน A4)' : 'ใบขอใช้รถยนต์รายใบ (แนวตั้ง A4)'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {periodMode === 'all' && 'ข้อมูลทั้งหมด'}
                {periodMode === 'daily' && `ประจำวัน: ${formatThaiDate(selectedDate, 'short')}`}
                {periodMode === 'monthly' && `ประจำเดือน: ${thaiMonths.find(m => m.value === selectedMonth)?.name} ${parseInt(selectedYear) + 543}`}
                {periodMode === 'yearly' && `ประจำปีงบประมาณ: พ.ศ. ${parseInt(selectedYear) + 543}`}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-slate-200">
                {docType === 'register' ? `${sortedMissionRecords.length} เที่ยวราชการ` : `${periodBookings.length} ใบคำขอ`}
              </span>
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={() => setShowToolbar(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer border border-slate-700"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>ปรับเปลี่ยนตัวกรอง</span>
              </button>
              {docType === 'request_form' && (
                <button
                  type="button"
                  onClick={() => setFloatingMemoBooking(activeRequestBooking || periodBookings[0] || null)}
                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[11px] transition flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>เปิด Pop-up ลอย</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TOP INTERACTIVE SETTINGS TOOLBAR (No-Print) */}
        {showToolbar && (
          <div className="bg-slate-900 p-3 sm:p-4 border-b border-slate-800 text-slate-200 no-print print:hidden text-xs space-y-3 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Select Document Type */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  เลือกแบบฟอร์มเอกสารพัสดุ
                </label>
                <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDocType('register')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition cursor-pointer text-xs ${
                      docType === 'register' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    สมุดทะเบียนคุมรถ (แนวนอน)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('request_form')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition cursor-pointer text-xs ${
                      docType === 'request_form' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ใบขอใช้รถยนต์รายใบ (แนวตั้ง)
                  </button>
                </div>
              </div>

              {/* 2. Selection Period Mode */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  คัดกรองรายงานตามช่วงเวลา (พัสดุ)
                </label>
                <div className="grid grid-cols-4 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                  {(['all', 'daily', 'monthly', 'yearly'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPeriodMode(mode)}
                      className={`py-1.5 rounded-lg font-semibold text-center transition cursor-pointer capitalize text-xs ${
                        periodMode === mode ? 'bg-slate-700 text-orange-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'all' ? 'ทั้งหมด' : mode === 'daily' ? 'รายวัน' : mode === 'monthly' ? 'รายเดือน' : 'รายปี'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Conditional Values Inputs */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  เลือกวันที่ / เดือน / ปีงบประมาณ
                </label>
                
                {periodMode === 'all' && (
                  <div className="bg-slate-800/50 py-1.5 px-3 rounded-xl border border-slate-700/60 text-slate-400 text-xs truncate">
                    แสดงข้อมูลพัสดุทั้งหมดในปีงบประมาณปัจจุบัน
                  </div>
                )}

                {periodMode === 'daily' && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 font-semibold text-xs"
                  />
                )}

                {periodMode === 'monthly' && (
                  <div className="flex gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 font-semibold cursor-pointer text-xs"
                    >
                      {thaiMonths.map((m) => (
                        <option key={m.value} value={m.value}>{m.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 font-semibold cursor-pointer text-xs"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>พ.ศ. {parseInt(y) + 543}</option>
                      ))}
                    </select>
                  </div>
                )}

                {periodMode === 'yearly' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 font-semibold cursor-pointer text-xs"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>ปีงบประมาณ พ.ศ. {parseInt(y) + 543}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Conditional Dropdown for Individual Request Form Selection */}
            {docType === 'request_form' && (
              <div className="border-t border-slate-800 pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center space-x-2 text-orange-400 font-bold shrink-0 text-xs">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>มีใบขอใช้รถราชการที่สามารถสั่งพิมพ์ได้ {periodBookings.length} ใบ</span>
                  </div>

                  {periodBookings.length > 0 && (
                    <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsBulkPrint(false)}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                          !isBulkPrint ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        พิมพ์เฉพาะใบที่เลือก (ใบเดียว)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBulkPrint(true)}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                          isBulkPrint ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        พิมพ์รวมทั้งหมด (PDF เรียงหน้า 1-31)
                      </button>
                    </div>
                  )}
                </div>
                
                {periodBookings.length > 0 ? (
                  !isBulkPrint ? (
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <span className="text-slate-400 shrink-0 text-xs font-semibold">เลือกใบขอใช้รถ:</span>
                      <select
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        className="flex-1 md:w-64 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 font-semibold text-xs cursor-pointer"
                      >
                        {periodBookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {formatThaiDate(b.date, 'short')} - {b.name} ({b.carName}) [{b.memoNo || b.id}]
                          </option>
                        ))}
                      </select>

                      {/* Prominent Pop-up Button for Single Request */}
                      <button
                        type="button"
                        onClick={() => setFloatingMemoBooking(activeRequestBooking || periodBookings[0])}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-orange-600/30 cursor-pointer shrink-0"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>เปิดเป็น Pop-up หน้าลอย (A4 เต็มจอ)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/40 px-3 py-1 rounded-xl">
                      ระบบจะจัดหน้าสั่งพิมพ์ใบขอใช้รถทั้ง {periodBookings.length} ใบเรียงต่อกันเป็น PDF แยกหน้าอัตโนมัติ
                    </div>
                  )
                ) : (
                  <span className="text-slate-500 italic text-xs">ไม่มีข้อมูลใบขอใช้รถที่สามารถพิมพ์ได้ในช่วงเวลาที่ระบุ</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRINTABLE AREA CONTAINER */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-8 flex items-start justify-center print:bg-white print:p-0 print:overflow-visible">
          <div
            id="printRegisterArea"
            ref={printContentRef}
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: 'top center',
              fontFamily: docType === 'register' ? "'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif" : "'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif"
            }}
            className={`bg-white shadow-md print:shadow-none p-4 sm:p-12 print:p-0 select-text transition-transform duration-150 ${
              docType === 'register' 
                ? 'w-full max-w-[297mm] print:w-full min-h-[210mm] text-[10px]' 
                : 'w-full max-w-[210mm] print:w-full min-h-[297mm] h-auto text-[13pt] font-sarabun leading-[1.45] text-black'
            }`}
          >
            {/* CASE 1: RENDER REGISTRY TABLE BOOK (สมุดทะเบียนคุมการใช้รถยนต์ราชการ) */}
            {docType === 'register' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                  <div className="text-xs tracking-wider uppercase text-teal-700 font-bold">
                    แบบฟอร์มฝ่ายบริหารทั่วไป งานพัสดุและยานพาหนะ
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    ทะเบียนคุมการใช้รถยนต์ส่วนกลางและรถประจำตำแหน่ง (รอบรายงาน: {
                      periodMode === 'all' ? 'ประวัติทั้งหมด' :
                      periodMode === 'daily' ? `รายวัน วันที่ ${formatThaiDate(selectedDate, 'short')}` :
                      periodMode === 'monthly' ? `รายเดือน ${thaiMonths.find(m => m.value === selectedMonth)?.name} พ.ศ. ${parseInt(selectedYear) + 543}` :
                      `รายปีงบประมาณ พ.ศ. ${parseInt(selectedYear) + 543}`
                    })
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
                      ประจำปีงบประมาณ พ.ศ. <strong>{parseInt(selectedYear) + 543}</strong>
                    </span>
                    <span>
                      วันที่พิมพ์เอกสาร:{' '}
                      <strong>{formatThaiDate(new Date().toISOString(), 'short')}</strong>
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full table-fixed border-collapse border border-slate-900 text-[10px] print:text-[8pt] print:leading-tight">
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '8.5%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '7.5%' }} />
                      <col style={{ width: '6.5%' }} />
                      <col style={{ width: '6.5%' }} />
                      <col style={{ width: '5.5%' }} />
                      <col style={{ width: '7.5%' }} />
                      <col style={{ width: '7%' }} />
                      <col style={{ width: '7%' }} />
                    </colgroup>
                    <thead style={{ display: 'table-header-group' }}>
                      <tr className="bg-slate-100 border-b border-slate-900 text-slate-900">
                        <th className="border border-slate-900 p-1 text-center font-bold">ลำดับ</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">วัน เดือน ปี</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">เลขที่ใบขอรถ</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">รถยนต์/ทะเบียน</th>
                        <th className="border border-slate-900 p-1 text-left font-bold">ผู้ขอใช้รถ / สังกัดกลุ่มงาน</th>
                        <th className="border border-slate-900 p-1 text-left font-bold">สถานที่ไปราชการ / ภารกิจ</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">เวลาไป-กลับ</th>
                        <th className="border border-slate-900 p-1 text-right font-bold">ไมล์ไป</th>
                        <th className="border border-slate-900 p-1 text-right font-bold">ไมล์กลับ</th>
                        <th className="border border-slate-900 p-1 text-right font-bold">รวม (กม.)</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">น้ำมัน (ลิตร/บาท)</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">ลายเซ็นผู้ขับรถ</th>
                        <th className="border border-slate-900 p-1 text-center font-bold">สถานะตรวจ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMissionRecords.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="border border-slate-900 p-6 text-center text-slate-500">
                            ไม่พบรายการลงคุมรถในทะเบียนคุมตามเงื่อนไขที่ระบุ
                          </td>
                        </tr>
                      ) : (
                        sortedMissionRecords.map((b, idx) => {
                          const startKm = b.startMileage || 0;
                          const endKm = b.endMileage || 0;
                          const kmDriven = b.totalDistance || (endKm > startKm ? endKm - startKm : 0);

                          return (
                            <tr key={b.id} className="border-b border-slate-400 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                              <td className="border border-slate-900 p-1 text-center font-mono">{idx + 1}</td>
                              <td className="border border-slate-900 p-1 text-center leading-tight">
                                {formatThaiDate(b.date, 'short')}
                              </td>
                              <td className="border border-slate-900 p-1 text-center font-mono leading-tight">
                                <button
                                  type="button"
                                  onClick={() => setFloatingMemoBooking(b)}
                                  className="group inline-flex items-center justify-center gap-1 font-mono text-[10px] text-slate-900 hover:text-orange-600 transition cursor-pointer underline decoration-dotted decoration-orange-400/60 hover:decoration-solid"
                                  title="แตะเพื่อเปิดดูใบคำขอฉบับนี้เป็น Pop-up หน้าลอย"
                                >
                                  <span>{b.memoNo || b.id}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-orange-500 opacity-0 group-hover:opacity-100 no-print transition-opacity" />
                                </button>
                              </td>
                              <td className="border border-slate-900 p-1 text-center font-semibold leading-tight">
                                {b.carName.replace(/Toyota|Hilux|Camry|Commuter|Fortuner/gi, '').trim() || b.carName}
                              </td>
                              <td className="border border-slate-900 p-1 leading-tight text-slate-800">
                                <strong className="block text-slate-950">{b.name}</strong>
                                <div className="text-[9px] text-slate-500">{b.department}</div>
                              </td>
                              <td className="border border-slate-900 p-1 leading-tight text-slate-800">
                                <div className="font-semibold text-slate-950">{b.destination}</div>
                                <div className="text-[9px] text-slate-500 whitespace-normal line-clamp-1">{b.purpose}</div>
                              </td>
                              <td className="border border-slate-900 p-1 text-center font-mono leading-tight text-[9px]">
                                {b.actualDepartureTime || b.startTime || '-'}<br />
                                {b.actualReturnTime || b.endTime || '-'}
                              </td>
                              <td className="border border-slate-900 p-1 text-right font-mono">
                                {startKm ? startKm.toLocaleString() : '-'}
                              </td>
                              <td className="border border-slate-900 p-1 text-right font-mono">
                                {endKm ? endKm.toLocaleString() : (b.status === 'in_progress' ? 'กำลังปฏิบัติงาน' : '-')}
                              </td>
                              <td className="border border-slate-900 p-1 text-right font-mono font-bold text-slate-950 bg-slate-50">
                                {kmDriven > 0 ? kmDriven.toLocaleString() : '-'}
                              </td>
                              <td className="border border-slate-900 p-1 text-center leading-tight">
                                {b.fuelRefilledLiters ? (
                                  <div>
                                    <span>{b.fuelRefilledLiters} ล.</span>
                                    {b.fuelRefilledCost && (
                                      <div className="text-[9px] text-slate-500 font-mono">
                                        {b.fuelRefilledCost.toLocaleString()} บ.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="border border-slate-900 p-1 text-center leading-tight">
                                {b.driverName ? `(ลงชื่อ) ${b.driverName}` : '-'}
                              </td>
                              <td className="border border-slate-900 p-1 text-center text-[9px] font-bold">
                                {b.status === 'completed' || b.registeredInAssetControl ? (
                                  <span className="text-emerald-800">✓ ตรวจรับแล้ว</span>
                                ) : (
                                  <span className="text-amber-800">● นอก สนง.</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot style={{ display: 'table-footer-group' }}>
                      <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold">
                        <td colSpan={9} className="border border-slate-900 p-1.5 text-right">
                          รวมทั้งสิ้น ({sortedMissionRecords.length} เที่ยวราชการ):
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono">
                          {totalKm.toLocaleString()} กม.
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center text-[9px]">
                          {totalLiters > 0 ? `${totalLiters.toLocaleString()} ลิตร` : '-'}
                          {totalCost > 0 && <div className="text-slate-600 font-mono">{totalCost.toLocaleString()} บาท</div>}
                        </td>
                        <td colSpan={2} className="border border-slate-900 p-1.5 text-center text-[9px] text-teal-800">
                          งานยานพาหนะพัสดุรับรองความถูกต้อง
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Government Official Signatures */}
                <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs break-inside-avoid">
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-800">ผู้รายงาน / พนักงานขับรถยนต์</p>
                    <div className="h-10 flex items-end justify-center">
                      <span className="border-b border-dotted border-slate-800 w-48 block" />
                    </div>
                    <div>
                      <p>(..........................................................)</p>
                      <p className="text-[10px] text-slate-500 mt-1">พนักงานขับรถยนต์ราชการ</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-semibold text-slate-800">ผู้ตรวจรับพัสดุ / เจ้าหน้าที่ยานพาหนะ</p>
                    <div className="h-10 flex items-end justify-center">
                      <span className="border-b border-dotted border-slate-800 w-48 block" />
                    </div>
                    <div>
                      <p>(..........................................................)</p>
                      <p className="text-[10px] text-slate-500 mt-1">เจ้าหน้าที่บริหารงานพัสดุ</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-semibold text-slate-800">ผู้อนุมัติผลรายงาน / วัฒนธรรมจังหวัด</p>
                    <div className="h-10 flex items-end justify-center">
                      <p className="font-bold text-slate-900 -mb-1">(ลงชื่ออนุมัติในระบบดิจิทัล)</p>
                    </div>
                    <div>
                      <p>(นางสาวอุไรวรรณ แดงงาม)</p>
                      <p className="text-[10px] text-slate-500 mt-1">วัฒนธรรมจังหวัดพังงา</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: RENDER INDIVIDUAL PORTRAIT A4 MEMORANDUM FORM (ใบขออนุญาตใช้รถยนต์ราชการ / บันทึกข้อความ) */}
            {docType === 'request_form' && (
              <div className="w-full">
                {/* Floating Pop-up Recommendation Notice */}
                <div className="no-print mb-4 p-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm">ใบคำขอใช้รถยนต์ราชการ (ฉบับแนวตั้ง A4)</div>
                      <div className="text-[11px] text-orange-100">
                        {activeRequestBooking ? `กำลังแสดง: ${activeRequestBooking.name} (${activeRequestBooking.id})` : 'ตัวอย่างใบคำขอ'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFloatingMemoBooking(activeRequestBooking || periodBookings[0] || null)}
                    className="px-3.5 py-1.5 bg-white hover:bg-orange-50 text-orange-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer ml-auto"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>เปิดดูแบบ Pop-up หน้าลอย (ขยายเต็มจอ)</span>
                  </button>
                </div>

                {isBulkPrint ? (
                  sortedPeriodBookingsForPrint.length > 0 ? (
                    <div className="space-y-12 print:space-y-0">
                      {sortedPeriodBookingsForPrint.map((b, idx) => (
                        <div
                          key={b.id}
                          className={`w-full bg-white flex flex-col justify-between print-keep-together print-request-form ${
                            idx > 0 ? 'print:break-before-page print-page-break-before border-t-2 border-dashed border-slate-300 pt-10 print:border-none print:pt-0' : ''
                          }`}
                          style={{
                            /* 260mm เดิมสูงเกินพื้นที่พิมพ์จริง (A4 297mm - ขอบบน/ล่าง 2.5cm = 247mm)
                               ทำให้ใบขอใช้รถแต่ละใบถูกดันไปหน้าถัดไป 1 หน้า จึงย่อให้พอดี 1 หน้า */
                            minHeight: '235mm',
                            pageBreakBefore: idx > 0 ? 'always' : 'auto',
                            breakBefore: idx > 0 ? 'page' : 'auto'
                          }}
                        >
                          <div>
                            {/* Garuda Icon / Heading */}
                            <div className="text-center font-bold text-[18pt] tracking-wide mb-4 flex flex-col items-center">
                              <span className="text-[20pt]">บันทึกข้อความ</span>
                            </div>

                            {/* Government Block Info */}
                            <div className="border-b-2 border-black pb-2 mb-4 text-[13pt]">
                              <p className="mb-1 leading-snug">
                                <span className="font-bold text-[14pt]">ส่วนราชการ:</span>{' '}
                                สำนักงานวัฒนธรรมจังหวัดพังงา ฝ่ายบริหารทั่วไป โทร. ๐ ๗๖๔๘ ๑๕๙๖
                              </p>
                              <div className="grid grid-cols-2 gap-4">
                                <p>
                                  <span className="font-bold text-[14pt]">ที่:</span>{' '}
                                  {b.memoNo 
                                    ? b.memoNo 
                                    : `พง ๐๐๓๒(พิเศษ)/${b.id.replace(/\D/g, '') || 'พิเศษ'}`}
                                </p>
                                <p className="text-right">
                                  <span className="font-bold text-[14pt]">วันที่:</span>{' '}
                                  {useThaiNumerals ? toThaiNumerals(formatThaiDate(b.date, 'official')) : formatThaiDate(b.date, 'official')}
                                </p>
                              </div>
                            </div>

                            {/* Subject & To */}
                            <div className="space-y-1 mb-4 text-[13pt]">
                              <p>
                                <span className="font-bold text-[14pt]">เรื่อง:</span> ขออนุมัติใช้รถยนต์ส่วนกลางราชการเพื่อเดินทางไปปฏิบัติหน้าที่
                              </p>
                              <p>
                                <span className="font-bold text-[14pt]">เรียน:</span> วัฒนธรรมจังหวัดพังงา
                              </p>
                            </div>

                            {/* Body Memorandum Details */}
                            <div className="text-justify text-[13pt] leading-relaxed space-y-3" style={{ textIndent: '2.5cm' }}>
                              <p>
                                ด้วย ข้าพเจ้า <span className="font-bold">{b.name}</span> ตำแหน่ง {b.position || 'เจ้าหน้าที่'} มีความจำเป็นที่จะต้องเดินทางไปปฏิบัติภารกิจราชการเกี่ยวกับ <span className="font-semibold">{b.purpose}</span> ณ สถานที่ปลายทาง <span className="font-semibold">{b.destination}</span> ในเขตพื้นที่จังหวัด{b.destProvince || 'พังงา'} 
                                ในวันที่ <span className="font-bold">{useThaiNumerals ? toThaiNumerals(formatThaiDate(b.date, 'official')) : formatThaiDate(b.date, 'official')}</span>
                                {b.startTime && (
                                  <span> เวลาประมาณ {num(b.startTime)} น. เป็นต้นไป</span>
                                )}
                              </p>

                              <p style={{ textIndent: '2.5cm' }}>
                                ในการปฏิบัติหน้าที่ครั้งนี้ มีผู้ร่วมเดินทางปฏิบัติราชการรวมจำนวน <span className="font-bold">{num(b.passengerCount || 1)}</span> คน (รวมผู้ประสานงาน) โดยขออนุมัติใช้รถยนต์ส่วนกลางของสำนักงานวัฒนธรรมจังหวัดพังงา หมายเลขทะเบียนคุม <span className="font-bold">{b.carName}</span> มอบหมายให้ <span className="font-bold">{b.driverName || 'พนักงานขับรถส่วนกลาง'}</span>{b.secondaryDriverName ? ` และมอบหมายให้ ${b.secondaryDriverName} (เจ้าหน้าที่ผู้ช่วยขับขี่)` : ''} เป็นผู้ควบคุมขับยานพาหนะในภารกิจนี้
                              </p>

                              <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ใช้รถยนต์ส่วนกลางตามความจำเป็นต่อไป</p>
                            </div>

                            {/* Requester Signature Box */}
                            <div className="pt-6 flex justify-end text-center text-[13pt] print-keep-together">
                              <div className="w-[50%] flex flex-col items-center space-y-1">
                                <div className="h-10 flex items-end justify-center relative">
                                  {b.requesterSignature ? (
                                    <img
                                      src={b.requesterSignature}
                                      alt="ลายเซ็นผู้ขอรถ"
                                      className="h-10 max-w-[150px] object-contain mb-1"
                                    />
                                  ) : (
                                    <span className="border-b border-dotted border-slate-800 w-44 block" />
                                  )}
                                </div>
                                <p className="font-semibold">({b.name})</p>
                                <p className="text-slate-700 text-[12pt] leading-none">{b.position || 'ผู้ขอใช้รถราชการ'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Footer / Director Order Panel */}
                          <div className="pt-4 border-t border-dashed border-slate-900 mt-8 space-y-3">
                            <div className="flex items-center justify-between text-[13pt]">
                              <p className="font-bold text-[14pt]">คำสั่ง / ข้อสั่งการเพิ่มเติมของผู้อำนวยการ:</p>
                              <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                                b.status === 'approved' || b.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {b.status === 'approved' || b.status === 'completed' ? '✓ อนุมัติใช้รถแล้ว' : 'รอพิจารณาอนุมัติ'}
                              </span>
                            </div>

                            <div className="pl-6 space-y-2 text-[13pt] leading-relaxed">
                              <div className="flex items-center space-x-8">
                                <span className="flex items-center space-x-2">
                                  <span>{(b.status === 'approved' || b.status === 'completed') ? '☑' : '☐'}</span>
                                  <span className="font-bold">อนุมัติให้ปฏิบัติราชการได้</span>
                                </span>
                                <span className="flex items-center space-x-2">
                                  <span>{b.status === 'rejected' ? '☑' : '☐'}</span>
                                  <span>ไม่อนุมัติ</span>
                                </span>
                              </div>

                              {b.directorComment ? (
                                <p className="text-[12pt] italic bg-slate-50 p-2 rounded border border-slate-200">
                                  ข้อสั่งการเพิ่มเติม: "{b.directorComment}"
                                </p>
                              ) : (
                                <p className="text-[12pt] text-slate-600 leading-none">
                                  - มอบหมายพนักงานขับรถตรวจสอบเลขไมล์และตรวจสภาพสภาพรถยนต์ทั้งก่อนและหลังเสร็จสิ้นภารกิจ -
                                </p>
                              )}

                              {/* Director Approved Signature */}
                              <div className="pt-4 flex justify-end text-center print-keep-together">
                                <div className="w-[50%] flex flex-col items-center space-y-1">
                                  <div className="h-10 flex items-end justify-center">
                                    {b.signatureData ? (
                                      <img
                                        src={b.signatureData}
                                        alt="ลายมือชื่อวัฒนธรรมจังหวัด"
                                        className="h-9 max-w-[150px] object-contain mb-1"
                                      />
                                    ) : (
                                      <span className="border-b border-dotted border-slate-800 w-44 block" />
                                    )}
                                  </div>
                                  <p className="font-bold">(นางสาวอุไรวรรณ แดงงาม)</p>
                                  <p className="text-slate-700 text-[12pt]">วัฒนธรรมจังหวัดพังงา</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-semibold space-y-2">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                      <p>ไม่มีข้อมูลใบขอใช้รถยนต์ราชการสอดคล้องตามเงื่อนไขที่เลือกด้านบน</p>
                    </div>
                  )
                ) : (
                  activeRequestBooking ? (
                    <div className="flex flex-col justify-between print-keep-together print-request-form" style={{ minHeight: '235mm' }}>
                      <div>
                        {/* Garuda Icon / Heading */}
                        <div className="text-center font-bold text-[18pt] tracking-wide mb-4 flex flex-col items-center">
                          <span className="text-[20pt]">บันทึกข้อความ</span>
                        </div>

                        {/* Government Block Info */}
                        <div className="border-b-2 border-black pb-2 mb-4 text-[13pt]">
                          <p className="mb-1 leading-snug">
                            <span className="font-bold text-[14pt]">ส่วนราชการ:</span>{' '}
                            สำนักงานวัฒนธรรมจังหวัดพังงา ฝ่ายบริหารทั่วไป โทร. ๐ ๗๖๔๘ ๑๕๙๖
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <p>
                              <span className="font-bold text-[14pt]">ที่:</span>{' '}
                              {activeRequestBooking.memoNo 
                                ? activeRequestBooking.memoNo 
                                : `พง ๐๐๓๒(พิเศษ)/${activeRequestBooking.id.replace(/\D/g, '') || 'พิเศษ'}`}
                            </p>
                            <p className="text-right">
                              <span className="font-bold text-[14pt]">วันที่:</span>{' '}
                              {useThaiNumerals ? toThaiNumerals(formatThaiDate(activeRequestBooking.date, 'official')) : formatThaiDate(activeRequestBooking.date, 'official')}
                            </p>
                          </div>
                        </div>

                        {/* Subject & To */}
                        <div className="space-y-1 mb-4 text-[13pt]">
                          <p>
                            <span className="font-bold text-[14pt]">เรื่อง:</span> ขออนุมัติใช้รถยนต์ส่วนกลางราชการเพื่อเดินทางไปปฏิบัติหน้าที่
                          </p>
                          <p>
                            <span className="font-bold text-[14pt]">เรียน:</span> วัฒนธรรมจังหวัดพังงา
                          </p>
                        </div>

                        {/* Body Memorandum Details */}
                        <div className="text-justify text-[13pt] leading-relaxed space-y-3" style={{ textIndent: '2.5cm' }}>
                          <p>
                            ด้วย ข้าพเจ้า <span className="font-bold">{activeRequestBooking.name}</span> ตำแหน่ง {activeRequestBooking.position || 'เจ้าหน้าที่'} มีความจำเป็นที่จะต้องเดินทางไปปฏิบัติภารกิจราชการเกี่ยวกับ <span className="font-semibold">{activeRequestBooking.purpose}</span> ณ สถานที่ปลายทาง <span className="font-semibold">{activeRequestBooking.destination}</span> ในเขตพื้นที่จังหวัด{activeRequestBooking.destProvince || 'พังงา'} 
                            ในวันที่ <span className="font-bold">{useThaiNumerals ? toThaiNumerals(formatThaiDate(activeRequestBooking.date, 'official')) : formatThaiDate(activeRequestBooking.date, 'official')}</span>
                            {activeRequestBooking.startTime && (
                              <span> เวลาประมาณ {num(activeRequestBooking.startTime)} น. เป็นต้นไป</span>
                            )}
                          </p>

                          <p style={{ textIndent: '2.5cm' }}>
                            ในการปฏิบัติหน้าที่ครั้งนี้ มีผู้ร่วมเดินทางปฏิบัติราชการรวมจำนวน <span className="font-bold">{num(activeRequestBooking.passengerCount || 1)}</span> คน (รวมผู้ประสานงาน) โดยขออนุมัติใช้รถยนต์ส่วนกลางของสำนักงานวัฒนธรรมจังหวัดพังงา หมายเลขทะเบียนคุม <span className="font-bold">{activeRequestBooking.carName}</span> มอบหมายให้ <span className="font-bold">{activeRequestBooking.driverName || 'พนักงานขับรถส่วนกลาง'}</span>{activeRequestBooking.secondaryDriverName ? ` และมอบหมายให้ ${activeRequestBooking.secondaryDriverName} (เจ้าหน้าที่ผู้ช่วยขับขี่)` : ''} เป็นผู้ควบคุมขับยานพาหนะในภารกิจนี้
                          </p>

                          <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ใช้รถยนต์ส่วนกลางตามความจำเป็นต่อไป</p>
                        </div>

                        {/* Requester Signature Box */}
                        <div className="pt-6 flex justify-end text-center text-[13pt] print-keep-together">
                          <div className="w-[50%] flex flex-col items-center space-y-1">
                            <div className="h-10 flex items-end justify-center relative">
                              {activeRequestBooking.requesterSignature ? (
                                <img
                                  src={activeRequestBooking.requesterSignature}
                                  alt="ลายเซ็นผู้ขอรถ"
                                  className="h-10 max-w-[150px] object-contain mb-1"
                                />
                              ) : (
                                <span className="border-b border-dotted border-slate-800 w-44 block" />
                              )}
                            </div>
                            <p className="font-semibold">({activeRequestBooking.name})</p>
                            <p className="text-slate-700 text-[12pt] leading-none">{activeRequestBooking.position || 'ผู้ขอใช้รถราชการ'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer / Director Order Panel */}
                      <div className="pt-4 border-t border-dashed border-slate-900 mt-8 space-y-3">
                        <div className="flex items-center justify-between text-[13pt]">
                          <p className="font-bold text-[14pt]">คำสั่ง / ข้อสั่งการเพิ่มเติมของผู้อำนวยการ:</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                            activeRequestBooking.status === 'approved' || activeRequestBooking.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {activeRequestBooking.status === 'approved' || activeRequestBooking.status === 'completed' ? '✓ อนุมัติใช้รถแล้ว' : 'รอพิจารณาอนุมัติ'}
                          </span>
                        </div>

                        <div className="pl-6 space-y-2 text-[13pt] leading-relaxed">
                          <div className="flex items-center space-x-8">
                            <span className="flex items-center space-x-2">
                              <span>{(activeRequestBooking.status === 'approved' || activeRequestBooking.status === 'completed') ? '☑' : '☐'}</span>
                              <span className="font-bold">อนุมัติให้ปฏิบัติราชการได้</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <span>{activeRequestBooking.status === 'rejected' ? '☑' : '☐'}</span>
                              <span>ไม่อนุมัติ</span>
                            </span>
                          </div>

                          {activeRequestBooking.directorComment ? (
                            <p className="text-[12pt] italic bg-slate-50 p-2 rounded border border-slate-200">
                              ข้อสั่งการเพิ่มเติม: "{activeRequestBooking.directorComment}"
                            </p>
                          ) : (
                            <p className="text-[12pt] text-slate-600 leading-none">
                              - มอบหมายพนักงานขับรถตรวจสอบเลขไมล์และตรวจสภาพสภาพรถยนต์ทั้งก่อนและหลังเสร็จสิ้นภารกิจ -
                            </p>
                          )}

                          {/* Director Approved Signature */}
                          <div className="pt-4 flex justify-end text-center print-keep-together">
                            <div className="w-[50%] flex flex-col items-center space-y-1">
                              <div className="h-10 flex items-end justify-center">
                                {activeRequestBooking.signatureData ? (
                                  <img
                                    src={activeRequestBooking.signatureData}
                                    alt="ลายมือชื่อวัฒนธรรมจังหวัด"
                                    className="h-9 max-w-[150px] object-contain mb-1"
                                  />
                                ) : (
                                  <span className="border-b border-dotted border-slate-800 w-44 block" />
                                )}
                              </div>
                              <p className="font-bold">(นางสาวอุไรวรรณ แดงงาม)</p>
                              <p className="text-slate-700 text-[12pt]">วัฒนธรรมจังหวัดพังงา</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-semibold space-y-2">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                      <p>ไม่มีข้อมูลใบขอใช้รถยนต์ราชการสอดคล้องตามเงื่อนไขที่เลือกด้านบน</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Pop-up Modal for Portrait Official Memo (A4) */}
      {floatingMemoBooking && (
        <OfficialMemoModal
          booking={floatingMemoBooking}
          onClose={() => setFloatingMemoBooking(null)}
          allBookings={bookings}
        />
      )}
    </div>
  );
};
