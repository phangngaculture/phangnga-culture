import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Layers,
  Crosshair,
  Maximize2,
  ExternalLink,
  Copy,
  Check,
  Fuel,
  User as UserIcon,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

interface GpsTrackingViewProps {
  vehicles: Vehicle[];
}

export interface Waypoint {
  lat: number;
  lng: number;
  label: string;
}

export interface CarGpsProfile {
  id: string;
  name: string;
  plate: string;
  driver: string;
  destination: string;
  color: string;
  status: 'en_route' | 'idle' | 'returning' | 'completed';
  statusText: string;
  speed: number;
  fuelLevel: number;
  totalDistanceKm: number;
  waypoints: Waypoint[];
}

// Phangnga Real Geographic Profiles & Simulated Road Routes
const DEFAULT_GPS_PROFILES: Record<string, CarGpsProfile> = {
  'v-camry': {
    id: 'v-camry',
    name: 'Toyota Camry (VIP)',
    plate: 'กข 1234 พังงา',
    driver: 'นายศราวุธ เกตุรักษ์',
    destination: 'ศาลากลางจังหวัดพังงา (ศูนย์ราชการ ถ้ำน้ำผุด)',
    color: '#ea580c', // Orange
    status: 'en_route',
    statusText: 'กำลังเดินทางไปราชการ',
    speed: 68,
    fuelLevel: 82,
    totalDistanceKm: 14.8,
    waypoints: [
      { lat: 8.4501, lng: 98.5255, label: 'สำนักงานวัฒนธรรมจังหวัดพังงา (จุดเริ่มต้น)' },
      { lat: 8.4565, lng: 98.5280, label: 'วงเวียนเขาตาปู / แยกวังหม้อแกง' },
      { lat: 8.4630, lng: 98.5310, label: 'ถนนเพชรเกษม (สายในเมือง)' },
      { lat: 8.4682, lng: 98.5341, label: 'ศาลากลางจังหวัดพังงา (ถ้ำน้ำผุด)' }
    ]
  },
  'v-revo': {
    id: 'v-revo',
    name: 'Toyota Hilux Revo (4 ประตู)',
    plate: 'ฮง 5678 พังงา',
    driver: 'นายเรวัติ แสงสว่าง',
    destination: 'จ.ภูเก็ต (โรงแรมรอยัลภูเก็ตซิตี้)',
    color: '#0284c7', // Sky Blue
    status: 'en_route',
    statusText: 'กำลังเดินทางข้ามจังหวัด',
    speed: 84,
    fuelLevel: 68,
    totalDistanceKm: 88.5,
    waypoints: [
      { lat: 8.4501, lng: 98.5255, label: 'สำนักงานวัฒนธรรมจังหวัดพังงา' },
      { lat: 8.3840, lng: 98.4120, label: 'ทางแยกบ่อแสน อ.ทับปุด' },
      { lat: 8.2714, lng: 98.3075, label: 'สี่แยกโคกกลอย อ.ตะกั่วทุ่ง' },
      { lat: 8.2018, lng: 98.2974, label: 'สะพานสารสิน (ด่านตรวจท่าฉัตรไชย)' },
      { lat: 8.0250, lng: 98.3360, label: 'อนุสาวรีย์ท้าวเทพกระษัตรี ท้าวศรีสุนทร' },
      { lat: 7.8839, lng: 98.3912, label: 'โรงแรมรอยัลภูเก็ตซิตี้ (จุดหมาย)' }
    ]
  },
  'v-commuter': {
    id: 'v-commuter',
    name: 'Toyota Commuter (รถตู้ส่วนกลาง)',
    plate: 'นค 9999 พังงา',
    driver: 'นายศราวุธ เกตุรักษ์',
    destination: 'ย่านเมืองเก่าตะกั่วป่า (ถนนสายวัฒนธรรม)',
    color: '#10b981', // Emerald
    status: 'en_route',
    statusText: 'กำลังปฏิบัติภารกิจมรดกวัฒนธรรม',
    speed: 62,
    fuelLevel: 75,
    totalDistanceKm: 65.2,
    waypoints: [
      { lat: 8.4501, lng: 98.5255, label: 'สำนักงานวัฒนธรรมจังหวัดพังงา' },
      { lat: 8.3995, lng: 98.2612, label: 'อ.ท้ายเหมือง (หาดท้ายเหมือง)' },
      { lat: 8.5240, lng: 98.2560, label: 'บ้านลำแก่น / ท่าเรือทับละมุ' },
      { lat: 8.6472, lng: 98.2520, label: 'เขาหลัก (หาดนางทอง)' },
      { lat: 8.7600, lng: 98.3150, label: 'บ้านน้ำเค็ม' },
      { lat: 8.8329, lng: 98.3642, label: 'ย่านเมืองเก่าตะกั่วป่า (จุดหมาย)' }
    ]
  },
  'v-dmax': {
    id: 'v-dmax',
    name: 'Isuzu D-Max (ตรวจการราชการ)',
    plate: 'บฉ 4321 พังงา',
    driver: 'นายเรวัติ แสงสว่าง',
    destination: 'ชุมชนคุณธรรมบ้านบางพัฒน์ อ.เมืองพังงา',
    color: '#a855f7', // Purple
    status: 'idle',
    statusText: 'จอดปฏิบัติงานในพื้นที่ชุมชน',
    speed: 0,
    fuelLevel: 90,
    totalDistanceKm: 18.2,
    waypoints: [
      { lat: 8.4501, lng: 98.5255, label: 'สำนักงานวัฒนธรรมจังหวัดพังงา' },
      { lat: 8.4120, lng: 98.5410, label: 'ถนนพังงา-ทับปุด กม. 5' },
      { lat: 8.3750, lng: 98.5520, label: 'ทางแยกเข้าบ้านบางพัฒน์' },
      { lat: 8.3498, lng: 98.5630, label: 'ชุมชนคุณธรรมบ้านบางพัฒน์ (จุดหมาย)' }
    ]
  }
};

