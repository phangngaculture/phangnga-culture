import React, { useState } from 'react';
import { Trash2, AlertTriangle, Download, X, CheckCircle2, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { BookingRequest } from '../types';

interface ClearAllBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingsCount: number;
  onConfirmClearAll: () => Promise<void>;
  onExportBackup?: () => void;
}

export const ClearAllBookingsModal: React.FC<ClearAllBookingsModalProps> = ({
  isOpen,
  onClose,
  bookingsCount,
  onConfirmClearAll,
  onExportBackup
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [hasExported, setHasExported] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmClearAll();
      onClose();
    } catch (err) {
      console.error('Failed to clear all bookings:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportFirst = () => {
    if (onExportBackup) {
      onExportBackup();
      setHasExported(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header with warning accent */}
        <div className="p-6 bg-gradient-to-br from-rose-50 via-white to-orange-50 border-b border-rose-100 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                ลบใบคำขอทั้งหมด (เริ่มใช้งานจริง)
              </h3>
              <p className="text-xs text-rose-600 font-medium mt-0.5">
                รีเซ็ตและล้างข้อมูลใบคำขอทดสอบทั้งหมดในระบบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ตรวจพบใบคำขอในระบบทั้งหมด {bookingsCount.toLocaleString()} รายการ</span>
            </div>
            <p className="text-[11px] text-amber-700">
              การดำเนินการนี้จะลบใบคำขอขอใช้รถยนต์ส่วนกลางทุกรายการ (ทั้งที่รออนุมัติ อนุมัติแล้ว และที่เสร็จสิ้นภารกิจ) ออกจากฐานข้อมูลทั้งหมด เพื่อเตรียมระบบให้พร้อมสำหรับ **การเริ่มใช้งานจริงอย่างเป็นทางการ**
            </p>
          </div>

          <div className="space-y-2 text-[11.5px] text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <p className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>สิ่งที่ระบบจะดำเนินการอัตโนมัติ:</span>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>ลบรายการคำขอขอใช้รถทั้งหมด ({bookingsCount} รายการ) ทั้งในเครื่องและ Cloud Firestore</li>
              <li>รีเซ็ตสถานะยานพาหนะทุกคันที่กำลังติดภารกิจ ให้กลับเป็น <strong className="text-emerald-700 font-bold">&ldquo;พร้อมใช้งาน&rdquo;</strong></li>
              <li>ข้อมูลผู้ใช้งาน, รายการยานพาหนะ, ข้อมูลระบบ และสิทธิ์ต่าง ๆ จะยังคงอยู่ครบถ้วน ไม่สูญหาย</li>
            </ul>
          </div>

          {/* Backup recommendation banner */}
          {onExportBackup && (
            <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-blue-800 font-medium">
                  {hasExported ? '✓ ดาวน์โหลดไฟล์สำรองข้อมูล (JSON) แล้ว' : 'แนะนำดาวน์โหลดไฟล์สำรองไว้ก่อนล้างข้อมูล'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportFirst}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
              >
                {hasExported ? 'ดาวน์โหลดอีกครั้ง' : 'สำรองข้อมูล (JSON)'}
              </button>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="pt-1">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              พิมพ์คำว่า <span className="text-rose-600 font-bold">&ldquo;ยืนยัน&rdquo;</span> เพื่อความปลอดภัยก่อนลบข้อมูลทั้งหมด:
            </label>
            <input
              type="text"
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              placeholder="พิมพ์ ยืนยัน ที่นี่..."
              disabled={isDeleting}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmKeyword.trim() !== 'ยืนยัน' || isDeleting}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังลบข้อมูลทั้งหมด...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบใบคำขอทั้งหมด</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
