import React, { useState, useEffect } from 'react';
import { Sparkles, Megaphone, Car, Bike, ShieldCheck, Flame, Clock, Calendar, Zap } from 'lucide-react';
import { Vehicle } from '../types';

interface MarqueeTickerProps {
  vehicles: Vehicle[];
  pendingCount: number;
}

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({ vehicles, pendingCount }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dayStr = now.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      setCurrentTime(`${dayStr} • ${timeStr} น.`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableCars = vehicles.filter((v) => v.status === 'available').length;
  const inMissionCars = vehicles.filter((v) => v.status === 'in_mission').length;
  const totalCars = vehicles.length;

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-orange-500/40 text-white overflow-hidden shadow-xl relative">
      {/* Glowing background animated accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-orange-500 via-amber-400 to-teal-400 animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-indigo-500/30" />

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
        {/* Left Badge with Live Clock */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5 bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-xl border border-orange-400/30 shadow-2xs">
            <Flame className="w-3.5 h-3.5 animate-bounce text-orange-400" />
            <span className="font-bold tracking-wide uppercase text-[11px] bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              ศูนย์ราชการดิจิทัล พังงา
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700 text-slate-300 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            <span>{currentTime || 'กำลังโหลดเวลา...'}</span>
          </div>
        </div>

        {/* Marquee Running Text */}
        <div className="overflow-hidden whitespace-nowrap flex-grow mx-2 w-full md:w-auto relative">
          <div className="inline-block animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused] text-xs font-medium text-slate-200">
            <span className="inline-flex items-center space-x-8">
              <span className="inline-flex items-center space-x-2 text-orange-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>สำนักงานวัฒนธรรมจังหวัดพังงา ยินดีต้อนรับสู่ระบบขอใช้รถราชการและบริหารจัดการยานพาหนะส่วนกลาง (Fleet Management)</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center space-x-2 text-emerald-300 font-semibold">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                <span>สถานะยานพาหนะ: พร้อมใช้งาน {availableCars} คัน | กำลังปฏิบัติภารกิจ {inMissionCars} คัน (รวมรถยนต์และรถจักรยานยนต์ราชการ)</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center space-x-2 text-amber-300 font-semibold">
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>คำขอจองรถรออนุมัติ: {pendingCount} รายการ • กรุณาตรวจสอบรอบภาษีประจำปีและ พ.ร.บ. เพื่อความปลอดภัยสูงสุด</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center space-x-2 text-teal-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>ระบบสมุดทะเบียนคุมอิเล็กทรอนิกส์ (Official Logbook) และใบเบิกออนไลน์ เปิดให้บริการตลอด 24 ชั่วโมง</span>
              </span>
            </span>
          </div>
        </div>

        {/* Right Status Indicator & Quick Stats */}
        <div className="shrink-0 hidden xl:flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-emerald-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px]">ระบบเสถียร (Online 100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
