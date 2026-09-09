import { User, Vehicle, BookingRequest, FuelLog, NotificationItem, MaintenanceRecord, MenuKey, MenuDefinition, PassengerDirectoryItem } from '../types';

export const APP_MENUS: MenuDefinition[] = [
  {
    id: 'dashboard',
    label: 'หน้าหลักภาพรวม',
    desc: 'สถานะคำขอ ข้อมูลสรุป และยานพาหนะพร้อมใช้',
    badge: 'ภาพรวม',
    color: 'text-orange-500 bg-orange-500/10'
  },
  {
    id: 'calendar',
    label: 'ปฏิทินตารางภารกิจ',
    desc: 'ตารางนัดหมายและการใช้รถประจำวัน/สัปดาห์',
    badge: 'กำหนดการ',
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    id: 'booking',
    label: 'เขียนใบเบิกใช้รถ',
    desc: 'สร้างคำขอใหม่/แก้ไข/พิมพ์ใบคำขอขอใช้รถยนต์ส่วนกลาง',
    badge: 'ยื่นคำขอ',
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    id: 'director',
    label: 'แผงอนุมัติผู้บริหาร',
    desc: 'พิจารณาอนุมัติ ลงนาม และสั่งการคำขอใช้รถ',
    badge: 'ผู้บริหาร',
    color: 'text-teal-500 bg-teal-500/10'
  },
  {
    id: 'driver_mission',
    label: 'ภารกิจคนขับรถ & ทะเบียนคุม',
    desc: 'เริ่มงาน/กรอกไมล์ไป-กลับ บันทึกภารกิจ และลงทะเบียนคุมพัสดุอัตโนมัติ',
    badge: 'คนขับ & พัสดุ',
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    id: 'asset_inspection',
    label: 'ตรวจรับรถเสร็จสิ้นภารกิจ (พัสดุ)',
    desc: 'ตรวจสภาพ ตรวจสอบเลขไมล์ไป-กลับ และลงชื่อตรวจรับรถโดยเจ้าหน้าที่พัสดุ',
    badge: 'เจ้าหน้าที่พัสดุ',
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    id: 'fuel',
    label: 'บันทึกไมล์และเชื้อเพลิง',
    desc: 'บันทึกเลขไมล์ ค่าน้ำมัน และตรวจสภาพรถ',
    badge: 'พนักงานขับรถ',
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    id: 'fleet',
    label: 'บำรุงรักษา & ทะเบียน',
    desc: 'ภาษี พ.ร.บ. ประกันภัย และประวัติซ่อมบำรุง',
    badge: 'งานช่าง/พัสดุ',
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  {
    id: 'analytics',
    label: 'รายงานสถิติและส่งออก',
    desc: 'สรุปงบประมาณ สถิติประจำเดือน และส่งออก Excel/CSV',
    badge: 'รายงาน',
    color: 'text-indigo-500 bg-indigo-500/10'
  },
  {
    id: 'tracking',
    label: 'ติดตาม GPS รถ (Live)',
    desc: 'จำลองเส้นทาง พิกัดดาวเทียม และความเร็วรถ',
    badge: 'GPS',
    color: 'text-purple-500 bg-purple-500/10'
  },
  {
    id: 'backup',
    label: 'สำรอง & กู้คืนข้อมูลระบบ (Backup)',
    desc: 'ดาวน์โหลดไฟล์ JSON สำรองข้อมูลทั้งหมด และนำเข้ากู้คืนข้อมูล',
    badge: 'Backup',
    color: 'text-sky-500 bg-sky-500/10'
  },
  {
    id: 'users',
    label: 'จัดการผู้ใช้งาน & สิทธิ์',
    desc: 'เพิ่ม ลบ แก้ไขผู้ใช้ และกำหนดสิทธิ์การเข้าถึงแต่ละเมนู',
    badge: 'เฉพาะ Admin',
    color: 'text-rose-500 bg-rose-500/10'
  }
];

export const DEFAULT_ROLE_MENUS: Record<string, MenuKey[]> = {
  admin: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'asset_inspection', 'fuel', 'fleet', 'analytics', 'tracking', 'backup', 'users'],
  director: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'asset_inspection', 'analytics', 'tracking', 'backup'],
  officer: ['dashboard', 'calendar', 'booking', 'asset_inspection', 'tracking'],
  driver: ['driver_mission', 'dashboard', 'calendar', 'fuel', 'fleet', 'tracking']
};

export function getUserAllowedMenus(user?: User | null): MenuKey[] {
  if (!user) return ['dashboard', 'calendar', 'booking'];
  if (user.role === 'admin') {
    const menus = user.allowedMenus && user.allowedMenus.length > 0 ? user.allowedMenus : DEFAULT_ROLE_MENUS.admin;
    return menus.includes('users') ? menus : [...menus, 'users'];
  }
  if (user.allowedMenus && user.allowedMenus.length > 0) {
    return user.allowedMenus;
  }
  return DEFAULT_ROLE_MENUS[user.role] || ['dashboard', 'calendar', 'booking'];
}

export const SYSTEM_USERS: User[] = [
  {
    id: 'u-admin',
    username: 'admin',
    password: 'dekcom2537',
    name: 'นายระบบ แอดมินยานพาหนะ',
    position: 'เจ้าพนักงานธุรการชำนาญงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    role: 'admin',
    roleTitle: 'ผู้ดูแลระบบและยานพาหนะ (Admin)',
    phone: '076-481-482 ต่อ 11',
    email: 'admin.phangnga@m-culture.go.th',
    status: 'active',
    allowedMenus: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'fuel', 'fleet', 'analytics', 'tracking', 'users']
  }
];

export const DEPARTMENTS = [
  'กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม',
  'กลุ่มส่งเสริมศาสนา ศิลปะ และวัฒนธรรม',
  'กลุ่มพิธีการศพที่ได้รับพระราชทาน',
  'กลุ่มกิจการพิเศษ',
  'ฝ่ายบริหารทั่วไป'
];

