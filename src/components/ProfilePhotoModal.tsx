import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  Camera,
  Upload,
  Trash2,
  Check,
  X,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Palette,
  Bot
} from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: string, newAvatarUrl: string) => void;
}

// Curated high quality Thai civil servant & cultural AI avatars
const AI_AVATAR_PRESETS = [
  {
    id: 'thai-male-white',
    label: 'ข้าราชการชาย (ชุดปกติขาว)',
    category: 'official',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    id: 'thai-female-white',
    label: 'ข้าราชการหญิง (ชุดปกติขาว)',
    category: 'official',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    id: 'thai-male-silk',
    label: 'ข้าราชการชาย (ชุดผ้าไทยพระราชทาน)',
    category: 'culture',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    id: 'thai-female-silk',
    label: 'ข้าราชการหญิง (ชุดผ้าไทยพังงา)',
    category: 'culture',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    id: 'thai-driver-pro',
    label: 'พนักงานขับรถ / เจ้าหน้าที่ภาคสนาม',
    category: 'official',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    id: 'thai-director',
    label: 'ผู้บริหาร / ผู้อำนวยการ',
    category: 'official',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'
  },
  {
    id: 'ai-3d-officer-m',
    label: 'AI 3D ข้าราชการสมาร์ท (ชาย)',
    category: '3d',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=CultureOfficerMan&backgroundColor=ffdfbf,ffd5dc,d1d4f9'
  },
  {
    id: 'ai-3d-officer-f',
    label: 'AI 3D ข้าราชการสมาร์ท (หญิง)',
    category: '3d',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=CultureOfficerWoman&backgroundColor=ffd5dc,d1d4f9,c0aede'
  },
  {
    id: 'ai-avataaars-1',
    label: 'AI Minimalist Avatar 1',
    category: 'minimal',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhangngaAdmin&clothingColor=262e33,3c4f5e&top=shortFlat,shortRound'
  },
  {
    id: 'ai-avataaars-2',
    label: 'AI Minimalist Avatar 2',
    category: 'minimal',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhangngaCultureStaff&clothingColor=25557c,4a314d&top=longButNotTooLong,straight01'
  },
  {
    id: 'ai-bot-smart',
    label: 'AI Assistant ยานพาหนะ',
    category: 'minimal',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MCultureVehicleBot&backgroundColor=ffe8d6,d8e2dc'
  },
  {
    id: 'ai-culture-spirit',
    label: 'AI ลายไทยศิลปวัฒนธรรม',
    category: 'culture',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=ThaiCulturePhangnga&baseColor=f9c9b6&hair=full'
  }
];

