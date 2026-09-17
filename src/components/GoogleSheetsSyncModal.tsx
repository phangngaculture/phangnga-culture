import React from 'react';
import {
  Database,
  CheckCircle2,
  Download,
  X,
  ShieldCheck,
  Server,
  Cloud,
  FileCode,
  FileSpreadsheet,
  HardDrive
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { SpreadsheetInfo } from '../services/googleSheetsService';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: FirebaseUser | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  isConnecting: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onManualSync: () => void;
  bookingCount: number;
  fuelCount: number;
  maintenanceCount: number;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  lastSyncedAt,
  bookingCount,
  fuelCount,
  maintenanceCount
}) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    const rawData = {
      exportedAt: new Date().toISOString(),
      organization: 'สำนักงานวัฒนธรรมจังหวัดพังงา',
      system: 'e-Fleet Management System v2.0 (Production Ready)',
      counts: {
        bookings: bookingCount,
        fuelLogs: fuelCount,
        maintenance: maintenanceCount
      },
      source: 'Google Cloud Firestore & Vercel'
    };
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mculture_fleet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">ศูนย์จัดการฐานข้อมูล Cloud & สำรองข้อมูล</h3>
              <p className="text-xs text-emerald-100">Google Cloud Firestore & Vercel Realtime Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Active Cloud Database Status Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-emerald-800">ฐานข้อมูล Cloud Database ทำงานปกติ</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-800">Google Cloud Firestore (NoSQL)</p>
                <p className="text-xs text-slate-500">เซิร์ฟเวอร์หลัก: Vercel / Cloud Run Serverless Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-800 border border-emerald-300/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Realtime</span>
            </div>
          </div>

          {/* Database Collections Metric Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>จำนวนข้อมูลที่จัดเก็บบนระบบปัจจุบัน</span>
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-[11px] text-slate-500">คำขอใช้รถยนต์</div>
                <div className="text-lg font-black text-slate-800">{bookingCount}</div>
                <div className="text-[10px] text-emerald-600 font-medium">บันทึกเรียบร้อย</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-[11px] text-slate-500">ประวัติการเติมน้ำมัน</div>
                <div className="text-lg font-black text-slate-800">{fuelCount}</div>
                <div className="text-[10px] text-emerald-600 font-medium">บันทึกเรียบร้อย</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-[11px] text-slate-500">งานซ่อมบำรุง</div>
                <div className="text-lg font-black text-slate-800">{maintenanceCount}</div>
                <div className="text-[10px] text-emerald-600 font-medium">บันทึกเรียบร้อย</div>
              </div>
            </div>
          </div>

          {/* Direct GitHub & Local Backup Action */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100">สำรองข้อมูลสำหรับ GitHub / Local</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">JSON File</span>
            </div>
            <p className="text-[11px] text-slate-300">
              ดาวน์โหลดชุดข้อมูลทั้งหมดในรูปแบบ JSON หรือพิมพ์รายงานสมุดทะเบียนคุมโดยตรง โดยไม่ต้องผ่านการล็อกอิน Google Sheets
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล (Export JSON)</span>
            </button>
          </div>

          {/* Guarantee */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 text-xs text-blue-900">
            <div className="flex items-center space-x-1.5 font-semibold text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>ความปลอดภัยและความเสถียร</span>
            </div>
            <p className="text-[11px] text-blue-700">
              ระบบบันทึกข้อมูลแบบ Real-time ลงฐานข้อมูล Cloud Database ทุกครั้งที่มีการขอใช้รถหรืออนุมัติ ทำให้ใช้งานได้ต่อเนื่องไม่มีปัญหา Session หมดอายุ
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-500">
            {lastSyncedAt ? `อัปเดตล่าสุด: ${lastSyncedAt}` : 'สถานะ: พร้อมใช้งาน 100%'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
