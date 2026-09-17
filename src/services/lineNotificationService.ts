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
// DEEP-LINKING & URL BUILDERS
// =========================================================================

/**
 * ดึง Base URL ของแอปพลิเคชันสำหรับสร้างลิงก์เปิดดูใน LINE
 * โดยลำดับความสำคัญ: การตั้งค่าในระบบ -> window.location.origin -> ค่าเริ่มต้น
 */
export const getAppBaseUrl = (): string => {
  const cfg = getGlobalLineConfig();
  if (cfg.appBaseUrl && cfg.appBaseUrl.trim()) {
    return cfg.appBaseUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://m-culture.go.th';
};

/**
 * สร้าง Deep Link URL ไปยังหน้าภารกิจงานคนขับ, ใบบันทึกคำขอ, หรือหน้าพิจารณาอนุมัติ
 */
export const getMissionUrl = (
  bookingId: string,
  action: 'open_mission' | 'view_memo' | 'director' = 'open_mission'
): string => {
  const baseUrl = getAppBaseUrl();
  const cleanId = encodeURIComponent(bookingId);
  if (action === 'open_mission') {
    return `${baseUrl}/?tab=driver_mission&bookingId=${cleanId}&action=open_mission`;
  }
  if (action === 'view_memo') {
    return `${baseUrl}/?tab=dashboard&bookingId=${cleanId}&action=view_memo`;
  }
  return `${baseUrl}/?tab=director&bookingId=${cleanId}`;
};

// =========================================================================
// MESSAGE FORMATTERS
// =========================================================================

export const formatNewBookingMessage = (booking: BookingRequest): string => {
  const driverText =
    booking.driverType === 'self'
      ? '🚗 ขอขับขี่ด้วยตนเอง'
      : `👔 ${booking.driverName || 'พนักงานขับรถประจำคัน'}`;

  const directorUrl = getMissionUrl(booking.id, 'director');
  const memoUrl = getMissionUrl(booking.id, 'view_memo');

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
    `⚡ ผู้อำนวยการสามารถเข้าสู่ระบบเพื่อพิจารณาอนุมัติคำขอ:`,
    `🔗 ${directorUrl}`,
    `📋 ดูใบคำขอ: ${memoUrl}`
  ].join('\n');
};

export const formatApprovedBookingMessage = (
  booking: BookingRequest,
  approverName: string = 'ผู้อำนวยการสำนักงานฯ'
): string => {
  const missionUrl = getMissionUrl(booking.id, 'open_mission');
  const memoUrl = getMissionUrl(booking.id, 'view_memo');

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
    `👉 สำหรับคนขับ/ผู้เดินทาง: กดเปิดภารกิจงานได้ทันที`,
    `🚗 เปิดภารกิจงานนี้: ${missionUrl}`,
    `📋 ดูใบบันทึกขอใช้รถยนต์: ${memoUrl}`,
    `━━━━━━━━━━━━━━`,
    `✨ ขอให้เดินทางโดยสวัสดิภาพ ปฏิบัติตามกฎจราจรและระเบียบราชการอย่างเคร่งครัด`
  ].join('\n');
};

export const formatRejectedBookingMessage = (
  booking: BookingRequest,
  reason: string = 'ไม่สะดวกอนุมัติในวันดังกล่าว'
): string => {
  const memoUrl = getMissionUrl(booking.id, 'view_memo');

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
    `📋 ตรวจสอบรายละเอียดคำขอ: ${memoUrl}`,
    `ℹ️ กรุณาตรวจสอบรายละเอียดและแก้ไขคำขอ หรือติดต่อประสานงานผู้ดูแลยานพาหนะ`
  ].join('\n');
};

export const formatMissionStartedMessage = (booking: BookingRequest): string => {
  const missionUrl = getMissionUrl(booking.id, 'open_mission');

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
    `🚗 ติดตามภารกิจ / สถานะการเดินทาง:`,
    `🔗 ${missionUrl}`,
    `━━━━━━━━━━━━━━`,
    `🛡️ ขอให้ภารกิจดำเนินไปด้วยความเรียบร้อยและปลอดภัย`
  ].join('\n');
};

