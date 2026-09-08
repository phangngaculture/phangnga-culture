/**
 * GPS Distance Calculation and Geolocation Services
 * Designed for Phangnga Provincial Cultural Office (M-Culture Phangnga)
 */

export interface GpsCoordinate {
  lat: number;
  lng: number;
  name: string;
  description?: string;
}

// Office default origin: Phangnga Provincial City Hall / Cultural Office
export const DEFAULT_OFFICE_ORIGIN: GpsCoordinate = {
  name: 'สำนักงานวัฒนธรรมจังหวัดพังงา (ศูนย์ราชการ ถ้ำน้ำผุด)',
  lat: 8.4503,
  lng: 98.5305,
  description: 'ศาลากลางจังหวัดพังงา ต.ถ้ำน้ำผุด อ.เมือง จ.พังงา'
};

// Alternative origins in Phangnga
export const FREQUENT_ORIGINS: GpsCoordinate[] = [
  DEFAULT_OFFICE_ORIGIN,
  {
    name: 'ศาลากลางจังหวัดพังงา (หลังเดิม ท้ายช้าง)',
    lat: 8.4325,
    lng: 98.5255,
    description: 'ถ.เพชรเกษม ต.ท้ายช้าง อ.เมืองพังงา'
  },
  {
    name: 'ที่ว่าการอำเภอตะกั่วป่า',
    lat: 8.8789,
    lng: 98.3683,
    description: 'อ.ตะกั่วป่า จ.พังงา'
  },
  {
    name: 'ที่ว่าการอำเภอท้ายเหมือง',
    lat: 8.4001,
    lng: 98.2612,
    description: 'อ.ท้ายเหมือง จ.พังงา'
  },
  {
    name: 'ที่ว่าการอำเภอตะกั่วทุ่ง',
    lat: 8.2834,
    lng: 98.3986,
    description: 'อ.ตะกั่วทุ่ง จ.พังงา'
  }
];

// District centroids for Phangnga and nearby provinces
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  // Phangnga Districts
  'เมืองพังงา': { lat: 8.4503, lng: 98.5305, name: 'อ.เมืองพังงา จ.พังงา' },
  'ตะกั่วป่า': { lat: 8.8789, lng: 98.3683, name: 'อ.ตะกั่วป่า จ.พังงา' },
  'ท้ายเหมือง': { lat: 8.4001, lng: 98.2612, name: 'อ.ท้ายเหมือง จ.พังงา' },
  'ตะกั่วทุ่ง': { lat: 8.2834, lng: 98.3986, name: 'อ.ตะกั่วทุ่ง จ.พังงา' },
  'คุระบุรี': { lat: 9.2014, lng: 98.4183, name: 'อ.คุระบุรี จ.พังงา' },
  'กะปง': { lat: 8.7067, lng: 98.4069, name: 'อ.กะปง จ.พังงา' },
  'ทับปุด': { lat: 8.5222, lng: 98.6361, name: 'อ.ทับปุด จ.พังงา' },
  'เกาะยาว': { lat: 8.1158, lng: 98.6014, name: 'อ.เกาะยาว จ.พังงา' },

  // Notable Cultural Sites in Phangnga
  'วัดประชุมศึกษา': { lat: 8.3951, lng: 98.2715, name: 'วัดประชุมศึกษา อ.ท้ายเหมือง' },
  'วัดสราภิมุข': { lat: 8.4412, lng: 98.5198, name: 'วัดสราภิมุข อ.เมืองพังงา' },
  'วัดนารายณิการาม': { lat: 8.8954, lng: 98.3912, name: 'วัดนารายณิการาม ต.เหล อ.กะปง' },
  'ย่านเมืองเก่าตะกั่วป่า': { lat: 8.8821, lng: 98.3614, name: 'ย่านเมืองเก่าตะกั่วป่า' },
  'เขาหลัก': { lat: 8.6508, lng: 98.2514, name: 'เขาหลัก อ.ตะกั่วป่า' },
  'เขาพิงกัน': { lat: 8.2745, lng: 98.5012, name: 'เขาพิงกัน อ่าวพังงา' },
  'เกาะปันหยี': { lat: 8.3341, lng: 98.5067, name: 'เกาะปันหยี อ่าวพังงา' },
  'วัดถ้ำสุวรรณคูหา': { lat: 8.4285, lng: 98.4736, name: 'วัดถ้ำสุวรรณคูหา อ.ตะกั่วทุ่ง' },
  'วัดราษฎร์สโมสร': { lat: 8.5189, lng: 98.6312, name: 'วัดราษฎร์สโมสร อ.ทับปุด' },
  'ศูนย์ศิลปวัฒนธรรมพื้นบ้านกะปง': { lat: 8.7112, lng: 98.4101, name: 'ศูนย์ศิลปวัฒนธรรมพื้นบ้านกะปง' },
  'สำนักงานวัฒนธรรมจังหวัดพังงา': { lat: 8.4503, lng: 98.5305, name: 'สำนักงานวัฒนธรรมจังหวัดพังงา' },
  'ศาลากลางจังหวัดพังงา': { lat: 8.4503, lng: 98.5305, name: 'ศาลากลางจังหวัดพังงา' },

  // Neighboring & Key Provinces
  'ภูเก็ต': { lat: 7.8804, lng: 98.3923, name: 'จ.ภูเก็ต (ศาลากลางภูเก็ต)' },
  'กระบี่': { lat: 8.0863, lng: 98.9063, name: 'จ.กระบี่ (ศาลากลางกระบี่)' },
  'สุราษฎร์ธานี': { lat: 9.1382, lng: 99.3215, name: 'จ.สุราษฎร์ธานี' },
  'ระนอง': { lat: 9.9529, lng: 98.6348, name: 'จ.ระนอง' },
  'นครศรีธรรมราช': { lat: 8.4304, lng: 99.9631, name: 'จ.นครศรีธรรมราช' },
  'ตรัง': { lat: 7.5563, lng: 99.6114, name: 'จ.ตรัง' },
  'สงขลา': { lat: 7.1756, lng: 100.6143, name: 'จ.สงขลา' },
  'กรุงเทพมหานคร': { lat: 13.7563, lng: 100.5018, name: 'กรุงเทพมหานคร (กระทรวงวัฒนธรรม)' }
};

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export const calculateHaversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Real-world road driving distance calculation
 * In Thailand highway/rural roads, driving factor is ~1.28 - 1.34 of direct distance
 */