// Helper to compress image to max 400x400 web-safe base64 data URL
async function compressImage(fileOrDataUrl: File | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Export as high quality JPEG or WebP
      try {
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        resolve(compressed);
      } catch {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };
    img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(user?.avatarUrl || '');
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'ai' | 'url'>('ai');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // AI Avatar Category Filter
  const [aiCategory, setAiCategory] = useState<'all' | 'official' | 'culture' | '3d' | 'minimal'>('all');

  // Sync preview url when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setPreviewUrl(user.avatarUrl || '');
    }
  }, [user, isOpen]);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle camera start
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('อุปกรณ์นี้ไม่รองรับการเปิดกล้องเว็บแคมในเบราว์เซอร์โดยตรง กรุณาใช้ปุ่มถ่ายภาพผ่านกล้องมือถือ');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'ท่านยังไม่ได้อนุญาตการเข้าถึงกล้อง กรุณาเปิดสิทธิ์กล้องในเบราว์เซอร์ หรือใช้ปุ่ม "เปิดกล้องมือถือโดยตรง" ด้านล่าง'
          : 'ไม่สามารถเปิดกล้องสดได้ กรุณาใช้ปุ่ม "เปิดกล้องมือถือโดยตรง"'
      );
      setIsCameraActive(false);
    }
  };

  // Toggle Camera Facing (Front / Back)
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Snap photo from in-app video
  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth, video.videoHeight) || 400;
      canvas.width = 400;
      canvas.height = 400;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Center crop square
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      // If front camera, mirror image for natural selfie look
      if (cameraFacing === 'user') {
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setPreviewUrl(photoDataUrl);
      stopCamera();
      showToast('บันทึกภาพถ่ายเซลฟี่เรียบร้อย');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดขณะถ่ายภาพ');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle native file upload / camera capture
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (.jpg, .png, .webp, .heic)');
      return;
    }

    try {
      setIsProcessing(true);
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
      showToast('อัปโหลดรูปภาพสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถประมวลผลไฟล์รูปภาพนี้ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Generate random AI avatar
  const generateRandomAiAvatar = () => {
    const styles = ['personas', 'avataaars', 'bottts', 'micah', 'lorelei'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = `culture-${Math.random().toString(36).substring(2, 8)}-phangnga`;
    const newUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,ffe8d6`;
    setPreviewUrl(newUrl);
    showToast('สร้าง AI Avatar สุ่มสำเร็จ');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setPreviewUrl(urlInput.trim());
      setUrlInput('');
      showToast('นำลิงก์รูปภาพมาใช้เรียบร้อย');
    }
  };

  const handleSave = () => {
    if (!user) return;
    onSave(user.id, previewUrl);
    stopCamera();
    onClose();
  };

  const filteredAvatars = AI_AVATAR_PRESETS.filter((item) => {
    if (aiCategory === 'all') return true;
    return item.category === aiCategory;
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/65 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto select-none no-print transition-all duration-300">
      
      {/* Floating Pop-up / Bottom Sheet Card */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Mobile Pull Bar Indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Floating Header Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/30 shadow-inner">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  เปลี่ยนรูปโปรไฟล์
                </h3>
                <span className="bg-white/20 text-[10px] font-semibold px-2 py-0.2 rounded-full">
                  Pop-up ลอย
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                {user.name} ({user.roleTitle})
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 flex items-center justify-center space-x-1.5 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Floating Avatar Preview & User Identity */}
        <div className="px-5 pt-4 pb-2 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="relative group mb-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-orange-500/30 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-3xl font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            {previewUrl && (
              <button
                type="button"
                onClick={() => setPreviewUrl('')}
                title="ลบรูปภาพนี้"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 active:scale-95 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {user.position} • {user.department}
            </div>
          </div>
        </div>

        {/* 4 Primary Navigation Tiles (Floating Tab Switcher) */}
        <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700 shrink-0">
          <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
            {/* 1. ถ่ายภาพจากมือถือ */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                activeTab === 'camera'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-[11px] leading-tight text-center">ถ่ายภาพมือถือ</span>
            </button>

            {/* 2. อัพโหลดรูปจากมือถือ */}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('upload');
              }}
              className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-[11px] leading-tight text-center">อัพโหลดรูป</span>
            </button>

            {/* 3. AI Avatar */}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('ai');
              }}
              className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-[11px] leading-tight text-center">AI Avatar</span>
            </button>

            {/* 4. ลิงก์รูปภาพ */}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('url');
              }}
              className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[11px] leading-tight text-center">ลิงก์ URL</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Scrollable Tab Content Area                                      */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-grow space-y-4">
          
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: ถ่ายภาพจากมือถือ (Live Camera & Native Mobile Camera)     */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'camera' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Camera Video Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-[280px] mx-auto border-2 border-orange-500/40 shadow-inner flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
                    />
                    {/* Facial Oval Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-60 rounded-full border-2 border-dashed border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>

                    {/* Camera Flip Button */}
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow transition active:scale-90"
                      title="สลับกล้องหน้า/กล้องหลัง"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="p-4 text-center space-y-2 text-slate-400">
                    <Camera className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
                    <p className="text-xs">
                      {cameraError || 'คลิกเปิดกล้องเพื่อถ่ายภาพเซลฟี่'}
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                      เปิดกล้องเว็บแคม
                    </button>
                  </div>
                )}
              </div>

              {/* Shutter Controls */}
              {isCameraActive && (
                <div className="flex items-center justify-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-amber-700 active:scale-90 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/30 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                    <span>กดชัตเตอร์ถ่ายภาพ</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-300 transition"
                  >
                    ปิดกล้อง
                  </button>
                </div>
              )}

              {/* Native Mobile Camera Button (Always Available Fallback) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center space-y-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    หรือเปิดกล้องจากมือถือโดยตรง (รองรับ iPhone / Android):
                  </span>
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>เปิดกล้องถ่ายภาพบนโทรศัพท์มือถือ</span>
                  </button>
                  {/* Hidden input with capture="user" */}
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: อัพโหลดรูปจากมือถือ (Gallery / Files)                    */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'upload' && (
            <div className="space-y-3 animate-fadeIn">
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50 hover:bg-orange-50/50 dark:bg-slate-800/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 active:scale-98"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    แตะเพื่อเลือกรูปภาพจากคลังภาพมือถือ
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                    รองรับ JPG, PNG, WEBP, HEIC (ระบบจะย่อขนาดให้อัตโนมัติ)
                  </span>
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  ระบบจะทำการปรับขนาดและบีบอัดภาพให้อยู่ในขนาดที่เหมาะสมเพื่อการแสดงผลที่รวดเร็วและประหยัดพื้นที่จัดเก็บ
                </p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: AI Avatar (สตูดิโออวาตาร์ AI วัฒนธรรม)                   */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'ai' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              {/* Category Filters + Random Generator */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setAiCategory('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                      aiCategory === 'all'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiCategory('official')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                      aiCategory === 'official'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ข้าราชการ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiCategory('culture')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                      aiCategory === 'culture'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ผ้าไทย/วัฒนธรรม
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiCategory('3d')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                      aiCategory === '3d'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    AI 3D
                  </button>
                </div>

                {/* Random Button */}
                <button
                  type="button"
                  onClick={generateRandomAiAvatar}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center space-x-1 shrink-0 active:scale-95 transition cursor-pointer"
                  title="สุ่มสร้างภาพ AI อัตโนมัติ"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>สุ่ม AI ใหม่</span>
                </button>
              </div>

              {/* Grid of AI Avatars */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredAvatars.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(preset.url);
                      showToast(`เลือก: ${preset.label}`);
                    }}
                    className={`p-2 rounded-2xl border text-center transition flex flex-col items-center space-y-1.5 cursor-pointer active:scale-95 ${
                      previewUrl === preset.url
                        ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 ring-2 ring-orange-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-xs bg-slate-100 dark:bg-slate-700">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-tight line-clamp-2">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: วางลิงก์รูปภาพออนไลน์ (URL)                             */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'url' && (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                วางลิงก์รูปภาพออนไลน์ (Image URL):
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  นำไปใช้
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ================================================================= */}
        {/* Modal Bottom Action Bar (Touch-Optimized)                         */}
        {/* ================================================================= */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200/70 dark:border-slate-700/80 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <div className="flex items-center space-x-2">
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl('');
                  showToast('นำรูปภาพออกแล้ว');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
              >
                ลบรูปภาพ
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกรูปโปรไฟล์</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