export const POSITIONS = [
  'นักวิชาการวัฒนธรรมปฏิบัติการ',
  'นักวิชาการวัฒนธรรมชำนาญการ',
  'นักวิชาการวัฒนธรรมชำนาญการพิเศษ',
  'เจ้าหน้าที่บริหารงานทั่วไป',
  'เจ้าพนักงานธุรการปฏิบัติงาน/ชำนาญงาน'
];

export const VEHICLES: Vehicle[] = [
  {
    id: 'v-camry',
    name: 'Toyota Camry (VIP เก๋ง)',
    plate: 'กข 1234 พังงา',
    type: 'รถยนต์นั่งส่วนบุคคลไม่เกิน 7 ที่นั่ง',
    seats: 5,
    fuelType: 'เบนซิน Gasohol 95',
    status: 'in_mission',
    odometer: 148520,
    driverName: 'นายศราวุธ เกตุรักษ์',
    colorTag: 'from-orange-500 to-amber-600',
    year: 2562,
    taxExpiry: '2026-11-15',
    actExpiry: '2026-11-15',
    insuranceExpiry: '2026-12-05',
    insuranceCompany: 'วิริยะประกันภัย (ชั้น 1 ราชการ)',
    nextServiceMileage: 150000,
    fuelEfficiencyAvg: 12.4
  },
  {
    id: 'v-revo',
    name: 'Toyota Hilux Revo (กระบะ 4 ประตู)',
    plate: 'ฮง 5678 พังงา',
    type: 'รถกระบะบรรทุกโดยสาร 4 ประตู',
    seats: 5,
    fuelType: 'ดีเซล B7',
    status: 'available',
    odometer: 89430,
    driverName: 'นายเรวัติ แสงสว่าง',
    colorTag: 'from-teal-600 to-emerald-700',
    year: 2564,
    taxExpiry: '2027-03-20',
    actExpiry: '2027-03-20',
    insuranceExpiry: '2027-04-10',
    insuranceCompany: 'ทิพยประกันภัย (ชั้น 1 ราชการ)',
    nextServiceMileage: 90000,
    fuelEfficiencyAvg: 11.2
  },
  {
    id: 'v-commuter',
    name: 'Toyota Commuter (รถตู้ส่วนกลาง)',
    plate: 'นค 9999 พังงา',
    type: 'รถยนต์ตู้โดยสารปรับอากาศ 11 ที่นั่ง',
    seats: 11,
    fuelType: 'ดีเซล B7',
    status: 'available',
    odometer: 112340,
    driverName: 'นายศราวุธ เกตุรักษ์',
    colorTag: 'from-indigo-600 to-blue-700',
    year: 2563,
    taxExpiry: '2026-10-30',
    actExpiry: '2026-10-30',
    insuranceExpiry: '2026-10-30',
    insuranceCompany: 'ทิพยประกันภัย (ชั้น 1 คุ้มครองผู้โดยสาร)',
    nextServiceMileage: 115000,
    fuelEfficiencyAvg: 10.5
  },
  {
    id: 'v-dmax',
    name: 'Isuzu D-Max Spacecab (ตรวจการ)',
    plate: 'บฉ 4321 พังงา',
    type: 'รถกระบะตรวจการ 2 ประตูแค็บ',
    seats: 4,
    fuelType: 'ดีเซล B7',
    status: 'available',
    odometer: 165200,
    driverName: 'นายเรวัติ แสงสว่าง',
    colorTag: 'from-slate-700 to-slate-900',
    year: 2561,
    taxExpiry: '2026-09-28',
    actExpiry: '2026-09-28',
    insuranceExpiry: '2026-10-15',
    insuranceCompany: 'เมืองไทยประกันภัย (ชั้น 1 ราชการ)',
    nextServiceMileage: 170000,
    fuelEfficiencyAvg: 13.1
  }
];

export type { ProvinceLocation, ThaiRegion } from './thaiLocations';
export { THAI_LOCATIONS, THAI_REGIONS } from './thaiLocations';

export interface FrequentDestination {
  id: string;
  name: string;
  shortName: string;
  province: string;
  amphoe: string;
  tambon: string;
  distanceKm: number; // ระยะทางไป-กลับโดยประมาณ (กม.)
  category: 'ราชการ' | 'วัฒนธรรม/ชุมชน' | 'วัด/ศาสนสถาน' | 'สนามบิน/ต่างจังหวัด';
}

