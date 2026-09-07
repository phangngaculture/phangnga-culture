import React, { useState, useEffect, useMemo } from 'react';
import { BookingRequest, Vehicle, User, PassengerDirectoryItem } from '../types';
import {
  DEPARTMENTS,
  POSITIONS,
  THAI_LOCATIONS,
  THAI_REGIONS,
  FREQUENT_DESTINATIONS,
  FrequentDestination,
  DEFAULT_PASSENGER_DIRECTORY,
  STORAGE_KEYS,
  loadSavedData,
  saveLocalData
} from '../data/mockData';
import {
  formatThaiDate,
  formatThaiTime,
  formatThaiDateRange
} from '../utils/thaiDate';
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  Car,
  UserCheck,
  Users,
  Paperclip,
  Send,
  X,
  Sparkles,
  Info,
  Plus,
  Trash2,
  Phone,
  Building,
  Navigation,
  Check,
  CornerDownLeft,
  ChevronRight,
  Route,
  UserPlus
} from 'lucide-react';

interface BookingFormViewProps {
  currentUser: User;
  vehicles: Vehicle[];
  users?: User[];
  editingBooking: BookingRequest | null;
  initialDate?: string;
  onSaveBooking: (data: Partial<BookingRequest>, isEdit: boolean) => void;
  onCancel: () => void;
}

