import React, { useState } from 'react';
import { Vehicle, MaintenanceRecord, User, MaintenanceServiceType } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  Wrench,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  PlusCircle,
  Car,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  Gauge,
  Sparkles,
  Info,
  Filter,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { VehicleModal } from './VehicleModal';
import { DeleteVehicleModal } from './DeleteVehicleModal';

interface FleetMaintenanceViewProps {
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
  currentUser: User;
  users?: User[];
  onAddMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdateVehicleStatus: (vehicleId: string, status: Vehicle['status']) => void;
  onAddVehicle?: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle?: (vehicleId: string, data: Partial<Vehicle>) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

const SERVICE_TYPE_OPTIONS: { type: MaintenanceServiceType; label: string; icon: string }[] = [
  { type: 'oil_change', label: 'เปลี่ยนถ่ายน้ำมันเครื่อง & ไส้กรอง', icon: '🛢️' },
  { type: 'tires', label: 'สลับยาง / เปลี่ยนยางใหม่ / ถ่วงล้อ', icon: '🛞' },
  { type: 'brakes', label: 'ตรวจระบบเบรก & ผ้าเบรก & ช่วงล่าง', icon: '🛑' },
  { type: 'tax_act', label: 'ต่อภาษีประจำปี & พ.ร.บ. คุ้มครองผู้ประสบภัย', icon: '📋' },
  { type: 'insurance', label: 'ต่ออายุประกันภัยภาคสมัครใจ (ชั้น 1)', icon: '🛡️' },
  { type: 'general_repair', label: 'ซ่อมบำรุงทั่วไป / แอร์ / แบตเตอรี่', icon: '🔧' }
];

export const FleetMaintenanceView: React.FC<FleetMaintenanceViewProps> = ({
  vehicles,
  maintenanceRecords,
  currentUser,
  users = [],
  onAddMaintenanceRecord,
  onUpdateVehicleStatus,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterVehicleId, setFilterVehicleId] = useState<string>('all');

  // Vehicle Edit / Add / Delete Modal States
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const canManageVehicles =
    currentUser.role === 'admin' ||
    currentUser.role === 'director' ||
    currentUser.department?.includes('บริหาร') ||
    currentUser.roleTitle?.includes('ยานพาหนะ');

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setShowVehicleModal(true);
  };

  const handleOpenDeleteVehicle = (v: Vehicle) => {
    setDeletingVehicle(v);
  };

  const handleSaveVehicle = (vehicleData: Omit<Vehicle, 'id'>, vehicleId?: string) => {
    if (vehicleId && onUpdateVehicle) {
      onUpdateVehicle(vehicleId, vehicleData);
    } else if (onAddVehicle) {
      onAddVehicle(vehicleData);
    }
  };