export const FREQUENT_DESTINATIONS: FrequentDestination[] = [
  {
    id: 'dest-gov-center',
    name: 'ศาลากลางจังหวัดพังงา (ศูนย์ราชการจังหวัดพังงา ถ้ำน้ำผุด)',
    shortName: 'ศาลากลางพังงา (ศูนย์ราชการ)',
    province: 'พังงา',
    amphoe: 'เมืองพังงา',
    tambon: 'ถ้ำน้ำผุด',
    distanceKm: 14,
    category: 'ราชการ'
  },
  {
    id: 'dest-jampoon-hall',
    name: 'หอประชุมจำปูน ศาลากลางจังหวัดพังงา',
    shortName: 'หอประชุมจำปูน ศูนย์ราชการ',
    province: 'พังงา',
    amphoe: 'เมืองพังงา',
    tambon: 'ถ้ำน้ำผุด',
    distanceKm: 14,
    category: 'ราชการ'
  },
  {
    id: 'dest-bangpat',
    name: 'ชุมชนคุณธรรมต้นแบบบ้านบางพัฒน์ อ.เมืองพังงา',
    shortName: 'ชุมชนคุณธรรมบ้านบางพัฒน์',
    province: 'พังงา',
    amphoe: 'เมืองพังงา',
    tambon: 'บางเตย',
    distanceKm: 28,
    category: 'วัฒนธรรม/ชุมชน'
  },
  {
    id: 'dest-prประชุม',
    name: 'วัดประชุมศึกษา (ทุ่งมะพร้าว) อ.ท้ายเหมือง',
    shortName: 'วัดประชุมศึกษา ทุ่งมะพร้าว',
    province: 'พังงา',
    amphoe: 'ท้ายเหมือง',
    tambon: 'ทุ่งมะพร้าว',
    distanceKm: 70,
    category: 'วัด/ศาสนสถาน'
  },
  {
    id: 'dest-takuapa-oldtown',
    name: 'ย่านเมืองเก่าตะกั่วป่า (ถนนสายวัฒนธรรม ตลาดเก่าตะกั่วป่า)',
    shortName: 'ย่านเมืองเก่าตะกั่วป่า (ถ.วัฒนธรรม)',
    province: 'พังงา',
    amphoe: 'ตะกั่วป่า',
    tambon: 'ตะกั่วป่า',
    distanceKm: 135,
    category: 'วัฒนธรรม/ชุมชน'
  },
  {
    id: 'dest-narayana-kapong',
    name: 'วัดนารายณิการาม ต.เหล อ.กะปง (แหล่งโบราณคดีเขาพระนารายณ์)',
    shortName: 'วัดนารายณิการาม กะปง',
    province: 'พังงา',
    amphoe: 'กะปง',
    tambon: 'เหล',
    distanceKm: 110,
    category: 'วัด/ศาสนสถาน'
  },
  {
    id: 'dest-kokkhlai-thapput',
    name: 'ชุมชนคุณธรรมบ้านโคกไคล ต.มะรุ่ย อ.ทับปุด',
    shortName: 'ชุมชนคุณธรรมบ้านโคกไคล ทับปุด',
    province: 'พังงา',
    amphoe: 'ทับปุด',
    tambon: 'มะรุ่ย',
    distanceKm: 48,
    category: 'วัฒนธรรม/ชุมชน'
  },
  {
    id: 'dest-tsunami-813',
    name: 'อนุสรณ์สถานสึนามิเรือ ต.๘๑๓ ต.คึกคัก อ.ตะกั่วป่า',
    shortName: 'อนุสรณ์สึนามิเรือ ต.๘๑๓ เขาหลัก',
    province: 'พังงา',
    amphoe: 'ตะกั่วป่า',
    tambon: 'คึกคัก',
    distanceKm: 118,
    category: 'วัฒนธรรม/ชุมชน'
  },
  {
    id: 'dest-suwankhuha',
    name: 'วัดสุวรรณคูหา (วัดถ้ำ) อ.ตะกั่วทุ่ง',
    shortName: 'วัดสุวรรณคูหา (วัดถ้ำ)',
    province: 'พังงา',
    amphoe: 'ตะกั่วทุ่ง',
    tambon: 'ถ้ำ',
    distanceKm: 24,
    category: 'วัด/ศาสนสถาน'
  },
  {
    id: 'dest-moken-kuraburi',
    name: 'ชุมชนมอแกน เกาะพระทอง/เกาะสุรินทร์ อ.คุระบุรี',
    shortName: 'ท่าเทียบเรือคุระบุรี (เกาะสุรินทร์)',
    province: 'พังงา',
    amphoe: 'คุระบุรี',
    tambon: 'คุระ',
    distanceKm: 245,
    category: 'วัฒนธรรม/ชุมชน'
  },
  {
    id: 'dest-phuket-airport',
    name: 'ท่าอากาศยานนานาชาติภูเก็ต ต.ไม้ขาว อ.ถลาง จ.ภูเก็ต',
    shortName: 'ท่าอากาศยานนานาชาติภูเก็ต',
    province: 'ภูเก็ต',
    amphoe: 'ถลาง',
    tambon: 'ไม้ขาว',
    distanceKm: 78,
    category: 'สนามบิน/ต่างจังหวัด'
  },
  {
    id: 'dest-phuket-gov',
    name: 'ศาลากลางจังหวัดภูเก็ต (ศูนย์ราชการภูเก็ต)',
    shortName: 'ศาลากลางจังหวัดภูเก็ต',
    province: 'ภูเก็ต',
    amphoe: 'เมืองภูเก็ต',
    tambon: 'ตลาดใหญ่',
    distanceKm: 96,
    category: 'สนามบิน/ต่างจังหวัด'
  },
  {
    id: 'dest-krabi-gov',
    name: 'ศาลากลางจังหวัดกระบี่ (ศูนย์ราชการกระบี่)',
    shortName: 'ศาลากลางจังหวัดกระบี่',
    province: 'กระบี่',
    amphoe: 'เมืองกระบี่',
    tambon: 'ปากน้ำ',
    distanceKm: 86,
    category: 'สนามบิน/ต่างจังหวัด'
  },
  {
    id: 'dest-bkk-mculture',
    name: 'กระทรวงวัฒนธรรม ถนนเทียมร่วมมิตร เขตห้วยขวาง กรุงเทพฯ',
    shortName: 'กระทรวงวัฒนธรรม (กทม.)',
    province: 'กรุงเทพมหานคร',
    amphoe: 'ห้วยขวาง (กระทรวงวัฒนธรรม)',
    tambon: 'ห้วยขวาง',
    distanceKm: 1650,
    category: 'สนามบิน/ต่างจังหวัด'
  }
];

export const POPULAR_CULTURAL_DESTINATIONS = FREQUENT_DESTINATIONS.map((d) => d.name);

