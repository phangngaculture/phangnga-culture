import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldAlert,
  Server,
  Calendar,
  Car,
  Fuel,
  Wrench,
  Users,
  Bell,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2
} from 'lucide-react';
import {
  BookingRequest,
  Vehicle,
  FuelLog,
  MaintenanceRecord,
  User,
  NotificationItem,
  SystemBackupData
} from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { manualForceSyncAllToFirestore } from '../services/firestoreService';

interface BackupRestoreViewProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceRecords: MaintenanceRecord[];
  users: User[];
  notifications: NotificationItem[];
  currentUser: User;
  onRestoreAllData: (data: SystemBackupData['data']) => Promise<void>;
  firestoreStatus?: 'connected' | 'syncing' | 'error' | 'idle';
  onForceCloudSync?: () => Promise<void>;
  onOpenClearAllBookings?: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  bookings,
  vehicles,
  fuelLogs,
  maintenanceRecords,
  users,
  notifications,
  currentUser,
  onRestoreAllData,
  firestoreStatus = 'connected',
  onForceCloudSync,
  onOpenClearAllBookings
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Staging for imported backup file preview before actual restore
  const [previewBackup, setPreviewBackup] = useState<SystemBackupData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const databaseId = (firebaseConfig as any).firestoreDatabaseId || 'default';

  // 1. Export All Data to JSON file
  const handleExportAll = () => {
    try {
      setIsExporting(true);
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split('T')[0];
      const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `mculture-phangnga-backup-${dateStr}-${timeStr}.json`;

      const backupData: SystemBackupData = {
        version: '5.2.0',
        exportedAt: timestamp.toISOString(),
        exportedBy: `${currentUser.name} (${currentUser.roleTitle || currentUser.role})`,
        source: 'M-Culture Phangnga Fleet Management System',
        firestoreDatabaseId: databaseId,
        summary: {
          bookingsCount: bookings.length,
          vehiclesCount: vehicles.length,
          fuelLogsCount: fuelLogs.length,
          maintenanceRecordsCount: maintenanceRecords.length,
          usersCount: users.length,
          notificationsCount: notifications.length
        },
        data: {
          bookings,
          vehicles,
          fuelLogs,
          maintenanceRecords,
          users,
          notifications
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `ส่งออกไฟล์สำรองข้อมูลสำเร็จ: "${filename}" (จำนวนรายการทั้งหมด: ${
          bookings.length + vehicles.length + fuelLogs.length + maintenanceRecords.length + users.length
        } รายการ)`
      });
    } catch (err: any) {
      console.error('Export Backup Error:', err);
      setStatusMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการดาวน์โหลดแบ๊คอัพ: ${err.message || String(err)}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Select file & Validate
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation of backup file structure
        if (!parsed.data || !Array.isArray(parsed.data.bookings) || !Array.isArray(parsed.data.vehicles)) {
          throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้องตามรูปแบบของระบบสำนักงานวัฒนธรรมจังหวัดพังงา');
        }

        const normalizedBackup: SystemBackupData = {
          version: parsed.version || 'unknown',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          exportedBy: parsed.exportedBy || 'ไม่ระบุ',
          source: parsed.source || 'สำรองข้อมูลภายนอก',
          firestoreDatabaseId: parsed.firestoreDatabaseId,
          summary: {
            bookingsCount: parsed.data.bookings.length,
            vehiclesCount: parsed.data.vehicles.length,
            fuelLogsCount: parsed.data.fuelLogs?.length || 0,
            maintenanceRecordsCount: parsed.data.maintenanceRecords?.length || 0,
            usersCount: parsed.data.users?.length || 0,
            notificationsCount: parsed.data.notifications?.length || 0
          },
          data: {
            bookings: parsed.data.bookings,
            vehicles: parsed.data.vehicles,
            fuelLogs: parsed.data.fuelLogs || [],
            maintenanceRecords: parsed.data.maintenanceRecords || [],
            users: parsed.data.users || [],
            notifications: parsed.data.notifications || []
          }
        };

        setPreviewBackup(normalizedBackup);
        setShowConfirmModal(true);
      } catch (err: any) {
        console.error('Parse backup file error:', err);
        setStatusMessage({
          type: 'error',
          text: `ไม่สามารถเปิดอ่านไฟล์สำรองข้อมูลได้: ${err.message || 'รูปแบบไฟล์ JSON ไม่ถูกต้อง'}`
        });
      }
    };

    reader.readAsText(file);
    // reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  // 3. Confirm Restore
  const handleConfirmRestore = async () => {
    if (!previewBackup) return;

    try {
      setIsImporting(true);
      setShowConfirmModal(false);

      await onRestoreAllData(previewBackup.data);

      setStatusMessage({
        type: 'success',
        text: `กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว! (คำขอ: ${previewBackup.summary.bookingsCount}, รถยนต์: ${previewBackup.summary.vehiclesCount}, เชื้อเพลิง: ${previewBackup.summary.fuelLogsCount}, ซ่อมบำรุง: ${previewBackup.summary.maintenanceRecordsCount}, ผู้ใช้งาน: ${previewBackup.summary.usersCount}) และได้ทำการซิงก์ขึ้น Cloud Firestore เรียบร้อยแล้ว`
      });
      setPreviewBackup(null);
    } catch (err: any) {
      console.error('Restore Error:', err);
      setStatusMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการกู้คืนข้อมูล: ${err.message || String(err)}`
      });
    } finally {
      setIsImporting(false);
    }
  };

  // 4. Force Push local data to Cloud Firestore
  const handleForceCloudSync = async () => {
    try {
      setIsCloudSyncing(true);
      if (onForceCloudSync) {
        await onForceCloudSync();
      } else {
        await manualForceSyncAllToFirestore(bookings, vehicles, fuelLogs, maintenanceRecords, users);
      }
      setStatusMessage({
        type: 'success',
        text: 'ผลักดันข้อมูลปัจจุบันทั้งหมดขึ้น Cloud Firestore สำเร็จเรียบร้อยแล้ว'
      });
    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      setStatusMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการซิงก์ Cloud Firestore: ${err.message || String(err)}`
      });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold border border-sky-500/30">
              <Database className="w-3.5 h-3.5" />
              <span>ระบบความปลอดภัยและการสำรองข้อมูล (Data Backup & Disaster Recovery)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              แบ๊คอัพและกู้คืนข้อมูลทั้งหมดของระบบ
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              สำรองข้อมูลภารกิจขอใช้รถราชการ, ยานพาหนะ, ข้อมูลผู้ใช้งาน, บันทึกเชื้อเพลิง และประวัติซ่อมบำรุงในรูปแบบไฟล์ JSON มาตรฐานความปลอดภัย เพื่อเก็บสำรองไว้ภายนอกหรือกู้คืนฉุกเฉินได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/30 flex items-center space-x-2 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังสร้างไฟล์แบ๊คอัพ...' : 'ดาวน์โหลดแบ๊คอัพทั้งหมด (JSON)'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm backdrop-blur-md flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-sky-300" />
              <span>นำเข้าข้อมูลเพื่อกู้คืน (Restore)</span>
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Status Notice if present */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start space-x-3 text-sm animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Cloud Database Live Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Google Cloud Firestore Live Storage</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    firestoreStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${firestoreStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {firestoreStatus === 'connected' ? 'ออนไลน์ & เชื่อมต่อแล้ว' : 'กำลังซิงก์แคช...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Database ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px]">{databaseId}</code> (ภูมิภาค asia-southeast1 / สิงคโปร์)
              </p>
            </div>
          </div>

          <button
            onClick={handleForceCloudSync}
            disabled={isCloudSyncing}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            title="กดเพื่อส่งข้อมูลในเครื่องปัจจุบันทั้งหมดขึ้นเซิร์ฟเวอร์ Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span>{isCloudSyncing ? 'กำลังซิงก์ขึ้น Cloud...' : 'ซิงก์ข้อมูลขึ้น Cloud Firestore ทันที'}</span>
          </button>
        </div>

        {/* Database Inventory Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>คำขอใช้รถ</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{bookings.length}</div>
            <div className="text-[10px] text-slate-400">รายการในระบบ</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
              <Car className="w-3.5 h-3.5 text-emerald-500" />
              <span>ยานพาหนะ</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{vehicles.length}</div>
            <div className="text-[10px] text-slate-400">คันส่วนกลาง</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
              <Fuel className="w-3.5 h-3.5 text-amber-500" />
              <span>บันทึกน้ำมัน</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{fuelLogs.length}</div>
            <div className="text-[10px] text-slate-400">ใบเสร็จ/เลขไมล์</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
              <Wrench className="w-3.5 h-3.5 text-cyan-500" />
              <span>การซ่อมบำรุง</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{maintenanceRecords.length}</div>
            <div className="text-[10px] text-slate-400">รายการงานช่าง</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>ผู้ใช้งาน</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{users.length}</div>
            <div className="text-[10px] text-slate-400">บัญชีเจ้าหน้าที่</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              <span>การแจ้งเตือน</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{notifications.length}</div>
            <div className="text-[10px] text-slate-400">ข้อความระบบ</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Instructions & Disaster Recovery Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Why Backup? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">โครงสร้างไฟล์แบ๊คอัพ (JSON Standard)</h3>
              <p className="text-xs text-slate-500">ข้อมูลครบถ้วนสำหรับตรวจราชการและย้ายเครื่อง</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">รวมข้อมูลทุกตาราง:</strong> ไฟล์ประกอบด้วยรายการขอใช้รถทั้งหมด, รายละเอียดรถ, บันทึกค่าน้ำมัน, ประวัติซ่อมบำรุง, และบัญชีผู้ใช้งาน
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">พร้อมลายเซ็นดิจิทัล:</strong> ลายเซ็นอนุมัติของผู้อำนวยการและเจ้าหน้าที่ถูกสำรองไว้ด้วย สามารถเปิดดูใบขอใช้รถย้อนหลังได้ตรงตามต้นฉบับ
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">สามารถเปิดตรวจสอบได้:</strong> ไฟล์เป็นรูปแบบ UTF-8 JSON สามารถนำไปเปิดดูใน Notepad, VS Code หรือโปรแกรมประมวลผลข้อมูลทั่วไปได้ทันที
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition border border-sky-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์แบ๊คอัพตอนนี้</span>
            </button>
          </div>
        </div>

        {/* Box 2: Disaster Recovery & Restore Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">คำแนะนำในการกู้คืนข้อมูล (Restore)</h3>
              <p className="text-xs text-slate-500">ข้อควรระวังในการนำเข้าไฟล์แบ๊คอัพ</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-amber-950">
              <strong className="text-amber-900">⚠️ สำคัญมาก:</strong> การกู้คืนข้อมูลจะนำข้อมูลจากไฟล์มาแทนที่และอัปเดตลงในระบบ รวมถึงซิงก์ต่อไปยัง Cloud Firestore เพื่อให้ทุกเครื่องแสดงข้อมูลตรงกัน
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">แนะนำ:</strong> ควรกดดาวน์โหลดไฟล์แบ๊คอัพปัจจุบันไว้ก่อนทำการกู้คืนข้อมูลทุกครั้ง เพื่อป้องกันการสูญหายของข้อมูลล่าสุด
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>เลือกไฟล์แบ๊คอัพเพื่อนำเข้า (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Production Launch: Reset Test Bookings */}
      {onOpenClearAllBookings && (
        <div className="bg-gradient-to-br from-rose-50/70 via-white to-orange-50/50 rounded-2xl p-5 border border-rose-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-slate-900">
                  ลบใบคำขอทดสอบทั้งหมด (เตรียมเริ่มใช้งานจริง)
                </h4>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                  {bookings.length} รายการในระบบ
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                ล้างข้อมูลใบคำขอขอใช้รถยนต์ที่เคยทดสอบออกทั้งหมด เพื่อเตรียมเปิดระบบให้ข้าราชการและเจ้าหน้าที่สำนักงานวัฒนธรรมจังหวัดพังงาเริ่มใช้งานจริง (บัญชีผู้ใช้และรายชื่อรถจะไม่ถูกลบ)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenClearAllBookings}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-sm hover:shadow shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ล้างใบคำขอทั้งหมด</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal before Restore */}
      {showConfirmModal && previewBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ยืนยันการกู้คืนข้อมูลระบบ</h3>
                <p className="text-xs text-slate-500">ตรวจสอบรายละเอียดไฟล์สำรองข้อมูลก่อนดำเนินการ</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">วันที่สำรองข้อมูล:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(previewBackup.exportedAt).toLocaleString('th-TH')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">ผู้สำรองข้อมูล:</span>
                <span className="font-semibold text-slate-900">{previewBackup.exportedBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">เวอร์ชันระบบ:</span>
                <span className="font-semibold text-slate-900">{previewBackup.version}</span>
              </div>

              {/* Items Summary */}
              <div className="pt-2">
                <span className="text-slate-500 font-medium block mb-2">จำนวนข้อมูลที่จะถูกกู้คืน:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    คำขอใช้รถ: <strong>{previewBackup.summary.bookingsCount}</strong> รายการ
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    ยานพาหนะ: <strong>{previewBackup.summary.vehiclesCount}</strong> คัน
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    บันทึกน้ำมัน: <strong>{previewBackup.summary.fuelLogsCount}</strong> รายการ
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    บันทึกซ่อม: <strong>{previewBackup.summary.maintenanceRecordsCount}</strong> รายการ
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    ผู้ใช้งาน: <strong>{previewBackup.summary.usersCount}</strong> บัญชี
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPreviewBackup(null);
                }}
                disabled={isImporting}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isImporting}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    <span>กำลังกู้คืนข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span>ยืนยันกู้คืนข้อมูลนี้</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