  // New Maintenance Form State
  const [selectedCarId, setSelectedCarId] = useState<string>(vehicles[0]?.id || 'v-camry');
  const [serviceType, setServiceType] = useState<MaintenanceServiceType>('oil_change');
  const [title, setTitle] = useState('');
  const [serviceCenter, setServiceCenter] = useState('ศูนย์โตโยต้า พังงา (บจก.โตโยต้า พังงา)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileageAtService, setMileageAtService] = useState<number>(149000);
  const [nextDueMileage, setNextDueMileage] = useState<number>(159000);
  const [nextDueDate, setNextDueDate] = useState<string>('2027-03-01');
  const [cost, setCost] = useState<number>(2800);
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-2569-');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [status, setStatus] = useState<'completed' | 'in_progress' | 'scheduled'>('completed');

  // Handle vehicle selection change in form to pre-populate current mileage
  const handleCarSelect = (vId: string) => {
    setSelectedCarId(vId);
    const car = vehicles.find((v) => v.id === vId);
    if (car) {
      setMileageAtService(car.odometer);
      setNextDueMileage(car.odometer + 10000);
      if (car.name.includes('Toyota')) {
        setServiceCenter('ศูนย์โตโยต้า พังงา (บจก.โตโยต้า พังงา)');
      } else if (car.name.includes('Isuzu')) {
        setServiceCenter('ศูนย์อีซูซุอันดามันเซลส์ สาขาพังงา');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const car = vehicles.find((v) => v.id === selectedCarId);
    if (!car) return;

    const opt = SERVICE_TYPE_OPTIONS.find((o) => o.type === serviceType);

    onAddMaintenanceRecord({
      carId: selectedCarId,
      carName: car.name,
      carPlate: car.plate,
      serviceType,
      serviceTypeLabel: opt?.label || 'งานซ่อมบำรุง',
      title: title || `${opt?.label} - ${car.name}`,
      serviceCenter,
      date,
      mileageAtService,
      nextDueMileage: nextDueMileage || undefined,
      nextDueDate: nextDueDate || undefined,
      cost,
      invoiceNo,
      technicianNotes,
      status
    });

    setShowAddModal(false);
    setTitle('');
    setTechnicianNotes('');
  };

  // Helper for days until expiry
  const getDaysUntil = (dateStr?: string) => {
    if (!dateStr) return null;
    const now = new Date();
    const target = new Date(dateStr);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredRecords = filterVehicleId === 'all'
    ? maintenanceRecords
    : maintenanceRecords.filter((r) => r.carId === filterVehicleId);

  const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Wrench className="w-3.5 h-3.5" />
              <span>ระบบบริหารจัดการบำรุงรักษาและงานทะเบียน (Fleet Maintenance & Compliance)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">
              ความพร้อมของยานพาหนะ ทะเบียน ภาษี พ.ร.บ. และประวัติซ่อมบำรุง
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              สำนักงานวัฒนธรรมจังหวัดพังงา — ควบคุมมาตรฐานความปลอดภัย ตรวจสอบรอบเปลี่ยนถ่ายของเหลว
              วันหมดอายุภาษีประจำปีและประกันภัยราชการ เพื่อความพร้อมในการปฏิบัติงานราชการทุกภารกิจ
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-slate-900/80 px-4 py-3 rounded-2xl border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block">งบซ่อมบำรุงสะสมปี ๒๕๖๙</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {totalMaintenanceCost.toLocaleString()} บาท
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {canManageVehicles && (
                <button
                  onClick={handleOpenAddVehicle}
                  className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
                >
                  <Car className="w-4 h-4" />
                  <span>+ เพิ่มรถราชการคันใหม่</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleCarSelect(vehicles[0]?.id || 'v-camry');
                  setShowAddModal(true);
                }}
                className="px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-semibold transition shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>บันทึกการซ่อมบำรุงใหม่</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Vehicles Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {vehicles.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-10 border border-dashed border-slate-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">ยังไม่มีข้อมูลรถยนต์ราชการในระบบ</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              คุณสามารถเพิ่มรถยนต์ราชการคันใหม่เพื่อบันทึกประวัติการใช้งาน กำหนดผู้รับผิดชอบ และเชื่อมต่อกับระบบขอใช้รถ
            </p>
            {canManageVehicles && (
              <button
                onClick={handleOpenAddVehicle}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรถยนต์ราชการคันแรก</span>
              </button>
            )}
          </div>
        )}

        {vehicles.map((v) => {
          const taxDays = getDaysUntil(v.taxExpiry);
          const actDays = getDaysUntil(v.actExpiry);
          const serviceDue = v.nextServiceMileage ? v.nextServiceMileage - v.odometer : 5000;

          let statusBadge = (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 aura-emerald text-[10px] font-bold px-2 py-0.5 rounded-full">
              พร้อมใช้งาน (Available)
            </span>
          );
          if (v.status === 'in_mission') {
            statusBadge = (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 aura-amber text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                กำลังปฏิบัติภารกิจ (In Mission)
              </span>
            );
          } else if (v.status === 'maintenance') {
            statusBadge = (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                อยู่ระหว่างซ่อมบำรุง (Maintenance)
              </span>
            );
          }

          return (
            <div
              key={v.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between card-3d-hover relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: v.colorTag || '#f97316' }}
              />
              <div className="space-y-3 pt-0.5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold border border-orange-100 shadow-2xs">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs md:text-sm text-slate-900 leading-tight">
                        {v.name}
                      </h3>
                      <div className="mt-1">
                        <span className="thai-license-badge text-[10px]">
                          {v.plate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header quick actions */}
                  {canManageVehicles && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVehicle(v)}
                        title="แก้ไขข้อมูลรถยนต์"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-500 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteVehicle(v)}
                        title="ลบข้อมูลรถยนต์"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  {statusBadge}
                  <span className="text-[10px] text-slate-500">ปีจดทะเบียน {v.year || 2563}</span>
                </div>

                {/* Odometer & Next Service Gauge */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">เลขไมล์ปัจจุบัน:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {v.odometer.toLocaleString()} กม.
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">รอบบริการถัดไป:</span>
                    <span className={`font-mono font-bold ${serviceDue < 1000 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {v.nextServiceMileage?.toLocaleString() || '-'} กม.
                    </span>
                  </div>
                  {/* Progress to next service */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${serviceDue < 1500 ? 'bg-amber-500' : 'bg-teal-600'}`}
                      style={{
                        width: `${Math.min(100, Math.max(15, (v.odometer % 10000) / 100))}%`
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 text-right">
                    เหลืออีกประมาณ {Math.max(0, serviceDue).toLocaleString()} กม. ถึงรอบตรวจเช็ค
                  </div>
                </div>

                {/* Tax & ACT Expiration Alert Box */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-600 flex items-center">
                      <Calendar className="w-3 h-3 text-slate-400 mr-1" />
                      ภาษี/พ.ร.บ. สิ้นสุด:
                    </span>
                    <span
                      className={`font-semibold ${
                        taxDays && taxDays <= 30
                          ? 'text-rose-600 font-bold'
                          : taxDays && taxDays <= 60
                          ? 'text-amber-600 font-bold'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatThaiDate(v.taxExpiry || '2026-12-31', 'short')}
                      {taxDays && (
                        <span className="text-[10px] block text-right font-normal">
                          (เหลือ {taxDays} วัน)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-600 flex items-center">
                      <ShieldCheck className="w-3 h-3 text-slate-400 mr-1" />
                      ประกันภัย:
                    </span>
                    <span className="font-semibold text-slate-700 text-right text-[10px] max-w-[140px] truncate">
                      {v.insuranceCompany || 'ประกันภัยชั้น 1'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 flex justify-between items-center">
                  <span>ผู้รับผิดชอบดูแล:</span>
                  <span className="font-semibold text-slate-800">{v.driverName}</span>
                </div>
              </div>

              {/* Status change actions and edit/delete buttons for Admin/Director */}
              {canManageVehicles && (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <select
                    value={v.status}
                    onChange={(e) => onUpdateVehicleStatus(v.id, e.target.value as Vehicle['status'])}
                    className="flex-1 text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1.5 font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="available">🟢 สถานะ: พร้อมใช้งาน</option>
                    <option value="in_mission">🔵 สถานะ: ปฏิบัติภารกิจ</option>
                    <option value="maintenance">🔴 สถานะ: ส่งซ่อมบำรุง</option>
                  </select>

                  <div className="flex items-center space-x-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenEditVehicle(v)}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-semibold transition flex items-center space-x-1 border border-orange-200"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteVehicle(v)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition flex items-center space-x-1 border border-rose-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Maintenance History Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-xs md:text-sm text-slate-900">
              ประวัติการซ่อมบำรุงและรายการตรวจสภาพ ({filteredRecords.length} รายการ)
            </h3>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">รถยนต์ราชการทุกคัน</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            ยังไม่มีประวัติการซ่อมบำรุงสำหรับรถยนต์คันนี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-medium">
                  <th className="p-3">รหัสงาน / วันที่</th>
                  <th className="p-3">ยานพาหนะ</th>
                  <th className="p-3">ประเภทงาน / รายละเอียด</th>
                  <th className="p-3">ศูนย์บริการ / อู่</th>
                  <th className="p-3 text-right">เลขไมล์ซ่อม</th>
                  <th className="p-3 text-right">ค่าใช้จ่าย</th>
                  <th className="p-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{r.id}</div>
                      <div className="text-[10px] text-slate-400">{formatThaiDate(r.date, 'short')}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{r.carName}</div>
                      <div className="text-[10px] font-mono text-orange-600">{r.carPlate}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-900">{r.title}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{r.technicianNotes || r.serviceTypeLabel}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-slate-800">{r.serviceCenter}</div>
                      <div className="text-[10px] text-slate-400 font-mono">บิล: {r.invoiceNo || '-'}</div>
                    </td>
                    <td className="p-3 text-right font-mono whitespace-nowrap">
                      <div>{r.mileageAtService.toLocaleString()} กม.</div>
                      {r.nextDueMileage && (
                        <div className="text-[10px] text-teal-700">
                          รอบถัดไป: {r.nextDueMileage.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.cost.toLocaleString()} บ.
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {r.status === 'completed' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          เสร็จสมบูรณ์
                        </span>
                      )}
                      {r.status === 'in_progress' && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          อยู่ระหว่างดำเนินการ
                        </span>
                      )}
                      {r.status === 'scheduled' && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          นัดหมายล่วงหน้า
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record New Maintenance */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm md:text-base text-slate-900">
                  บันทึกรายการซ่อมบำรุง / ตรวจสภาพรถยนต์ราชการ
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Vehicle Selection */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">เลือกรถยนต์ราชการ *</label>
                <select
                  value={selectedCarId}
                  onChange={(e) => handleCarSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.plate} (ไมล์ปัจจุบัน: {v.odometer.toLocaleString()} กม.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type Selection */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">ประเภทการซ่อมบำรุง / งานบริการ *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as MaintenanceServiceType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  {SERVICE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.type} value={opt.type}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Service Center */}
              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">หัวข้อ / รายการที่ดำเนินการ *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น เช็คระยะ 150,000 กม. เปลี่ยนน้ำมันเครื่องแท้และกรองอากาศ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">ศูนย์บริการ / อู่มาตรฐาน / สถานที่ตรวจ *</label>
                  <input
                    type="text"
                    required
                    value={serviceCenter}
                    onChange={(e) => setServiceCenter(e.target.value)}
                    placeholder="เช่น ศูนย์โตโยต้าพังงา, บี-ควิก, สำนักงานขนส่งพังงา"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Date & Mileage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่เข้าบริการ *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">เลขไมล์ขณะเข้าบริการ (กม.) *</label>
                  <input
                    type="number"
                    required
                    value={mileageAtService}
                    onChange={(e) => setMileageAtService(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Next Due Mileage & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เลขไมล์รอบบริการถัดไป (กม.)</label>
                  <input
                    type="number"
                    value={nextDueMileage}
                    onChange={(e) => setNextDueMileage(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono text-teal-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">กำหนดรอบบริการถัดไป (วันที่)</label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Cost & Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ค่าใช้จ่ายรวม (บาท) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">เลขที่ใบเสร็จ / ใบสั่งซ่อม</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="INV-69012"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">หมายเหตุช่าง / รายละเอียดอะไหล่ที่เปลี่ยน</label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="เช่น ใช้น้ำมันเครื่องสังเคราะห์ 5W-30 เปลี่ยนไส้กรองเครื่อง เช็คผ้าเบรกหน้าเหลือ 7 มม."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกประวัติการซ่อม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Modal for Add & Edit */}
      <VehicleModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        vehicle={editingVehicle}
        users={users}
        onSave={handleSaveVehicle}
      />

      {/* Delete Vehicle Modal */}
      <DeleteVehicleModal
        isOpen={!!deletingVehicle}
        onClose={() => setDeletingVehicle(null)}
        vehicle={deletingVehicle}
        onConfirmDelete={(vId) => {
          if (onDeleteVehicle) {
            onDeleteVehicle(vId);
          }
        }}
      />

    </div>
  );
};
