import { BookingRequest, User } from '../types';

/**
 * ทำความสะอาดและตัดคำนำหน้าชื่อภาษาไทย / ข้อความกำกับในวงเล็บ
 * เพื่อให้การเปรียบเทียบชื่อมีความแม่นยำสูงสุด
 */
export function normalizeThaiName(name?: string): string {
  if (!name) return '';
  return name
    .replace(/\(ผู้ขอขับขี่ด้วยตนเอง\)/gi, '')
    .replace(/\(ขับขี่ด้วยตนเอง\)/gi, '')
    .replace(/\(ขับเอง\)/gi, '')
    .replace(/\(.*\)/g, '')
    .replace(/^(นาย|นางสาว|นาง|น\.ส\.|ว่าที่\s*ร\.ต\.|ด\.ต\.|ร\.ต\.อ\.|ร\.ต\.ท\.|พ\.ต\.ท\.|พ\.ต\.อ\.|ดร\.|อาจารย์|ผอ\.)\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ตรวจสอบความสอดคล้องของชื่อภาษาไทย
 */
export function isThaiNameMatch(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const rawA = nameA.trim();
  const rawB = nameB.trim();
  if (rawA.toLowerCase() === rawB.toLowerCase()) return true;

  const cleanA = normalizeThaiName(rawA);
  const cleanB = normalizeThaiName(rawB);
  if (!cleanA || !cleanB) return false;

  if (cleanA.toLowerCase() === cleanB.toLowerCase()) return true;

  const noSpaceA = cleanA.replace(/\s+/g, '').toLowerCase();
  const noSpaceB = cleanB.replace(/\s+/g, '').toLowerCase();
  if (noSpaceA === noSpaceB) return true;

  // เปรียบเทียบกรณีมีนามสกุลย่อหรือคำค้นหากรณีความยาวเพียงพอ
  if (cleanA.length >= 5 && cleanB.length >= 5) {
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
  }

  return false;
}

/**
 * ตรวจสอบว่าใบคำขอนี้เป็นการ "ขับรถเอง" หรือไม่
 */
export function isSelfDriveBooking(booking?: BookingRequest | null): boolean {
  if (!booking) return false;
  if (booking.driverType === 'self') return true;

  const driverName = booking.driverName || '';
  if (
    driverName.includes('ตนเอง') ||
    driverName.includes('ขับขี่ด้วยตนเอง') ||
    driverName.includes('ขับเอง')
  ) {
    return true;
  }

  // หากชื่อผู้ขับตรงกับชื่อผู้ขอ และไม่ใช่การระบุพนักงานขับรถประจำคัน
  if (booking.name && isThaiNameMatch(driverName, booking.name) && booking.driverType !== 'driver') {
    return true;
  }

  return false;
}

/**
 * ตรวจสอบว่าผู้ใช้งานปัจจุบันคือ "ผู้ขอใช้รถ" ของใบคำขอนี้หรือไม่
 * รองรับทั้ง username, userId/id และชื่อผู้ใช้งาน
 */
export function isRequesterOfBooking(
  booking?: BookingRequest | null,
  user?: User | null
): boolean {
  if (!booking || !user) return false;

  // 1. ตรวจสอบตาม username
  if (
    booking.username &&
    user.username &&
    booking.username.trim().toLowerCase() === user.username.trim().toLowerCase()
  ) {
    return true;
  }

  // 2. ตรวจสอบตาม userId / id
  const bookingUserId = (booking as unknown as { userId?: string }).userId;
  if (
    bookingUserId &&
    user.id &&
    String(bookingUserId).trim().toLowerCase() === String(user.id).trim().toLowerCase()
  ) {
    return true;
  }

  // 3. ตรวจสอบตามชื่อ นามสกุล
  if (isThaiNameMatch(user.name, booking.name)) {
    return true;
  }

  return false;
}

/**
 * ตรวจสอบว่าผู้ใช้งานปัจจุบันคือ "พนักงานขับรถที่ได้รับมอบหมาย" ในใบคำขอหรือไม่
 * รองรับทั้ง username, userId/id, ชื่อคนขับ และการเปลี่ยนแปลงผู้ขับรถ
 */
export function isAssignedDriverOfBooking(
  booking?: BookingRequest | null,
  user?: User | null,
  allUsers?: User[]
): boolean {
  if (!booking || !user) return false;

  // กรณีไม่มีการระบุผู้ขับรถ
  const driverName = booking.driverName?.trim();
  if (
    !driverName ||
    driverName === '' ||
    driverName === 'ไม่ระบุ' ||
    driverName.includes('ยังไม่ระบุ') ||
    driverName.includes('รอระบุ')
  ) {
    return false;
  }

  // 1. ตรวจสอบตาม driverUsername ในโครงสร้างข้อมูล
  const driverUsername = (booking as unknown as { driverUsername?: string }).driverUsername;
  if (
    driverUsername &&
    user.username &&
    String(driverUsername).trim().toLowerCase() === user.username.trim().toLowerCase()
  ) {
    return true;
  }

  // 2. ตรวจสอบตาม driverId ในโครงสร้างข้อมูล
  const driverId = (booking as unknown as { driverId?: string }).driverId;
  if (
    driverId &&
    user.id &&
    String(driverId).trim().toLowerCase() === String(user.id).trim().toLowerCase()
  ) {
    return true;
  }

  // 3. ตรวจสอบตามชื่อผู้ขับรถกับชื่อผู้ใช้
  if (isThaiNameMatch(driverName, user.name)) {
    return true;
  }

  // 4. ตรวจสอบค้นหาจากฐานข้อมูลผู้ใช้ทั้งหมด (allUsers)
  if (allUsers && allUsers.length > 0) {
    const matchedUser = allUsers.find(
      (u) =>
        isThaiNameMatch(u.name, driverName) ||
        (driverUsername && u.username.toLowerCase() === driverUsername.toLowerCase()) ||
        (driverId && u.id === driverId)
    );

    if (matchedUser) {
      if (
        (user.id && matchedUser.id === user.id) ||
        (user.username && matchedUser.username.toLowerCase() === user.username.toLowerCase())
      ) {
        return true;
      }
    }
  }

  return false;
}

export interface MissionPermissionDetails {
  canExecute: boolean;
  isSelfDrive: boolean;
  isRequester: boolean;
  isAssignedDriver: boolean;
  hasDriverAssigned: boolean;
  driverDisplayName: string;
  reason?: string;
}

/**
 * ตรวจสอบสิทธิ์การเริ่มงาน/บันทึกภารกิจงานขับรถแบบละเอียด
 */
export function getMissionPermissionDetails(
  booking?: BookingRequest | null,
  user?: User | null,
  allUsers?: User[]
): MissionPermissionDetails {
  if (!booking || !user) {
    return {
      canExecute: false,
      isSelfDrive: false,
      isRequester: false,
      isAssignedDriver: false,
      hasDriverAssigned: false,
      driverDisplayName: 'ไม่ระบุ',
      reason: 'ไม่พบข้อมูลผู้ใช้หรือใบคำขอ'
    };
  }

  const isSelfDrive = isSelfDriveBooking(booking);
  const isRequester = isRequesterOfBooking(booking, user);
  const isAssignedDriver = isAssignedDriverOfBooking(booking, user, allUsers);
  
  const rawDriverName = booking.driverName?.trim() || '';
  const hasDriverAssigned =
    rawDriverName !== '' &&
    rawDriverName !== 'ไม่ระบุ' &&
    !rawDriverName.includes('ยังไม่ระบุ') &&
    !rawDriverName.includes('รอระบุ');

  const driverDisplayName = isSelfDrive
    ? `${booking.name || 'ผู้ขอใช้รถ'} (ขับขี่ด้วยตนเอง)`
    : hasDriverAssigned
    ? rawDriverName
    : 'ยังไม่ได้ระบุพนักงานขับรถ';

  // สถานะใบคำขอต้องเป็น 'approved' หรือ 'in_progress' เท่านั้นที่จะเริ่มหรือบันทึกจบงานได้
  const isEligibleStatus = booking.status === 'approved' || booking.status === 'in_progress';
  if (!isEligibleStatus) {
    return {
      canExecute: false,
      isSelfDrive,
      isRequester,
      isAssignedDriver,
      hasDriverAssigned,
      driverDisplayName,
      reason: 'สถานะใบคำขอไม่อยู่ในเงื่อนไขที่เริ่มหรือบันทึกภารกิจได้ (ต้องได้รับอนุมัติแล้ว หรือกำลังปฏิบัติภารกิจ)'
    };
  }

  // กรณีขับรถเอง: ผู้ขอใช้รถที่ขับรถเองเท่านั้นที่จะเห็นปุ่มเริ่มงานได้
  if (isSelfDrive) {
    const canExecute = isRequester || isThaiNameMatch(user.name, rawDriverName);
    return {
      canExecute,
      isSelfDrive: true,
      isRequester,
      isAssignedDriver: false,
      hasDriverAssigned: true,
      driverDisplayName,
      reason: canExecute
        ? undefined
        : 'คำขอนี้ระบุว่าขับขี่ด้วยตนเอง สงวนสิทธิ์เฉพาะผู้ขอใช้รถท่านนี้เท่านั้น'
    };
  }

  // กรณีมีพนักงานขับรถ: ต้องเป็นพนักงานขับรถที่ได้รับมอบหมายเท่านั้น
  if (!hasDriverAssigned) {
    return {
      canExecute: false,
      isSelfDrive: false,
      isRequester,
      isAssignedDriver: false,
      hasDriverAssigned: false,
      driverDisplayName,
      reason: 'ใบคำขอนี้ยังไม่ได้ระบุพนักงานขับรถ'
    };
  }

  if (isAssignedDriver) {
    return {
      canExecute: true,
      isSelfDrive: false,
      isRequester,
      isAssignedDriver: true,
      hasDriverAssigned: true,
      driverDisplayName,
      reason: undefined
    };
  }

  return {
    canExecute: false,
    isSelfDrive: false,
    isRequester,
    isAssignedDriver: false,
    hasDriverAssigned: true,
    driverDisplayName,
    reason: `สงวนสิทธิ์เฉพาะพนักงานขับรถที่ได้รับมอบหมาย (${driverDisplayName})`
  };
}

/**
 * ฟังก์ชันหลักในการตรวจสอบว่าผู้ใช้ปัจจุบันมีสิทธิ์กดปุ่ม "เริ่มงาน" หรือ "กรอกไมล์กลับ" หรือไม่
 */
export function canUserExecuteMission(
  booking?: BookingRequest | null,
  user?: User | null,
  allUsers?: User[]
): boolean {
  return getMissionPermissionDetails(booking, user, allUsers).canExecute;
}
