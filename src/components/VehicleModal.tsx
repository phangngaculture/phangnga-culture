import React, { useState, useEffect } from 'react';
import { Vehicle, User } from '../types';
import {
  Car,
  X,
  CheckCircle2,
  Calendar,
  Shield,
  FileText,
  Gauge,
  User as UserIcon,
  Palette,
  AlertCircle
} from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null; // null/undefined means creating new vehicle
  users?: User[];
  onSave: (vehicleData: Omit<Vehicle, 'id'>, vehicleId?: string) => void;
}

const VEHICLE_TYPE_PRESETS = [
  'รถยนต์นั่งส่วนบุคคลไม่เกิน 7 ที่นั่ง',
  'รถยนต์ตู้โดยสารปรับอากาศ 11 ที่นั่ง',
  'รถกระบะบรรทุกโดยสาร 4 ประตู',
  'รถกระบะตรวจการ 2 ประตูแค็บ',
  'รถยนต์อเนกประสงค์ SUV / PPV 7 ที่นั่ง',
  'รถยนต์พลังงานไฟฟ้า 100% (EV)'
];

const FUEL_TYPE_PRESETS = [
  'ดีเซล B7',
  'ดีเซล B20',
  'เบนซิน Gasohol 95',
  'เบนซิน Gasohol 91',
  'เบนซิน E20',
  'ไฮบริด (Gasoline / Electric)',
  'ไฟฟ้า 100% (Battery EV)'
];

