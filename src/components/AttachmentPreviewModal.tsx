import React, { useRef, useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Paperclip,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  Globe,
  Copy,
  Check,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  FileDown
} from 'lucide-react';
import { BookingRequest } from '../types';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !booking) return null;

  const fileName = booking.attachmentName || 'เอกสารแนบประกอบคำขอใช้รถยนต์.pdf';
  const fileUrl = booking.attachmentUrl || '';
  const lowerName = fileName.toLowerCase();

  // Detect file format
  const isImage = fileUrl.startsWith('data:image/') || lowerName.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i);
  const isPdf = fileUrl.startsWith('data:application/pdf') || lowerName.endsWith('.pdf');
  const isWord =
    booking.attachmentType === 'word' ||
    fileUrl.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    fileUrl.includes('application/msword') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.dotx');
  const isExcel =
    booking.attachmentType === 'excel' ||
    fileUrl.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
    fileUrl.includes('application/vnd.ms-excel') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.csv');
  const isLink =
    booking.attachmentType === 'link' ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('https://');

  // Attachment Category Thai Label
  const getCategoryLabel = () => {
    switch (booking.attachmentCategory) {
      case 'schedule':
        return '📌 กำหนดการ / แผนการเดินทาง';
      case 'order':
        return '📜 หนังสือคำสั่งปฏิบัติราชการ';
      case 'dispatch':
        return '📨 หนังสือส่ง / หนังสือเชิญประชุม';
      case 'project':
        return '📋 โครงการ / แผนงาน';
      default:
        if (lowerName.includes('กำหนดการ') || lowerName.includes('แผน')) return '📌 กำหนดการ / แผนงาน';
        if (lowerName.includes('คำสั่ง')) return '📜 หนังสือคำสั่งปฏิบัติราชการ';
        if (lowerName.includes('หนังสือส่ง') || lowerName.includes('เชิญ')) return '📨 หนังสือส่ง / เชิญ';
        return '📄 เอกสารแนบประกอบภารกิจ';
    }
  };

  // Format date in Thai
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const thMonthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const thaiYear = parseInt(year, 10) > 2500 ? parseInt(year, 10) : parseInt(year, 10) + 543;
      const monthIdx = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${thMonthNames[monthIdx] || ''} พ.ศ. ${thaiYear}`;
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName} - เอกสารแนบคำขอใช้รถยนต์</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@latest/fonts/THSarabunNew/style.css" />
          <style>
            @page {
              size: A4 portrait;
              margin-top: 2.5cm;
              margin-left: 3cm;
              margin-right: 2cm;
              margin-bottom: 2.5cm;
            }
            body {
              font-family: 'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', Tahoma, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
            .print-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding-top: 2.5cm;
              padding-left: 3cm;
              padding-right: 2cm;
              padding-bottom: 2.5cm;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (fileUrl && !fileUrl.startsWith('data:text/html')) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create printable HTML download with official margins
      const content = printRef.current ? printRef.current.innerHTML : '';
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${fileName}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lazywasabi/thai-web-fonts@latest/fonts/THSarabunNew/style.css" />
            <style>
              @page {
                size: A4 portrait;
                margin-top: 2.5cm;
                margin-left: 3cm;
                margin-right: 2cm;
                margin-bottom: 2.5cm;
              }
              body {
                font-family: 'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', Tahoma, sans-serif;
                padding-top: 2.5cm;
                padding-left: 3cm;
                padding-right: 2cm;
                padding-bottom: 2.5cm;
                line-height: 1.6;
                color: #1e293b;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.replace(/\.[^/.]+$/, "")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenNewTab = () => {
    if (isLink && fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (fileUrl && !fileUrl.startsWith('data:text/html')) {
      const win = window.open();
      if (win) {
        win.document.write(`
          <html>
            <head><title>${fileName}</title></head>
            <body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh;">
              ${isImage ? `<img src="${fileUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />` : `<iframe src="${fileUrl}" style="width:100%; height:100%; border:none; background:#fff;"></iframe>`}
            </body>
          </html>
        `);
        win.document.close();
      }
    } else {
      handlePrint();
    }
  };

  const handleCopyLink = () => {
    if (fileUrl) {
      navigator.clipboard.writeText(fileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                isPdf
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                  : isWord
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : isExcel
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : isImage
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                  : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
              }`}
            >
              {isPdf && <FileText className="w-5 h-5" />}
              {isWord && <FileText className="w-5 h-5 text-blue-600" />}
              {isExcel && <FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
              {isImage && <ImageIcon className="w-5 h-5 text-purple-600" />}
              {!isPdf && !isWord && !isExcel && !isImage && <Globe className="w-5 h-5 text-teal-600" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2 truncate">
                <span className="truncate">เอกสารแนบประกอบคำขอใช้รถยนต์</span>
                <span className="text-[11px] px-2 py-0.5 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 rounded-full font-medium shrink-0">
                  {booking.id}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-semibold shrink-0">
                  {getCategoryLabel()}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                📁 {fileName} {booking.attachmentSize ? `(${booking.attachmentSize})` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              title="สั่งพิมพ์เอกสาร"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์เอกสาร</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-100/70 dark:bg-slate-950/50 flex flex-col items-center justify-start min-h-[420px]">
          
          {/* Mode 1: Cloud Link / URL */}
          {isLink && fileUrl ? (
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] px-2 py-0.5 bg-teal-50 text-teal-700 font-bold rounded-md border border-teal-200">
                    ลิงก์เอกสารออนไลน์ / Cloud Document
                  </span>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {fileName}
                  </h4>
                  <p className="text-xs text-slate-500 break-all font-mono mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {fileUrl}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>เปิดดูเอกสารต้นทาง (Google Drive / ลิงก์ภายนอก)</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'คัดลอกลิงก์สำเร็จแล้ว' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>

              {/* Summary Info */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">ประเภทเอกสาร:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{getCategoryLabel()}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">ผู้แนบเอกสาร:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{booking.name} ({booking.position})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">ภารกิจ:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{booking.purpose}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">วันที่เดินทาง:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{formatThaiDate(booking.date)}</span>
                </div>
              </div>
            </div>
          ) : isWord && fileUrl ? (
            /* Mode 2: Word Document (.docx / .doc) */
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200">
                      เอกสาร Microsoft Word (.docx)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-orange-50 text-orange-700 font-bold rounded-md border border-orange-200">
                      {getCategoryLabel()}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {fileName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เอกสารพิมพ์จากเครื่องคอมพิวเตอร์เพื่อประกอบคำขอใช้รถยนต์ราชการ
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    ดาวน์โหลดไฟล์เอกสารเพื่อเปิดใน Microsoft Word
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    ไฟล์แนบพร้อมเปิดแก้ไขและตรวจทานบนคอมพิวเตอร์ของคุณ
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ Word</span>
                </button>
              </div>

              {/* Summary Info */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">ผู้ขอใช้รถยนต์:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{booking.name} ({booking.position})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">หน่วยงาน:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{booking.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">วัตถุประสงค์:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{booking.purpose}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">วันที่เดินทาง:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{formatThaiDate(booking.date)}</span>
                </div>
              </div>
            </div>
          ) : isExcel && fileUrl ? (
            /* Mode 3: Excel Spreadsheet (.xlsx / .xls / .csv) */
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200">
                      ตารางคำนวณ Microsoft Excel (.xlsx)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-orange-50 text-orange-700 font-bold rounded-md border border-orange-200">
                      {getCategoryLabel()}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {fileName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ไฟล์ตารางข้อมูล/บัญชีรายชื่อ/งบประมาณแนบประกอบคำขอ
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    ดาวน์โหลดไฟล์ตารางเพื่อเปิดใน Microsoft Excel
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    ไฟล์แนบพร้อมเปิดดูตารางและสูตรคำนวณบนคอมพิวเตอร์ของคุณ
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ Excel</span>
                </button>
              </div>

              {/* Summary Info */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">ผู้ขอใช้รถยนต์:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{booking.name} ({booking.position})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">หน่วยงาน:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{booking.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">วัตถุประสงค์:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{booking.purpose}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">วันที่เดินทาง:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{formatThaiDate(booking.date)}</span>
                </div>
              </div>
            </div>
          ) : fileUrl && isImage ? (
            /* Mode 4: Image Scan / Photo Preview */
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 max-h-[580px] flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-[540px] max-w-full object-contain rounded-xl"
              />
            </div>
          ) : fileUrl && isPdf ? (
            /* Mode 5: PDF Document Native Embedded Preview */
            <div className="w-full h-full min-h-[520px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex flex-col">
              <iframe
                src={fileUrl}
                title={fileName}
                className="w-full h-[540px] border-0"
              />
            </div>
          ) : (
            /* Mode 6: Official Certified Electronic Document Preview (ไม่มีตราครุฑ พร้อมระยะขอบ Margin ตามระเบียบสารบรรณราชการ) */
            <div
              ref={printRef}
              style={{
                paddingTop: '2.5cm',
                paddingLeft: '3cm',
                paddingRight: '2cm',
                paddingBottom: '2.5cm',
                boxSizing: 'border-box'
              }}
              className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-md border border-slate-200 space-y-6 font-['Sarabun',sans-serif] text-sm leading-relaxed select-text"
            >
              {/* Document Header (ไม่มีตราครุฑ) */}
              <div className="flex flex-col items-center text-center border-b border-slate-200 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                  สำนักงานวัฒนธรรมจังหวัดพังงา
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  เอกสารแนบประกอบคำขอใช้รถยนต์ส่วนกลางและแผนปฏิบัติราชการ
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[11px] font-mono font-medium">
                    เลขที่อ้างอิง: {booking.memoNo || `พง ๐๐๓๒/${booking.id}`}
                  </span>
                  <span className="px-2.5 py-0.5 bg-orange-50 text-orange-800 border border-orange-300 rounded-md text-[11px] font-medium">
                    {getCategoryLabel()}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[11px] font-medium flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เอกสารอิเล็กทรอนิกส์รับรอง</span>
                  </span>
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-700">ชื่อเอกสารแนบ:</span>{' '}
                  <span className="text-slate-900 font-semibold">{fileName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">วันที่เดินทาง:</span>{' '}
                  <span className="text-slate-900">{formatThaiDate(booking.date)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">ผู้ขอใช้รถยนต์:</span>{' '}
                  <span className="text-slate-900">{booking.name} ({booking.position})</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">หน่วยงาน/สังกัด:</span>{' '}
                  <span className="text-slate-900">{booking.department}</span>
                </div>
              </div>

              {/* Document Content Details */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-800">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 border-l-2 border-orange-600 pl-2">
                    <span>๑. วัตถุประสงค์และรายละเอียดภารกิจราชการ</span>
                  </h4>
                  <p className="pl-3.5 text-slate-700 leading-normal text-justify">
                    {booking.purpose || 'ปฏิบัติราชการตามภารกิจของสำนักงานวัฒนธรรมจังหวัดพังงา และขับเคลื่อนงานวัฒนธรรมในพื้นที่'}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 border-l-2 border-orange-600 pl-2">
                    <span>๒. สถานที่ปลายทางและเส้นทางการเดินทาง</span>
                  </h4>
                  <p className="pl-3.5 text-slate-700 leading-normal">
                    {booking.destination || `${booking.destProvince || 'พังงา'} ${booking.destAmphoe || ''} ${booking.destTambon || ''} ${booking.destDetail || ''}`}
                    {booking.estimatedDistance ? ` (ระยะทางรวมประมาณ ${booking.estimatedDistance} กิโลเมตร)` : ''}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 border-l-2 border-orange-600 pl-2">
                    <span>๓. รายชื่อคณะผู้ร่วมเดินทาง ({booking.passengerCount || 1} คน)</span>
                  </h4>
                  <p className="pl-3.5 text-slate-700 leading-normal">
                    {booking.passengerNames || booking.name}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 border-l-2 border-orange-600 pl-2">
                    <span>๔. ยานพาหนะและพนักงานขับรถที่จัดสรร</span>
                  </h4>
                  <div className="pl-3.5 text-slate-700 space-y-0.5">
                    <p>• ยานพาหนะ: <span className="font-semibold text-slate-900">{booking.carName || 'รถยนต์ส่วนกลางสำนักงาน'}</span></p>
                    <p>
                      • พนักงานขับรถ: <span className="font-semibold text-slate-900">{booking.driverName || 'พนักงานขับรถยนต์ประจำสำนักงาน'}</span> ({booking.driverType === 'self' ? 'ผู้ขอขับรถยนต์ด้วยตนเอง' : 'พนักงานขับรถยนต์ส่วนกลาง'})
                      {booking.secondaryDriverName && (
                        <span className="text-orange-700 font-medium ml-1">
                          (ผู้ช่วยขับขี่: {booking.secondaryDriverName})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures & Certification Stamp */}
              <div className="pt-4 border-t border-slate-200 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs">
                {/* Requester */}
                <div className="flex flex-col items-center justify-end space-y-1">
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-serif italic text-slate-500 font-bold text-sm tracking-wider">
                      {booking.name}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">({booking.name})</p>
                  <p className="text-slate-500">{booking.position}</p>
                  <p className="text-[11px] text-slate-400">ผู้ขออนุมัติและแนบเอกสาร</p>
                </div>

                {/* Approver / Director */}
                <div className="flex flex-col items-center justify-end space-y-1">
                  <div className="h-10 flex items-center justify-center">
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-bold text-xs flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-800">({booking.approvedBy || 'นางสาวอุไรวรรณ แดงงาม'})</p>
                  <p className="text-slate-500">วัฒนธรรมจังหวัดพังงา</p>
                  <p className="text-[11px] text-emerald-600 font-medium">ผู้อนุมัติการใช้ยานพาหนะ</p>
                </div>
              </div>

              {/* Official Electronic Verification Footer Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ระบบบริหารจัดการยานพาหนะและเอกสารราชการ สำนักงานวัฒนธรรมจังหวัดพังงา</span>
                </div>
                <span className="font-mono text-slate-400">ID: {booking.id}</span>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="hidden sm:inline">ความปลอดภัยระดับองค์กร สำนักงานวัฒนธรรมจังหวัดพังงา</span>
            <span className="sm:hidden">ระบบยานพาหนะ วธ.พังงา</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดแท็บใหม่</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