export const formatMissionCompletedMessage = (booking: BookingRequest): string => {
  const start = Number(booking.startMileage || 0);
  const end = Number(booking.endMileage || 0);
  const dist = end > start ? end - start : 0;
  const missionUrl = getMissionUrl(booking.id, 'open_mission');
  const memoUrl = getMissionUrl(booking.id, 'view_memo');

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
    `🏁 ตรวจสอบบันทึกภารกิจและลงทะเบียนคุม:`,
    `🔗 ${missionUrl}`,
    `📋 ดูใบบันทึกขอใช้รถ: ${memoUrl}`,
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

export const checkServerLineStatus = async (): Promise<{
  configured: boolean;
  hasEnvToken?: boolean;
  hasSecret?: boolean;
  message: string;
}> => {
  try {
    const res = await fetch('/api/line/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[LINE] Server status query failed:', err);
  }
  return {
    configured: false,
    message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านเพื่อตรวจสอบ LINE ได้'
  };
};

export const createBookingFlexBubble = (
  booking: BookingRequest,
  eventType: LineEventType,
  title: string
): Record<string, unknown> => {
  let themeColor = '#C59A3F'; // Cultural Gold / Amber
  let badgeText = 'คำขอใช้รถยนต์ราชการ';
  let badgeColor = '#C59A3F';

  if (eventType === 'new_booking') {
    themeColor = '#EA580C'; // Orange
    badgeText = 'คำขอใหม่ รอพิจารณา';
    badgeColor = '#EA580C';
  } else if (eventType === 'booking_approved') {
    themeColor = '#059669'; // Emerald
    badgeText = 'อนุมัติแล้ว';
    badgeColor = '#059669';
  } else if (eventType === 'booking_rejected') {
    themeColor = '#E11D48'; // Rose
    badgeText = 'ส่งกลับ / ไม่อนุมัติ';
    badgeColor = '#E11D48';
  } else if (eventType === 'mission_started') {
    themeColor = '#2563EB'; // Blue
    badgeText = 'เริ่มออกเดินทางแล้ว';
    badgeColor = '#2563EB';
  } else if (eventType === 'mission_completed') {
    themeColor = '#0D9488'; // Teal
    badgeText = 'เสร็จสิ้นภารกิจ นำรถส่งคืน';
    badgeColor = '#0D9488';
  }

  const driverText =
    booking.driverType === 'self'
      ? 'ขอขับขี่ด้วยตนเอง'
      : (booking.driverName || 'พนักงานขับรถประจำคัน');

  // Build Action Buttons in Footer for Direct Navigation from LINE
  const missionUrl = getMissionUrl(booking.id, 'open_mission');
  const memoUrl = getMissionUrl(booking.id, 'view_memo');
  const directorUrl = getMissionUrl(booking.id, 'director');

  const footerContents: Array<Record<string, unknown>> = [];

  if (eventType === 'booking_approved') {
    footerContents.push(
      {
        type: 'button',
        style: 'primary',
        color: '#059669',
        height: 'sm',
        action: {
          type: 'uri',
          label: '🚗 เปิดภารกิจงานนี้ (คนขับ)',
          uri: missionUrl
        }
      },
      {
        type: 'button',
        style: 'secondary',
        height: 'sm',
        action: {
          type: 'uri',
          label: '📋 ดูใบบันทึกขอใช้รถ',
          uri: memoUrl
        }
      }
    );
  } else if (eventType === 'new_booking') {
    footerContents.push(
      {
        type: 'button',
        style: 'primary',
        color: '#EA580C',
        height: 'sm',
        action: {
          type: 'uri',
          label: '⚡ เปิดพิจารณาอนุมัติคำขอนี้',
          uri: directorUrl
        }
      },
      {
        type: 'button',
        style: 'secondary',
        height: 'sm',
        action: {
          type: 'uri',
          label: '📋 ดูรายละเอียดคำขอ',
          uri: memoUrl
        }
      }
    );
  } else if (eventType === 'mission_started') {
    footerContents.push(
      {
        type: 'button',
        style: 'primary',
        color: '#2563EB',
        height: 'sm',
        action: {
          type: 'uri',
          label: '🚗 ติดตามภารกิจ / ดูสถานะ',
          uri: missionUrl
        }
      },
      {
        type: 'button',
        style: 'secondary',
        height: 'sm',
        action: {
          type: 'uri',
          label: '📋 ดูใบบันทึกขอใช้รถ',
          uri: memoUrl
        }
      }
    );
  } else if (eventType === 'mission_completed') {
    footerContents.push(
      {
        type: 'button',
        style: 'primary',
        color: '#0D9488',
        height: 'sm',
        action: {
          type: 'uri',
          label: '🏁 ตรวจสอบบันทึกภารกิจ',
          uri: missionUrl
        }
      },
      {
        type: 'button',
        style: 'secondary',
        height: 'sm',
        action: {
          type: 'uri',
          label: '📋 ดูใบบันทึกขอใช้รถ',
          uri: memoUrl
        }
      }
    );
  } else {
    footerContents.push({
      type: 'button',
      style: 'secondary',
      height: 'sm',
      action: {
        type: 'uri',
        label: '📋 เปิดดูในระบบงานยานพาหนะ',
        uri: memoUrl
      }
    });
  }

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: themeColor,
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: '🏛️ สำนักงานวัฒนธรรมจังหวัดพังงา',
          color: '#FFFFFF',
          size: 'xs',
          weight: 'bold',
          opacity: 0.9
        },
        {
          type: 'text',
          text: title,
          color: '#FFFFFF',
          size: 'md',
          weight: 'bold',
          margin: 'sm',
          wrap: true
        }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: badgeText,
              color: badgeColor,
              size: 'xs',
              weight: 'bold',
              flex: 0
            },
            {
              type: 'text',
              text: `เลขที่ ${booking.id}`,
              color: '#94A3B8',
              size: 'xs',
              align: 'end'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'sm',
          color: '#F1F5F9'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '👤 ผู้ขอ:', color: '#64748B', size: 'xs', flex: 2 },
                { type: 'text', text: `${booking.name} (${booking.position})`, color: '#0F172A', size: 'xs', weight: 'bold', flex: 5, wrap: true }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '📍 ปลายทาง:', color: '#64748B', size: 'xs', flex: 2 },
                { type: 'text', text: `${booking.destination} (${booking.destAmphoe || ''} จ.${booking.destProvince || 'พังงา'})`, color: '#0F172A', size: 'xs', weight: 'bold', flex: 5, wrap: true }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '📅 วันที่:', color: '#64748B', size: 'xs', flex: 2 },
                { type: 'text', text: `${booking.date} (${booking.startTime || '08:30'} - ${booking.endTime || '16:30'} น.)`, color: '#334155', size: 'xs', flex: 5, wrap: true }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '🚗 รถยนต์:', color: '#64748B', size: 'xs', flex: 2 },
                { type: 'text', text: booking.carName, color: '#334155', size: 'xs', weight: 'bold', flex: 5, wrap: true }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '👔 ผู้ขับ:', color: '#64748B', size: 'xs', flex: 2 },
                { type: 'text', text: driverText, color: '#334155', size: 'xs', flex: 5, wrap: true }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '🎯 ภารกิจ:', color: '#64748B', size: 'xs', flex: 2 },
                { type: 'text', text: booking.purpose, color: '#475569', size: 'xs', flex: 5, wrap: true }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      spacing: 'sm',
      contents: footerContents
    }
  };
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
  const token = payload.token || globalConfig.channelAccessToken || '';

  // 1. Send via Backend Server (/api/line/send) -> LINE Messaging API or LINE Notify
  if ((lineUserId || token) && !globalConfig.simulationModeOnly) {
    try {
      const resp = await fetch('/api/line/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lineUserId,
          title: payload.title,
          message: payload.message,
          flex: payload.flex,
          token,
          eventType: payload.eventType,
          bookingId: payload.bookingId
        })
      });

      const data = await resp.json().catch(() => null);

      if (resp.ok && data?.success) {
        const log: LineNotificationLog = {
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          recipient: payload.recipientName,
          lineUserId: lineUserId || 'NOTIFY-TOKEN',
          title: payload.title,
          message: payload.message,
          status: 'success',
          mode: data.mode === 'line_notify' ? 'webhook' : 'messaging_api',
          eventType: payload.eventType,
          details: data.mode === 'line_notify' ? 'ส่งผ่าน LINE Notify สำเร็จ' : 'ส่งผ่าน LINE Messaging API Push สำเร็จ'
        };
        saveLineNotificationLog(log);
        return { success: true, mode: data.mode === 'line_notify' ? 'webhook' : 'messaging_api', message: 'ส่งผ่าน LINE สำเร็จ' };
      }

      const errorMsg = data?.message || data?.error || `HTTP ${resp.status}`;
      console.warn('[LINE] Server push notification error:', errorMsg);

      if (resp.status === 401 || data?.status === 401 || data?.error === 'unauthorized') {
        const log: LineNotificationLog = {
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          recipient: payload.recipientName,
          lineUserId: lineUserId || 'NOTIFY-TOKEN',
          title: payload.title,
          message: payload.message,
          status: 'failed',
          mode: 'messaging_api',
          eventType: payload.eventType,
          details: 'ข้อผิดพลาด Error 401 Unauthorized: LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ'
        };
        saveLineNotificationLog(log);
        return {
          success: false,
          mode: 'messaging_api',
          message: 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ (Error 401 Unauthorized) กรุณาตรวจสอบหรืออัปเดต Token ในเมนูตั้งค่า LINE'
        };
      }
    } catch (err) {
      console.warn('[LINE] Server notification request failed:', err);
    }
  }

  // 2. Check if Webhook URL provided (Custom Webhook / Google Apps Script proxy)
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
          flex: payload.flex,
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

  // 3. Fallback to simulation mode only when the server is unavailable or simulation is enabled.
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
    bookingId: payload.bookingId,
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
  const flex = createBookingFlexBubble(booking, 'new_booking', 'มีคำขอใช้รถยนต์ราชการใหม่');
  let count = 0;

  for (const user of recipients) {
    await sendLineNotification({
      recipientUserId: user.id,
      recipientName: user.name,
      lineUserId: user.lineUserId,
      token: user.lineNotifyToken,
      title: 'มีคำขอใช้รถยนต์ราชการใหม่',
      message,
      flex,
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
  const flex = createBookingFlexBubble(booking, 'booking_approved', 'คำขอใช้รถยนต์ได้รับการอนุมัติแล้ว');
  let count = 0;

  for (const user of recipients) {
    await sendLineNotification({
      recipientUserId: user.id,
      recipientName: user.name,
      lineUserId: user.lineUserId,
      token: user.lineNotifyToken,
      title: 'คำขอใช้รถยนต์ได้รับการอนุมัติแล้ว',
      message,
      flex,
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
  const flex = createBookingFlexBubble(booking, 'booking_rejected', 'คำขอใช้รถยนต์ไม่ได้รับการอนุมัติ');
  await sendLineNotification({
    recipientUserId: requester.id,
    recipientName: requester.name,
    lineUserId: requester.lineUserId,
    token: requester.lineNotifyToken,
    title: 'คำขอใช้รถยนต์ไม่ได้รับการอนุมัติ',
    message,
    flex,
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
  const flex = createBookingFlexBubble(booking, 'mission_started', 'พนักงานขับรถเริ่มออกเดินทางแล้ว');
  await sendLineNotification({
    recipientUserId: requester.id,
    recipientName: requester.name,
    lineUserId: requester.lineUserId,
    token: requester.lineNotifyToken,
    title: 'พนักงานขับรถเริ่มออกเดินทางแล้ว',
    message,
    flex,
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
  const flex = createBookingFlexBubble(booking, 'mission_completed', 'ภารกิจสิ้นสุดและส่งคืนรถเรียบร้อยแล้ว');
  await sendLineNotification({
    recipientUserId: requester.id,
    recipientName: requester.name,
    lineUserId: requester.lineUserId,
    token: requester.lineNotifyToken,
    title: 'ภารกิจสิ้นสุดและส่งคืนรถเรียบร้อยแล้ว',
    message,
    flex,
    eventType: 'mission_completed',
    bookingId: booking.id
  });

  return true;
};

/**
 * ส่งการแจ้งเตือนมอบหมายภารกิจไปยังพนักงานขับรถโดยเฉพาะ
 * พร้อมปุ่มเปิดดูภารกิจงานในแอปพลิเคชันได้โดยตรง
 */
export const notifyMissionToDriver = async (
  booking: BookingRequest,
  allUsers: User[],
  customNote?: string
): Promise<{ success: boolean; recipientName: string; message: string }> => {
  const driver = findDriver(booking, allUsers);
  const targetDriverName = driver?.name || booking.driverName || 'พนักงานขับรถ';
  const targetLineUserId = driver?.lineUserId || '';
  const targetToken = driver?.lineNotifyToken;

  const title = `มอบหมายภารกิจงานขับรถ: ${booking.carName}`;
  const missionUrl = getMissionUrl(booking.id, 'open_mission');
  const memoUrl = getMissionUrl(booking.id, 'view_memo');

  const textLines = [
    `🚗 มอบหมายภารกิจงานขับรถราชการ`,
    `━━━━━━━━━━━━━━`,
    `🔖 เลขที่คำขอ: ${booking.id}`,
    `📑 เลขที่หนังสือ: ${booking.memoNo || '-'}`,
    `🚗 รถยนต์: ${booking.carName}`,
    `👔 พนักงานขับรถ: ${targetDriverName}`,
    `👤 ผู้เดินทาง: ${booking.name} (${booking.position})`,
    `🏢 สังกัด: ${booking.department}`,
    `📍 จุดหมาย: ${booking.destination} (${booking.destAmphoe || ''} จ.${booking.destProvince || 'พังงา'})`,
    `📅 วันที่: ${booking.date}${booking.endDate && booking.endDate !== booking.date ? ` ถึง ${booking.endDate}` : ''}`,
    `⏰ เวลา: ${booking.startTime || '08:30'} - ${booking.endTime || '16:30'} น.`,
    `🎯 ภารกิจ: ${booking.purpose}`,
    customNote ? `💬 หมายเหตุ: "${customNote}"` : '',
    `━━━━━━━━━━━━━━`,
    `👉 พนักงานขับรถกดเปิดภารกิจเพื่อเริ่มเดินทางและบันทึกเลขไมล์:`,
    `🚗 เปิดภารกิจงานนี้: ${missionUrl}`,
    `📋 ดูใบบันทึกขอใช้รถยนต์: ${memoUrl}`,
    `━━━━━━━━━━━━━━`,
    `✨ สำนักงานวัฒนธรรมจังหวัดพังงา`
  ].filter(Boolean).join('\n');

  const flex = createBookingFlexBubble(booking, 'booking_approved', title);

  const res = await sendLineNotification({
    recipientUserId: driver?.id,
    recipientName: targetDriverName,
    lineUserId: targetLineUserId,
    token: targetToken,
    title,
    message: textLines,
    flex,
    eventType: 'booking_approved',
    bookingId: booking.id
  });

  return {
    success: res.success,
    recipientName: targetDriverName,
    message: res.message
  };
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
