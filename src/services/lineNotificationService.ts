import {
  BookingRequest,
  User,
  LineEventType,
  LineNotificationPayload,
  LineNotificationLog,
  GlobalLineConfig
} from '../types';

const STORAGE_KEYS = {
  LINE_LOGS: 'mculture_line_logs_v1',
  GLOBAL_CONFIG: 'mculture_line_config_v1'
};

const DEFAULT_GLOBAL_CONFIG: GlobalLineConfig = {
  channelAccessToken: '',
  channelSecret: '',
  webhookUrl: '',
  notifyToken: '',
  defaultEnabled: true,
  simulationModeOnly: false
};

// =========================================================================
// CONFIG & STORAGE HELPERS
// =========================================================================

export const getGlobalLineConfig = (): GlobalLineConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GLOBAL_CONFIG);
    if (!raw) return DEFAULT_GLOBAL_CONFIG;
    return { ...DEFAULT_GLOBAL_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('[LINE] Error reading global config:', err);
    return DEFAULT_GLOBAL_CONFIG;
  }
};

export const saveGlobalLineConfig = (config: GlobalLineConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('[LINE] Error saving global config:', err);
  }
};

export const getLineNotificationLogs = (): LineNotificationLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINE_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[LINE] Error reading logs:', err);
    return [];
  }
};

export const saveLineNotificationLog = (log: LineNotificationLog): void => {
  try {
    const current = getLineNotificationLogs();
    const updated = [log, ...current].slice(0, 100); // เก็บประวัติ 100 รายการล่าสุด
    localStorage.setItem(STORAGE_KEYS.LINE_LOGS, JSON.stringify(updated));

    // Dispatch event to notify UI components (e.g. LineSimulatorModal, Header)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('line-notification-dispatched', {
          detail: log
        })
      );
    }
  } catch (err) {
    console.warn('[LINE] Error saving log:', err);
  }
};

export const clearLineNotificationLogs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.LINE_LOGS);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('line-notification-dispatched'));
    }
  } catch (err) {
    console.warn('[LINE] Error clearing logs:', err);
  }
};

// =========================================================================
// MESSAGE FORMATTERS
// =========================================================================

export const formatNewBookingMessage = (booking: BookingRequest): string => {
  const driverText =
    booking.driverType === 'self'
      ? '🚗 ขอขับขี่ด้วยตนเอง'
      : `👔 ${booking.driverName || 'พนักงานขับรถประจำคัน'}`;

  return [
    `📢 มีคำขอใช้รถยนต์ราชการใหม่!`,
    `━━━━━━━━━━━━━━`,
    `🔖 เลขที่คำขอ: ${booking.id}`,
    `📑 เลขที่หนังสือ: ${booking.memoNo || 'อยู่ระหว่างออกเลข'}`,
    `👤 ผู้ขอ: ${booking.name} (${booking.position})`,
    `🏢 สังกัด: ${booking.department}`,
    `📅 วันที่เดินทาง: ${booking.date}${booking.endDate && booking.endDate !== booking.date ? ` ถึง ${booking.endDate}` : ''}`,
    `⏰ เวลา: ${booking.startTime || '08:30'} - ${booking.endTime || '16:30'} น.`,
    `📍 ปลายทาง: ${booking.destination} (${booking.destAmphoe || ''} จ.${booking.destProvince || 'พังงา'})`,
    `🎯 วัตถุประสงค์: ${booking.purpose}`,
    `🚗 รถยนต์: ${booking.carName}`,
    `👔 ผู้ขับ: ${driverText}`,
    `━━━━━━━━━━━━━━`,
    `⚡ ผู้อำนวยการสามารถเข้าสู่ระบบเพื่อพิจารณาอนุมัติคำขอ`
  ].join('\n');
};

export const formatApprovedBookingMessage = (
  booking: BookingRequest,
  approverName: string = 'ผู้อำนวยการสำนักงานฯ'
): string => {
  return [
    `✅ คำขอใช้รถยนต์ได้รับการอนุมัติแล้ว!`,
    `━━━━━━━━━━━━━━`,
    `🔖 เลขที่คำขอ: ${booking.id}`,
    `📑 เลขที่หนังสือ: ${booking.memoNo || '-'}`,
    `👤 ผู้ขอใช้รถ: ${booking.name}`,
    `🚗 รถยนต์: ${booking.carName}`,
    `📅 วันที่เดินทาง: ${booking.date} (${booking.startTime || '08:30'} - ${booking.endTime || '16:30'} น.)`,
    `📍 ปลายทาง: ${booking.destination}`,
    `👔 ผู้ขับ: ${booking.driverName || (booking.driverType === 'self' ? 'ผู้ขอขับขี่ด้วยตนเอง' : 'พนักงานขับรถ')}`,
    `✍️ อนุมัติโดย: ${approverName}`,
    `💬 ความเห็น: "${booking.directorComment || 'อนุมัติ ให้เดินทางโดยสวัสดิภาพและปฏิบัติตามระเบียบราชการ'}"`,
    `━━━━━━━━━━━━━━`,
    `✨ ขอให้เดินทางโดยสวัสดิภาพ ปฏิบัติตามกฎจราจรและระเบียบราชการอย่างเคร่งครัด`
  ].join('\n');
};

