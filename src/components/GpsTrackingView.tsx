import React, { useEffect, useRef, useState } from 'react';
import { Vehicle } from '../types';
import {
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  MapPin,
  Car,
  Clock,
  Radio,
  Compass,
  AlertCircle
} from 'lucide-react';

interface GpsTrackingViewProps {
  vehicles: Vehicle[];
}

interface CarGpsProfile {
  id: string;
  name: string;
  plate: string;
  driver: string;
  destination: string;
  speed: number;
  color: string;
  status: string;
}

const GPS_PROFILES: Record<string, CarGpsProfile> = {
  'v-camry': {
    id: 'v-camry',
    name: 'Toyota Camry (VIP)',
    plate: 'กข 1234 พังงา',
    driver: 'นายศราวุธ เกตุรักษ์',
    destination: 'ศาลากลางจังหวัดพังงา (ศูนย์ราชการ ถ้ำน้ำผุด)',
    speed: 68,
    color: '#f97316',
    status: 'กำลังเดินทาง (En Route)'
  },
  'v-revo': {
    id: 'v-revo',
    name: 'Toyota Hilux Revo (4 ประตู)',
    plate: 'ฮง 5678 พังงา',
    driver: 'นายเรวัติ แสงสว่าง',
    destination: 'จ.ภูเก็ต (โรงแรมรอยัลภูเก็ตซิตี้)',
    speed: 82,
    color: '#0284c7',
    status: 'กำลังเดินทาง (En Route)'
  },
  'v-commuter': {
    id: 'v-commuter',
    name: 'Toyota Commuter (รถตู้)',
    plate: 'นค 9999 พังงา',
    driver: 'นายศราวุธ เกตุรักษ์',
    destination: 'ย่านเมืองเก่าตะกั่วป่า (ถนนสายวัฒนธรรม)',
    speed: 62,
    color: '#10b981',
    status: 'กำลังเดินทาง (En Route)'
  },
  'v-dmax': {
    id: 'v-dmax',
    name: 'Isuzu D-Max (ตรวจการ)',
    plate: 'บฉ 4321 พังงา',
    driver: 'นายเรวัติ แสงสว่าง',
    destination: 'ชุมชนคุณธรรมบ้านบางพัฒน์ อ.เมืองพังงา',
    speed: 55,
    color: '#a855f7',
    status: 'จอดเตรียมพร้อม'
  }
};

// Route waypoints simulating Phangnga highway 4 / 402
const ROUTE_WAYPOINTS = [
  { x: 90, y: 320, label: 'สำนักงานวัฒนธรรมจังหวัดพังงา' },
  { x: 190, y: 300, label: 'ศาลากลางจังหวัดพังงา' },
  { x: 310, y: 240, label: 'แยกทับปุด / ทางหลวง 4' },
  { x: 440, y: 220, label: 'อ.ตะกั่วทุ่ง / โคกกลอย' },
  { x: 580, y: 150, label: 'อ.ท้ายเหมือง' },
  { x: 700, y: 120, label: 'เขาหลัก (หาดนางทอง)' },
  { x: 840, y: 180, label: 'ย่านเมืองเก่าตะกั่วป่า' },
  { x: 920, y: 250, label: 'จุดหมายปลายทาง' }
];