export const estimateDrivingDistanceKm = (
  straightLineDistanceKm: number
): number => {
  if (straightLineDistanceKm <= 0) return 0;
  // Local short trips in town have slightly higher detour factor
  const roadFactor = straightLineDistanceKm < 15 ? 1.35 : 1.28;
  return Math.round(straightLineDistanceKm * roadFactor);
};

/**
 * Estimate driving time based on distance in kilometers
 */
export const estimateDrivingDuration = (
  distanceKm: number
): { hours: number; minutes: number; text: string } => {
  if (distanceKm <= 0) {
    return { hours: 0, minutes: 0, text: '0 นาที' };
  }
  // Average speed in southern Thailand including traffic/turns ~ 65 km/h
  const avgSpeedKmH = 65;
  const totalMinutes = Math.round((distanceKm / avgSpeedKmH) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return {
      hours,
      minutes,
      text: minutes > 0 ? `${hours} ชม. ${minutes} นาที` : `${hours} ชั่วโมง`
    };
  }
  return { hours: 0, minutes: totalMinutes, text: `${totalMinutes} นาที` };
};

/**
 * Get user's live GPS position from the browser
 */
export const getCurrentBrowserGps = (): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
  label: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('เบราว์เซอร์ไม่รองรับการระบุพิกัด GPS'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          label: `พิกัดปัจจุบัน GPS (${position.coords.latitude.toFixed(4)}°, ${position.coords.longitude.toFixed(4)}°)`
        });
      },
      (error) => {
        let msg = 'ไม่สามารถดึงข้อมูลตำแหน่ง GPS ได้';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'ผู้ใช้งานไม่อนุญาตให้เข้าถึงตำแหน่ง GPS (โปรดอนุญาตตำแหน่งในเบราว์เซอร์)';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'สัญญาณ GPS หรือตำแหน่งไม่พร้อมใช้งาน';
        } else if (error.code === error.TIMEOUT) {
          msg = 'หมดเวลารอสัญญาณ GPS';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Resolves approximate GPS coordinates from province, amphoe, or destination text
 */
export const resolveCoordinatesFromAddress = (
  province?: string,
  amphoe?: string,
  destinationText?: string
): GpsCoordinate => {
  // 1. Check if matches a known cultural site or landmark
  if (destinationText) {
    for (const [key, coord] of Object.entries(DISTRICT_COORDINATES)) {
      if (destinationText.includes(key)) {
        return {
          name: coord.name,
          lat: coord.lat,
          lng: coord.lng,
          description: destinationText
        };
      }
    }
  }

  // 2. Check amphoe in Phangnga
  if (amphoe && DISTRICT_COORDINATES[amphoe]) {
    const c = DISTRICT_COORDINATES[amphoe];
    return {
      name: `อ.${amphoe} จ.${province || 'พังงา'}`,
      lat: c.lat,
      lng: c.lng,
      description: `ศูนย์กลางอำเภอ${amphoe}`
    };
  }

  // 3. Check province
  if (province && DISTRICT_COORDINATES[province]) {
    const c = DISTRICT_COORDINATES[province];
    return {
      name: `จ.${province}`,
      lat: c.lat,
      lng: c.lng,
      description: `ศูนย์ราชการจังหวัด${province}`
    };
  }

  // Default fallback to Phangnga Town
  return {
    name: destinationText || 'ปลายทางในจังหวัดพังงา',
    lat: 8.4503,
    lng: 98.5305,
    description: 'จ.พังงา'
  };
};

/**
 * Calculates complete multi-stop or single stop trip GPS distance
 */
export const calculateTripGpsDistance = (
  origin: { lat: number; lng: number; name: string },
  destinationPoints: Array<{ lat: number; lng: number; name: string }>,
  isRoundTrip: boolean = true
): {
  oneWayKm: number;
  totalDistanceKm: number;
  straightLineKm: number;
  estimatedDurationText: string;
  legs: Array<{ from: string; to: string; distanceKm: number }>;
} => {
  if (!destinationPoints || destinationPoints.length === 0) {
    return {
      oneWayKm: 0,
      totalDistanceKm: 0,
      straightLineKm: 0,
      estimatedDurationText: '0 นาที',
      legs: []
    };
  }

  let totalStraightLine = 0;
  let currentLat = origin.lat;
  let currentLng = origin.lng;
  let currentName = origin.name;
  const legs: Array<{ from: string; to: string; distanceKm: number }> = [];

  // Leg by leg calculation
  for (const pt of destinationPoints) {
    const straight = calculateHaversineDistanceKm(currentLat, currentLng, pt.lat, pt.lng);
    const drivingKm = estimateDrivingDistanceKm(straight);
    totalStraightLine += straight;
    legs.push({
      from: currentName,
      to: pt.name,
      distanceKm: drivingKm
    });
    currentLat = pt.lat;
    currentLng = pt.lng;
    currentName = pt.name;
  }

  const oneWayDrivingKm = legs.reduce((acc, l) => acc + l.distanceKm, 0);

  // Return leg to origin if round trip
  if (isRoundTrip && destinationPoints.length > 0) {
    const lastPt = destinationPoints[destinationPoints.length - 1];
    const returnStraight = calculateHaversineDistanceKm(lastPt.lat, lastPt.lng, origin.lat, origin.lng);
    const returnDrivingKm = estimateDrivingDistanceKm(returnStraight);
    legs.push({
      from: lastPt.name,
      to: `${origin.name} (ขากลับ)`,
      distanceKm: returnDrivingKm
    });
    const totalKm = oneWayDrivingKm + returnDrivingKm;
    const duration = estimateDrivingDuration(totalKm);
    return {
      oneWayKm: oneWayDrivingKm,
      totalDistanceKm: totalKm,
      straightLineKm: Math.round(totalStraightLine + returnStraight),
      estimatedDurationText: duration.text,
      legs
    };
  }

  const duration = estimateDrivingDuration(oneWayDrivingKm);
  return {
    oneWayKm: oneWayDrivingKm,
    totalDistanceKm: oneWayDrivingKm,
    straightLineKm: Math.round(totalStraightLine),
    estimatedDurationText: duration.text,
    legs
  };
};