// Calculate interpolated point along waypoints
function interpolatePosition(waypoints: Waypoint[], progress: number): { lat: number; lng: number; heading: number } {
  if (!waypoints || waypoints.length === 0) {
    return { lat: 8.4501, lng: 98.5255, heading: 0 };
  }
  if (waypoints.length === 1) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng, heading: 0 };
  }

  const totalSegments = waypoints.length - 1;
  const clamped = Math.max(0, Math.min(1, progress));
  const exact = clamped * totalSegments;
  const index = Math.min(Math.floor(exact), totalSegments - 1);
  const t = exact - index;

  const p1 = waypoints[index];
  const p2 = waypoints[index + 1];

  const lat = p1.lat + (p2.lat - p1.lat) * t;
  const lng = p1.lng + (p2.lng - p1.lng) * t;

  // Calculate heading angle
  const dLng = p2.lng - p1.lng;
  const dLat = p2.lat - p1.lat;
  const angleRad = Math.atan2(dLng, dLat);
  const heading = (angleRad * 180) / Math.PI;

  return { lat, lng, heading: (heading + 360) % 360 };
}

export const MAP_STYLES = {
  voyager: {
    name: '🗺️ สีสันสดใสพรีเมียม (CartoDB Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  positron: {
    name: '🎨 มินิมอลคลีน (CartoDB Positron)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  dark: {
    name: '🖤 ลักชัวรี่ดาร์กโหมด (CartoDB Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    name: '🛰️ ภาพถ่ายดาวเทียมคมชัดสูง (Esri Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS'
  },
  standard: {
    name: '🌐 OpenStreetMap มาตรฐาน',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  }
};

export const GpsTrackingView: React.FC<GpsTrackingViewProps> = ({ vehicles = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const waypointMarkersRef = useRef<L.Marker[]>([]);

  // State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('v-camry');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0.35);
  const [followVehicle, setFollowVehicle] = useState<boolean>(true);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'focus' | 'fleet'>('focus');
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('voyager');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // Merge default profiles with available vehicles from props
  const gpsProfiles = useMemo<Record<string, CarGpsProfile>>(() => {
    const map: Record<string, CarGpsProfile> = { ...DEFAULT_GPS_PROFILES };
    vehicles.forEach((v) => {
      const existing = map[v.id];
      if (existing) {
        map[v.id] = {
          ...existing,
          name: v.name || existing.name,
          plate: v.plate || existing.plate
        };
      }
    });
    return map;
  }, [vehicles]);

  const activeProfile = gpsProfiles[selectedVehicleId] || gpsProfiles['v-camry'];

  // Current real-time coordinates of active vehicle
  const currentCoords = useMemo(() => {
    return interpolatePosition(activeProfile.waypoints, progress);
  }, [activeProfile, progress]);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animation Loop for simulated vehicle GPS progress
  useEffect(() => {
    if (!isPlaying || activeProfile.status === 'idle') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const step = 0.003;
        const next = prev + step;
        return next >= 1 ? 0 : next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, activeProfile.status]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add Tile Layer
    const selectedStyle = MAP_STYLES[mapStyle];
    const tileLayer = L.tileLayer(selectedStyle.url, {
      maxZoom: 19,
      attribution: selectedStyle.attribution
    }).addTo(map);

    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const selectedStyle = MAP_STYLES[mapStyle];
    L.tileLayer(selectedStyle.url, {
      maxZoom: 19,
      attribution: selectedStyle.attribution
    }).addTo(map);
  }, [mapStyle]);

  // Render or update route polyline & waypoints for active vehicle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // Remove old waypoint markers
    waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
    waypointMarkersRef.current = [];

    // Draw route polyline
    const latlngs = activeProfile.waypoints.map((w) => [w.lat, w.lng] as [number, number]);
    const polyline = L.polyline(latlngs, {
      color: activeProfile.color,
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    polylineRef.current = polyline;

    // Draw start & finish waypoints
    activeProfile.waypoints.forEach((w, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === activeProfile.waypoints.length - 1;

      const markerHtml = `
        <div style="
          background-color: ${isStart ? '#10b981' : isEnd ? '#ef4444' : '#64748b'};
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        ">
          ${isStart ? '🚩' : isEnd ? '🏁' : idx + 1}
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-waypoint-icon',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([w.lat, w.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <strong style="color: #0f172a;">${w.label}</strong>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">พิกัด: ${w.lat.toFixed(4)}, ${w.lng.toFixed(4)}</div>
        </div>
      `);
      waypointMarkersRef.current.push(marker);
    });

    if (viewMode === 'focus') {
      map.setView([currentCoords.lat, currentCoords.lng], 13);
    } else {
      // Fit all waypoints
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activeProfile, viewMode]);

  // Update Active Vehicle Marker position and rotation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const carHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar ring -->
        <div style="
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${activeProfile.color}33;
          border: 1.5px solid ${activeProfile.color};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>

        <!-- Vehicle Center Pill -->
        <div style="
          background-color: ${activeProfile.color};
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${currentCoords.heading}deg);
          transition: transform 0.2s ease;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>

        <!-- Plate Badge Tag -->
        <div style="
          position: absolute;
          top: 38px;
          white-space: nowrap;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid #334155;
          font-size: 10px;
          font-weight: bold;
          font-family: monospace;
          padding: 1px 6px;
          border-radius: 6px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        ">
          ${activeProfile.plate}
        </div>
      </div>
    `;

    const carIcon = L.divIcon({
      className: 'custom-car-icon',
      html: carHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    if (!vehicleMarkerRef.current) {
      const marker = L.marker([currentCoords.lat, currentCoords.lng], { icon: carIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; min-width: 180px;">
          <strong style="font-size: 13px; color: ${activeProfile.color};">${activeProfile.name}</strong>
          <div style="font-mono; font-size: 11px; color: #475569;">ทะเบียน: ${activeProfile.plate}</div>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <div>👔 คนขับ: <strong>${activeProfile.driver}</strong></div>
          <div>📍 ปลายทาง: ${activeProfile.destination}</div>
          <div>⚡ ความเร็ว: <strong style="color: #ea580c;">${activeProfile.speed} กม./ชม.</strong></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">พิกัด: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}</div>
        </div>
      `);
      vehicleMarkerRef.current = marker;
    } else {
      vehicleMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
      vehicleMarkerRef.current.setIcon(carIcon);
    }

    // Auto-pan map if followVehicle is enabled
    if (followVehicle && viewMode === 'focus') {
      map.panTo([currentCoords.lat, currentCoords.lng], { animate: true, duration: 0.5 });
    }
  }, [currentCoords, activeProfile, followVehicle, viewMode]);

  // In Fleet Overview mode, show markers for other vehicles too
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean other markers
    otherMarkersRef.current.forEach((m) => map.removeLayer(m));
    otherMarkersRef.current = [];

    if (viewMode === 'fleet') {
      const bounds = L.latLngBounds([[currentCoords.lat, currentCoords.lng]]);

      (Object.values(gpsProfiles) as CarGpsProfile[]).forEach((prof) => {
        if (prof.id === selectedVehicleId) return;

        // Static sample position for other vehicles along their routes
        const pos = interpolatePosition(prof.waypoints, 0.5);
        bounds.extend([pos.lat, pos.lng]);

        const otherHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="
              background-color: ${prof.color};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              🚗
            </div>
            <div style="
              position: absolute;
              top: 30px;
              white-space: nowrap;
              background: #1e293b;
              color: #e2e8f0;
              font-size: 9px;
              font-family: monospace;
              padding: 1px 4px;
              border-radius: 4px;
            ">
              ${prof.plate}
            </div>
          </div>
        `;

        const otherIcon = L.divIcon({
          className: 'other-car-icon',
          html: otherHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const otherMarker = L.marker([pos.lat, pos.lng], { icon: otherIcon }).addTo(map);
        otherMarker.on('click', () => {
          setSelectedVehicleId(prof.id);
          setViewMode('focus');
        });
        otherMarkersRef.current.push(otherMarker);
      });

      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [viewMode, gpsProfiles, selectedVehicleId]);

  // Copy coordinates
  const handleCopyCoordinates = () => {
    const text = `${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Center on Vehicle
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([currentCoords.lat, currentCoords.lng], 14, { animate: true });
    setFollowVehicle(true);
  };

  // Fit Route
  const handleFitRoute = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const latlngs = activeProfile.waypoints.map((w) => [w.lat, w.lng] as [number, number]);
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [50, 50] });
    setFollowVehicle(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Controls Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-orange-600 animate-pulse" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              ระบบติดตามพิกัดยานพาหนะ OpenStreetMap (Live Fleet Telemetry)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            สำนักงานวัฒนธรรมจังหวัดพังงา — แผนที่ดาวเทียมและพิกัดถนนจริง OpenStreetMap (OSM) พร้อมข้อมูลโทรมาตรเรียลไทม์
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Selector */}
          <select
            value={selectedVehicleId}
            onChange={(e) => {
              setSelectedVehicleId(e.target.value);
              setProgress(0.2);
              setFollowVehicle(true);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {(Object.values(gpsProfiles) as CarGpsProfile[]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.plate})
              </option>
            ))}
          </select>

          {/* Map Style Selector */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as keyof typeof MAP_STYLES)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            title="เลือกรูปแบบดีไซน์แผนที่"
          >
            {Object.entries(MAP_STYLES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>

          {/* Play/Pause Simulation */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95 ${
              isPlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            title={isPlaying ? 'หยุดชั่วคราว' : 'จำลองการเคลื่อนที่ต่อ'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'หยุดชั่วคราว' : 'เล่นต่อ'}</span>
          </button>

          {/* Reset Progress */}
          <button
            type="button"
            onClick={() => setProgress(0)}
            className="w-8.5 h-8.5 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
            title="รีเซ็ตไปที่จุดเริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setViewMode('focus');
                handleRecenter();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'focus' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ติดตามคันนี้
            </button>
            <button
              type="button"
              onClick={() => setViewMode('fleet')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'fleet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ดูทั้งฝูงรถ ({Object.keys(gpsProfiles).length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: OpenStreetMap on Left (8 cols), Telemetry Deck on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* MAP CONTAINER (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          
          {/* Top Live Bar over Map */}
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 z-10">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-xs">{activeProfile.name}</span>
              <span className="font-mono text-xs text-orange-300">({activeProfile.plate})</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeProfile.statusText}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="font-mono text-orange-300 flex items-center space-x-1">
                <Gauge className="w-3.5 h-3.5" />
                <span>{activeProfile.speed} กม./ชม.</span>
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                อัปเดต: {lastUpdatedTime}
              </span>
            </div>
          </div>

          {/* Leaflet Map DOM Element */}
          <div className="relative w-full h-[460px] sm:h-[520px] bg-slate-100 z-0">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Floating Map Overlay Action Buttons */}
            <div className="absolute top-3 right-3 z-40 flex flex-col space-y-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200">
              <button
                type="button"
                onClick={handleRecenter}
                className="p-2 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl transition cursor-pointer"
                title="เล็งกึ่งกลางที่รถคันนี้ (Recenter)"
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFitRoute}
                className="p-2 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl transition cursor-pointer"
                title="ย่อดูทั้งเส้นทาง (Fit Route)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const keys = Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>;
                  const currentIndex = keys.indexOf(mapStyle);
                  const nextIndex = (currentIndex + 1) % keys.length;
                  setMapStyle(keys[nextIndex]);
                }}
                className="p-2 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl transition cursor-pointer"
                title="เปลี่ยนรูปแบบแผนที่เชิงโต้ตอบ"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {/* Coordinates Floating Pill at Bottom Left */}
            <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCoordinates}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="คัดลอกพิกัด GPS"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Route Summary Bar */}
          <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800">จุดเริ่มต้น:</span>
              <span>สำนักงานวัฒนธรรมจังหวัดพังงา</span>
              <span>&rarr;</span>
              <span className="font-semibold text-orange-700">ปลายทาง:</span>
              <span className="truncate max-w-[200px] sm:max-w-none">{activeProfile.destination}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                OSM Live Connected
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-orange-600 hover:text-orange-700 font-medium"
              >
                <span>เปิดใน Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* TELEMETRY DECK (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Main Telemetry Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center space-x-1.5">
                <Gauge className="w-4 h-4 text-orange-600" />
                <span>ข้อมูลโทรมาตรยานพาหนะ (Telemetry)</span>
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                GPS ล่าสุด
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Driver */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>พนักงานขับรถประจำคัน</span>
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="font-bold text-slate-900 text-sm">{activeProfile.driver}</p>
              </div>

              {/* Destination */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>จุดหมายปลายทางตามภารกิจ</span>
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <p className="font-bold text-orange-950 text-xs leading-relaxed">{activeProfile.destination}</p>
              </div>

              {/* Speed & Distance */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ความเร็วปัจจุบัน</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                    {activeProfile.speed} <span className="text-xs font-normal text-slate-500">กม./ชม.</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ระยะทางสะสม</span>
                  <div className="text-xl font-bold font-mono text-teal-700 mt-0.5">
                    {activeProfile.totalDistanceKm} <span className="text-xs font-normal text-slate-500">กม.</span>
                  </div>
                </div>
              </div>

              {/* ETA & Fuel Level */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>ประมาณเวลาถึง</span>
                    <Clock className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">25-35 นาที</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>ระดับน้ำมัน</span>
                    <Fuel className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">{activeProfile.fuelLevel}%</div>
                </div>
              </div>

              {/* Route Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>ความคืบหน้าเส้นทาง</span>
                  <span className="font-bold text-orange-600">{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>

              {/* Waypoint Steps Accordion */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">หมุดจุดหมายตามเส้นทาง:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeProfile.waypoints.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 text-[11px] p-1.5 rounded-xl bg-slate-50 hover:bg-orange-50/60 transition"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 truncate">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Speed Safety Info Card */}
          <div className="bg-teal-50 border border-teal-200/80 rounded-3xl p-4.5 text-xs text-teal-900 space-y-2 shadow-xs">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>ความปลอดภัยและการควบคุมพิกัด GPS</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              ระบบตรวจสอบพิกัดบนถนนจริงผ่านแผนที่ OpenStreetMap (OSM)
              สอดคล้องตามระเบียบยานพาหนะราชการ สำนักงานวัฒนธรรมจังหวัดพังงา
              ควบคุมความเร็วไม่เกิน ๙๐ กม./ชม. บนทางหลวงสายหลัก
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