export const GpsTrackingView: React.FC<GpsTrackingViewProps> = ({ vehicles }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('v-camry');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [distanceKm, setDistanceKm] = useState<number>(16.4);
  const [progress, setProgress] = useState<number>(0.2);

  const activeCar = GPS_PROFILES[selectedVehicleId] || GPS_PROFILES['v-camry'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localProg = progress;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = Math.max(420, canvas.parentElement.clientHeight);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark canvas background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Map scale
      const scaleX = w / 1000;
      const scaleY = h / 450;
      const scaledPts = ROUTE_WAYPOINTS.map((pt) => ({
        x: pt.x * scaleX,
        y: pt.y * scaleY,
        label: pt.label
      }));

      // Draw road base
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      scaledPts.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Road dash stripe
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      scaledPts.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint marker circles & labels
      scaledPts.forEach((pt, idx) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Prompt, sans-serif';
        ctx.fillText(pt.label, pt.x - 30, pt.y - 12);
      });

      // Update position
      if (isPlaying) {
        localProg += 0.0018;
        if (localProg >= 1) localProg = 0;
        setProgress(localProg);
        setDistanceKm((prev) => +(prev + 0.012).toFixed(1));
      }

      // Interpolate along route
      const totalSegments = scaledPts.length - 1;
      const exactSeg = localProg * totalSegments;
      const segIndex = Math.floor(exactSeg);
      const t = exactSeg - segIndex;

      const p1 = scaledPts[Math.min(segIndex, totalSegments)];
      const p2 = scaledPts[Math.min(segIndex + 1, totalSegments)];

      const curX = p1.x + (p2.x - p1.x) * t;
      const curY = p1.y + (p2.y - p1.y) * t;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Draw radar ping around current vehicle
      const pingRadius = (Date.now() % 1000) / 30;
      ctx.strokeStyle = activeCar.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(curX, curY, pingRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Car box
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(angle);

      // Vehicle body
      ctx.fillStyle = activeCar.color;
      ctx.shadowColor = activeCar.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(-16, -9, 32, 18, 4);
      ctx.fill();

      // Vehicle windshield & lights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -7, 6, 14);

      // Headlights glow
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(42, -16);
      ctx.lineTo(42, 16);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, activeCar, selectedVehicleId]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-orange-600 animate-pulse" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              ระบบติดตามพิกัดยานพาหนะอัจฉริยะ (Live Fleet Tracking & Telemetry)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            สำนักงานวัฒนธรรมจังหวัดพังงา — จำลองตำแหน่งพิกัด GPS เส้นทาง ความเร็ว และข้อมูลโทรมาตรแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            {Object.values(GPS_PROFILES).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.plate})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center space-x-1.5 shadow-sm ${
              isPlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'หยุดชั่วคราว' : 'เล่นต่อ'}</span>
          </button>

          <button
            onClick={() => {
              setProgress(0);
              setDistanceKm(0);
            }}
            className="w-9 h-9 rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
            title="รีเซ็ตตำแหน่งเริ่มต้น"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Canvas on Left, Telemetry on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Map Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          
          {/* Overlay Status Bar */}
          <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 z-10">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-xs text-white">{activeCar.name}</span>
              <span className="font-mono text-[11px] text-orange-400">({activeCar.plate})</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full font-medium">
                {activeCar.status}
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center space-x-4">
              <span className="flex items-center text-orange-400 font-mono">
                <Gauge className="w-3.5 h-3.5 mr-1" />
                {activeCar.speed} กม./ชม.
              </span>
              <span className="text-slate-400 text-[11px]">
                พิกัด: อ.ท้ายเหมือง &rarr; เขาหลัก
              </span>
            </div>
          </div>

          {/* Real Canvas element */}
          <div className="relative w-full h-[420px] rounded-xl overflow-hidden my-2">
            <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
          </div>

          {/* Route Milestones info */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 px-2">
            <span>จุดเริ่มต้น: สำนักงานวัฒนธรรมจังหวัดพังงา</span>
            <span className="text-orange-400 font-medium">จำลองพิกัดบนทางหลวงหมายเลข ๔ (เพชรเกษม)</span>
            <span>ปลายทาง: ย่านเมืองเก่าตะกั่วป่า</span>
          </div>

        </div>

        {/* Telemetry Telemetry Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-orange-600" />
                <span>ข้อมูลโทรมาตรยานพาหนะ (Telemetry)</span>
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                GPS Connected
              </span>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">พนักงานขับรถประจำคัน</span>
                <p className="font-bold text-slate-900 text-sm">{activeCar.driver}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">จุดหมายปลายทางตามคำขอ</span>
                <p className="font-bold text-orange-800 text-xs leading-relaxed">{activeCar.destination}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ความเร็วปัจจุบัน</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {activeCar.speed} <span className="text-xs font-normal text-slate-500">กม./ชม.</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ระยะทางที่เดินทาง</span>
                  <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
                    {distanceKm} <span className="text-xs font-normal text-slate-500">กม.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">เวลาถึงโดยประมาณ (ETA)</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">35 นาที</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ความคืบหน้าเส้นทาง</span>
                  <div className="text-sm font-bold text-orange-600 mt-0.5">
                    {Math.round(progress * 100)}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-600 h-full transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>

            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 space-y-2">
            <div className="font-bold flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-teal-700" />
              <span>ความปลอดภัยและการตรวจจับความเร็ว</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              ระบบจำลองการปฏิบัติตาม พ.ร.บ.จราจรทางบก สำหรับรถยนต์ราชการ
              กำหนดความเร็วไม่เกิน ๙๐ กม./ชม. บนทางหลวงแผ่นดิน
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