export const formatRejectedBookingMessage = (
  booking: BookingRequest,
  reason: string = 'ไม่สะดวกอนุมัติในวันดังกล่าว'
): string => {
  return [
    `❌ คำขอใช้รถยนต์ส่งกลับ / ไม่อนุมัติ`,
    `━━━━━━━━━━━━━━`,
    `🔖 เลขที่คำขอ: ${booking.id}`,
    `👤 ผู้ขอใช้รถ: ${booking.name}`,
    `🚗 รถยนต์ที่ขอ: ${booking.carName}`,
    `📅 วันที่ขอใช้: ${booking.date}`,
    `📍 ปลายทาง: ${booking.destination}`,
    `💬 ความเห็น/เหตุผลส่งกลับ: "${reason}"`,
    `━━━━━━━━━━━━━━`,
    `ℹ️ กรุณาตรวจสอบรายละเอียดและแก้ไขคำขอ หรือติดต่อประสานงานผู้ดูแลยานพาหนะ`
  ].join('\n');
};

export const formatMissionStartedMessage = (booking: BookingRequest): string => {
  return [
    `🚗 พนักงานขับรถเริ่มออกเดินทางแล้ว!`,
    `━━━━━━━━━━━━━━`,
    `🔖 เลขที่คำขอ: ${booking.id}`,
    `🚗 รถยนต์: ${booking.carName}`,
    `👔 ผู้ขับ: ${booking.driverName}`,
    `👤 ผู้เดินทาง: ${booking.name}`,
    `📍 ปลายทาง: ${booking.destination}`,
    `🔢 เลขไมล์เริ่มต้น: ${booking.startMileage ? Number(booking.startMileage).toLocaleString() : '-'} กม.`,
    `⏰ เวลาเริ่มเดินทาง: ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`,
    `━━━━━━━━━━━━━━`,
    `🛡️ ขอให้ภารกิจดำเนินไปด้วยความเรียบร้อยและปลอดภัย`
  ].join('\n');
};

export const formatMissionCompletedMessage = (booking: BookingRequest): string => {
  const start = Number(booking.startMileage || 0);
  const end = Number(booking.endMileage || 0);
  const dist = end > start ? end - start : 0;

  return [
    `🏁 ภารกิจเสร็จสิ้น นำรถส่งคืนเรียบร้อยแล้ว`,
    `━━━━━━━━━━━━━━`,
    `🔖 เลขที่คำขอ: ${booking.id}`,
    `🚗 รถยนต์: ${booking.carName}`,
    `👤 ผู้เดินทาง: ${booking.name}`,
    `📍 ปลายทาง: ${booking.destination}`,
    `🔢 เลขไมล์สิ้นสุด: ${end > 0 ? end.toLocaleString() : '-'} กม.`,
    `📏 รวมระยะทางทั้งสิ้น: ${dist.toLocaleString()} กิโลเมตร`,
    `━━━━━━━━━━━━━━`,
    `✨ รถยนต์พร้อมสำหรับภารกิจราชการต่อไป`
  ].join('\n');
};

export const formatTestMessage = (user: User): string => {
  return [
    `🔔 ทดสอบการแจ้งเตือน LINE Notification`,
    `━━━━━━━━━━━━━━`,
    `🏛️ ระบบเบิกใช้งานรถยนต์ราชการ - สำนักงานวัฒนธรรมจังหวัดพังงา`,
    `👤 ผู้รับ: ${user.name} (@${user.username})`,
    `🏢 ตำแหน่ง: ${user.position}`,
    `📌 สังกัด: ${user.department}`,
    `🆔 LINE User ID: ${user.lineUserId || 'ไม่ได้ระบุ (รันผ่าน Simulator Mode)'}`,
    `⏰ เวลาทดสอบ: ${new Date().toLocaleString('th-TH')}`,
    `━━━━━━━━━━━━━━`,
    `✅ ระบบเชื่อมต่อการแจ้งเตือน LINE พร้อมทำงานแล้ว!`
  ].join('\n');
};

// =========================================================================
// SEND NOTIFICATION ENGINE
// =========================================================================

