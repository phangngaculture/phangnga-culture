import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const MobileAppInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check dismissed
    const dismissed = localStorage.getItem('mculture_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('mculture_pwa_banner_dismissed', 'true');
  };

  // If already standalone (installed) or dismissed, don't show the banner
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show on mobile screens
  return (
    <>
      <div className="md:hidden mx-4 mb-4 mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-700/80 flex items-center justify-between gap-3 relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 p-1">
            <img
              src="/logo_mculture.svg"
              alt="ตรากระทรวงวัฒนธรรม"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white truncate">
                ติดตั้งแอปบนมือถือ
              </span>
              <span className="text-[9px] bg-orange-500/30 text-orange-300 border border-orange-500/40 px-1.5 py-0.2 rounded font-semibold">
                PWA App
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              เปิดเต็มหน้าจอ เสมือนแอปแท้ สะดวกกว่า
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ติดตั้ง</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-1">
                  <img src="/logo_mculture.svg" alt="logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">ติดตั้งบน iPhone / iPad</h3>
                  <p className="text-xs text-slate-400">วิธีเพิ่มแอปลงหน้าจอโฮม</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs shrink-0 border border-orange-500/30">
                  1
                </span>
                <div>
                  กดปุ่ม <span className="inline-flex items-center space-x-1 font-semibold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><Share className="w-3 h-3 text-blue-400 inline" /> แชร์ (Share)</span> ที่แถบเครื่องมือด้านล่างของ Safari
                </div>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs shrink-0 border border-orange-500/30">
                  2
                </span>
                <div>
                  เลื่อนลงแล้วเลือก <span className="inline-flex items-center space-x-1 font-semibold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><PlusSquare className="w-3 h-3 text-emerald-400 inline" /> เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs shrink-0 border border-orange-500/30">
                  3
                </span>
                <div>
                  กด <strong>เพิ่ม (Add)</strong> มุมขวาบน จะมีไอคอนแอปปรากฏบนหน้าจอมือถือทันที!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              รับทราบและปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
};