export const BookingFormView: React.FC<BookingFormViewProps> = ({
  currentUser,
  vehicles,
  users = [],
  editingBooking,
  initialDate,
  onSaveBooking,
  onCancel
}) => {
  // Form fields - Requester
  const [name, setName] = useState(editingBooking?.name || currentUser.name);
  const [position, setPosition] = useState(editingBooking?.position || currentUser.position || POSITIONS[0]);
  const [department, setDepartment] = useState(editingBooking?.department || currentUser.department || DEPARTMENTS[0]);
  const [purpose, setPurpose] = useState(editingBooking?.purpose || '');

  // Destination fields (Reordered: Tambon, Amphoe, Province)
  const [destProvince, setDestProvince] = useState(editingBooking?.destProvince || 'พังงา');
  const [destAmphoe, setDestAmphoe] = useState(editingBooking?.destAmphoe || 'เมืองพังงา');
  const [destTambon, setDestTambon] = useState(editingBooking?.destTambon || 'ท้ายช้าง');
  const [destDetail, setDestDetail] = useState(editingBooking?.destDetail || '');

  // Multi-destination list state
  const [destinations, setDestinations] = useState<string[]>(() => {
    if (editingBooking?.destinationsList && editingBooking.destinationsList.length > 0) {
      return editingBooking.destinationsList;
    }
    if (editingBooking?.destDetail) {
      return [editingBooking.destDetail];
    }
    return [];
  });
  const [currentDestInput, setCurrentDestInput] = useState<string>('');
  const [estimatedDistance, setEstimatedDistance] = useState<number>(
    editingBooking?.estimatedDistance || 0
  );

  // Dates and timing
  const [date, setDate] = useState(editingBooking?.date || initialDate || '2026-09-05');
  const [endDate, setEndDate] = useState(editingBooking?.endDate || initialDate || '2026-09-05');
  const [startTime, setStartTime] = useState(editingBooking?.startTime || '08:30');
  const [endTime, setEndTime] = useState(editingBooking?.endTime || '16:30');

  // Vehicle & Driver
  const [carId, setCarId] = useState(editingBooking?.carId || vehicles[0]?.id || '');
  const [driverType, setDriverType] = useState<'driver' | 'self'>(editingBooking?.driverType || 'driver');
  const [driverName, setDriverName] = useState(editingBooking?.driverName || vehicles[0]?.driverName || 'นายศราวุธ เกตุรักษ์');

  // Passenger Directory and Selection
  const [passengerDirectory, setPassengerDirectory] = useState<PassengerDirectoryItem[]>(() => {
    return loadSavedData(STORAGE_KEYS.PASSENGERS, DEFAULT_PASSENGER_DIRECTORY);
  });

  // Selected passengers
  const [selectedPassengers, setSelectedPassengers] = useState<PassengerDirectoryItem[]>(() => {
    if (editingBooking?.passengerNames) {
      const names = editingBooking.passengerNames.split(',').map((s) => s.trim()).filter(Boolean);
      return names.map((nm, idx) => ({
        id: `prev-${idx}`,
        name: nm,
        position: 'ผู้ร่วมเดินทาง',
        department: 'สำนักงานวัฒนธรรมจังหวัดพังงา'
      }));
    }
    return [];
  });

  const [passengerCount, setPassengerCount] = useState(editingBooking?.passengerCount || 3);
  const [passengerNames, setPassengerNames] = useState(editingBooking?.passengerNames || '');

  // Add new passenger modal
  const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
  const [newPsgName, setNewPsgName] = useState('');
  const [newPsgPosition, setNewPsgPosition] = useState('');
  const [newPsgDepartment, setNewPsgDepartment] = useState('สำนักงานวัฒนธรรมจังหวัดพังงา');
  const [newPsgPhone, setNewPsgPhone] = useState('');

  // Attachment
  const [attachmentName, setAttachmentName] = useState(editingBooking?.attachmentName || '');

  // Helper location objects
  const currentProvinceObj = useMemo(() => {
    return THAI_LOCATIONS.find((p) => p.province === destProvince) || THAI_LOCATIONS[0];
  }, [destProvince]);

  const currentAmphoeObj = useMemo(() => {
    return (
      currentProvinceObj?.amphoes?.find((a) => a.amphoe === destAmphoe) ||
      currentProvinceObj?.amphoes?.[0] || { amphoe: destAmphoe || '', tambons: [] }
    );
  }, [currentProvinceObj, destAmphoe]);

  // Combined passenger pool (system users + directory)
  const availablePassengers = useMemo(() => {
    const map = new Map<string, PassengerDirectoryItem>();

    // Add passenger directory items
    passengerDirectory.forEach((p) => {
      map.set(p.name, p);
    });

    // Merge system users
    users.forEach((u) => {
      if (!map.has(u.name)) {
        map.set(u.name, {
          id: u.id,
          name: u.name,
          position: u.position,
          department: u.department,
          phone: u.phone,
          isDefault: true
        });
      }
    });

    return Array.from(map.values());
  }, [users, passengerDirectory]);

  useEffect(() => {
    if (editingBooking) {
      setName(editingBooking.name);
      setPosition(editingBooking.position);
      setDepartment(editingBooking.department);
      setPurpose(editingBooking.purpose);
      setDestProvince(editingBooking.destProvince);
      setDestAmphoe(editingBooking.destAmphoe);
      setDestTambon(editingBooking.destTambon);
      setDestDetail(editingBooking.destDetail);
      if (editingBooking.destinationsList && editingBooking.destinationsList.length > 0) {
        setDestinations(editingBooking.destinationsList);
      } else if (editingBooking.destDetail) {
        setDestinations([editingBooking.destDetail]);
      }
      setEstimatedDistance(editingBooking.estimatedDistance || 0);
      setDate(editingBooking.date);
      setEndDate(editingBooking.endDate || editingBooking.date);
      setStartTime(editingBooking.startTime);
      setEndTime(editingBooking.endTime);
      setCarId(editingBooking.carId);
      setDriverName(editingBooking.driverName);
      setPassengerCount(editingBooking.passengerCount);
      setPassengerNames(editingBooking.passengerNames || '');
      setAttachmentName(editingBooking.attachmentName || '');
    }
  }, [editingBooking]);

  // When vehicle changes, auto set driver
  const handleCarChange = (newCarId: string) => {
    setCarId(newCarId);
    const chosen = vehicles.find((v) => v.id === newCarId);
    if (chosen && driverType === 'driver') {
      setDriverName(chosen.driverName);
    }
  };

  // Add typed destination to list (by clicking button or pressing Enter)
  const handleAddDestination = () => {
    const trimmed = currentDestInput.trim();
    if (!trimmed) return;

    if (!destinations.includes(trimmed)) {
      const updated = [...destinations, trimmed];
      setDestinations(updated);

      // Check if matches a frequent destination to auto add distance
      const matched = FREQUENT_DESTINATIONS.find(
        (f) => f.name === trimmed || f.shortName === trimmed || trimmed.includes(f.shortName)
      );
      if (matched) {
        setEstimatedDistance((prev) => (prev > 0 ? prev + matched.distanceKm : matched.distanceKm));
        setDestProvince(matched.province);
        setDestAmphoe(matched.amphoe);
        setDestTambon(matched.tambon);
      }
    }
    setCurrentDestInput('');
  };

  const handleKeyDownDestination = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDestination();
    }
  };

  // Select a frequent destination
  const handleSelectFrequentDest = (freq: FrequentDestination) => {
    if (!destinations.includes(freq.name)) {
      setDestinations((prev) => [...prev, freq.name]);
      setEstimatedDistance((prev) => (prev > 0 ? prev + freq.distanceKm : freq.distanceKm));
      setDestProvince(freq.province);
      setDestAmphoe(freq.amphoe);
      setDestTambon(freq.tambon);
    }
  };

  // Remove a destination
  const handleRemoveDestination = (index: number) => {
    const target = destinations[index];
    const updated = destinations.filter((_, i) => i !== index);
    setDestinations(updated);

    const matched = FREQUENT_DESTINATIONS.find((f) => f.name === target);
    if (matched) {
      setEstimatedDistance((prev) => Math.max(0, prev - matched.distanceKm));
    }
  };

  // Passenger selection from available pool
  const handleSelectPassenger = (psgName: string) => {
    if (!psgName) return;
    const found = availablePassengers.find((p) => p.name === psgName);
    if (!found) return;

    if (!selectedPassengers.some((p) => p.name === found.name)) {
      const nextSelected = [...selectedPassengers, found];
      setSelectedPassengers(nextSelected);
      const namesStr = nextSelected.map((p) => p.name).join(', ');
      setPassengerNames(namesStr);
      setPassengerCount(Math.max(passengerCount, nextSelected.length));
    }
  };

  const handleRemovePassenger = (index: number) => {
    const nextSelected = selectedPassengers.filter((_, i) => i !== index);
    setSelectedPassengers(nextSelected);
    const namesStr = nextSelected.map((p) => p.name).join(', ');
    setPassengerNames(namesStr);
    setPassengerCount(Math.max(1, nextSelected.length));
  };

  // Save new passenger to directory in localStorage & system
  const handleSaveNewPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPsgName.trim()) return;

    const newPsg: PassengerDirectoryItem = {
      id: `psg-${Date.now()}`,
      name: newPsgName.trim(),
      position: newPsgPosition.trim() || 'ผู้ร่วมเดินทาง',
      department: newPsgDepartment.trim() || 'สำนักงานวัฒนธรรมจังหวัดพังงา',
      phone: newPsgPhone.trim() || undefined,
      isDefault: false
    };

    const updatedDir = [...passengerDirectory, newPsg];
    setPassengerDirectory(updatedDir);
    saveLocalData(STORAGE_KEYS.PASSENGERS, updatedDir);

    // Also add to current selected passengers
    if (!selectedPassengers.some((p) => p.name === newPsg.name)) {
      const nextSelected = [...selectedPassengers, newPsg];
      setSelectedPassengers(nextSelected);
      const namesStr = nextSelected.map((p) => p.name).join(', ');
      setPassengerNames(namesStr);
      setPassengerCount(Math.max(passengerCount, nextSelected.length));
    }

    setNewPsgName('');
    setNewPsgPosition('');
    setNewPsgDepartment('สำนักงานวัฒนธรรมจังหวัดพังงา');
    setNewPsgPhone('');
    setShowAddPassengerModal(false);
  };

  // Assemble full destination string
  const assembleDestination = () => {
    const allStops = destinations.length > 0 ? destinations : (destDetail ? [destDetail] : []);

    let addressStr = '';
    if (destProvince === 'กรุงเทพมหานคร') {
      if (destTambon) addressStr += `แขวง${destTambon} `;
      if (destAmphoe) addressStr += `เขต${destAmphoe} `;
      addressStr += `กรุงเทพมหานคร`;
    } else {
      if (destTambon) addressStr += `ต.${destTambon} `;
      if (destAmphoe) addressStr += `อ.${destAmphoe} `;
      if (destProvince) addressStr += `จ.${destProvince}`;
    }
    addressStr = addressStr.trim();

    if (allStops.length > 1) {
      const stopsJoined = allStops.map((s, idx) => `${idx + 1}. ${s}`).join(' ');
      let res = `${stopsJoined} (${addressStr})`;
      if (estimatedDistance > 0) {
        res += ` [ระยะทางรวมประมาณ ${estimatedDistance} กม.]`;
      }
      return res;
    }

    const singleLoc = allStops[0] || '';
    let res = addressStr;
    if (singleLoc) {
      res = `${singleLoc} (${addressStr})`;
    }
    if (estimatedDistance > 0) {
      res += ` [ระยะทางประมาณ ${estimatedDistance} กม.]`;
    }
    return res;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Include any remaining typed destination in input if not yet added
    let finalDestinations = [...destinations];
    if (currentDestInput.trim() && !finalDestinations.includes(currentDestInput.trim())) {
      finalDestinations.push(currentDestInput.trim());
    }

    const chosenCar = vehicles.find((v) => v.id === carId);
    const fullDestination = assembleDestination();

    const bookingData: Partial<BookingRequest> = {
      name,
      position,
      department,
      purpose,
      destination: fullDestination,
      destProvince,
      destAmphoe,
      destTambon,
      destDetail: finalDestinations.length > 0 ? finalDestinations.join(', ') : destDetail,
      destinationsList: finalDestinations,
      estimatedDistance: Number(estimatedDistance) || 0,
      date,
      endDate,
      startTime,
      endTime,
      carId,
      carName: chosenCar ? `${chosenCar.name} (${chosenCar.plate})` : 'รถยนต์ราชการ',
      driverType,
      driverName: driverType === 'self' ? `${name} (ผู้ขอขับขี่ด้วยตนเอง)` : driverName,
      passengerCount: Number(passengerCount),
      passengerNames: selectedPassengers.length > 0
        ? selectedPassengers.map((p) => p.name).join(', ')
        : passengerNames,
      attachmentName: attachmentName || 'เอกสารประกอบคำขอ.pdf',
      status: editingBooking?.status || 'pending'
    };

    onSaveBooking(bookingData, !!editingBooking);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              {editingBooking ? 'แก้ไขแบบคำขอใช้รถยนต์ราชการ' : 'แบบฟอร์มขออนุมัติใช้รถยนต์ราชการ'}
            </h2>
            <p className="text-xs text-slate-500">
              สำนักงานวัฒนธรรมจังหวัดพังงา • ใบคำขอขอใช้รถยนต์ส่วนกลางอิเล็กทรอนิกส์
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Requester Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-xs md:text-sm text-slate-900">๑. ข้อมูลผู้ขอใช้ยานพาหนะ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">ชื่อ-นามสกุล *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">ตำแหน่ง *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">ฝ่าย / กลุ่มงาน *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Purpose */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-xs md:text-sm text-slate-900">๒. วัตถุประสงค์และภารกิจ</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1.5">
                เลือกจากภารกิจงานวัฒนธรรมที่พบบ่อย (คลิกเพื่อระบุอัตโนมัติ):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'ตรวจติดตามงานโครงการลานธรรม ลานวิถีไทย',
                  'ร่วมพิธีบวงสรวงและงานประเพณีทางศาสนาและวัฒนธรรม',
                  'สำรวจแหล่งมรดกทางวัฒนธรรมและภูมิปัญญาท้องถิ่น',
                  'เข้าร่วมประชุมราชการและประสานงาน ณ ศาลากลางจังหวัดพังงา',
                  'จัดกิจกรรมส่งเสริมคุณธรรม จริยธรรม และวิถีถิ่นพังงา',
                  'ปฏิบัติงานโครงการชุมชนคุณธรรมและประเพณีท้องถิ่น'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPurpose(preset)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 border border-slate-200 rounded-lg transition text-slate-700 font-medium"
                  >
                    + {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5 text-xs md:text-sm">
                ระบุวัตถุประสงค์ / ความจำเป็นที่ต้องเดินทาง *
              </label>
              <textarea
                required
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ระบุภารกิจ วาระงาน หรือรายละเอียดการเดินทาง..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Destination Selector (Reordered: Tambon, Amphoe, Province & Multi-destination) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs md:text-sm text-slate-900">๓. กำหนดสถานที่ปลายทาง (เลือกได้มากกว่า ๑ สถานที่)</h3>
            </div>
            {estimatedDistance > 0 && (
              <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center space-x-1">
                <Route className="w-3.5 h-3.5 text-emerald-600" />
                <span>ระยะทางรวม: ~{estimatedDistance} กม.</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            
            {/* Quick Frequent Destinations (สถานที่ปลายทางที่ใช้บ่อย) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-600 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>สถานที่ปลายทางที่ใช้บ่อย (คลิกเพื่อเพิ่มเข้าในรายการทันที):</span>
                </label>
                <span className="text-[10px] text-slate-400">มีระยะทางคำนวณอัตโนมัติ</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FREQUENT_DESTINATIONS.map((freq) => {
                  const isAdded = destinations.includes(freq.name);
                  return (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => handleSelectFrequentDest(freq)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition font-medium flex items-center space-x-1.5 border ${
                        isAdded
                          ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-2xs font-semibold'
                          : 'bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-slate-700 border-slate-200'
                      }`}
                      title={`${freq.name} (${freq.tambon}, ${freq.amphoe}, ${freq.province}) ระยะทาง ~${freq.distanceKm} กม.`}
                    >
                      {isAdded && <Check className="w-3 h-3 text-orange-600" />}
                      <span>{freq.shortName}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-slate-100 text-slate-500 rounded">
                        {freq.distanceKm} กม.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Address fields: จังหวัด -> อำเภอ/เขต -> ตำบล/แขวง */}
            <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  เขตพื้นที่การปฏิบัติราชการ (ข้อมูลครบ ๗๗ จังหวัด ๙๒๘ อำเภอ/เขต ๗,๓๕๔ ตำบล/แขวง ทั่วไทย)
                </label>
                <span className="text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {destProvince === 'กรุงเทพมหานคร'
                    ? `แขวง${destTambon || '-'} เขต${destAmphoe || '-'} กรุงเทพมหานคร`
                    : `ต.${destTambon || '-'} อ.${destAmphoe || '-'} จ.${destProvince || '-'}`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. จังหวัด */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    ๑. จังหวัด (๗๗ จังหวัดทั่วไทย) *
                  </label>
                  <select
                    value={destProvince}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      setDestProvince(newProv);
                      const pObj = THAI_LOCATIONS.find((x) => x.province === newProv);
                      if (pObj && pObj.amphoes.length > 0) {
                        setDestAmphoe(pObj.amphoes[0].amphoe);
                        setDestTambon(pObj.amphoes[0].tambons[0] || '');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-2xs"
                  >
                    {THAI_REGIONS.map((grp) => (
                      <optgroup key={grp.region} label={grp.region}>
                        {grp.provinces.map((provName) => (
                          <option key={provName} value={provName}>
                            {provName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* 2. อำเภอ / เขต */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    ๒. {destProvince === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'} ({currentProvinceObj?.amphoes?.length || 0}) *
                  </label>
                  <select
                    value={destAmphoe}
                    onChange={(e) => {
                      const newAmphoe = e.target.value;
                      setDestAmphoe(newAmphoe);
                      const aObj = currentProvinceObj?.amphoes?.find((x) => x.amphoe === newAmphoe);
                      if (aObj && aObj.tambons.length > 0) {
                        setDestTambon(aObj.tambons[0]);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-2xs"
                  >
                    {(currentProvinceObj?.amphoes || []).map((a) => (
                      <option key={a.amphoe} value={a.amphoe}>
                        {destProvince === 'กรุงเทพมหานคร' ? `เขต${a.amphoe}` : `อ.${a.amphoe}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. ตำบล / แขวง */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    ๓. {destProvince === 'กรุงเทพมหานคร' ? 'แขวง' : 'ตำบล'} ({currentAmphoeObj?.tambons?.length || 0}) *
                  </label>
                  <select
                    value={destTambon}
                    onChange={(e) => setDestTambon(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-2xs"
                  >
                    {(currentAmphoeObj?.tambons || []).map((t) => (
                      <option key={t} value={t}>
                        {destProvince === 'กรุงเทพมหานคร' ? `แขวง${t}` : `ต.${t}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Destination Input with Enter to add next destination */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  พิมพ์ชื่อสถานที่ปลายทาง (พิมพ์แล้วกดปุ่ม Enter หรือคลิก &quot;+ เพิ่มสถานที่&quot; เพื่อเลือกสถานที่ ๒, ๓...) *
                </label>
                <span className="text-[11px] text-orange-600 font-medium flex items-center space-x-1">
                  <CornerDownLeft className="w-3 h-3" />
                  <span>กด Enter เพิ่มสถานที่ถัดไปได้ทันที</span>
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={currentDestInput}
                    onChange={(e) => setCurrentDestInput(e.target.value)}
                    onKeyDown={handleKeyDownDestination}
                    placeholder="พิมพ์ชื่อสถานที่ปลายทาง เช่น วัดประชุมศึกษา หรือ ศาลากลางจังหวัด แล้วกด Enter..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  {currentDestInput && (
                    <button
                      type="button"
                      onClick={() => setCurrentDestInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddDestination}
                  disabled={!currentDestInput.trim()}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition shrink-0 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มสถานที่</span>
                </button>
              </div>
            </div>

            {/* List of Selected Destinations (จุดที่ ๑, ๒, ๓...) */}
            {destinations.length > 0 && (
              <div className="p-3.5 bg-orange-50/50 border border-orange-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-950 flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5 text-orange-600" />
                    <span>รายการสถานที่ปลายทางที่เลือก ({destinations.length} แห่ง):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDestinations([]);
                      setEstimatedDistance(0);
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-medium"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>

                <div className="space-y-1.5">
                  {destinations.map((dest, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-orange-200/60 shadow-2xs text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{dest}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDestination(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="ลบสถานที่นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distance Input & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระยะทางไป-กลับโดยประมาณ (กิโลเมตร)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={estimatedDistance || ''}
                    onChange={(e) => setEstimatedDistance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="เช่น 60, 120, 240 (กม.)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none pr-12 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                    กม.
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * ใช้สำหรับคำนวณเชื้อเพลิงและประเมินเวลาการปฏิบัติงานของพนักงานขับรถ
                </p>
              </div>

              {/* Destination Preview */}
              <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-orange-950 font-medium">
                <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-orange-900">ข้อความปลายทางที่จะปรากฏในใบคำขอขอใช้รถยนต์ส่วนกลาง:</span>
                  <p className="text-slate-700 leading-relaxed bg-white/70 p-2 rounded-lg border border-orange-100 font-sans">
                    {assembleDestination() || 'ยังไม่ได้ระบุสถานที่'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Date, Time & Vehicles (Thai Format) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Car className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-xs md:text-sm text-slate-900">
              ๔. วันที่เดินทางและยานพาหนะ (รูปแบบวัน-เวลาของไทย)
            </h3>
          </div>

          {/* Thai Date Badge preview */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-amber-950 font-medium shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="leading-relaxed">
              <span>กำหนดการเดินทาง: </span>
              <b className="text-amber-900">{formatThaiDateRange(date, endDate)}</b>
              <span className="mx-1.5">•</span>
              <span>เวลา </span>
              <b className="text-amber-900">{formatThaiTime(startTime)} - {formatThaiTime(endTime)}</b>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                วันที่เดินทางไป *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                {formatThaiDate(date, 'full')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                วันที่เดินทางกลับ (กรณีค้างคืน)
              </label>
              <input
                type="date"
                value={endDate}
                min={date}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                {formatThaiDate(endDate, 'full')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">เวลาออกเดินทาง *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                เวลาเดินทางกลับโดยประมาณ
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                เลือกรถยนต์ราชการ *
              </label>
              <select
                required
                value={carId}
                onChange={(e) => handleCarChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plate}) - {v.fuelType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                ผู้ขับขี่ / พนักงานขับรถ *
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-4 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="driverType"
                      checked={driverType === 'driver'}
                      onChange={() => {
                        setDriverType('driver');
                        const chosen = vehicles.find((v) => v.id === carId);
                        if (chosen) setDriverName(chosen.driverName);
                      }}
                      className="text-orange-600 focus:ring-0"
                    />
                    <span>พนักงานขับรถประจำสำนักงาน</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="driverType"
                      checked={driverType === 'self'}
                      onChange={() => {
                        setDriverType('self');
                        setDriverName(`${name} (ผู้ขอขับขี่ด้วยตนเอง)`);
                      }}
                      className="text-orange-600 focus:ring-0"
                    />
                    <span>ขับขี่ด้วยตนเอง</span>
                  </label>
                </div>

                {driverType === 'driver' ? (
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="นายศราวุธ เกตุรักษ์ (พนักงานขับรถประจำ)">
                      นายศราวุธ เกตุรักษ์ (พนักงานขับรถประจำ)
                    </option>
                    <option value="นายเรวัติ แสงสว่าง (พนักงานขับรถประจำ)">
                      นายเรวัติ แสงสว่าง (พนักงานขับรถประจำ)
                    </option>
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={`${name} (ผู้ขอขับขี่ด้วยตนเอง)`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Passengers from Directory / System & Add New */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs md:text-sm text-slate-900">
                ๕. รายชื่อผู้ร่วมเดินทางและเอกสารแนบ
              </h3>
            </div>
            
            {/* Button to add new passenger to system directory */}
            <button
              type="button"
              onClick={() => setShowAddPassengerModal(true)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ เพิ่มรายชื่อใหม่ (บันทึกลงระบบ)</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Passenger Selector Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลือกผู้ร่วมเดินทางจากระบบ (ข้าราชการ / เจ้าหน้าที่):
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectPassenger(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">-- คลิกเพื่อเลือกรายชื่อผู้ร่วมเดินทางจากระบบ --</option>
                {availablePassengers.map((psg) => (
                  <option key={psg.id} value={psg.name}>
                    {psg.name} — {psg.position} ({psg.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Passenger Tags */}
            {selectedPassengers.length > 0 && (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-slate-500">
                  รายชื่อผู้ร่วมเดินทางที่เลือกแล้ว ({selectedPassengers.length} ท่าน):
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedPassengers.map((psg, idx) => (
                    <span
                      key={psg.id || idx}
                      className="inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl text-xs font-medium shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold flex items-center justify-center">
                        {psg.name.charAt(0)}
                      </span>
                      <span>{psg.name}</span>
                      <span className="text-[10px] text-purple-600 bg-white/70 px-1.5 py-0.5 rounded">
                        {psg.position}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePassenger(idx)}
                        className="text-purple-400 hover:text-rose-600 transition"
                        title="ลบรายชื่อนี้"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  จำนวนผู้ร่วมเดินทางรวม (คน) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  required
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  ข้อความรายชื่อผู้ร่วมเดินทาง (จะปรากฏในใบคำขอขอใช้รถยนต์ส่วนกลาง)
                </label>
                <input
                  type="text"
                  value={passengerNames}
                  onChange={(e) => setPassengerNames(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดี, นางสาวกุณา สุขสบาย, ผู้แทนชุมชน 2 ท่าน"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                แนบเอกสารราชการประกอบคำขอ (เช่น คำสั่งปฏิบัติราชการ, โครงการ, กำหนดการ)
              </label>
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 border border-slate-200">
                  <Paperclip className="w-4 h-4" />
                  <span>เลือกไฟล์เอกสาร (.PDF / .DOCX)</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachmentName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {attachmentName && (
                  <span className="text-xs text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>{attachmentName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-orange-600/30 flex items-center space-x-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{editingBooking ? 'บันทึกการแก้ไข' : 'ส่งใบคำขอขอใช้รถยนต์ส่วนกลาง'}</span>
          </button>
        </div>

      </form>

      {/* Modal: Add New Passenger to System Directory */}
      {showAddPassengerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-sm">เพิ่มรายชื่อผู้ร่วมเดินทางใหม่เข้าระบบ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPassengerModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPassenger} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                ข้อมูลที่บันทึกจะถูกเก็บลงในระบบทำเนียบผู้ร่วมเดินทางของสำนักงาน เพื่อให้สามารถเลือกใช้ได้ในคำขอครั้งต่อไป
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={newPsgName}
                  onChange={(e) => setNewPsgName(e.target.value)}
                  placeholder="เช่น นายรักเกียรติ มั่นคง"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่ง / บทบาท
                </label>
                <input
                  type="text"
                  value={newPsgPosition}
                  onChange={(e) => setNewPsgPosition(e.target.value)}
                  placeholder="เช่น นักวิชาการวัฒนธรรม, ผู้แทนชุมชน"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยงาน / สังกัด
                </label>
                <input
                  type="text"
                  value={newPsgDepartment}
                  onChange={(e) => setNewPsgDepartment(e.target.value)}
                  placeholder="เช่น สำนักงานวัฒนธรรมจังหวัดพังงา"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ (ถ้ามี)
                </label>
                <input
                  type="tel"
                  value={newPsgPhone}
                  onChange={(e) => setNewPsgPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPassengerModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกลงระบบ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