export const sendLineNotification = async (
  payload: LineNotificationPayload
): Promise<{ success: boolean; mode: LineNotificationLog['mode']; message: string }> => {
  const globalConfig = getGlobalLineConfig();
  const timestamp = new Date().toISOString();
  const lineUserId = payload.lineUserId || '';
  const webhookUrl = globalConfig.webhookUrl || '';

  // The access token must stay on the server. The browser calls the same-origin
  // Vercel function, which then calls LINE Messaging API securely.
  if (lineUserId && !globalConfig.simulationModeOnly) {
    try {
      const resp = await fetch('/api/line/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lineUserId,
          title: payload.title,
          message: payload.message,
          eventType: payload.eventType,
          bookingId: payload.bookingId
        })
      });

      if (resp.ok) {
        const log: LineNotificationLog = {
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          recipient: payload.recipientName,
          lineUserId,
          title: payload.title,
          message: payload.message,
          status: 'success',
          mode: 'messaging_api',
          eventType: payload.eventType,
          details: 'ส่งผ่าน Vercel Serverless Function และ LINE Messaging API สำเร็จ'
        };
        saveLineNotificationLog(log);
        return { success: true, mode: 'messaging_api', message: 'ส่งผ่าน LINE Messaging API สำเร็จ' };
      }

      const errorDetail = await resp.text().catch(() => '');
      console.warn('[LINE] Server notification failed:', resp.status, errorDetail);
    } catch (err) {
      console.warn('[LINE] Server notification request failed:', err);
    }
  }

  // 1. Check if Webhook URL provided (Custom Webhook / Google Apps Script proxy)
  if (webhookUrl && !globalConfig.simulationModeOnly) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lineUserId,
          recipient: payload.recipientName,
          title: payload.title,
          message: payload.message,
          eventType: payload.eventType,
          bookingId: payload.bookingId,
          timestamp
        })
      });

      if (resp.ok) {
        const log: LineNotificationLog = {
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          recipient: payload.recipientName,
          lineUserId,
          title: payload.title,
          message: payload.message,
          status: 'success',
          mode: 'webhook',
          eventType: payload.eventType,
          details: `ส่งผ่าน Webhook สำเร็จ (${webhookUrl})`
        };
        saveLineNotificationLog(log);
        return { success: true, mode: 'webhook', message: 'ส่งผ่าน Webhook สำเร็จ' };
      }
    } catch (err) {
      console.warn('[LINE] Webhook dispatch error, falling back to simulator:', err);
    }
  }

  // Fallback to simulation mode only when the server is unavailable or simulation is enabled.
  const log: LineNotificationLog = {
    id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    recipient: payload.recipientName,
    lineUserId: lineUserId || 'SIMULATED-USER',
    title: payload.title,
    message: payload.message,
    status: 'simulated',
    mode: 'simulation',
    eventType: payload.eventType,
    details: lineUserId
      ? `จำลองการส่งถึง ${payload.recipientName} (ID: ${lineUserId})`
      : `จำลองการส่ง (ผู้ใช้ยังไม่ได้ระบุ LINE User ID)`
  };
  saveLineNotificationLog(log);

  return {
    success: true,
    mode: 'simulation',
    message: `บันทึกและจำลองการส่งข้อความ LINE ถึง ${payload.recipientName} สำเร็จ`
  };
};

// =========================================================================
// HIGH LEVEL WORKFLOW DISPATCHERS
// =========================================================================

const findBookingUser = (
  booking: BookingRequest,
  allUsers: User[],
  userId: string | undefined,
  username: string | undefined,
  name: string | undefined
): User | undefined => {
  if (userId) {
    const userById = allUsers.find((user) => user.id === userId);
    if (userById) return userById;
  }
  if (username) {
    const userByUsername = allUsers.find((user) => user.username === username);
    if (userByUsername) return userByUsername;
  }
  return name ? allUsers.find((user) => user.name === name) : undefined;
};

const findRequester = (booking: BookingRequest, allUsers: User[]): User | undefined =>
  findBookingUser(booking, allUsers, booking.userId, booking.username, booking.name);

const findDriver = (booking: BookingRequest, allUsers: User[]): User | undefined =>
  findBookingUser(booking, allUsers, booking.driverId, booking.driverUsername, booking.driverName);

/**
 * แจ้งเตือนเมื่อมีคำขอใหม่: ส่งหา ผอ. และ Admin
 */
export const notifyNewBooking = async (
  booking: BookingRequest,
  allUsers: User[]
): Promise<number> => {
  const recipients = allUsers.filter(
    (u) =>
      (u.role === 'director' || u.role === 'admin') &&
      u.status !== 'inactive' &&
      u.lineNotificationEnabled !== false
  );

  const message = formatNewBookingMessage(booking);
  let count = 0;

  for (const user of recipients) {
    await sendLineNotification({
      recipientUserId: user.id,
      recipientName: user.name,
      lineUserId: user.lineUserId,
      token: user.lineNotifyToken,
      title: 'มีคำขอใช้รถยนต์ราชการใหม่',
      message,
      eventType: 'new_booking',
      bookingId: booking.id
    });
    count++;
  }

  return count;
};

