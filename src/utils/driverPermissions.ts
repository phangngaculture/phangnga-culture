import { BookingRequest, User } from '../types';

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
  const driverDisplayName = isSelfDrive ? booking.name : booking.driverName;
  const canExecute = canUserExecuteMission(booking, currentUser, allUsers);
  let reason: string | undefined = undefined;
  
  if (!canExecute) {
    if (isSelfDrive) {
      reason = `สงวนสิทธิ์เฉพาะผู้ขอใช้รถที่ระบุขับขี่เอง (${booking.name}) เท่านั้น`;
    } else {
      reason = `สงวนสิทธิ์เฉพาะพนักงานขับรถที่ได้รับมอบหมาย (${booking.driverName}) เท่านั้น`;
    }
  }
  
  return {
    canExecute,
    driverDisplayName,
    reason,
    isSelfDrive
  };
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
    return {
      canStart: false,
      reason: `ท่านไม่มีสิทธิ์ขับรถในคำขอนี้ (ระบุให้ ${expectedName} เป็นผู้ขับขี่)`
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
