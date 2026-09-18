import { BookingRequest, User } from '../types';

export const APPROVER_ROLE: User['role'] = 'director';
export const ASSET_OFFICER_ROLE: User['role'] = 'officer';

export function isApproverRole(role: User['role'] | string | undefined): boolean {
  return role === APPROVER_ROLE;
}

export function isAssetOfficerRole(role: User['role'] | string | undefined): boolean {
  return role === ASSET_OFFICER_ROLE;
}

export function isSelfDriveBooking(booking: BookingRequest): boolean {
  return booking.driverType === 'self';
}

export function isThaiNameMatch(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const clean = (s: string) => s.replace(/\s+/g, '').replace(/^(นาย|นาง|นางสาว|น\.ส\.|ดร\.)/g, '');
  return clean(name1) === clean(name2);
}

export function canUserExecuteMission(
  booking: BookingRequest,
  currentUser: User | null,
  allUsers?: User[]
): boolean {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  
  if (isSelfDriveBooking(booking)) {
    if (booking.userId === currentUser.id || booking.username === currentUser.username) return true;
    if (isThaiNameMatch(booking.name, currentUser.name)) return true;
  } else {
    if (booking.driverId === currentUser.id || booking.driverUsername === currentUser.username) return true;
    if (isThaiNameMatch(booking.driverName, currentUser.name)) return true;
  }

  // Check co-driver / assistant driver (เจ้าหน้าที่ในกลุ่มที่มาช่วยขับ)
  if (booking.secondaryDriverName) {
    if (booking.secondaryDriverId === currentUser.id || booking.secondaryDriverUsername === currentUser.username) return true;
    if (isThaiNameMatch(booking.secondaryDriverName, currentUser.name)) return true;
  }
  
  return false;
}

export function getMissionPermissionDetails(
  booking: BookingRequest,
  currentUser: User | null,
  allUsers?: User[]
): {
  canExecute: boolean;
  driverDisplayName: string;
  reason?: string;
  isSelfDrive: boolean;
} {
  const isSelfDrive = isSelfDriveBooking(booking);
  let driverDisplayName = isSelfDrive ? booking.name : booking.driverName;
  if (booking.secondaryDriverName) {
    driverDisplayName += ` (และผู้ช่วยขับ: ${booking.secondaryDriverName})`;
  }
  const canExecute = canUserExecuteMission(booking, currentUser, allUsers);
  let reason: string | undefined = undefined;
  
  if (!canExecute) {
    const assistantNote = booking.secondaryDriverName ? ` หรือผู้ช่วยขับ (${booking.secondaryDriverName})` : '';
    if (isSelfDrive) {
      reason = `สงวนสิทธิ์เฉพาะผู้ขอใช้รถที่ระบุขับขี่เอง (${booking.name})${assistantNote} เท่านั้น`;
    } else {
      reason = `สงวนสิทธิ์เฉพาะพนักงานขับรถที่ได้รับมอบหมาย (${booking.driverName})${assistantNote} เท่านั้น`;
    }
  }
  
  return {
    canExecute,
    driverDisplayName,
    reason,
    isSelfDrive
  };
}

export function canUserApproveBooking(currentUser: User | null | undefined): boolean {
  if (!currentUser) return false;
  // ปุ่มอนุมัติ: สิทธิ์เฉพาะ "ผู้อนุมัติ" (role = director) เท่านั้น — admin/officer/driver กดไม่ได้
  return isApproverRole(currentUser.role);
}

export function canUserInspectAsset(currentUser: User | null | undefined): boolean {
  if (!currentUser) return false;
  // ปุ่มตรวจรับพัสดุ: สิทธิ์เฉพาะ "เจ้าหน้าที่พัสดุ" (role = officer) เท่านั้น — admin/director/driver กดไม่ได้
  return isAssetOfficerRole(currentUser.role);
}

export function checkVehicleMissionConflict(
  carId: string,
  currentBookingId: string,
  allBookings: BookingRequest[]
): { hasConflict: boolean; conflictingBooking?: BookingRequest } {
  const conflictingBooking = allBookings.find(
    (b) => b.carId === carId && b.id !== currentBookingId && b.status === 'in_progress'
  );
  
  return {
    hasConflict: !!conflictingBooking,
    conflictingBooking
  };
}

export function validateCanStartMission(
  booking: BookingRequest,
  currentUser: User | null,
  allBookings: BookingRequest[],
  allUsers?: User[]
): { canStart: boolean; reason?: string } {
  if (booking.status !== 'approved') {
    return { canStart: false, reason: 'คำขอนี้ยังไม่ได้รับการอนุมัติจากผู้บริหาร' };
  }
  
  if (!canUserExecuteMission(booking, currentUser, allUsers)) {
    const isSelfDrive = isSelfDriveBooking(booking);
    const expectedName = isSelfDrive ? booking.name : booking.driverName;
    const secondaryNote = booking.secondaryDriverName ? ` หรือผู้ช่วยขับ (${booking.secondaryDriverName})` : '';
    return {
      canStart: false,
      reason: `ท่านไม่มีสิทธิ์ขับรถในคำขอนี้ (ระบุให้ ${expectedName}${secondaryNote} เป็นผู้ขับขี่)`
    };
  }
  
  if (booking.carId) {
    const conflict = checkVehicleMissionConflict(booking.carId, booking.id, allBookings);
    if (conflict.hasConflict) {
      return {
        canStart: false,
        reason: `ยานพาหนะนี้กำลังอยู่ในภารกิจอื่น (${conflict.conflictingBooking?.memoNo || conflict.conflictingBooking?.id}) และยังไม่ได้แจ้งจบงาน`
      };
    }
  }
  
  return { canStart: true };
}

export function validateMissionMileage(
  startMile: number,
  endMile: number
): { isValid: boolean; error?: string; totalDistance: number } {
  if (isNaN(endMile) || endMile <= 0) {
    return { isValid: false, error: 'กรุณากรอกเลขไมล์เมื่อกลับถึงที่ถูกต้อง', totalDistance: 0 };
  }
  if (endMile <= startMile) {
    return {
      isValid: false,
      error: `เลขไมล์ตอนกลับ (${endMile.toLocaleString()}) ต้องมากกว่าเลขไมล์ตอนออกเดินทาง (${startMile.toLocaleString()})`,
      totalDistance: 0
    };
  }
  return { isValid: true, totalDistance: endMile - startMile };
}
