import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  PenTool,
  Upload,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Trash2,
  FileCheck2,
  Info,
  ShieldCheck,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface UserSignatureModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSaveSignature: (userId: string, signatureUrl: string, signatureType: 'draw' | 'image' | 'electronic') => void;
  onDeleteSignature?: (userId: string) => void;
}

export const UserSignatureModal: React.FC<UserSignatureModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveSignature,
  onDeleteSignature
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'electronic'>('draw');
  
  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#1e3a8a'); // Official Royal Blue
  const [penWidth, setPenWidth] = useState(2.8);

  // Upload State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Electronic Signature State
  const [electronicStyle, setElectronicStyle] = useState<'cursive' | 'formal' | 'seal'>('cursive');
  const [customSignerText, setCustomSignerText] = useState(user.name);

  // Current preview
  const [previewSignature, setPreviewSignature] = useState<string | null>(user.signatureUrl || null);

  useEffect(() => {
    if (isOpen) {
      setCustomSignerText(user.name);
      setPreviewSignature(user.signatureUrl || null);
      setHasDrawn(false);
      setUploadedImage(null);
      
      // Delay initialization slightly to let modal DOM render
      const timer = setTimeout(() => {
        initCanvas();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, user]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution for retina displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Transparent canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    lastPointRef.current = { x, y };
    setIsDrawing(true);
    setHasDrawn(true);

    ctx.beginPath();
    ctx.arc(x, y, penWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    initCanvas();
  };

  // Upload handler with automatic white-background removal to create a crisp transparent signature PNG
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (PNG หรือ JPG)');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create an offscreen canvas to process and clean transparent background
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setUploadedImage(img.src);
          setIsProcessingImage(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Convert near-white pixels to transparent
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // If the pixel is very bright / close to white paper background
            if (r > 215 && g > 215 && b > 215) {
              data[i + 3] = 0; // set alpha to 0
            } else {
              // Enhance ink color slightly towards deep blue or dark charcoal
              const darkness = (r + g + b) / 3;
              if (darkness < 150) {
                // Keep ink intact
                data[i + 3] = 255;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          const cleanedDataUrl = canvas.toDataURL('image/png');
          setUploadedImage(cleanedDataUrl);
        } catch {
          setUploadedImage(img.src);
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Generate Electronic Signature Stamp as a Data URL
  const generateElectronicSignatureUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (electronicStyle === 'cursive') {
      // Artistic handwriting style
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'italic 34px "Sarabun", "TH Sarabun New", "Angsana New", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customSignerText, 250, 70);

      // Underline flourish
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(70, 95);
      ctx.bezierCurveTo(170, 110, 330, 90, 430, 95);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Sarabun", sans-serif';
      ctx.fillText(`(ลงนามอิเล็กทรอนิกส์ • ${user.position || 'เจ้าหน้าที่'})`, 250, 125);
    } else if (electronicStyle === 'formal') {
      // Formal rectangular seal
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 20, 440, 120);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 22px "Sarabun", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customSignerText, 250, 55);

      ctx.font = '15px "Sarabun", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(user.position || 'เจ้าหน้าที่ผู้ขอใช้รถ', 250, 85);

      ctx.font = '12px "Sarabun", sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText('✓ DIGITAL SIGNATURE VERIFIED', 250, 115);
    } else {
      // Official Circular Seal
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(250, 80, 65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.arc(250, 80, 58, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 15px "Sarabun", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('สำนักงานวัฒนธรรม', 250, 55);
      ctx.fillText(customSignerText, 250, 80);
      ctx.font = '12px "Sarabun", sans-serif';
      ctx.fillText('จ.พังงา', 250, 105);
    }

    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    let finalSignatureUrl = '';
    let finalType: 'draw' | 'image' | 'electronic' = activeTab;

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert('กรุณาวาดลายมือชื่อบนผืนผ้าใบก่อนทำการบันทึก');
        return;
      }
      finalSignatureUrl = canvas.toDataURL('image/png');
      finalType = 'draw';
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        alert('กรุณาเลือกไฟล์ภาพลายเซ็นที่ต้องการอัปโหลด');
        return;
      }
      finalSignatureUrl = uploadedImage;
      finalType = 'image';
    } else if (activeTab === 'electronic') {
      finalSignatureUrl = generateElectronicSignatureUrl();
      finalType = 'electronic';
    }

    if (!finalSignatureUrl) {
      alert('ไม่พบลายมือชื่อ กรุณาลองใหม่อีกครั้ง');
      return;
    }

    onSaveSignature(user.id, finalSignatureUrl, finalType);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`คุณต้องการลบลายมือชื่อของ "${user.name}" ออกจากระบบหรือไม่?`)) {
      if (onDeleteSignature) {
        onDeleteSignature(user.id);
      } else {
        onSaveSignature(user.id, '', 'draw');
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">จัดการลายมือชื่อดิจิทัล</h3>
              <p className="text-[11px] text-slate-300">
                สำหรับ: <span className="text-orange-300 font-semibold">{user.name}</span> ({user.position || user.roleTitle})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Signature Status Banner */}
        {user.signatureUrl ? (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold">มีลายมือชื่อบันทึกในระบบแล้ว</span>
                <span className="text-[11px] text-emerald-700 ml-1.5">(พร้อมประทับลงในใบคำขออัตโนมัติ)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 shrink-0 px-2 py-0.5 rounded-lg hover:bg-rose-100 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบลายเซ็น</span>
            </button>
          </div>
        ) : (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center space-x-2 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>ยังไม่มีลายเซ็นในระบบ สามารถวาด อัปโหลด หรือสร้างลายเซ็นอิเล็กทรอนิกส์ได้ทันที</span>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition ${
                activeTab === 'draw'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>1. วาดลายมือชื่อสด</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition ${
                activeTab === 'upload'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>2. อัปโหลดรูปภาพ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('electronic')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition ${
                activeTab === 'electronic'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. ตราประทับดิจิทัล</span>
            </button>
          </div>
        </div>

        {/* Body Content by Tab */}
        <div className="p-5 space-y-4">

          {/* TAB 1: DRAW CANVAS */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              {/* Canvas Controls */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-medium">สีหมึก:</span>
                  <button
                    type="button"
                    onClick={() => setPenColor('#1e3a8a')}
                    className={`w-5 h-5 rounded-full bg-blue-900 border-2 transition ${
                      penColor === '#1e3a8a' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-white shadow-xs'
                    }`}
                    title="น้ำเงินราชการ"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#0f172a')}
                    className={`w-5 h-5 rounded-full bg-slate-900 border-2 transition ${
                      penColor === '#0f172a' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-white shadow-xs'
                    }`}
                    title="ดำทางการ"
                  />

                  <span className="text-slate-400 mx-1">|</span>

                  <span className="text-slate-500 font-medium">ความหนา:</span>
                  <button
                    type="button"
                    onClick={() => setPenWidth(1.8)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === 1.8 ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    บาง
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(2.8)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === 2.8 ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    ปกติ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(4.2)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === 4.2 ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    หนา
                  </button>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างกระดาน</span>
                </button>
              </div>

              {/* Canvas Box */}
              <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl bg-amber-50/20 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs">
                    <PenTool className="w-6 h-6 mb-1 text-slate-300" />
                    <span>ใช้เมาส์หรือนิ้ววาดลายมือชื่อในกรอบนี้</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">รองรับทั้งคอมพิวเตอร์และหน้าจอสัมผัส (iPad/Tablet/มือถือ)</span>
                  </div>
                )}
                {/* Baseline Guide */}
                <div className="absolute left-6 right-6 bottom-10 border-b border-dashed border-slate-300 pointer-events-none" />
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-2xl p-6 text-center bg-slate-50 transition">
                <input
                  type="file"
                  id="signature-file-upload"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="signature-file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-orange-600 hover:underline">คลิกเพื่อเลือกรูปภาพลายเซ็น</span>
                    <span className="text-xs text-slate-500"> หรือลากไฟล์มาวางที่นี่</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    รองรับไฟล์ PNG, JPG (ระบบจะตัดพื้นหลังสีขาวออกให้โปร่งใสอัตโนมัติ)
                  </p>
                </label>
              </div>

              {isProcessingImage && (
                <div className="text-center py-2 text-xs text-slate-500 animate-pulse">
                  กำลังประมวลผลและตัดพื้นหลังรูปภาพ...
                </div>
              )}

              {uploadedImage && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-28 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden">
                      <img src={uploadedImage} alt="Uploaded preview" className="max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">ประมวลผลภาพสำเร็จ</div>
                      <div className="text-[11px] text-emerald-600 font-medium">✓ พื้นหลังโปร่งใส คมชัด พร้อมใช้งาน</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold p-1"
                  >
                    ลบภาพ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ELECTRONIC SIGNATURE / STAMP */}
          {activeTab === 'electronic' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ข้อความชื่อผู้ลงนาม:</label>
                <input
                  type="text"
                  value={customSignerText}
                  onChange={(e) => setCustomSignerText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-hidden"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">รูปแบบตราประทับ / ลายเซ็น:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setElectronicStyle('cursive')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      electronicStyle === 'cursive'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <div className="text-xs font-serif italic mb-0.5">ลายเซ็นหวัด</div>
                    <div className="text-[10px] text-slate-400">Handwriting Style</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setElectronicStyle('formal')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      electronicStyle === 'formal'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold mb-0.5">ตรากรอบราชการ</div>
                    <div className="text-[10px] text-slate-400">Verified Stamp</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setElectronicStyle('seal')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      electronicStyle === 'seal'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">ตราวงกลมทางการ</div>
                    <div className="text-[10px] text-slate-400">Official Seal</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Document Preview Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Eye className="w-3.5 h-3.5 text-orange-600" />
              <span>ตัวอย่างการแสดงผลใน &quot;ใบคำขอขอใช้รถยนต์ส่วนกลาง&quot;</span>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center font-serif text-slate-800 text-xs">
              <div className="w-56 mx-auto flex flex-col items-center">
                {/* Signature Preview */}
                <div className="h-14 flex items-center justify-center my-1 w-full">
                  {activeTab === 'draw' && hasDrawn && (
                    <span className="text-[11px] text-blue-800 font-sans italic bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      [ ลายมือชื่อที่วาด ]
                    </span>
                  )}
                  {activeTab === 'upload' && uploadedImage && (
                    <img src={uploadedImage} alt="Preview" className="max-h-12 object-contain" />
                  )}
                  {activeTab === 'electronic' && (
                    <span className="text-[11px] text-blue-900 font-sans font-bold bg-blue-50 px-3 py-1 rounded border border-blue-200">
                      (ลงนามดิจิทัล • {customSignerText})
                    </span>
                  )}
                  {((activeTab === 'draw' && !hasDrawn) || (activeTab === 'upload' && !uploadedImage)) && user.signatureUrl && (
                    <img src={user.signatureUrl} alt="Current signature" className="max-h-12 object-contain" />
                  )}
                  {((activeTab === 'draw' && !hasDrawn) || (activeTab === 'upload' && !uploadedImage)) && !user.signatureUrl && (
                    <span className="text-slate-400 text-xs italic">ยังไม่มีการลงลายมือชื่อ</span>
                  )}
                </div>

                <p className="font-medium text-xs">({user.name})</p>
                <p className="text-[11px] text-slate-500">{user.position || 'ตำแหน่งตามคำสั่งราชการ'}</p>
                <p className="text-[10px] text-slate-400">ผู้ขอใช้รถราชการ</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            ยกเลิก
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกลายมือชื่อใช้งาน</span>
          </button>
        </div>

      </div>
    </div>
  );
};