// Default Master Passenger Directory (persisted into localStorage)
export const DEFAULT_PASSENGER_DIRECTORY: PassengerDirectoryItem[] = [
  {
    id: 'psg-1',
    name: 'นายสมชาย ใจดี',
    position: 'นักวิชาการวัฒนธรรมชำนาญการ',
    department: 'กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม',
    phone: '081-234-5678',
    isDefault: true
  },
  {
    id: 'psg-2',
    name: 'นางสาวกุณา สุขสบาย',
    position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
    department: 'กลุ่มส่งเสริมศาสนา ศิลปะ และวัฒนธรรม',
    phone: '089-876-5432',
    isDefault: true
  },
  {
    id: 'psg-3',
    name: 'นางสาวศิริพร ใจงาม',
    position: 'เจ้าพนักงานธุรการชำนาญงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    phone: '087-654-3210',
    isDefault: true
  },
  {
    id: 'psg-4',
    name: 'นายประสิทธิ์ วัฒนชัย',
    position: 'นักวิชาการวัฒนธรรมชำนาญการพิเศษ',
    department: 'กลุ่มพิธีการศพที่ได้รับพระราชทาน',
    phone: '084-556-7890',
    isDefault: true
  },
  {
    id: 'psg-5',
    name: 'นายศราวุธ เกตุรักษ์',
    position: 'พนักงานขับรถยนต์ประจำสำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    phone: '086-112-2334',
    isDefault: true
  },
  {
    id: 'psg-6',
    name: 'นายเรวัติ แสงสว่าง',
    position: 'พนักงานขับรถยนต์ประจำสำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    phone: '082-334-4556',
    isDefault: true
  },
  {
    id: 'psg-7',
    name: 'นางสาวพัชรี แก้วสุวรรณ',
    position: 'นักจัดการงานทั่วไปปฏิบัติการ',
    department: 'ฝ่ายบริหารทั่วไป',
    phone: '085-443-2211',
    isDefault: true
  },
  {
    id: 'psg-8',
    name: 'นายสมศักดิ์ สุริยะ',
    position: 'เจ้าหน้าที่ปฏิบัติงานพิธีการศพฯ',
    department: 'กลุ่มพิธีการศพที่ได้รับพระราชทาน',
    phone: '083-998-7766',
    isDefault: true
  },
  {
    id: 'psg-9',
    name: 'นายธีระพงษ์ สว่างศิลป์',
    position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
    department: 'กลุ่มส่งเสริมศาสนา ศิลปะ และวัฒนธรรม',
    phone: '086-778-8990',
    isDefault: true
  },
  {
    id: 'psg-10',
    name: 'ผู้แทนสภาวัฒนธรรมจังหวัดพังงา',
    position: 'กรรมการสภาวัฒนธรรม',
    department: 'สภาวัฒนธรรมจังหวัดพังงา',
    isDefault: true
  },
  {
    id: 'psg-11',
    name: 'ผู้แทนชุมชนคุณธรรมต้นแบบ',
    position: 'ผู้นำชุมชน',
    department: 'เครือข่ายชุมชนคุณธรรม',
    isDefault: true
  }
];

