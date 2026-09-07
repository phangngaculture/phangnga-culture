import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  X,
  AlertCircle,
  CloudCheck,
  LogOut,
  ShieldCheck,
  Table,
  Check
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
  googleUser,
  spreadsheetInfo,
  isConnecting,
  isSyncing,
  lastSyncedAt,
  onConnectGoogle,
  onDisconnectGoogle,
  onManualSync,
  bookingCount,
  fuelCount,
  maintenanceCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">เชื่อมโยง Google Sheets</h3>
              <p className="text-xs text-emerald-100">ซิงค์ฐานข้อมูลยานพาหนะ สวจ.พังงา แบบอัตโนมัติ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Connection Status Banner */}
          {googleUser ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-emerald-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {googleUser.displayName ? googleUser.displayName.charAt(0) : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-emerald-800">เชื่อมต่อบัญชี Google แล้ว</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{googleUser.displayName || 'ผู้ใช้งานสำนักงาน'}</p>
                  <p className="text-xs text-slate-500">{googleUser.email}</p>
                </div>
              </div>

              <button
                onClick={onDisconnectGoogle}
                title="ยกเลิกการเชื่อมต่อ"
                className="text-xs text-slate-400 hover:text-red-600 flex items-center space-x-1 px-2 py-1 rounded hover:bg-red-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center shadow-sm border border-slate-200">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">ยังไม่ได้เชื่อมต่อ Google Sheets</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  เข้าสู่ระบบด้วยบัญชี Google ของสำนักงานวัฒนธรรมจังหวัดพังงา เพื่อซิงค์ข้อมูลลงตาราง Google Sheets อัตโนมัติ
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onConnectGoogle}
                  disabled={isConnecting}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-300 shadow-sm hover:shadow transition flex items-center space-x-3 cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14-.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isConnecting ? 'กำลังเชื่อมต่อบัญชี Google...' : 'เข้าสู่ระบบด้วย Google (Sign in with Google)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Spreadsheet Target Details */}
          {googleUser && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>ไฟล์สเปรดชีตปลายทาง:</span>
                  </span>
                  {spreadsheetInfo && (
                    <a
                      href={spreadsheetInfo.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <span>เปิด Google Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-slate-800 font-medium">
                  {spreadsheetInfo ? spreadsheetInfo.name : 'ระบบบริหารรถยนต์ราชการ สวจ.พังงา'}
                </div>

                {lastSyncedAt && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ซิงค์ข้อมูลล่าสุดเมื่อ: {lastSyncedAt}</span>
                  </div>
                )}
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xs text-slate-500">คำขอใช้รถ</div>
                  <div className="text-base font-bold text-slate-800">{bookingCount}</div>
                  <div className="text-[10px] text-emerald-600">แท็บ 1</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xs text-slate-500">การใช้น้ำมัน</div>
                  <div className="text-base font-bold text-slate-800">{fuelCount}</div>
                  <div className="text-[10px] text-emerald-600">แท็บ 2</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xs text-slate-500">งานบำรุงรักษา</div>
                  <div className="text-base font-bold text-slate-800">{maintenanceCount}</div>
                  <div className="text-[10px] text-emerald-600">แท็บ 3</div>
                </div>
              </div>

              {/* Features Guarantee */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-900">
                <div className="flex items-center space-x-1.5 font-semibold text-blue-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>คุณสมบัติการซิงค์ข้อมูล</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-blue-700 space-y-0.5">
                  <li>ซิงค์อัตโนมัติทุกครั้งเมื่อมีการยื่นคำขอใหม่ หรือผู้อำนวยการอนุมัติ</li>
                  <li>แยกชีตเป็นระเบียบ 3 แท็บ พร้อมหัวตารางภาษาไทยสมบูรณ์แบบ</li>
                  <li>ข้อมูลปลอดภัยตามมาตรฐานความปลอดภัยของ Google Workspace</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition"
          >
            ปิดหน้าต่าง
          </button>

          {googleUser ? (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-medium transition shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ข้อมูลเดี๋ยวนี้ (Sync Now)'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">กรุณาเข้าสู่ระบบ Google เพื่อเริ่มซิงค์</span>
          )}
        </div>

      </div>
    </div>
  );
};
