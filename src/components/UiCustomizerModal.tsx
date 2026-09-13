import React from 'react';
import { X, Palette, Sliders, Type, Grid, Check, Sparkles, Wand2 } from 'lucide-react';
import { playAppSound } from '../utils/thaiDate';

export type UiStyleType = 'modern' | 'ribbon' | 'slim_rail' | 'double_panel' | 'classic' | 'eevo_sleek';

interface UiCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiStyle: UiStyleType;
  onSetUiStyle: (style: UiStyleType) => void;
  menuButtonColor: 'orange' | 'emerald' | 'indigo' | 'rose' | 'violet';
  onSetMenuButtonColor: (color: 'orange' | 'emerald' | 'indigo' | 'rose' | 'violet') => void;
  iconStyle: 'gradient' | 'neon' | 'flat';
  onSetIconStyle: (style: 'gradient' | 'neon' | 'flat') => void;
  fontSize: 'small' | 'medium' | 'large';
  onSetFontSize: (size: 'small' | 'medium' | 'large') => void;
  soundEnabled?: boolean;
}

export const UiCustomizerModal: React.FC<UiCustomizerModalProps> = ({
  isOpen,
  onClose,
  uiStyle,
  onSetUiStyle,
  menuButtonColor,
  onSetMenuButtonColor,
  iconStyle,
  onSetIconStyle,
  fontSize,
  onSetFontSize,
  soundEnabled = true
}) => {
  if (!isOpen) return null;

  const styleOptions = [
    {
      id: 'modern' as const,
      name: '1. Standard Modern List',
      desc: 'แผงเมนูด้านซ้ายสีเข้ม มีรูปภาพโปรไฟล์ พร้อมแถบเส้นสว่างบอกสถานะฝั่งซ้ายแบบสปอร์ต',
      previewClass: 'bg-slate-900 border-slate-700'
    },
    {
      id: 'ribbon' as const,
      name: '2. Curved Inset Ribbon',
      desc: 'ขอบเมนูส่วนโค้งมนเว้าเข้ารูปแบบสามมิติไร้รอยต่อ (แบบดีไซน์ตัวเลือกด้านขวาในรูปภาพที่ส่งมา)',
      previewClass: 'bg-slate-950 border-emerald-500/30'
    },
    {
      id: 'slim_rail' as const,
      name: '3. Slim Icon Rail Dock',
      desc: 'แถบข้างผอมพิเศษ ประหยัดพื้นที่การแสดงผลสูงสุด แสดงผลเฉพาะไอคอนขอบมนเรืองแสง',
      previewClass: 'bg-[#151c2c] border-indigo-500/30'
    },
    {
      id: 'double_panel' as const,
      name: '4. Double Layer Grid Board',
      desc: 'แถบคู่ไฮเทค: ซีกซ้ายเก็บรูปโปรไฟล์/ผู้ใช้งาน ซีกขวาจัดวางแบบบล็อกตารางไอคอนโมเดิร์น',
      previewClass: 'bg-slate-900 border-purple-500/30'
    },
    {
      id: 'classic' as const,
      name: '5. Classic Thai Office',
      desc: 'สไตล์ราชการแบบดั้งเดิม กรอบเส้นลายคู่ อักษรแบบสารบรรณและขอบสีทองคำหรูหรา',
      previewClass: 'bg-stone-100 border-amber-800'
    }
  ];

  const colorOptions = [
    { id: 'orange' as const, name: 'ส้มชาไทย (Siam Amber)', colorClass: 'bg-orange-500', hex: '#f97316' },
    { id: 'emerald' as const, name: 'เขียวมรกต (Phangnga Emerald)', colorClass: 'bg-emerald-500', hex: '#10b981' },
    { id: 'indigo' as const, name: 'น้ำเงินหลวง (Royal Blue)', colorClass: 'bg-indigo-500', hex: '#6366f1' },
    { id: 'rose' as const, name: 'ชมพูบัวหลวง (Lotus Rose)', colorClass: 'bg-rose-500', hex: '#f43f5e' },
    { id: 'violet' as const, name: 'ม่วงอัญชัน (Violet Amethyst)', colorClass: 'bg-violet-500', hex: '#8b5cf6' }
  ];

  const iconStyleOptions = [
    { id: 'gradient' as const, name: 'ไล่เฉดสีทูโทน', desc: 'ไอคอนพร้อมพื้นหลังไล่โทนสีสันสดใสแบบโมเดิร์น' },
    { id: 'neon' as const, name: 'แสงนีออนเรืองแสง', desc: 'ขอบไอคอนเรืองแสงรอบปุ่ม มีประกายเงาในโหมดมืด' },
    { id: 'flat' as const, name: 'มินิมอลโมโนโครม', desc: 'สไตล์เรียบหรู ดูทางการด้วยสีขาว/เทาสลักลึก' }
  ];

  const fontOptions = [
    { id: 'small' as const, name: 'ตัวอักษรเล็ก (Compact)', desc: 'ขนาดกะทัดรัด เหมาะสำหรับจอมอนิเตอร์ขนาดเล็ก' },
    { id: 'medium' as const, name: 'ตัวอักษรกลาง (Standard)', desc: 'ขนาดมาตรฐาน อ่านง่าย สบายตาทั้งมือถือและคอมพิวเตอร์' },
    { id: 'large' as const, name: 'ตัวอักษรใหญ่ (Accessible)', desc: 'ขนาดใหญ่พิเศษ ชัดเจน คมชัดสูงสุดสำหรับผู้สูงอายุ' }
  ];

  const handleSelectStyle = (style: UiStyleType) => {
    onSetUiStyle(style);
    playAppSound('click', soundEnabled);
  };

  const handleSelectColor = (color: 'orange' | 'emerald' | 'indigo' | 'rose' | 'violet') => {
    onSetMenuButtonColor(color);
    playAppSound('success', soundEnabled);
  };

  const handleSelectIcon = (style: 'gradient' | 'neon' | 'flat') => {
    onSetIconStyle(style);
    playAppSound('click', soundEnabled);
  };

  const handleSelectFontSize = (size: 'small' | 'medium' | 'large') => {
    onSetFontSize(size);
    playAppSound('click', soundEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">เมนูออกแบบระดับโปรดักชัน (สไตล์หรูหราแบบใหม่)</h3>
              <p className="text-[10px] text-slate-400">
                สอดรับกับรูปภาพต้นแบบที่คุณอัปโหลด ปรับเปลี่ยนดีไซน์เมนูข้างและชุดสีได้เรียลไทม์ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar dark:bg-[#0c101b]">
          
          {/* Section 1: UI Layout Styles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Grid className="w-4 h-4" />
              1. เลือกสไตล์เมนูบาร์ด้านซ้าย (รองรับ 4 แบบจากรูปต้นแบบที่คุณอัปโหลด)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {styleOptions.map((opt) => {
                const isSelected = uiStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectStyle(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition duration-300 relative group flex flex-col justify-between cursor-pointer min-h-[110px] ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`text-xs font-bold transition-colors ${
                        isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {opt.name}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-normal">{opt.desc}</p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between w-full">
                      {/* Sub-indicator */}
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {isSelected ? 'เลือกใช้งานอยู่' : 'สลับใช้'}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Accent Buttons and Highlight Colors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              2. ตกแต่งสีของเมนูปุ่ม และเน้นจุดสังเกต (Brand Accents)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {colorOptions.map((opt) => {
                const isSelected = menuButtonColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectColor(opt.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-950/5 ring-2 ring-slate-500 dark:border-white dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full shadow-md ${opt.colorClass} flex items-center justify-center mb-2 relative`}>
                      {isSelected && <Check className="w-4 h-4 text-white font-bold" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      {opt.name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] text-slate-400 mt-0.5 font-mono">{opt.hex}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Icon styles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              3. ปรับเปลี่ยนรูปแบบดีไซน์การแสดงไอคอน (Icon Presentation)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {iconStyleOptions.map((opt) => {
                const isSelected = iconStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectIcon(opt.id)}
                    className={`p-4 rounded-xl border text-left transition duration-200 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{opt.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{opt.desc}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Font Sizes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4" />
              4. ปรับระดับขนาดตัวอักษรของระบบงานทั้งหมด (Font Scaling)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fontOptions.map((opt) => {
                const isSelected = fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectFontSize(opt.id)}
                    className={`p-4 rounded-xl border text-left transition duration-200 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      <p className={`font-bold transition-colors ${
                        opt.id === 'small' ? 'text-xs' : opt.id === 'medium' ? 'text-sm' : 'text-base'
                      } ${isSelected ? 'text-orange-500' : 'text-slate-800 dark:text-slate-100'}`}>
                        {opt.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{opt.desc}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>ค่าปรับแต่งจะถูกจำไว้ในเครื่องบราวเซอร์นี้โดยอัตโนมัติ</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition cursor-pointer border-none"
          >
            ตกลงและบันทึก
          </button>
        </div>

      </div>
    </div>
  );
};