const COLOR_TAG_OPTIONS = [
  { label: 'ส้ม-ทองอำพัน (Amber/Orange)', value: 'from-orange-500 to-amber-600', preview: 'bg-gradient-to-r from-orange-500 to-amber-600' },
  { label: 'เขียวมรกต-เทล (Teal/Emerald)', value: 'from-teal-600 to-emerald-700', preview: 'bg-gradient-to-r from-teal-600 to-emerald-700' },
  { label: 'น้ำเงินราชการ-คราม (Indigo/Blue)', value: 'from-indigo-600 to-blue-700', preview: 'bg-gradient-to-r from-indigo-600 to-blue-700' },
  { label: 'เทาเข้ม-แกรไฟต์ (Slate/Dark)', value: 'from-slate-700 to-slate-900', preview: 'bg-gradient-to-r from-slate-700 to-slate-900' },
  { label: 'ม่วงเข้ม-อเมทิสต์ (Purple/Violet)', value: 'from-purple-600 to-indigo-800', preview: 'bg-gradient-to-r from-purple-600 to-indigo-800' },
  { label: 'แดงชาด-มารูน (Rose/Red)', value: 'from-rose-600 to-red-700', preview: 'bg-gradient-to-r from-rose-600 to-red-700' }
];

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  users = [],
  onSave
}) => {
  const isEditing = !!vehicle;

  // Form states
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState(VEHICLE_TYPE_PRESETS[0]);
  const [seats, setSeats] = useState(5);
  const [fuelType, setFuelType] = useState(FUEL_TYPE_PRESETS[0]);
  const [status, setStatus] = useState<Vehicle['status']>('available');
  const [odometer, setOdometer] = useState(100000);
  const [driverName, setDriverName] = useState('');
  const [colorTag, setColorTag] = useState(COLOR_TAG_OPTIONS[0].value);
  const [year, setYear] = useState(2563);
  const [taxExpiry, setTaxExpiry] = useState('2027-03-31');
  const [actExpiry, setActExpiry] = useState('2027-03-31');
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-04-30');
  const [insuranceCompany, setInsuranceCompany] = useState('ทิพยประกันภัย (ชั้น 1 ราชการ)');
  const [nextServiceMileage, setNextServiceMileage] = useState(110000);
  const [fuelEfficiencyAvg, setFuelEfficiencyAvg] = useState(12.0);

  const [errorMsg, setErrorMsg] = useState('');

  // Extract list of potential drivers
  const driverList = users.filter((u) => u.role === 'driver' || u.roleTitle.includes('ขับรถ'));

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name || '');
      setPlate(vehicle.plate || '');
      setType(vehicle.type || VEHICLE_TYPE_PRESETS[0]);
      setSeats(vehicle.seats || 5);
      setFuelType(vehicle.fuelType || FUEL_TYPE_PRESETS[0]);
      setStatus(vehicle.status || 'available');
      setOdometer(vehicle.odometer || 0);
      setDriverName(vehicle.driverName || '');
      setColorTag(vehicle.colorTag || COLOR_TAG_OPTIONS[0].value);
      setYear(vehicle.year || 2563);
      setTaxExpiry(vehicle.taxExpiry || '');
      setActExpiry(vehicle.actExpiry || '');
      setInsuranceExpiry(vehicle.insuranceExpiry || '');
      setInsuranceCompany(vehicle.insuranceCompany || '');
      setNextServiceMileage(vehicle.nextServiceMileage || (vehicle.odometer ? vehicle.odometer + 10000 : 10000));
      setFuelEfficiencyAvg(vehicle.fuelEfficiencyAvg || 12.0);
    } else {
      // Default reset for new vehicle
      setName('');
      setPlate('');
      setType(VEHICLE_TYPE_PRESETS[0]);
      setSeats(5);
      setFuelType('ดีเซล B7');
      setStatus('available');
      setOdometer(50000);
      setDriverName(driverList[0]?.name || 'นายศราวุธ เกตุรักษ์');
      setColorTag(COLOR_TAG_OPTIONS[1].value);
      setYear(2566);
      setTaxExpiry('2027-03-31');
      setActExpiry('2027-03-31');
      setInsuranceExpiry('2027-04-30');
      setInsuranceCompany('ทิพยประกันภัย (ชั้น 1 ราชการ)');
      setNextServiceMileage(60000);
      setFuelEfficiencyAvg(12.0);
    }
    setErrorMsg('');
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อหรือยี่ห้อ/รุ่นของรถยนต์');
      return;
    }
    if (!plate.trim()) {
      setErrorMsg('กรุณาระบุหมายเลขทะเบียนรถ เช่น กข 1234 พังงา');
      return;
    }

    const payload: Omit<Vehicle, 'id'> = {
      name: name.trim(),
      plate: plate.trim(),
      type,
      seats: Number(seats) || 5,
      fuelType,
      status,
      odometer: Number(odometer) || 0,
      driverName: driverName.trim() || 'พนักงานขับรถส่วนกลาง',
      colorTag,
      year: Number(year) || 2563,
      taxExpiry: taxExpiry || undefined,
      actExpiry: actExpiry || undefined,
      insuranceExpiry: insuranceExpiry || undefined,
      insuranceCompany: insuranceCompany.trim() || undefined,
      nextServiceMileage: Number(nextServiceMileage) || undefined,
      fuelEfficiencyAvg: Number(fuelEfficiencyAvg) || undefined
    };

    onSave(payload, vehicle?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 text-orange-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                {isEditing ? 'แก้ไขข้อมูลรถยนต์ราชการ' : 'เพิ่มรถยนต์ราชการคันใหม่'}
              </h2>
              <p className="text-xs text-slate-300">
                {isEditing
                  ? `แก้ไขข้อมูล: ${vehicle.name} (${vehicle.plate})`
                  : 'บันทึกประวัติ ทะเบียน ภาษี และผู้รับผิดชอบดูแลรถราชการ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Vehicle Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Car className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. ข้อมูลพื้นฐานและหมายเลขทะเบียน
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อและรุ่นรถยนต์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น Toyota Camry (VIP เก๋ง), Toyota Commuter"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเลขทะเบียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="เช่น กข 1234 พังงา, นค 9999 พังงา"
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทรถราชการ
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                >
                  {VEHICLE_TYPE_PRESETS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนที่นั่ง
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปีจดทะเบียน (พ.ศ.)
                  </label>
                  <input
                    type="number"
                    min="2540"
                    max="2580"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทเชื้อเพลิง
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition"
                >
                  {FUEL_TYPE_PRESETS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะความพร้อมใช้งาน
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-orange-500 focus:outline-none transition"
                >
                  <option value="available">🟢 พร้อมใช้งาน (Available)</option>
                  <option value="in_mission">🔵 กำลังปฏิบัติภารกิจ (In Mission)</option>
                  <option value="maintenance">🔴 อยู่ระหว่างซ่อมบำรุง (Maintenance)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Driver & Mileage */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Gauge className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. พนักงานขับรถประจำคัน & เลขไมล์ระยะทาง
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  พนักงานขับรถประจำคัน
                </label>
                <input
                  type="text"
                  list="drivers-list"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="พิมพ์ชื่อหรือเลือกจากรายการ"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
                <datalist id="drivers-list">
                  {driverList.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                  <option value="นายศราวุธ เกตุรักษ์" />
                  <option value="นายเรวัติ แสงสว่าง" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลขไมล์ปัจจุบัน (กม.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={odometer}
                  onChange={(e) => setOdometer(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รอบบริการเลขไมล์ถัดไป (กม.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={nextServiceMileage}
                  onChange={(e) => setNextServiceMileage(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อัตราประหยัดน้ำมันเฉลี่ย (กม./ลิตร)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={fuelEfficiencyAvg}
                  onChange={(e) => setFuelEfficiencyAvg(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  โทนสีแถบประจำรถ (Color Theme)
                </label>
                <select
                  value={colorTag}
                  onChange={(e) => setColorTag(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                >
                  {COLOR_TAG_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Tax, ACT & Insurance */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. วันหมดอายุภาษี พ.ร.บ. และประกันภัยราชการ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันหมดอายุภาษีประจำปี
                </label>
                <input
                  type="date"
                  value={taxExpiry}
                  onChange={(e) => setTaxExpiry(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันหมดอายุ พ.ร.บ.
                </label>
                <input
                  type="date"
                  value={actExpiry}
                  onChange={(e) => setActExpiry(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันหมดอายุประกันภัยราชการ
                </label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บริษัทประกันภัย / รายละเอียดความคุ้มครอง
              </label>
              <input
                type="text"
                value={insuranceCompany}
                onChange={(e) => setInsuranceCompany(e.target.value)}
                placeholder="เช่น ทิพยประกันภัย (ชั้น 1 ราชการ), วิริยะประกันภัย (ชั้น 1)"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-orange-600/20 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไขข้อมูลรถ' : 'บันทึกเพิ่มรถใหม่'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
