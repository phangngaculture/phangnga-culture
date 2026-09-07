import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera, Upload, Trash2, Check, X, User as UserIcon, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: string, newAvatarUrl: string) => void;
}

// Curated high quality avatars for Thai government / cultural officers
const PRESET_AVATARS = [
  {
    label: 'ข้าราชการชาย 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'
  },
  {
    label: 'ข้าราชการหญิง 1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80'
  },
  {
    label: 'ข้าราชการชาย 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80'
  },
  {
    label: 'ข้าราชการหญิง 2',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80'
  },
  {
    label: 'ผู้บริหาร/ผู้อำนวยการ',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80'
  },
  {
    label: 'พนักงานขับรถ/เจ้าหน้าที่',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80'
  }
];

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave
}) => {
  if (!isOpen || !user) return null;

  const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (.jpg, .png, .webp)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์รูปภาพมีขนาดใหญ่เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กลง');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setPreviewUrl(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
  };

  const handleSave = () => {
    onSave(user.id, previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                จัดการรูปภาพโปรไฟล์
              </h3>
              <p className="text-xs text-orange-100">
                {user.name} ({user.roleTitle})
              </p>
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
        <div className="p-6 space-y-6">
          
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full ring-4 ring-orange-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg">
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
                  onClick={handleRemovePhoto}
                  title="ลบรูปภาพนี้"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-center">
              <div className="font-bold text-sm text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500">{user.position} • {user.department}</div>
            </div>
          </div>

          {/* Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดจากเครื่อง</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'preset'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>เลือกภาพตัวอย่าง</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'url'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ลิงก์รูปภาพ</span>
            </button>
          </div>

          {/* Tab 1: Upload from local device */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">คลิกเพื่อเลือกไฟล์รูปภาพจากอุปกรณ์</span>
                  <span className="text-[11px] text-slate-500">รองรับไฟล์ JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Choose from presets */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-600 block">
                เลือกภาพถ่ายโปรไฟล์ทางการที่เหมาะสมกับบทบาท:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewUrl(preset.url)}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center space-y-1.5 ${
                      previewUrl === preset.url
                        ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-400'
                        : 'border-slate-200 hover:border-orange-300 bg-white'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-12 h-12 rounded-full object-cover shadow-xs"
                    />
                    <span className="text-[10px] font-medium text-slate-700 leading-tight">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Image URL input */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-700 block">
                วางลิงก์รูปภาพออนไลน์ (URL):
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  นำไปใช้
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition"
          >
            ยกเลิก
          </button>
          <div className="flex items-center space-x-2">
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                ลบรูปภาพ
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
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