/**
 * แจ้งเตือนเมื่อ ผอ. อนุมัติคำขอ: ส่งหา ผู้ขอใช้รถ และ พนักงานขับรถ
 */
export const notifyBookingApproved = async (
  booking: BookingRequest,
  allUsers: User[],
  approverName: string = 'ผู้อำนวยการสำนักงานฯ'
): Promise<number> => {
  const recipients: User[] = [];

  // ผู้ขอ
  const requester = findRequester(booking, allUsers);
  if (requester && requester.lineNotificationEnabled !== false) {
    recipients.push(requester);
  }

  // พนักงานขับรถ (ถ้ามอบหมายและไม่ใช่คนเดียวกับผู้ขอ)
  if (booking.driverType === 'driver') {
    const driver = findDriver(booking, allUsers);
    if (driver && driver.id !== requester?.id && driver.lineNotificationEnabled !== false) {
      recipients.push(driver);
    }
  }

  const message = formatApprovedBookingMessage(booking, approverName);
  let count = 0;

  for (const user of recipients) {
    await sendLineNotification({
      recipientUserId: user.id,
      recipientName: user.name,
      lineUserId: user.lineUserId,
      token: user.lineNotifyToken,
      title: 'คำขอใช้รถยนต์ได้รับการอนุมัติแล้ว',
      message,
      eventType: 'booking_approved',
      bookingId: booking.id
    });
    count++;
  }

  return count;
};

/**
 * แจ้งเตือนเมื่อคำขอถูกส่งกลับ / ไม่อนุมัติ: ส่งหาผู้ขอ
 */
export const notifyBookingRejected = async (
  booking: BookingRequest,
  allUsers: User[],
  reason: string
): Promise<boolean> => {
  const requester = findRequester(booking, allUsers);

  if (!requester || requester.lineNotificationEnabled === false) return false;

  const message = formatRejectedBookingMessage(booking, reason);
  await sendLineNotification({
    recipientUserId: requester.id,
    recipientName: requester.name,
    lineUserId: requester.lineUserId,
    token: requester.lineNotifyToken,
    title: 'คำขอใช้รถยนต์ไม่ได้รับการอนุมัติ',
    message,
    eventType: 'booking_rejected',
    bookingId: booking.id
  });

  return true;
};

/**
 * แจ้งเตือนเมื่อคนขับเริ่มออกเดินทาง: ส่งหาผู้ขอ
 */
export const notifyMissionStarted = async (
  booking: BookingRequest,
  allUsers: User[]
): Promise<boolean> => {
  const requester = findRequester(booking, allUsers);

  if (!requester || requester.lineNotificationEnabled === false) return false;

  const message = formatMissionStartedMessage(booking);
  await sendLineNotification({
    recipientUserId: requester.id,
    recipientName: requester.name,
    lineUserId: requester.lineUserId,
    token: requester.lineNotifyToken,
    title: 'พนักงานขับรถเริ่มออกเดินทางแล้ว',
    message,
    eventType: 'mission_started',
    bookingId: booking.id
  });

  return true;
};

/**
 * แจ้งเตือนเมื่อภารกิจสิ้นสุด: ส่งหาผู้ขอ
 */
export const notifyMissionCompleted = async (
  booking: BookingRequest,
  allUsers: User[]
): Promise<boolean> => {
  const requester = findRequester(booking, allUsers);

  if (!requester || requester.lineNotificationEnabled === false) return false;

  const message = formatMissionCompletedMessage(booking);
  await sendLineNotification({
    recipientUserId: requester.id,
    recipientName: requester.name,
    lineUserId: requester.lineUserId,
    token: requester.lineNotifyToken,
    title: 'ภารกิจสิ้นสุดและส่งคืนรถเรียบร้อยแล้ว',
    message,
    eventType: 'mission_completed',
    bookingId: booking.id
  });

  return true;
};

/**
 * ส่งข้อความทดสอบไปยังผู้ใช้ที่ระบุ
 */
export const sendTestNotification = async (
  user: User
): Promise<{ success: boolean; mode: LineNotificationLog['mode']; message: string }> => {
  const message = formatTestMessage(user);
  return await sendLineNotification({
    recipientUserId: user.id,
    recipientName: user.name,
    lineUserId: user.lineUserId,
    token: user.lineNotifyToken,
    title: 'ทดสอบการแจ้งเตือน LINE',
    message,
    eventType: 'test'
  });
};
