export interface GpsCoordinate {
  name: string;
  lat: number;
  lng: number;
  description?: string;
  accuracy?: number;
}

export const DEFAULT_OFFICE_ORIGIN: GpsCoordinate = {
  name: 'สำนักงานวัฒนธรรมจังหวัดพังงา',
  lat: 8.4475,
  lng: 98.5258,
  description: 'ศาลากลางจังหวัดพังงา ถนนพังงา-ทับปุด ต.ถ้ำน้ำผุด อ.เมืองพังงา'
};

export const FREQUENT_ORIGINS: GpsCoordinate[] = [
  DEFAULT_OFFICE_ORIGIN,
  {
    name: 'ที่ว่าการอำเภอเมืองพังงา',
    lat: 8.4482,
    lng: 98.5234,
    description: 'ต.ท้ายช้าง อ.เมืองพังงา'
  },
  {
    name: 'ที่ว่าการอำเภอตะกั่วป่า',
    lat: 8.8252,
    lng: 98.3497,
    description: 'ต.ตะกั่วป่า อ.ตะกั่วป่า'
  },
  {
    name: 'ที่ว่าการอำเภอท้ายเหมือง',
    lat: 8.3986,
    lng: 98.2619,
    description: 'ต.ท้ายเหมือง อ.ท้ายเหมือง'
  },
  {
    name: 'ที่ว่าการอำเภอทับปุด',
    lat: 8.5244,
    lng: 98.6361,
    description: 'ต.ทับปุด อ.ทับปุด'
  },
  {
    name: 'ที่ว่าการอำเภอตะกั่วทุ่ง',
    lat: 8.3242,
    lng: 98.4358,
    description: 'ต.กระโสม อ.ตะกั่วทุ่ง'
  },
  {
    name: 'ที่ว่าการอำเภอคุระบุรี',
    lat: 9.1764,
    lng: 98.4183,
    description: 'ต.คุระบุรี อ.คุระบุรี'
  },
  {
    name: 'ที่ว่าการอำเภอเกาะยาว',
    lat: 8.1189,
    lng: 98.6083,
    description: 'ต.เกาะยาวน้อย อ.เกาะยาว'
  },
  {
    name: 'ที่ว่าการอำเภอกะปง',
    lat: 8.5997,
    lng: 98.4101,
    description: 'ต.กะปง อ.กะปง'
  }
];

