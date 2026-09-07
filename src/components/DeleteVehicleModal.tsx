import React from 'react';
import { Vehicle } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onConfirmDelete: (vehicleId: string) => void;
  hasActiveBookings?: boolean;
}

export const DeleteVehicleModal: React.FC<DeleteVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onConfirmDelete,
  hasActiveBookings = false
}) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบข้อมูลรถราชการ
              </h3>
              <p className="text-xs text-rose-600 font-medium">
                การดำเนินการนี้ไม่สามารถเรียกคืนได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-xs text-slate-500">ข้อมูลรถที่จะถูกลบ:</div>
            <div className="font-bold text-sm text-slate-900">{vehicle.name}</div>
            <div className="inline-block font-mono font-bold text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              ทะเบียน: {vehicle.plate}
            </div>
            <div className="text-xs text-slate-500 pt-1">
              ผู้ดูแล: {vehicle.driverName} | เลขไมล์: {vehicle.odometer.toLocaleString()} กม.
            </div>
          </div>

          {hasActiveBookings && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ข้อควรระวัง:</span> รถยนต์คันนี้มีรายการจองหรือภารกิจที่เกี่ยวข้องในระบบ
                การลบรถจะทำให้ข้อมูลยานพาหนะในรายการจองเดิมยังคงอยู่แต่จะไม่สามารถเลือกใช้รถคันนี้ในการขอใช้รถใหม่ได้
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลรถยนต์คันนี้ออกจากสารบบยานพาหนะราชการ สำนักงานวัฒนธรรมจังหวัดพังงา?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onConfirmDelete(vehicle.id);
              onClose();
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-rose-600/30 flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันลบรถคันนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
