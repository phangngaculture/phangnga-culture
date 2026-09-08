import React, { useState, useRef, useEffect } from 'react';
import { BookingRequest, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  PenTool,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Car,
  Gauge,
  Clock,
  MapPin,
  Calendar,
  FileCheck
} from 'lucide-react';

interface AssetInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
  currentUser: User;
  onConfirmInspection: (
    bookingId: string,
    data: {
      assetInspectorName: string;
      assetInspectorPosition: string;
      assetInspectedAt: string;
      assetInspectionStatus: 'accepted' | 'rejected' | 'pending';
      assetInspectionNote?: string;
      assetInspectionVehicleCondition: 'normal' | 'needs_cleaning' | 'needs_maintenance';
      assetInspectionSignature: string;
      assetInspectionSignatureType: 'draw' | 'electronic';
    }
  ) => void;
}

export const AssetInspectionModal: React.FC<AssetInspectionModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUser,
  onConfirmInspection
}) => {
  const [inspectorName, setInspectorName] = useState<string>('');
  const [inspectorPosition, setInspectorPosition] = useState<string>('เจ้าหน้าที่พัสดุ');
  const [condition, setCondition] = useState<'normal' | 'needs_cleaning' | 'needs_maintenance'>('normal');
  const [inspectionNote, setInspectionNote] = useState<string>('ตรวจรับยานพาหนะและเลขไมล์ถูกต้องเรียบร้อย สภาพรถพร้อมใช้งาน');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'electronic'>('draw');

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#1e3a8a'); // Civil service blue ink
  const [penWidth, setPenWidth] = useState(2.8);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && booking) {
      setInspectorName(booking.assetInspectorName || currentUser.name || 'นายประเสริฐ สินทรัพย์');
      setInspectorPosition(booking.assetInspectorPosition || currentUser.position || 'เจ้าพนักงานพัสดุชำนาญงาน');
      setCondition(booking.assetInspectionVehicleCondition || 'normal');
      setInspectionNote(booking.assetInspectionNote || 'ตรวจรับยานพาหนะและเลขไมล์ถูกต้องเรียบร้อย สภาพรถพร้อมใช้งาน');
      setHasDrawn(false);
      setErrorMsg('');

      // If already signed with drawing, don't force redraw unless user wants
      setTimeout(() => {
        initCanvas();
      }, 60);
    }
  }, [isOpen, booking, currentUser]);

  // Touch handlers for mobile
  useEffect(() => {
    if (!isOpen || signatureMode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasPos = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    };

    const handleNativeTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pos = getCanvasPos(e.touches[0]);
      setIsDrawing(true);
      setHasDrawn(true);
      lastPointRef.current = pos;

      ctx.strokeStyle = penColor;
      ctx.fillStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, penWidth / 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing && !lastPointRef.current) return;
      if (e.touches.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pos = getCanvasPos(e.touches[0]);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPointRef.current = pos;
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(false);
      lastPointRef.current = null;
    };

    canvas.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleNativeTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleNativeTouchStart);
      canvas.removeEventListener('touchmove', handleNativeTouchMove);
      canvas.removeEventListener('touchend', handleNativeTouchEnd);
    };
  }, [isOpen, signatureMode, isDrawing, penColor, penWidth]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw subtle signing guide line
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 35);
    ctx.lineTo(canvas.width - 30, canvas.height - 35);
    ctx.stroke();
    ctx.restore();
  };

  const handleClearCanvas = () => {
    initCanvas();
    setHasDrawn(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setHasDrawn(true);
    lastPointRef.current = { x, y };

    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(x, y, penWidth / 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const generateElectronicSignature = (name: string): string => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 460;
    offCanvas.height = 140;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'italic bold 32px "Sarabun", "TH Sarabun New", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`(${name})`, offCanvas.width / 2, 50);

    ctx.font = '14px "Sarabun", sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('✓ รับรองการตรวจรับยานพาหนะราชการ (Digital e-Sign)', offCanvas.width / 2, 95);

    return offCanvas.toDataURL('image/png');
  };

  const handleSubmit = () => {
    if (!booking) return;

    if (!inspectorName.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลของเจ้าหน้าที่พัสดุผู้ตรวจรับ');
      return;
    }

    let finalSignature = '';
    if (signatureMode === 'draw') {
      if (!hasDrawn && !booking.assetInspectionSignature) {
        setErrorMsg('กรุณาลงลายมือชื่อบนช่องลายเซ็นดิจิทัล');
        return;
      }
      if (hasDrawn && canvasRef.current) {
        finalSignature = canvasRef.current.toDataURL('image/png');
      } else if (booking.assetInspectionSignature) {
        finalSignature = booking.assetInspectionSignature;
      }
    } else {
      finalSignature = generateElectronicSignature(inspectorName);
    }

    const nowIso = new Date().toISOString();

    onConfirmInspection(booking.id, {
      assetInspectorName: inspectorName.trim(),
      assetInspectorPosition: inspectorPosition.trim() || 'เจ้าพนักงานพัสดุชำนาญงาน',
      assetInspectedAt: nowIso,
      assetInspectionStatus: 'accepted',
      assetInspectionNote: inspectionNote.trim(),
      assetInspectionVehicleCondition: condition,
      assetInspectionSignature: finalSignature,
      assetInspectionSignatureType: signatureMode
    });

    onClose();
  };

  if (!isOpen || !booking) return null;

  const startMile = booking.startMileage || 0;
  const endMile = booking.endMileage || 0;
  const dist = booking.totalDistance || (endMile > startMile ? endMile - startMile : 0);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex justify-between items-center relative shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ตรวจรับรถเสร็จสิ้นภารกิจ (งานพัสดุ)
              </h2>
              <p className="text-xs text-emerald-200">
                เชื่อมโยงและบันทึกลงลายมือชื่อในใบบันทึกขอใช้รถราชการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mission & Vehicle Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">เลขที่บันทึกข้อความ: {booking.memoNo || 'พง ๐๐๓๒(พิเศษ)/-'}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                ภารกิจเสร็จสิ้นแล้ว
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-slate-500">ภารกิจ/วัตถุประสงค์:</p>
                <p className="font-semibold text-slate-800">{booking.purpose}</p>
                <p className="text-slate-500 mt-1">ผู้ขอใช้รถ / พนักงานขับรถ:</p>
                <p className="font-semibold text-slate-800">
                  {booking.name} ({booking.driverName || 'ผู้ขอขับเอง'})
                </p>
              </div>

              <div>
                <p className="text-slate-500">ยานพาหนะ:</p>
                <p className="font-semibold text-slate-800">{booking.carName}</p>
                <p className="text-slate-500 mt-1">สถานที่ปลายทาง:</p>
                <p className="font-semibold text-slate-800">{booking.destination} ({booking.destProvince || 'พังงา'})</p>
              </div>
            </div>

            {/* Mileage Inspection Verification Strip */}
            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block">เลขไมล์ไป (Start)</span>
                <span className="font-bold text-blue-800 text-sm">{startMile.toLocaleString()} กม.</span>
                {booking.startMileageTime && (
                  <span className="text-[10px] text-slate-400 block">{booking.startMileageTime} น.</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">เลขไมล์กลับ (End)</span>
                <span className="font-bold text-emerald-800 text-sm">{endMile.toLocaleString()} กม.</span>
                {booking.endMileageTime && (
                  <span className="text-[10px] text-slate-400 block">{booking.endMileageTime} น.</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ระยะทางรวมทั้งสิ้น</span>
                <span className="font-bold text-indigo-900 text-sm">{dist.toLocaleString()} กม.</span>
                {booking.fuelRefilledLiters ? (
                  <span className="text-[10px] text-teal-700 block">เติม {booking.fuelRefilledLiters} ลิตร</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Inspection Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล เจ้าหน้าที่พัสดุผู้ตรวจรับ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  placeholder="เช่น นายประเสริฐ สินทรัพย์"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่งทางราชการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectorPosition}
                  onChange={(e) => setInspectorPosition(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  placeholder="เช่น เจ้าพนักงานพัสดุชำนาญงาน"
                />
              </div>
            </div>

            {/* Vehicle Condition Radio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ผลการตรวจสภาพยานพาหนะหลังเสร็จสิ้นภารกิจ:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition('normal')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition ${
                    condition === 'normal'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 mb-1 ${condition === 'normal' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>ปกติเรียบร้อย</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCondition('needs_cleaning')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition ${
                    condition === 'needs_cleaning'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-400/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 mb-1 ${condition === 'needs_cleaning' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>ควรล้างทำความสะอาด</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCondition('needs_maintenance')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition ${
                    condition === 'needs_maintenance'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-400/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 mb-1 ${condition === 'needs_maintenance' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>พบข้อบกพร่อง/ต้องซ่อม</span>
                </button>
              </div>
            </div>

            {/* Inspection Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                บันทึกความเห็นการตรวจรับของเจ้าหน้าที่พัสดุ:
              </label>
              <textarea
                value={inspectionNote}
                onChange={(e) => setInspectionNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden resize-none"
                placeholder="ระบุข้อสังเกต หรือความเห็นของเจ้าหน้าที่พัสดุ"
              />
            </div>

            {/* Signature Mode Selector */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  ลายมือชื่อเจ้าหน้าที่พัสดุ (เชื่อมโยงในใบบันทึกขอใช้รถ): <span className="text-rose-500">*</span>
                </span>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      signatureMode === 'draw'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    วาดลายเซ็นสด (Digital Sign)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('electronic')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      signatureMode === 'electronic'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ลายเซ็นอิเล็กทรอนิกส์ (e-Sign)
                  </button>
                </div>
              </div>

              {signatureMode === 'draw' ? (
                <div className="space-y-2">
                  <div className="relative border-2 border-dashed border-emerald-300 bg-slate-50/60 rounded-xl overflow-hidden touch-none">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={140}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="w-full h-[140px] cursor-crosshair bg-white"
                    />
                    
                    {!hasDrawn && !booking.assetInspectionSignature && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                        <PenTool className="w-5 h-5 mb-1 text-emerald-500/60 animate-bounce" />
                        <span className="text-xs">เซ็นลายมือชื่อของเจ้าหน้าที่พัสดุในกรอบนี้</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleClearCanvas}
                        className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-900 text-white rounded-lg text-[11px] flex items-center space-x-1 shadow"
                        title="ลบลายเซ็นเพื่อวาดใหม่"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ล้าง</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>ใช้เมาส์ วาดด้วยนิ้วบนมือถือ หรือปากกาสไตลัส</span>
                    <span className="text-emerald-700 font-medium">✓ หมึกปากกาน้ำเงินราชการ</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center space-y-1">
                  <div className="font-serif italic text-blue-900 font-bold tracking-widest text-lg py-1">
                    ({inspectorName || 'ชื่อเจ้าหน้าที่พัสดุ'})
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    ระบบจะประทับตรารับรองอิเล็กทรอนิกส์พร้อมวันเวลาตรวจรับลงในเอกสาร
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>บันทึกลายเซ็น & ตรวจรับยานพาหนะ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