export const INITIAL_BOOKINGS: BookingRequest[] = [
  {
    id: 'CAR-69001',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๒',
    date: '2026-09-03',
    endDate: '2026-09-03',
    startTime: '08:30',
    endTime: '16:30',
    name: 'นายสมชาย ใจดี',
    username: 'user',
    position: 'นักวิชาการวัฒนธรรมชำนาญการ',
    department: 'กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม',
    purpose: 'ลงพื้นที่ตรวจเยี่ยมชุมชนคุณธรรมและขับเคลื่อนศูนย์เฝ้าระวังทางวัฒนธรรมนอกสถานศึกษา',
    destination: 'จ.พังงา อ.เมืองพังงา ต.ท้ายช้าง (ศาลากลางจังหวัดพังงา ศูนย์ราชการ)',
    destProvince: 'พังงา',
    destAmphoe: 'เมืองพังงา',
    destTambon: 'ท้ายช้าง',
    destDetail: 'ศาลากลางจังหวัดพังงา ศูนย์ราชการ',
    destinationsList: ['ศาลากลางจังหวัดพังงา ศูนย์ราชการ', 'หอประชุมจำปูน ศาลากลางจังหวัดพังงา'],
    estimatedDistance: 28,
    carId: 'v-camry',
    carName: 'Toyota Camry (กข 1234 พังงา)',
    driverType: 'driver',
    driverName: 'นายศราวุธ เกตุรักษ์',
    passengerCount: 3,
    passengerNames: 'นายสมชาย ใจดี, นางสาวศิริพร ใจงาม, นายเรวัติ แสงสว่าง',
    attachmentName: 'คำสั่งปฏิบัติงานที่_142_2569.pdf',
    status: 'in_progress',
    directorComment: 'อนุมัติเรียบร้อย เดินทางอย่างปลอดภัย',
    approvedAt: '2026-09-02T08:45:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    startMileage: 148520,
    startMileageTime: '08:30',
    actualDepartureTime: '08:30',
    driverNotes: 'ตรวจเช็กลมยางและระบบความเย็นเรียบร้อย ออกเดินทางตามเวลา',
    createdAt: '2026-09-02T08:30:00.000Z'
  },
  {
    id: 'CAR-69002',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๑',
    date: '2026-09-01',
    endDate: '2026-09-01',
    startTime: '07:00',
    endTime: '18:00',
    name: 'นางสาวกุณา สุขสบาย',
    username: 'guna',
    position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
    department: 'กลุ่มส่งเสริมศาสนา ศิลปะ และวัฒนธรรม',
    purpose: 'ร่วมประชุมเชิงปฏิบัติการพัฒนาผลิตภัณฑ์วัฒนธรรมไทย (CPOT) ระดับกลุ่มจังหวัดภาคใต้ฝั่งอันดามัน',
    destination: 'จ.ภูเก็ต อ.เมืองภูเก็ต ต.ตลาดใหญ่ (โรงแรมรอยัลภูเก็ตซิตี้)',
    destProvince: 'ภูเก็ต',
    destAmphoe: 'เมืองภูเก็ต',
    destTambon: 'ตลาดใหญ่',
    destDetail: 'โรงแรมรอยัลภูเก็ตซิตี้ ถ.พังงา',
    destinationsList: ['โรงแรมรอยัลภูเก็ตซิตี้ ถ.พังงา', 'ศาลากลางจังหวัดภูเก็ต'],
    estimatedDistance: 180,
    carId: 'v-revo',
    carName: 'Toyota Hilux Revo (ฮง 5678 พังงา)',
    driverType: 'driver',
    driverName: 'นายเรวัติ แสงสว่าง',
    passengerCount: 4,
    passengerNames: 'นางสาวกุณา สุขสบาย, ผู้แทนชุมชนคุณธรรมต้นแบบ, ผู้แทนสภาวัฒนธรรมจังหวัดพังงา, พนักงานขับรถ',
    attachmentName: 'หนังสือเชิญประชุม_ภก0030_1289.pdf',
    status: 'completed',
    directorComment: 'อนุมัติ ให้เดินทางอย่างระมัดระวังและปฏิบัติตามระเบียบราชการอย่างเคร่งครัด',
    approvedAt: '2026-09-01T08:15:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    startMileage: 89250,
    startMileageTime: '07:00',
    actualDepartureTime: '07:00',
    endMileage: 89430,
    endMileageTime: '17:45',
    actualReturnTime: '17:45',
    totalDistance: 180,
    fuelRefilledLiters: 17.5,
    fuelRefilledCost: 595,
    fuelStation: 'ปตท. โคกกลอย (ถ.เพชรเกษม)',
    fuelReceiptNo: 'RC-PTT-99821',
    driverNotes: 'เดินทางราบรื่น ไม่พบปัญหาเครื่องยนต์ ล้างทำความสะอาดรถเรียบร้อย',
    tripRating: 'ดีเยี่ยม (เครื่องยนต์ปกติ แอร์เย็น สะอาดตรงเวลา)',
    registeredInAssetControl: true,
    assetControlRecordedAt: '2026-09-01T18:00:00.000Z',
    createdAt: '2026-08-31T14:20:00.000Z'
  },
  {
    id: 'CAR-69003',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๐',
    date: '2026-09-03',
    endDate: '2026-09-03',
    startTime: '09:00',
    endTime: '17:00',
    name: 'นายระบบ แอดมินยานพาหนะ',
    username: 'admin',
    position: 'เจ้าพนักงานธุรการชำนาญงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    purpose: 'ขนส่งอุปกรณ์จัดนิทรรศการมรดกภูมิปัญญาทางวัฒนธรรมย่านเมืองเก่าตะกั่วป่า',
    destination: 'จ.พังงา อ.ตะกั่วป่า ต.ตะกั่วป่า (ถนนสายวัฒนธรรม ตลาดเก่าตะกั่วป่า)',
    destProvince: 'พังงา',
    destAmphoe: 'ตะกั่วป่า',
    destTambon: 'ตะกั่วป่า',
    destDetail: 'ถนนสายวัฒนธรรม ตลาดเก่าตะกั่วป่า',
    destinationsList: ['ถนนสายวัฒนธรรม ตลาดเก่าตะกั่วป่า'],
    estimatedDistance: 135,
    carId: 'v-commuter',
    carName: 'Toyota Commuter (นค 9999 พังงา)',
    driverType: 'driver',
    driverName: 'นายศราวุธ เกตุรักษ์',
    passengerCount: 6,
    passengerNames: 'คณะทำงานฝ่ายพิธีการและจัดนิทรรศการวัฒนธรรม 6 คน',
    attachmentName: 'โครงการถนนสายวัฒนธรรม2569.pdf',
    status: 'approved',
    directorComment: 'อนุมัติ ให้ประสานเทศบาลเมืองตะกั่วป่าเพื่อความเรียบร้อย',
    approvedAt: '2026-09-02T16:00:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'CAR-69004',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๓',
    date: '2026-09-04',
    endDate: '2026-09-04',
    startTime: '08:00',
    endTime: '16:00',
    name: 'นายสมชาย ใจดี',
    username: 'user',
    position: 'นักวิชาการวัฒนธรรมชำนาญการ',
    department: 'กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม',
    purpose: 'ร่วมพิธีถวายผ้ากฐินพระราชทานและประสานงานศาสนพิธี ณ วัดประชุมศึกษา',
    destination: 'จ.พังงา อ.ท้ายเหมือง ต.ทุ่งมะพร้าว (วัดประชุมศึกษา)',
    destProvince: 'พังงา',
    destAmphoe: 'ท้ายเหมือง',
    destTambon: 'ทุ่งมะพร้าว',
    destDetail: 'วัดประชุมศึกษา ทุ่งมะพร้าว',
    destinationsList: ['วัดประชุมศึกษา ทุ่งมะพร้าว', 'ที่ว่าการอำเภอท้ายเหมือง'],
    estimatedDistance: 86,
    carId: 'v-fortuner',
    carName: 'Toyota Fortuner 2.8 Legender (กง 8888 พังงา)',
    driverType: 'driver',
    driverName: 'นายศราวุธ เกตุรักษ์',
    passengerCount: 5,
    passengerNames: 'นายสมชาย ใจดี, นายประสิทธิ์ วัฒนชัย, นางสาวพัชรี แก้วสุวรรณ, พนักงานขับรถ',
    attachmentName: 'หนังสือแจ้งกำหนดการกฐินพระราชทาน_2569.pdf',
    status: 'pending',
    createdAt: '2026-09-02T11:20:00.000Z'
  },
  {
    id: 'CAR-69005',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๐๙',
    date: '2026-08-30',
    endDate: '2026-08-30',
    startTime: '08:30',
    endTime: '17:00',
    name: 'นางสาวกุณา สุขสบาย',
    username: 'guna',
    position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
    department: 'กลุ่มส่งเสริมศาสนา ศิลปะ และวัฒนธรรม',
    purpose: 'สำรวจและบันทึกข้อมูลภูมิปัญญาท้องถิ่นและการแปรรูปผลผลิตทางการเกษตรเชิงวัฒนธรรม อ.กะปง',
    destination: 'จ.พังงา อ.กะปง ต.ท่านา (ศูนย์เรียนรู้ภูมิปัญญากะปง)',
    destProvince: 'พังงา',
    destAmphoe: 'กะปง',
    destTambon: 'ท่านา',
    destDetail: 'ศูนย์เรียนรู้ภูมิปัญญาพื้นบ้านกะปง ต.ท่านา',
    destinationsList: ['ศูนย์เรียนรู้ภูมิปัญญาพื้นบ้านกะปง', 'วัดปากวีป ต.เหมาะ'],
    estimatedDistance: 94,
    carId: 'v-dmax',
    carName: 'Isuzu D-Max Spacecab (บฉ 4321 พังงา)',
    driverType: 'driver',
    driverName: 'นายเรวัติ แสงสว่าง',
    passengerCount: 3,
    passengerNames: 'นางสาวกุณา สุขสบาย, นายสมศักดิ์ สุริยะ, นายเรวัติ แสงสว่าง',
    attachmentName: 'แผนการสำรวจภูมิปัญญากะปง_2569.pdf',
    status: 'completed',
    directorComment: 'อนุมัติ ให้จัดทำรายงานสรุปข้อมูลส่งกลุ่มส่งเสริมฯ ภายใน 5 วันทำการ',
    approvedAt: '2026-08-29T10:00:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    startMileage: 165106,
    startMileageTime: '08:30',
    actualDepartureTime: '08:30',
    endMileage: 165200,
    endMileageTime: '16:45',
    actualReturnTime: '16:45',
    totalDistance: 94,
    fuelRefilledLiters: 9.2,
    fuelRefilledCost: 312,
    fuelStation: 'ปตท. ตะกั่วป่า',
    fuelReceiptNo: 'RC-PTT-88741',
    driverNotes: 'สภาพถนนบนเขามีฝนตกเล็กน้อย ขับขี่ปลอดภัย ตัวรถสภาพสมบูรณ์',
    tripRating: 'ดีเยี่ยม (เครื่องยนต์ปกติ แอร์เย็น สะอาดตรงเวลา)',
    registeredInAssetControl: true,
    assetControlRecordedAt: '2026-08-30T17:15:00.000Z',
    createdAt: '2026-08-28T09:15:00.000Z'
  },
  {
    id: 'CAR-69006',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๔',
    date: '2026-09-05',
    endDate: '2026-09-05',
    startTime: '13:00',
    endTime: '20:00',
    name: 'นายระบบ แอดมินยานพาหนะ',
    username: 'admin',
    position: 'เจ้าพนักงานธุรการชำนาญงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    purpose: 'รับ-ส่งผู้ตรวจราชการกระทรวงวัฒนธรรมและคณะ ลงพื้นที่ตรวจราชการรอบที่ ๒ ณ ท่าอากาศยานภูเก็ต',
    destination: 'จ.ภูเก็ต อ.ถลาง ต.ไม้ขาว (ท่าอากาศยานนานาชาติภูเก็ต)',
    destProvince: 'ภูเก็ต',
    destAmphoe: 'ถลาง',
    destTambon: 'ไม้ขาว',
    destDetail: 'อาคารผู้โดยสารขาเข้า ท่าอากาศยานนานาชาติภูเก็ต',
    destinationsList: ['ท่าอากาศยานนานาชาติภูเก็ต', 'โรงแรมที่พัก อ.เมืองพังงา'],
    estimatedDistance: 156,
    carId: 'v-camry',
    carName: 'Toyota Camry (กข 1234 พังงา)',
    driverType: 'driver',
    driverName: 'นายศราวุธ เกตุรักษ์',
    passengerCount: 4,
    passengerNames: 'ผู้ตรวจราชการกระทรวงวัฒนธรรม, ผู้ติดตาม 2 ท่าน, เจ้าหน้าที่ต้อนรับ',
    attachmentName: 'กำหนดการตรวจราชการ_วธ_กย2569.pdf',
    status: 'approved',
    directorComment: 'อนุมัติ มอบหมายพนักงานขับรถแต่งกายเครื่องแบบสุภาพเรียบร้อย ดูแลความสะอาดรถเป็นพิเศษ',
    approvedAt: '2026-09-02T17:30:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    createdAt: '2026-09-02T14:10:00.000Z'
  },
  {
    id: 'CAR-69007',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๕',
    date: '2026-09-06',
    endDate: '2026-09-06',
    startTime: '10:00',
    endTime: '15:30',
    name: 'นายสมชาย ใจดี',
    username: 'user',
    position: 'นักวิชาการวัฒนธรรมชำนาญการ',
    department: 'กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม',
    purpose: 'ตรวจประเมินร้านเกมและสถานประกอบการตาม พ.ร.บ.ภาพยนตร์และวีดิทัศน์ พื้นที่โคกกลอย',
    destination: 'จ.พังงา อ.ตะกั่วทุ่ง ต.โคกกลอย (เทศบาลตำบลโคกกลอย)',
    destProvince: 'พังงา',
    destAmphoe: 'ตะกั่วทุ่ง',
    destTambon: 'โคกกลอย',
    destDetail: 'ย่านการค้าและชุมชนเทศบาลตำบลโคกกลอย',
    destinationsList: ['เทศบาลตำบลโคกกลอย', 'ที่ว่าการอำเภอตะกั่วทุ่ง'],
    estimatedDistance: 76,
    carId: 'v-revo',
    carName: 'Toyota Hilux Revo (ฮง 5678 พังงา)',
    driverType: 'driver',
    driverName: 'นายเรวัติ แสงสว่าง',
    passengerCount: 3,
    passengerNames: 'นายสมชาย ใจดี, เจ้าหน้าที่สารวัตรวัฒนธรรม 2 ท่าน',
    attachmentName: 'แผนตรวจสถานประกอบกิจการ_กย69.pdf',
    status: 'pending',
    createdAt: '2026-09-03T09:30:00.000Z'
  },
  {
    id: 'CAR-69008',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๐๘',
    date: '2026-08-28',
    endDate: '2026-08-28',
    startTime: '08:00',
    endTime: '16:00',
    name: 'นางสาวกุณา สุขสบาย',
    username: 'guna',
    position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
    department: 'กลุ่มส่งเสริมศาสนา ศิลปะ และวัฒนธรรม',
    purpose: 'งานพิธีทางศาสนาและสมโภชพระมหาธาตุเจดีย์พุทธธรรมบันลือ ณ วัดราษฎร์อุปถัมภ์ (วัดบางเหรียง)',
    destination: 'จ.พังงา อ.ทับปุด ต.บางเหรียง (วัดบางเหรียง)',
    destProvince: 'พังงา',
    destAmphoe: 'ทับปุด',
    destTambon: 'บางเหรียง',
    destDetail: 'วัดราษฎร์อุปถัมภ์ (วัดบางเหรียง) เขาหลาน ต.บางเหรียง',
    destinationsList: ['วัดราษฎร์อุปถัมภ์ (วัดบางเหรียง)'],
    estimatedDistance: 64,
    carId: 'v-commuter',
    carName: 'Toyota Commuter (นค 9999 พังงา)',
    driverType: 'driver',
    driverName: 'นายศราวุธ เกตุรักษ์',
    passengerCount: 7,
    passengerNames: 'คณะเจ้าหน้าที่กลุ่มส่งเสริมศาสนาฯ และกลุ่มพิธีการศพฯ รวม 7 ท่าน',
    attachmentName: 'กำหนดการสมโภชพระมหาธาตุเจดีย์.pdf',
    status: 'completed',
    directorComment: 'อนุมัติ ให้ประสานเจ้าคณะอำเภอทับปุดและดูแลความเรียบร้อย',
    approvedAt: '2026-08-27T11:00:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    startMileage: 112276,
    startMileageTime: '08:00',
    actualDepartureTime: '08:00',
    endMileage: 112340,
    endMileageTime: '15:50',
    actualReturnTime: '15:50',
    totalDistance: 64,
    fuelRefilledLiters: 6.8,
    fuelRefilledCost: 231,
    fuelStation: 'ปตท. ทับปุด',
    fuelReceiptNo: 'RC-PTT-77219',
    driverNotes: 'การเดินทางปกติ ปฏิบัติศาสนพิธีครบถ้วนตามกำหนด',
    tripRating: 'ดีเยี่ยม (เครื่องยนต์ปกติ แอร์เย็น สะอาดตรงเวลา)',
    registeredInAssetControl: true,
    assetControlRecordedAt: '2026-08-28T16:30:00.000Z',
    createdAt: '2026-08-26T15:00:00.000Z'
  },
  {
    id: 'CAR-69009',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๐๗',
    date: '2026-08-25',
    endDate: '2026-08-25',
    startTime: '09:00',
    endTime: '16:00',
    name: 'นายสมชาย ใจดี',
    username: 'user',
    position: 'นักวิชาการวัฒนธรรมชำนาญการ',
    department: 'กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม',
    purpose: 'ประสานงานสำรวจพื้นที่โครงการและสัมมนาแลกเปลี่ยนองค์ความรู้ภายนอก',
    destination: 'จ.พังงา อ.ตะกั่วป่า ต.คึกคัก (ย่านเขาหลัก)',
    destProvince: 'พังงา',
    destAmphoe: 'ตะกั่วป่า',
    destTambon: 'คึกคัก',
    destDetail: 'ศูนย์ประสานงานเครือข่ายท่องเที่ยวเขาหลัก',
    destinationsList: ['ศูนย์ประสานงานเครือข่ายท่องเที่ยวเขาหลัก'],
    estimatedDistance: 110,
    carId: 'v-dmax',
    carName: 'Isuzu D-Max Spacecab (บฉ 4321 พังงา)',
    driverType: 'driver',
    driverName: 'นายเรวัติ แสงสว่าง',
    passengerCount: 2,
    passengerNames: 'นายสมชาย ใจดี, เจ้าหน้าที่ร่วมเดินทาง',
    attachmentName: '',
    status: 'rejected',
    directorComment: 'ขอให้ระบุภารกิจราชการตามคำสั่งหรือหนังสือเชิญให้ชัดเจน พร้อมแนบเอกสารโครงการประกอบการพิจารณาอีกครั้ง',
    createdAt: '2026-08-24T13:00:00.000Z'
  },
  {
    id: 'CAR-69010',
    memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๖',
    date: '2026-09-07',
    endDate: '2026-09-08',
    startTime: '07:30',
    endTime: '17:30',
    name: 'นายระบบ แอดมินยานพาหนะ',
    username: 'admin',
    position: 'เจ้าพนักงานธุรการชำนาญงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    purpose: 'โครงการอนุรักษ์และฟื้นฟูวิถีชีวิตกลุ่มชาติพันธุ์ชาวเล (มอแกน) ณ เกาะพระทอง อ.คุระบุรี',
    destination: 'จ.พังงา อ.คุระบุรี ต.เกาะพระทอง (ท่าเรือคุระบุรี - ชุมชนมอแกน)',
    destProvince: 'พังงา',
    destAmphoe: 'คุระบุรี',
    destTambon: 'เกาะพระทอง',
    destDetail: 'ท่าเทียบเรืออำเภอคุระบุรี ข้ามฟากสู่เกาะพระทอง',
    destinationsList: ['ท่าเทียบเรืออำเภอคุระบุรี', 'ที่ว่าการอำเภอคุระบุรี'],
    estimatedDistance: 245,
    carId: 'v-fortuner',
    carName: 'Toyota Fortuner 2.8 Legender (กง 8888 พังงา)',
    driverType: 'driver',
    driverName: 'นายศราวุธ เกตุรักษ์',
    passengerCount: 5,
    passengerNames: 'วัฒนธรรมจังหวัดพังงา, นักวิชาการวัฒนธรรม 3 ท่าน, พนักงานขับรถ',
    attachmentName: 'โครงการฟื้นฟูวิถีชีวิตชาวเล2569.pdf',
    status: 'approved',
    directorComment: 'อนุมัติ ให้จัดเตรียมยานพาหนะและตรวจสอบอุปกรณ์ความปลอดภัยทางน้ำล่วงหน้า',
    approvedAt: '2026-09-03T16:45:00.000Z',
    approvedBy: 'นางสาวอุไรวรรณ แดงงาม',
    createdAt: '2026-09-03T11:00:00.000Z'
  }
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: 'FL-2569-001',
    bookingId: 'CAR-69002',
    carPlate: 'ฮง 5678 พังงา',
    driverName: 'นายเรวัติ แสงสว่าง',
    startMileage: 89250,
    endMileage: 89430,
    distance: 180,
    litres: 17.5,
    cost: 595,
    fuelStation: 'ปตท. โคกกลอย (ถ.เพชรเกษม)',
    receiptNo: 'RC-PTT-99821',
    rating: 'ดีเยี่ยม (เครื่องยนต์ปกติ แอร์เย็น สะอาดตรงเวลา)',
    checklist: {
      tires: true,
      engineOil: true,
      coolant: true,
      brakesAndLights: true,
      cleanliness: true,
      emergencyTools: true
    },
    notes: 'เดินทางราบรื่น ไม่พบปัญหาเครื่องยนต์',
    date: '2026-09-01'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'มีคำขอใช้รถยนต์ราชการใหม่',
    desc: 'นายสมชาย ใจดี ส่งใบเบิก CAR-69001 (ไปศาลากลางพังงา) รอดำเนินการอนุมัติ',
    time: '15 นาทีที่แล้ว',
    read: false,
    type: 'new'
  },
  {
    id: 'n-2',
    title: 'คำขอได้รับการอนุมัติแล้ว',
    desc: 'คำขอ CAR-69002 (ไป จ.ภูเก็ต) ได้รับการอนุมัติจาก ผอ.สำนักงานแล้ว',
    time: '2 ชั่วโมงที่แล้ว',
    read: false,
    type: 'approved'
  },
  {
    id: 'n-3',
    title: 'บันทึกน้ำมันและระยะทาง',
    desc: 'นายเรวัติ แสงสว่าง บันทึกเลขไมล์ภารกิจ FL-2569-001 ระยะทาง 180 กม. เรียบร้อยแล้ว',
    time: 'เมื่อวานนี้',
    read: true,
    type: 'fuel'
  }
];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'MNT-2569-001',
    carId: 'v-dmax',
    carName: 'Isuzu D-Max Spacecab (ตรวจการ)',
    carPlate: 'บฉ 4321 พังงา',
    serviceType: 'oil_change',
    serviceTypeLabel: 'เปลี่ยนถ่ายน้ำมันเครื่อง & ไส้กรอง',
    title: 'เช็คระยะ 160,000 กม. เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์แท้และกรองอากาศ',
    serviceCenter: 'ศูนย์อีซูซุอันดามันเซลส์ สาขาพังงา',
    date: '2026-08-15',
    mileageAtService: 160200,
    nextDueMileage: 170000,
    nextDueDate: '2027-02-15',
    cost: 3450,
    invoiceNo: 'INV-ISZ-690812',
    technicianNotes: 'เปลี่ยนน้ำมันเครื่อง Isuzu Ddi MAX 5W-30, กรองเครื่องแท้, ตรวจเช็คระบบเบรกปกติ',
    status: 'completed'
  },
  {
    id: 'MNT-2569-002',
    carId: 'v-commuter',
    carName: 'Toyota Commuter (รถตู้ส่วนกลาง)',
    carPlate: 'นค 9999 พังงา',
    serviceType: 'tires',
    serviceTypeLabel: 'สลับยางและถ่วงล้อ',
    title: 'สลับยาง 4 ล้อ ตรวจเช็คแรงดันลมยางและระบบช่วงล่าง',
    serviceCenter: 'บี-ควิก สาขาพังงา (ถ.เพชรเกษม)',
    date: '2026-07-20',
    mileageAtService: 110000,
    nextDueMileage: 120000,
    nextDueDate: '2027-01-20',
    cost: 800,
    invoiceNo: 'BQ-PG-256907',
    technicianNotes: 'ดอกยางเหลือ 6.2 มม. ยังอยู่ในเกณฑ์ดี ถ่วงล้อหน้า 2 ล้อเรียบร้อย',
    status: 'completed'
  },
  {
    id: 'MNT-2569-003',
    carId: 'v-camry',
    carName: 'Toyota Camry (VIP เก๋ง)',
    carPlate: 'กข 1234 พังงา',
    serviceType: 'tax_act',
    serviceTypeLabel: 'ต่อภาษีประจำปีและ พ.ร.บ.',
    title: 'ตรวจสภาพ ตรอ. และชำระภาษีรถยนต์ประจำปี พ.ศ. ๒๕๖๙',
    serviceCenter: 'สำนักงานขนส่งจังหวัดพังงา',
    date: '2025-11-10',
    mileageAtService: 140000,
    nextDueMileage: 150000,
    nextDueDate: '2026-11-15',
    cost: 2320,
    invoiceNo: 'TAX-DLT-6911',
    technicianNotes: 'ผ่านการตรวจควันดำและไฟส่องสว่าง ป้ายภาษีหมดอายุ 15 พ.ย. 2569',
    status: 'completed'
  }
];

// LocalStorage Persistence Keys
export const STORAGE_KEYS = {
  USERS: 'mculture_fleet_users_v2',
  VEHICLES: 'mculture_fleet_vehicles_v2',
  BOOKINGS: 'mculture_fleet_bookings_v2',
  FUEL_LOGS: 'mculture_fleet_fuel_v2',
  MAINTENANCE: 'mculture_fleet_maintenance_v2',
  PASSENGERS: 'mculture_fleet_passengers_v2',
  CURRENT_USER: 'mculture_fleet_user_v2',
  NOTIFICATIONS: 'mculture_fleet_notifs_v2',
  SOUND_ENABLED: 'mculture_fleet_sound_v2',
  GOOGLE_SHEET_INFO: 'mculture_fleet_sheet_info_v2',
  LAST_SYNCED_TIME: 'mculture_fleet_last_sync_v2',
  IS_AUTHENTICATED: 'mculture_fleet_auth_status_v2'
};

export function loadSavedData<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultData;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading from ${key}:`, err);
    return defaultData;
  }
}

export function saveLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving to ${key}:`, err);
  }
}
