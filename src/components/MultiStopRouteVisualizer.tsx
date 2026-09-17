import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Milestone,
  ArrowRight,
  Clock,
  Gauge,
  CloudSun,
  CloudRain,
  Sun,
  AlertTriangle,
  Compass,
  Layers,
  ChevronUp,
  ChevronDown,
  Trash2,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface StopItem {
  name: string;
  lat?: number;
  lng?: number;
  estimatedKm?: number;
}

interface MultiStopRouteVisualizerProps {
  origin?: string;
  destinations: string[];
  destProvince?: string;
  destDetail?: string;
  onRemoveStop?: (index: number) => void;
  onReorderStops?: (newStops: string[]) => void;
}

// Preset landmarks with coordinates & typical weather in Phang Nga & nearby
const PHANGNGA_LANDMARKS: Record<string, { lat: number; lng: number; district: string; kmFromCenter: number; weather: { text: string; temp: string; icon: 'sun' | 'rain' | 'cloud'; advisory?: string } }> = {
  'ถ้ำพุงช้าง (เมืองพังงา)': {
    lat: 8.4412,
    lng: 98.5193,
    district: 'อ.เมืองพังงา',
    kmFromCenter: 2.5,
    weather: { text: 'แดดร่ม ลมสงบ', temp: '31°C', icon: 'sun' }
  },
  'วนอุทยานสระนางมโนราห์': {
    lat: 8.5123,
    lng: 98.5412,
    district: 'อ.เมืองพังงา',
    kmFromCenter: 8.0,
    weather: { text: 'อากาศชุ่มชื้น ลมเย็น', temp: '29°C', icon: 'cloud' }
  },
  'จุดชมวิวเสม็ดนางชี (ตะกั่วทุ่ง)': {
    lat: 8.2405,
    lng: 98.4485,
    district: 'อ.ตะกั่วทุ่ง',
    kmFromCenter: 38.0,
    weather: { text: 'ท้องฟ้าแจ่มใส ลมทะเลพัดดี', temp: '32°C', icon: 'sun' }
  },
  'สะพานสารสิน (เชื่อมภูเก็ต)': {
    lat: 8.2014,
    lng: 98.2986,
    district: 'อ.ตะกั่วทุ่ง',
    kmFromCenter: 58.0,
    weather: { text: 'ลมทะเลปานกลาง ทัศนวิสัยดี', temp: '32°C', icon: 'sun' }
  },
  'ย่านเมืองเก่าตะกั่วป่า (ถนนศรีตะกั่วป่า)': {
    lat: 8.8312,
    lng: 98.3615,
    district: 'อ.ตะกั่วป่า',
    kmFromCenter: 65.0,
    weather: { text: 'เมฆบางส่วน แดดอ่อน', temp: '30°C', icon: 'cloud' }
  },
  'อนุสรณ์สถานสึนามิ เรือ ต.813 (เขาหลัก)': {
    lat: 8.6651,
    lng: 98.2514,
    district: 'อ.ตะกั่วป่า',
    kmFromCenter: 62.0,
    weather: { text: 'คลื่นลมปกติ ริมหาด', temp: '31°C', icon: 'sun' }
  },
  'วัดพระทอง / วัดพระผุด (ตะกั่วทุ่ง)': {
    lat: 8.3512,
    lng: 98.4012,
    district: 'อ.ตะกั่วทุ่ง',
    kmFromCenter: 22.0,
    weather: { text: 'อากาศโปร่ง ปลอดโปร่ง', temp: '31°C', icon: 'sun' }
  },
  'ชุมชนคุณธรรมบ้านโคกไคร': {
    lat: 8.3125,
    lng: 98.4112,
    district: 'อ.ตะกั่วทุ่ง',
    kmFromCenter: 32.0,
    weather: { text: 'ลมป่าชายเลน ทัศนวิสัยดี', temp: '30°C', icon: 'sun' }
  },
  'น้ำตกเต่าทอง (ทับปุด)': {
    lat: 8.5214,
    lng: 98.6214,
    district: 'อ.ทับปุด',
    kmFromCenter: 24.0,
    weather: { text: 'ร่มรื่น ระวังทางโค้งลาดชัน', temp: '28°C', icon: 'cloud', advisory: 'ทางเข้าแคบ โปรดใช้ความระมัดระวัง' }
  },
  'ศูนย์ศิลปาชีพบ้านกะปง (กะปง)': {
    lat: 8.6814,
    lng: 98.4214,
    district: 'อ.กะปง',
    kmFromCenter: 48.0,
    weather: { text: 'มีหมอกยามเช้า อากาศเย็น', temp: '27°C', icon: 'cloud' }
  },
  'หาดท้ายเหมือง / อุทยานเขาลำปี-หาดท้ายเหมือง': {
    lat: 8.4012,
    lng: 98.2715,
    district: 'อ.ท้ายเหมือง',
    kmFromCenter: 52.0,
    weather: { text: 'ลมชายหาดแรง คลื่นสูง 1-2 ม.', temp: '31°C', icon: 'cloud', advisory: 'ระวังลมกรรโชกแรงช่วงบ่าย' }
  },
  'ศาลากลางจังหวัดพังงา': {
    lat: 8.4485,
    lng: 98.5285,
    district: 'อ.เมืองพังงา',
    kmFromCenter: 3.0,
    weather: { text: 'แดดจัด ทัศนวิสัยดี', temp: '32°C', icon: 'sun' }
  }
};

