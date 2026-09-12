import React, { useState, useEffect } from 'react';
import {
  VoiceSettings,
  getVoiceSettings,
  saveVoiceSettings,
  isSpeechSynthesisSupported,
  getAvailableThaiVoices,
  testVoiceAlert,
  stopVoiceAlert,
  playChimeSound
} from '../utils/voiceAlerts';
import {
  Volume2,
  VolumeX,
  Mic,
  Play,
  Square,
  CheckCircle2,
  Sliders,
  Bell,
  Check,
  X,
  Sparkles,
  Info,
  Radio,
  Car,
  FileCheck,
  RotateCcw
} from 'lucide-react';

interface VoiceAlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: VoiceSettings) => void;
}

export const VoiceAlertSettingsModal: React.FC<VoiceAlertSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());
  const [isPlayingTest, setIsPlayingTest] = useState<string | null>(null);
  const [thaiVoices, setThaiVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    if (isOpen) {
      setSettings(getVoiceSettings());
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const updateVoices = () => {
          setThaiVoices(getAvailableThaiVoices());
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMaster = () => {
    const next = { ...settings, enabled: !settings.enabled };
    setSettings(next);
    saveVoiceSettings(next);
    onSettingsChanged?.(next);
    if (next.enabled) {
      playChimeSound('crystal', next.voiceVolume);
    }
  };

  const handleChange = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveVoiceSettings(next);
    onSettingsChanged?.(next);
  };

  const handleTest = (
    type: 'new_booking' | 'approved' | 'rejected' | 'mission_started' | 'mission_completed'
  ) => {
    setIsPlayingTest(type);
    testVoiceAlert(type);
    setTimeout(() => {
      setIsPlayingTest((curr) => (curr === type ? null : curr));
    }, 4500);
  };

  const handleStop = () => {
    stopVoiceAlert();
    setIsPlayingTest(null);
  };

  const handleReset = () => {
    const defaults: VoiceSettings = {
      enabled: true,
      chimeEnabled: true,
      voiceVolume: 1.0,
      voiceRate: 1.0,
      voicePitch: 1.0,
      speakNewBooking: true,
      speakApproval: true,
      speakMission: true,
      speakInspection: true
    };
    setSettings(defaults);
    saveVoiceSettings(defaults);
    onSettingsChanged?.(defaults);
    playChimeSound('crystal', 1.0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">ตั้งค่าการแจ้งเตือนด้วยเสียง</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium border border-white/30">
                  Voice Alerts
                </span>
              </div>
              <p className="text-xs text-orange-100">
                ระบบอ่านออกเสียงภาษาไทยอัตโนมัติเมื่อมีการอนุมัติหรือมีคำขอใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200">
          
          {/* Master Switch Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/50">
            <div className="flex items-start space-x-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  settings.enabled
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {settings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>เปิดใช้งานเสียงพูดแจ้งเตือน (Voice Alerts)</span>
                  {settings.enabled && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      ทำงานอยู่
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ช่วยให้ทราบสถานะงานทันทีโดยไม่ต้องจ้องหน้าจอตลอดเวลา
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleMaster}
              type="button"
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.enabled ? 'bg-orange-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Browser TTS Engine Status */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-300">
                เครื่องยนต์เสียงสังเคราะห์:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {isSupported
                    ? thaiVoices.length > 0
                      ? `Web Speech API (${thaiVoices[0]?.name || 'Thai TTS'})`
                      : 'Web Speech API (Thai Default)'
                    : 'ไม่รองรับในเบราว์เซอร์นี้ (ใช้เสียงกระดิ่งแทน)'}
                </strong>
              </span>
            </div>
            {isSupported && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> พร้อมใช้งาน
              </span>
            )}
          </div>

          {/* Event Triggers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-orange-500" />
              <span>เลือกเหตุการณ์ที่ต้องการให้อ่านออกเสียง</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Event 1: New Booking */}
              <label
                className={`flex items-start p-3 rounded-xl border transition cursor-pointer ${
                  settings.speakNewBooking
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.speakNewBooking}
                  onChange={(e) => handleChange('speakNewBooking', e.target.checked)}
                  disabled={!settings.enabled}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 mt-1 cursor-pointer"
                />
                <div className="ml-2.5">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>มีคำขอใช้รถใหม่เข้ามา</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    อ่านชื่อผู้ขอ และวัตถุประสงค์การเดินทาง
                  </p>
                </div>
              </label>

              {/* Event 2: Approval */}
              <label
                className={`flex items-start p-3 rounded-xl border transition cursor-pointer ${
                  settings.speakApproval
                    ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.speakApproval}
                  onChange={(e) => handleChange('speakApproval', e.target.checked)}
                  disabled={!settings.enabled}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-1 cursor-pointer"
                />
                <div className="ml-2.5">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-teal-600" />
                    <span>เมื่อ ผอ. ลงนามอนุมัติใบเบิก</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    แจ้งว่าใบเบิกอนุมัติแล้ว พร้อมเดินทาง
                  </p>
                </div>
              </label>

              {/* Event 3: Mission Updates */}
              <label
                className={`flex items-start p-3 rounded-xl border transition cursor-pointer ${
                  settings.speakMission
                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.speakMission}
                  onChange={(e) => handleChange('speakMission', e.target.checked)}
                  disabled={!settings.enabled}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                />
                <div className="ml-2.5">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    <Car className="w-3 h-3 text-blue-600" />
                    <span>เริ่มงาน / จบภารกิจคนขับ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    แจ้งเตือนเมื่อรถออกวิ่ง หรือกลับเข้า สนง.
                  </p>
                </div>
              </label>

              {/* Event 4: Chime Bell Preamble */}
              <label
                className={`flex items-start p-3 rounded-xl border transition cursor-pointer ${
                  settings.chimeEnabled
                    ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.chimeEnabled}
                  onChange={(e) => handleChange('chimeEnabled', e.target.checked)}
                  disabled={!settings.enabled}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-1 cursor-pointer"
                />
                <div className="ml-2.5">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>เสียงกระดิ่งคริสตัลนำหน้า</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    เล่นเสียงเตือน (Chime) ก่อนเริ่มพูด
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Volume & Speed Sliders */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              <span>ปรับแต่งระดับเสียงและความเร็ว</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">ระดับความดัง (Volume)</span>
                  <span className="font-bold text-orange-600">{Math.round(settings.voiceVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={settings.voiceVolume}
                  onChange={(e) => handleChange('voiceVolume', parseFloat(e.target.value))}
                  disabled={!settings.enabled}
                  className="w-full accent-orange-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Rate / Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">ความเร็วเสียงพูด (Speed)</span>
                  <span className="font-bold text-orange-600">{settings.voiceRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={settings.voiceRate}
                  onChange={(e) => handleChange('voiceRate', parseFloat(e.target.value))}
                  disabled={!settings.enabled}
                  className="w-full accent-orange-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Interactive Test Center */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5 text-orange-500" />
                <span>ทดลองฟังตัวอย่างเสียงพูด (Live Audio Preview)</span>
              </h4>
              {isPlayingTest && (
                <button
                  onClick={handleStop}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Square className="w-3 h-3 fill-current" /> หยุดเสียง
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTest('new_booking')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isPlayingTest === 'new_booking'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md animate-pulse'
                    : 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>🔊 เสียงเตือน "มีคำขอใหม่"</span>
                </span>
                <span className="text-[10px] opacity-75">คำขอใช้รถ</span>
              </button>

              <button
                type="button"
                onClick={() => handleTest('approved')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isPlayingTest === 'approved'
                    ? 'bg-teal-600 text-white border-teal-700 shadow-md animate-pulse'
                    : 'bg-teal-50 hover:bg-teal-100/80 text-teal-900 border-teal-200 dark:bg-teal-950/40 dark:text-teal-200 dark:border-teal-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>✅ เสียงเตือน "อนุมัติใบเบิก"</span>
                </span>
                <span className="text-[10px] opacity-75">ผอ. ลงนาม</span>
              </button>

              <button
                type="button"
                onClick={() => handleTest('mission_started')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isPlayingTest === 'mission_started'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100/80 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>🚗 เสียงเตือน "รถออกเดินทาง"</span>
                </span>
                <span className="text-[10px] opacity-75">เริ่มภารกิจ</span>
              </button>

              <button
                type="button"
                onClick={() => handleTest('mission_completed')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isPlayingTest === 'mission_completed'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md animate-pulse'
                    : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>🏁 เสียงเตือน "จบภารกิจ"</span>
                </span>
                <span className="text-[10px] opacity-75">ลงทะเบียนคุม</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-md shadow-orange-600/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกและปิด</span>
          </button>
        </div>
      </div>
    </div>
  );
};
