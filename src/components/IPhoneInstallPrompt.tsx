import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';

export const IPhoneInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);

    // Check if already launched in standalone (PWA installed) mode
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Has user dismissed in this session?
    const hasDismissed = sessionStorage.getItem('dismissed_ios_prompt');

    if (isIos && !isStandalone && !hasDismissed) {
      // Delay prompt slightly so it doesn't immediately obscure UI
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('dismissed_ios_prompt', 'true');
  };

  return (
    <aside
      aria-label="ติดตั้งแอปบนหน้าจอโฮม iPhone"
      className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:max-w-md z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center p-1 shrink-0 shadow-md">
            <img
              src="/logo_mculture.svg"
              alt="ตรากระทรวงวัฒนธรรม"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-white">
              <Smartphone className="w-4 h-4 text-orange-400" />
              ติดตั้งบน iPhone / iPad (รองรับแจ้งเตือนบนไอคอน)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              เปิดเต็มจอได้ทันที และแสดงตัวเลขแจ้งเตือนสีแดงบนหน้าจอโฮม
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          aria-label="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-200 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0 border border-orange-500/30">
            1
          </span>
          <span className="flex items-center gap-1 flex-wrap">
            กดปุ่ม <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-white border border-slate-700"><Share className="w-3.5 h-3.5 text-blue-400" /> แชร์ (Share)</span> ที่แถบด้านล่าง Safari
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[11px] shrink-0 border border-orange-500/30">
            2
          </span>
          <span className="flex items-center gap-1 flex-wrap">
            เลื่อนลงแล้วเลือก <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-white border border-slate-700"><PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</span>
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleDismiss}
          className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition shadow-sm"
        >
          เข้าใจแล้ว
        </button>
      </div>
    </aside>
  );
};
