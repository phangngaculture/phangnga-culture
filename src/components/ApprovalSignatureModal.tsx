import React, { useState, useRef, useEffect } from 'react';
import { BookingRequest, User } from '../types';
import { formatThaiDate } from '../utils/thaiDate';
import {
  PenTool,
  ShieldCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Upload,
  FileCheck2,
  Calendar,
  MapPin,
  Car,
  User as UserIcon,
  Stamp,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

interface ApprovalSignatureModalProps {
  isOpen: boolean;
  booking: BookingRequest | null;
  currentUser?: User;
  approverName?: string;
  approverRoleTitle?: string;
  initialComment?: string;
  onClose: () => void;
  onConfirm?: (
    bookingId: string,
    approvalData: {
      comment: string;
      signatureType: 'draw' | 'electronic';
      signatureData: string;
      signerName: string;
    }
  ) => void;
  onConfirmApproval?: (
    bookingId: string,
    approvalData: {
      comment: string;
      signatureType: 'draw' | 'electronic';
      signatureData: string;
      signerName: string;
    }
  ) => void;
}

const PRESET_DIRECTOR_COMMENTS = [
  'อนุมัติ ให้เดินทางโดยสวัสดิภาพและปฏิบัติตามกฎจราจรและระเบียบราชการอย่างเคร่งครัด',
  'อนุมัติ มอบหมายฝ่ายบริหารทั่วไปและพนักงานขับรถดูแลความพร้อมของยานพาหนะ',
  'อนุมัติ ให้ประสานงานหน่วยงานในพื้นที่ล่วงหน้าเพื่อให้การปฏิบัติภารกิจบรรลุผล',
  'อนุมัติ โดยให้ใช้ความระมัดระวังเป็นพิเศษในการขับขี่'
];

export const ApprovalSignatureModal: React.FC<ApprovalSignatureModalProps> = ({
  isOpen,
  booking,
  currentUser,
  approverName = 'นางสาวอุไรวรรณ แดงงาม',
  approverRoleTitle = 'วัฒนธรรมจังหวัดพังงา',
  initialComment = PRESET_DIRECTOR_COMMENTS[0],
  onClose,
  onConfirm,
  onConfirmApproval
}) => {
  const effectiveApproverName = approverName || currentUser?.name || 'นางสาวอุไรวรรณ แดงงาม';
  const effectiveApproverRole = approverRoleTitle || currentUser?.position || 'วัฒนธรรมจังหวัดพังงา';

  const [signatureMode, setSignatureMode] = useState<'draw' | 'electronic'>('draw');
  const [comment, setComment] = useState<string>(initialComment);
  const [signerName, setSignerName] = useState<string>(effectiveApproverName);
  
  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#1e3a8a'); // Official civil service blue pen
  const [penWidth, setPenWidth] = useState(2.8);

  // Electronic Signature state
  const [electronicStyle, setElectronicStyle] = useState<'calligraphy' | 'stamp' | 'upload'>('calligraphy');
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && booking) {
      setComment(initialComment || booking.directorComment || PRESET_DIRECTOR_COMMENTS[0]);
      setSignerName(effectiveApproverName);
      setHasDrawn(false);
      // Clear canvas if open
      setTimeout(() => {
        initCanvas();
      }, 50);
    }
  }, [isOpen, booking, initialComment, effectiveApproverName]);

  // Attach native non-passive touch listeners directly to canvas to eliminate all mobile gesture delay
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
      if (e.touches.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pos = getCanvasPos(e.touches[0]);
      const last = lastPointRef.current || pos;

      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      const midX = (last.x + pos.x) / 2;
      const midY = (last.y + pos.y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      ctx.stroke();

      lastPointRef.current = pos;
      setHasDrawn(true);
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(false);
      lastPointRef.current = null;
    };

    canvas.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleNativeTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleNativeTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleNativeTouchStart);
      canvas.removeEventListener('touchmove', handleNativeTouchMove);
      canvas.removeEventListener('touchend', handleNativeTouchEnd);
      canvas.removeEventListener('touchcancel', handleNativeTouchEnd);
    };
  }, [isOpen, signatureMode, penColor, penWidth]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPointRef.current = null;
    setHasDrawn(false);
  };

  // Draw authentic sample signature immediately into canvas without manual drawing
  const drawSampleSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Signature flourish curve for "อุไรวรรณ"
    ctx.beginPath();
    ctx.moveTo(110, 115);
    ctx.bezierCurveTo(120, 80, 150, 60, 180, 85);
    ctx.bezierCurveTo(195, 105, 170, 130, 145, 110);
    ctx.bezierCurveTo(135, 95, 160, 70, 205, 80);
    ctx.bezierCurveTo(230, 88, 245, 115, 270, 100);
    ctx.bezierCurveTo(300, 80, 310, 65, 340, 85);
    ctx.bezierCurveTo(360, 100, 370, 120, 420, 75);
    ctx.stroke();

    // Underline flourish
    ctx.beginPath();
    ctx.moveTo(140, 128);
    ctx.bezierCurveTo(240, 138, 360, 125, 450, 105);
    ctx.stroke();

    setHasDrawn(true);
  };

  if (!isOpen || !booking) return null;

  // Pointer Handlers for Mouse / Stylus
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
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

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!isDrawing) {
      if (e.buttons === 1) {
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
      }
      return;
    }

    const last = lastPointRef.current || { x, y };
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    const midX = (last.x + x) / 2;
    const midY = (last.y + y) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // Generate Electronic Signature image or SVG dataURL
  const generateElectronicSignature = (): string => {
    if (electronicStyle === 'upload' && uploadedSignatureUrl) {
      return uploadedSignatureUrl;
    }

    // Generate a clean off-screen canvas for electronic signature
    const offscreen = document.createElement('canvas');
    offscreen.width = 500;
    offscreen.height = 160;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, 500, 160);

    if (electronicStyle === 'stamp') {
      // Official Digital Certificate Stamp
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(8, 8, 484, 144);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(13, 13, 474, 134);

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 16px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('อนุมัติผ่านระบบอิเล็กทรอนิกส์', 250, 42);

      ctx.font = 'bold 20px "TH Sarabun New", Sarabun, serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`(${signerName})`, 250, 78);

      ctx.font = '13px Sarabun, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(effectiveApproverRole, 250, 102);

      const nowStr = formatThaiDate(new Date().toISOString().split('T')[0], 'short');
      ctx.font = '11px monospace';
      ctx.fillStyle = '#0284c7';
      ctx.fillText(`[DIGITAL ID: PNA-CULT-${Date.now().toString(36).toUpperCase()} • ${nowStr}]`, 250, 130);
    } else {
      // Calligraphy Signature
      ctx.font = 'italic bold 32px "Angsana New", "TH Sarabun New", cursive, serif';
      ctx.fillStyle = '#1e3a8a';
      ctx.textAlign = 'center';
      ctx.fillText(signerName.replace('ดร.', '').trim(), 250, 80);

      // Underline flourish
      ctx.beginPath();
      ctx.moveTo(120, 95);
      ctx.bezierCurveTo(200, 105, 300, 85, 380, 98);
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '12px Sarabun, sans-serif';
      ctx.fillStyle = '#2563eb';
      ctx.fillText('✓ ลงนามอิเล็กทรอนิกส์รับรอง', 250, 130);
    }

    return offscreen.toDataURL('image/png');
  };

  const handleConfirm = () => {
    if (!booking) return;

    try {
      let finalSignatureData = '';

      if (signatureMode === 'draw') {
        const canvas = canvasRef.current;
        if (canvas && hasDrawn) {
          finalSignatureData = canvas.toDataURL('image/png');
        } else {
          // If not drawn yet, generate electronic signature automatically
          finalSignatureData = generateElectronicSignature();
        }
      } else {
        finalSignatureData = generateElectronicSignature();
      }

      const callback = onConfirmApproval || onConfirm;
      if (typeof callback === 'function') {
        callback(booking.id, {
          comment: comment.trim() || PRESET_DIRECTOR_COMMENTS[0],
          signatureType: signatureMode,
          signatureData: finalSignatureData,
          signerName: signerName.trim() || effectiveApproverName
        });
      } else {
        console.warn('Neither onConfirmApproval nor onConfirm is provided');
        onClose();
      }
    } catch (err) {
      console.error('Error generating signature or confirming approval:', err);
      const callback = onConfirmApproval || onConfirm;
      if (typeof callback === 'function') {
        callback(booking.id, {
          comment: comment.trim() || PRESET_DIRECTOR_COMMENTS[0],
          signatureType: signatureMode,
          signatureData: '',
          signerName: signerName.trim() || effectiveApproverName
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2">
                <span>ลงนามอนุมัติคำขอใช้รถยนต์ราชการ</span>
                <span className="text-[10px] bg-teal-500/30 text-teal-200 border border-teal-400/40 px-2 py-0.5 rounded-full font-mono">
                  {booking.id}
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                กรุณาเลือกรูปแบบลายเซ็น (วาดลายเซ็นสด หรือลายเซ็นอิเล็กทรอนิกส์) เพื่อประทับลงใบคำขอขอใช้รถยนต์ส่วนกลาง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-teal-800/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">

          {/* Booking Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 font-medium">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <FileCheck2 className="w-4 h-4 text-teal-700" />
                <span>เรื่อง: {booking.purpose}</span>
              </div>
              <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-semibold">
                {booking.memoNo}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>ผู้ขอ: <b>{booking.name}</b> ({booking.department})</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Car className="w-3.5 h-3.5 text-teal-600" />
                <span>ยานพาหนะ: <b>{booking.carName}</b></span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span className="truncate">ปลายทาง: <b>{booking.destination}</b></span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>วันที่: <b>{formatThaiDate(booking.date, 'short')}</b></span>
              </div>
            </div>
          </div>

          {/* Tab Selector: Draw Signature vs Electronic Signature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <PenTool className="w-4 h-4 text-teal-700" />
                <span>เลือกรูปแบบการลงนาม (Signature Method) *</span>
              </label>
              <span className="text-[11px] text-slate-500">รองรับตาม พ.ร.บ.ธุรกรรมอิเล็กทรอนิกส์</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  signatureMode === 'draw'
                    ? 'bg-white text-teal-900 shadow-sm border border-teal-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-4 h-4 text-teal-700" />
                <span>๑. วาดลายเซ็น (Draw Signature)</span>
              </button>

              <button
                type="button"
                onClick={() => setSignatureMode('electronic')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  signatureMode === 'electronic'
                    ? 'bg-white text-teal-900 shadow-sm border border-teal-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stamp className="w-4 h-4 text-teal-700" />
                <span>๒. ลายเซ็นอิเล็กทรอนิกส์ (E-Signature)</span>
              </button>
            </div>
          </div>

          {/* Option 1: Draw Signature Canvas */}
          {signatureMode === 'draw' && (
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <span>วาดลายเซ็นลงบนพื้นที่ด้านล่าง (ใช้เมาส์ หรือนิ้ว/ปากกาสไตลัส)</span>
                </span>
                
                <div className="flex items-center space-x-2">
                  {/* Pen Color Picker */}
                  <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPenColor('#1e3a8a')}
                      className={`w-5 h-5 rounded-full bg-[#1e3a8a] border ${
                        penColor === '#1e3a8a' ? 'ring-2 ring-blue-400' : ''
                      }`}
                      title="หมึกสีน้ำเงินทางการ"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#0f172a')}
                      className={`w-5 h-5 rounded-full bg-[#0f172a] border ${
                        penColor === '#0f172a' ? 'ring-2 ring-slate-400' : ''
                      }`}
                      title="หมึกสีดำ"
                    />
                  </div>

                  {/* Auto signature preset button */}
                  <button
                    type="button"
                    onClick={drawSampleSignature}
                    className="px-2.5 py-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-300 flex items-center space-x-1 transition font-medium"
                    title="ลงลายมือชื่อตัวอย่างทันทีโดยไม่ต้องวาดเอง"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>เซ็นด่วนอัตโนมัติ</span>
                  </button>

                  <button
                    type="button"
                    onClick={initCanvas}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center space-x-1 transition font-medium"
                    title="ลบลายเซ็นเพื่อวาดใหม่"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้างเพื่อวาดใหม่</span>
                  </button>
                </div>
              </div>

              {/* Canvas Board */}
              <div className="relative border-2 border-dashed border-teal-300 rounded-xl overflow-hidden bg-white shadow-inner flex flex-col items-center justify-center touch-none select-none">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={180}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  style={{
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                  className="w-full h-44 cursor-crosshair block touch-none select-none"
                />

                {/* Baseline guide */}
                <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex flex-col items-center opacity-40">
                  <div className="w-3/4 border-b border-slate-400 border-dashed"></div>
                  <span className="text-[10px] text-slate-500 mt-1">(พื้นที่ลงลายมือชื่อผู้อนุมัติ)</span>
                </div>

                {!hasDrawn && (
                  <div className="absolute pointer-events-none text-slate-300 flex flex-col items-center space-y-1">
                    <PenTool className="w-6 h-6 animate-bounce" />
                    <span className="text-xs font-medium">แตะ/คลิกหรือลากเพื่อวาดลายมือชื่อได้ทันที</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>ชื่อผู้อนุมัติ: <b className="text-slate-800">{signerName}</b></span>
                <span className="text-teal-700 font-medium">
                  {hasDrawn ? '✓ บันทึกลายมือชื่อสดเรียบร้อย' : 'คำแนะนำ: สามารถวาดเพื่อความสมจริง หรือสลับไปใช้ลายเซ็นอิเล็กทรอนิกส์ได้'}
                </span>
              </div>
            </div>
          )}

          {/* Option 2: Electronic Signature Styles */}
          {signatureMode === 'electronic' && (
            <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  เลือกรูปแบบลายเซ็นอิเล็กทรอนิกส์ / ตราประทับ:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setElectronicStyle('calligraphy')}
                    className={`p-3 rounded-xl border text-left transition ${
                      electronicStyle === 'calligraphy'
                        ? 'bg-teal-50 border-teal-500 shadow-2xs text-teal-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">ตัวเขียนทางการ</span>
                      {electronicStyle === 'calligraphy' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">ลายเซ็นอักษรวิจิตรน้ำเงิน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setElectronicStyle('stamp')}
                    className={`p-3 rounded-xl border text-left transition ${
                      electronicStyle === 'stamp'
                        ? 'bg-teal-50 border-teal-500 shadow-2xs text-teal-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">ตราประทับดิจิทัล</span>
                      {electronicStyle === 'stamp' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">ตรายางอิเล็กทรอนิกส์พร้อมรหัส</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setElectronicStyle('upload')}
                    className={`p-3 rounded-xl border text-left transition ${
                      electronicStyle === 'upload'
                        ? 'bg-teal-50 border-teal-500 shadow-2xs text-teal-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">อัปโหลดไฟล์ภาพ</span>
                      {electronicStyle === 'upload' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">ไฟล์ภาพ PNG/JPG จากเครื่อง</span>
                  </button>
                </div>
              </div>

              {/* Upload field if selected */}
              {electronicStyle === 'upload' && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    เลือกไฟล์รูปภาพลายเซ็น (PNG พื้นหลังโปร่งใส หรือ JPG):
                  </label>
                  <label className="flex items-center justify-center p-4 border-2 border-dashed border-teal-300 rounded-xl hover:bg-teal-50/50 cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setUploadedSignatureUrl(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <div className="text-center space-y-1">
                      <Upload className="w-6 h-6 text-teal-600 mx-auto" />
                      <span className="text-xs text-teal-800 font-semibold block">
                        {uploadedSignatureUrl ? 'เปลี่ยนไฟล์ภาพลายเซ็น' : 'คลิกเพื่อเลือกไฟล์รูปภาพลายเซ็น'}
                      </span>
                      <span className="text-[10px] text-slate-400">ขนาดแนะนำไม่เกิน 2MB</span>
                    </div>
                  </label>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="bg-white rounded-xl p-5 border border-teal-200 shadow-inner flex flex-col items-center justify-center text-center min-h-[140px]">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 block">
                  ตัวอย่างการแสดงผลลายเซ็นในใบคำขอขอใช้รถยนต์ส่วนกลาง
                </span>

                {electronicStyle === 'calligraphy' && (
                  <div className="space-y-1">
                    <div className="font-serif italic text-blue-900 font-bold tracking-widest text-2xl border-b-2 border-blue-600 pb-1 px-8">
                      ({signerName})
                    </div>
                    <div className="text-[11px] text-blue-600 font-sans mt-1">
                      ✓ อนุมัติผ่านระบบลงนามอิเล็กทรอนิกส์ (Digital Sign)
                    </div>
                  </div>
                )}

                {electronicStyle === 'stamp' && (
                  <div className="border-2 border-sky-600 rounded-lg p-3 max-w-sm bg-sky-50/30 text-sky-900 space-y-1">
                    <div className="text-xs font-bold text-sky-800">อนุมัติผ่านระบบอิเล็กทรอนิกส์</div>
                    <div className="text-base font-bold text-slate-900">({signerName})</div>
                    <div className="text-[11px] text-slate-600">{effectiveApproverRole}</div>
                    <div className="text-[10px] font-mono text-sky-700 pt-1 border-t border-sky-200">
                      พ.ร.บ.ธุรกรรมอิเล็กทรอนิกส์ • วันที่ {formatThaiDate(new Date().toISOString().split('T')[0], 'short')}
                    </div>
                  </div>
                )}

                {electronicStyle === 'upload' && (
                  <div>
                    {uploadedSignatureUrl ? (
                      <img src={uploadedSignatureUrl} alt="ลายเซ็น" className="max-h-20 object-contain mx-auto" />
                    ) : (
                      <span className="text-xs text-slate-400 italic">ยังไม่ได้เลือกไฟล์ภาพลายเซ็น (ระบบจะใช้แบบตัวเขียนแทน)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Signer Name Input */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ชื่อ-สกุลผู้อนุมัติที่จะระบุใต้ลายเซ็น:
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          )}

          {/* Section: Director's Comment / Executive Order */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>ความเห็นและคำสั่งการของวัฒนธรรมจังหวัดพังงา *</span>
              </label>
              <span className="text-[10px] text-slate-400">จะประทับลงในใบคำขอขอใช้รถยนต์ส่วนกลาง</span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DIRECTOR_COMMENTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setComment(preset)}
                  className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition text-left"
                >
                  + {preset.slice(0, 36)}...
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ระบุข้อสั่งการ ความเห็น หรือคำสั่งอนุมัติ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 leading-relaxed"
            />
          </div>

          {/* Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-amber-900 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              เมื่อท่านกดปุ่ม <b>&ldquo;ตกลง / ยืนยันการลงนามอนุมัติ&rdquo;</b> ระบบจะบันทึกสถานะเป็น <b>&ldquo;อนุมัติแล้ว&rdquo;</b> พร้อมประทับลายมือชื่อของท่าน และจะ<b>เด้งแสดงตัวอย่างใบคำขอขอใช้รถยนต์ส่วนกลางฉบับสมบูรณ์</b> ขึ้นมาทันทีเพื่อให้ท่านตรวจสอบความเรียบร้อย
            </p>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            ยกเลิก
          </button>

          <button
            id="btn-confirm-approval-signature"
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-teal-700/25 flex items-center space-x-2 transition cursor-pointer active:scale-95 select-none"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ตกลง / ยืนยันการลงนามอนุมัติ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
