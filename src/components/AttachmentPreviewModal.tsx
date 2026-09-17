import React from 'react';
import { X, FileText, Download, Printer, Paperclip, ExternalLink } from 'lucide-react';
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
  if (!isOpen || !booking) return null;

  const fileName = booking.attachmentName || 'เอกสารแนบประกอบคำขอ';
  const fileUrl = booking.attachmentUrl;
  const isImage = fileUrl && (fileUrl.startsWith('data:image/') || fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i));

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.alert(`ดาวน์โหลดเอกสาร: ${fileName}`);
    }
  };

  const handleOpenNewTab = () => {
    if (fileUrl) {
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
      }
    } else {
      window.alert(`ไม่พบลิงก์ไฟล์จริงสำหรับเปิดในแท็บใหม่ (${fileName})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <span>เอกสารแนบประกอบคำขอ</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                  {booking.id}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-grow p-6 overflow-y-auto bg-slate-100/70 dark:bg-slate-950/40 flex flex-col items-center justify-center min-h-[360px]">
          {fileUrl ? (
            isImage ? (
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 max-h-[500px] flex items-center justify-center">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-h-[460px] object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-full h-full min-h-[400px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex flex-col">
                <iframe
                  src={fileUrl}
                  title={fileName}
                  className="w-full h-[450px] border-0"
                />
              </div>
            )
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{fileName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                คำขอนี้มีเอกสารแนบระบุไว้ในระบบ (ไม่มีไฟล์ไบนารีที่อัปโหลดโดยตรงในเซสชันนี้ หรือเป็นเอกสารอ้างอิงของสำนักงาน)
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-300 font-mono">
                รหัสคำขอ: {booking.id} | สถานะ: {booking.status}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ความปลอดภัยระดับองค์กร สำนักงานวัฒนธรรมจังหวัดพังงา</span>
          </div>
          <div className="flex items-center space-x-3">
            {fileUrl && (
              <>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>เปิดแท็บใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดเอกสาร</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