export function getCurrentBrowserGps(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('เบราว์เซอร์ของท่านไม่สนับสนุนระบบ Geolocation'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function resolveCoordinatesFromAddress(
  province: string,
  amphoe: string,
  detail?: string
): { lat: number; lng: number; name: string } {
  const normalizedAmphoe = amphoe ? amphoe.trim().replace('อ.', '') : '';
  const normalizedProvince = province ? province.trim().replace('จ.', '') : 'พังงา';
  
  let lat = DEFAULT_OFFICE_ORIGIN.lat;
  let lng = DEFAULT_OFFICE_ORIGIN.lng;
  let name = detail || `${normalizedAmphoe}, ${normalizedProvince}`;
  
  const amphoeCoords: Record<string, { lat: number; lng: number }> = {
    'เมืองพังงา': { lat: 8.4482, lng: 98.5234 },
    'ตะกั่วป่า': { lat: 8.8252, lng: 98.3497 },
    'ท้ายเหมือง': { lat: 8.3986, lng: 98.2619 },
    'ทับปุด': { lat: 8.5244, lng: 98.6361 },
    'ตะกั่วทุ่ง': { lat: 8.3242, lng: 98.4358 },
    'คุระบุรี': { lat: 9.1764, lng: 98.4183 },
    'เกาะยาว': { lat: 8.1189, lng: 98.6083 },
    'กะปง': { lat: 8.5997, lng: 98.4101 },
  };
  
  if (amphoeCoords[normalizedAmphoe]) {
    lat = amphoeCoords[normalizedAmphoe].lat;
    lng = amphoeCoords[normalizedAmphoe].lng;
  } else if (normalizedProvince === 'ภูเก็ต') {
    lat = 7.8804;
    lng = 98.3923;
  } else if (normalizedProvince === 'กระบี่') {
    lat = 8.0863;
    lng = 98.9063;
  } else if (normalizedProvince === 'สุราษฎร์ธานี') {
    lat = 9.1382;
    lng = 99.3216;
  } else if (normalizedProvince === 'ระนอง') {
    lat = 9.9657;
    lng = 98.6348;
  } else {
    // Generate deterministic coordinates if location is unknown
    let hash = 0;
    const fullStr = `${normalizedAmphoe}${normalizedProvince}${detail || ''}`;
    for (let i = 0; i < fullStr.length; i++) {
      hash = fullStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    lat = DEFAULT_OFFICE_ORIGIN.lat + (Math.abs(hash % 100) - 50) * 0.005;
    lng = DEFAULT_OFFICE_ORIGIN.lng + (Math.abs((hash >> 3) % 100) - 50) * 0.005;
  }
  
  return { lat, lng, name };
}

export function getHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateTripGpsDistance(
  originGps: GpsCoordinate,
  destCoords: Array<{ lat: number; lng: number; name: string }>,
  isRoundTrip: boolean
): {
  totalDistanceKm: number;
  straightLineKm: number;
  estimatedDurationText: string;
  legs: Array<{
    from: string;
    to: string;
    distanceKm: number;
    durationText: string;
    straightLineKm: number;
  }>;
} {
  const legs: any[] = [];
  let lastCoord = { lat: originGps.lat, lng: originGps.lng, name: originGps.name };
  let totalDistanceKm = 0;
  let totalStraightLineKm = 0;
  
  destCoords.forEach((dest) => {
    const straight = getHaversineDistance(lastCoord.lat, lastCoord.lng, dest.lat, dest.lng);
    // Multiply by a factor of 1.3 to simulate realistic driving routes via roads
    const roadDist = Math.round(straight * 1.3 * 10) / 10;
    const durationMin = Math.round(roadDist * 1.2);
    let durationText = `${durationMin} นาที`;
    if (durationMin >= 60) {
      const h = Math.floor(durationMin / 60);
      const m = durationMin % 60;
      durationText = `${h} ชม. ${m > 0 ? `${m} นาที` : ''}`;
    }
    
    legs.push({
      from: lastCoord.name,
      to: dest.name,
      distanceKm: roadDist,
      durationText,
      straightLineKm: Math.round(straight * 10) / 10
    });
    
    totalDistanceKm += roadDist;
    totalStraightLineKm += straight;
    lastCoord = { lat: dest.lat, lng: dest.lng, name: dest.name };
  });
  
  if (isRoundTrip && destCoords.length > 0) {
    const dest = { lat: originGps.lat, lng: originGps.lng, name: originGps.name };
    const straight = getHaversineDistance(lastCoord.lat, lastCoord.lng, dest.lat, dest.lng);
    const roadDist = Math.round(straight * 1.3 * 10) / 10;
    const durationMin = Math.round(roadDist * 1.2);
    let durationText = `${durationMin} นาที`;
    if (durationMin >= 60) {
      const h = Math.floor(durationMin / 60);
      const m = durationMin % 60;
      durationText = `${h} ชม. ${m > 0 ? `${m} นาที` : ''}`;
    }
    
    legs.push({
      from: lastCoord.name,
      to: dest.name,
      distanceKm: roadDist,
      durationText,
      straightLineKm: Math.round(straight * 10) / 10
    });
    
    totalDistanceKm += roadDist;
    totalStraightLineKm += straight;
  }
  
  totalDistanceKm = Math.round(totalDistanceKm * 10) / 10;
  totalStraightLineKm = Math.round(totalStraightLineKm * 10) / 10;
  
  const totalDurationMin = Math.round(totalDistanceKm * 1.2);
  let estimatedDurationText = `${totalDurationMin} นาที`;
  if (totalDurationMin >= 60) {
    const h = Math.floor(totalDurationMin / 60);
    const m = totalDurationMin % 60;
    estimatedDurationText = `${h} ชั่วโมง ${m > 0 ? `${m} นาที` : ''}`;
  }
  
  return {
    totalDistanceKm,
    straightLineKm: totalStraightLineKm,
    estimatedDurationText,
    legs
  };
}