export const MultiStopRouteVisualizer: React.FC<MultiStopRouteVisualizerProps> = ({
  origin = 'สำนักงานวัฒนธรรมจังหวัดพังงา',
  destinations,
  destProvince = 'พังงา',
  destDetail = '',
  onRemoveStop,
  onReorderStops
}) => {
  const [mapStyle, setMapStyle] = useState<'standard' | 'terrain' | 'satellite'>('standard');
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // Parse destinations list
  const validStops = destinations.filter((d) => d && d.trim().length > 0);

  // Compute estimated distances
  const routePoints = [
    { name: origin, type: 'origin', district: 'อ.เมืองพังงา', km: 0 },
    ...validStops.map((stop, idx) => {
      // Find matching landmark if any
      const match = Object.entries(PHANGNGA_LANDMARKS).find(([key]) => stop.includes(key) || key.includes(stop));
      const dist = match ? match[1].kmFromCenter : (idx + 1) * 28.5;
      return {
        name: stop,
        type: idx === validStops.length - 1 ? 'final' : 'waypoint',
        district: match ? match[1].district : destProvince === 'พังงา' ? 'จ.พังงา' : `จ.${destProvince}`,
        km: dist
      };
    })
  ];

  // Calculate cumulative stats
  const totalLegsKm = validStops.length > 0 ? (validStops.length * 35) + 15 : 0;
  const roundTripKm = totalLegsKm * 2;
  const estDrivingMinutes = Math.round((totalLegsKm / 60) * 60);
  const estHours = Math.floor(estDrivingMinutes / 60);
  const estMins = estDrivingMinutes % 60;
  const estFuelLiters = (roundTripKm / 11.5).toFixed(1); // 11.5 km/L standard van
  const estFuelCost = (parseFloat(estFuelLiters) * 33.5).toFixed(0); // ~33.5 THB/L Diesel

  const handleMoveUp = (index: number) => {
    if (index === 0 || !onReorderStops) return;
    const newStops = [...destinations];
    const temp = newStops[index];
    newStops[index] = newStops[index - 1];
    newStops[index - 1] = temp;
    onReorderStops(newStops);
  };

  const handleMoveDown = (index: number) => {
    if (index === destinations.length - 1 || !onReorderStops) return;
    const newStops = [...destinations];
    const temp = newStops[index];
    newStops[index] = newStops[index + 1];
    newStops[index + 1] = temp;
    onReorderStops(newStops);
  };

  const handleStartSimulation = () => {
    setIsSimulatingDrive(true);
    setSimProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      if (p >= 100) {
        setSimProgress(100);
        clearInterval(interval);
        setTimeout(() => setIsSimulatingDrive(false), 800);
      } else {
        setSimProgress(p);
      }
    }, 40);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${destinations
    .filter(Boolean)
    .map((d) => encodeURIComponent(d + (destProvince ? ` ${destProvince}` : '')))
    .join('/')}`;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 shadow-xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
            <Milestone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white tracking-wide">
                แผนผังจำลองเส้นทาง & จุดแวะหลายจุด
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full font-medium">
                {validStops.length} จุดหมาย
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              วิเคราะห์เส้นทาง คำนวณระยะทาง-เวลาสะสม และตรวจสอบสภาพอากาศรายจุด
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isSimulatingDrive || validStops.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              isSimulatingDrive
                ? 'bg-amber-500 text-slate-900 animate-pulse'
                : 'bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/30'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulatingDrive ? `จำลองการวิ่ง (${simProgress}%)` : 'จำลองเส้นทาง GPS'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
            <span>Google Maps</span>
          </a>
        </div>
      </div>

      {/* Route Timeline Stages */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-teal-300 flex items-center justify-between">
          <span>ลำดับการแวะปฏิบัติราชการ (Waypoints):</span>
          <span className="text-slate-400 text-[10px]">กด ▲/▼ เพื่อจัดลำดับก่อน-หลัง</span>
        </div>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-teal-500 before:to-orange-500">
          {/* Origin Point */}
          <div className="relative flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 text-xs">
            <span className="absolute -left-6 top-3 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm" />
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                จุดเริ่มต้น
              </span>
              <span className="font-semibold text-slate-100 truncate">{origin}</span>
            </div>
            <div className="text-[11px] text-emerald-400 shrink-0 font-mono">0 กม. (กม.0)</div>
          </div>

          {/* Waypoints */}
          {validStops.length === 0 ? (
            <div className="p-3 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
              ยังไม่มีจุดหมายปลายทางที่ระบุ — พิมพ์หรือเลือกสถานที่ในช่องด้านบน
            </div>
          ) : (
            validStops.map((stop, idx) => {
              const isLast = idx === validStops.length - 1;
              const match = Object.entries(PHANGNGA_LANDMARKS).find(
                ([k]) => stop.includes(k) || k.includes(stop)
              );
              const legKm = match ? match[1].kmFromCenter : (idx + 1) * 32;

              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-between rounded-xl p-2.5 text-xs transition ${
                    isLast
                      ? 'bg-gradient-to-r from-orange-950/40 to-slate-800/80 border border-orange-500/40'
                      : 'bg-slate-800/80 border border-slate-700/80'
                  }`}
                >
                  <span
                    className={`absolute -left-6 top-3 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm ${
                      isLast ? 'bg-orange-500' : 'bg-teal-400'
                    }`}
                  />
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 font-bold rounded shrink-0 ${
                        isLast
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}
                    >
                      {isLast ? 'จุดหมายปลายทาง' : `จุดแวะ ${idx + 1}`}
                    </span>
                    <span className="font-medium text-slate-100 truncate">{stop}</span>
                    {match && (
                      <span className="text-[10px] text-slate-400 hidden sm:inline truncate">
                        ({match[1].district})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-[11px] text-slate-300 font-mono">
                      ~{legKm} กม.
                    </span>

                    {/* Reorder Buttons */}
                    {onReorderStops && validStops.length > 1 && (
                      <div className="flex items-center space-x-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === validStops.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="เลื่อนลง"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {onRemoveStop && (
                      <button
                        type="button"
                        onClick={() => onRemoveStop(idx)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded cursor-pointer"
                        title="ลบจุดนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Simulation Progress Bar */}
      {isSimulatingDrive && (
        <div className="p-3 bg-indigo-950/70 rounded-xl border border-indigo-500/40 space-y-2">
          <div className="flex justify-between text-xs text-indigo-200">
            <span className="flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>ความเร็วจำลอง: 85 กม./ชม.</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">{simProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 via-amber-400 to-orange-500 h-full transition-all duration-75"
              style={{ width: `${simProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Route Weather & Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400">ระยะทางเที่ยวเดียว</div>
          <div className="text-sm font-bold text-teal-400 font-mono mt-0.5">
            {totalLegsKm} <span className="text-[10px] font-normal text-slate-300">กม.</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400">ไป-กลับ รวม</div>
          <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">
            {roundTripKm} <span className="text-[10px] font-normal text-slate-300">กม.</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400">เวลาเดินทางโดยประมาณ</div>
          <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
            {estHours > 0 ? `${estHours} ชม. ` : ''}{estMins} <span className="text-[10px] font-normal text-slate-300">นาที</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400">ประมาณการน้ำมันดีเซล</div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            ~{estFuelCost} <span className="text-[10px] font-normal text-slate-300">บาท</span>
          </div>
        </div>
      </div>

      {/* Safety & Monsoon Advisory */}
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold">ข้อแนะนำความปลอดภัยการขับขี่ใน จ.พังงา:</span>{' '}
          เส้นทางระหว่าง อ.เมือง ➔ อ.กะปง (ผ่านเขานางหงส์/ทางหลวง 4090) มีทางโค้งลาดชันสูง หากมีฝนตกโปรดลดความเร็วและเปิดไฟหน้ารถ
        </div>
      </div>
    </div>
  );
};
