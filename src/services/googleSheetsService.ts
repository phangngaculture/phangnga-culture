import { BookingRequest, FuelLog, MaintenanceRecord } from '../types';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  name: string;
  lastSyncedAt?: string;
}

const DEFAULT_SHEET_NAME = 'ระบบบริหารรถยนต์ราชการ สวจ.พังงา';

const BOOKING_HEADERS = [
  'รหัสคำขอ',
  'วันที่ยื่นขอ',
  'เลขที่ใบคำขอขอใช้รถยนต์ส่วนกลาง',
  'ผู้ขอใช้รถ',
  'ตำแหน่ง',
  'ฝ่าย/กลุ่มงาน',
  'วัตถุประสงค์การเดินทาง',
  'สถานที่ปลายทาง',
  'จังหวัดปลายทาง',
  'ทะเบียนรถราชการ',
  'พนักงานขับรถ/ผู้ควบคุม',
  'วันที่เริ่มเดินทาง',
  'วันที่สิ้นสุด',
  'ช่วงเวลา (ไป - กลับ)',
  'จำนวนผู้โดยสาร (คน)',
  'รายชื่อผู้ร่วมเดินทาง',
  'สถานะคำขอ',
  'วันที่อนุมัติ/สั่งการ'
];

const FUEL_HEADERS = [
  'รหัสรายการ',
  'วันที่บันทึก',
  'ทะเบียนรถ',
  'ผู้บันทึก/พนักงานขับรถ',
  'ระยะทางวิ่ง (กม.)',
  'จำนวนลิตร',
  'ยอดเงินรวม (บาท)',
  'เลขไมล์สิ้นสุด',
  'ปั๊มน้ำมัน',
  'เลขที่ใบเสร็จ'
];

const MAINTENANCE_HEADERS = [
  'รหัสงานบำรุงรักษา',
  'วันที่เข้าบริการ',
  'ทะเบียนรถ',
  'ชื่องานซ่อมบำรุง/บริการ',
  'ประเภทบริการ',
  'เลขไมล์ขณะเข้าบริการ',
  'ค่าใช้จ่ายรวม (บาท)',
  'ศูนย์บริการ / อู่ซ่อม',
  'เลขที่ใบแจ้งหนี้/ใบเสร็จ',
  'สถานะงาน',
  'กำหนดรอบตรวจเช็คถัดไป'
];

// Helper to translate booking status
const translateStatus = (status: BookingRequest['status']) => {
  switch (status) {
    case 'approved':
      return 'อนุมัติแล้ว';
    case 'pending':
      return 'รออนุมัติ';
    case 'rejected':
      return 'ไม่อนุมัติ';
    case 'completed':
      return 'เสร็จสิ้นภารกิจ';
    default:
      return status;
  }
};

/**
 * Find existing spreadsheet on Google Drive or create a new one
 */
export const findOrCreateSpreadsheet = async (accessToken: string): Promise<SpreadsheetInfo> => {
  try {
    // 1. Search for existing file on Google Drive
    const query = encodeURIComponent(
      `name = '${DEFAULT_SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const driveSearchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

    const searchRes = await fetch(driveSearchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        return {
          spreadsheetId: found.id,
          spreadsheetUrl:
            found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}/edit`,
          name: found.name
        };
      }
    }

    // 2. If not found, create a new spreadsheet with 3 tabs
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const createBody = {
      properties: {
        title: DEFAULT_SHEET_NAME
      },
      sheets: [
        {
          properties: {
            title: 'คำขอใช้รถยนต์',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'บันทึกการใช้น้ำมัน',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'บำรุงรักษาและงานทะเบียน',
            gridProperties: { frozenRowCount: 1 }
          }
        }
      ]
    };

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createBody)
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`สร้าง Google Sheets ไม่สำเร็จ: ${errText}`);
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return {
      spreadsheetId,
      spreadsheetUrl,
      name: DEFAULT_SHEET_NAME
    };
  } catch (error: any) {
    console.error('findOrCreateSpreadsheet error:', error);
    throw error;
  }
};

/**
 * Ensure sheet tab exists; if not, add it
 */
const ensureSheetTab = async (accessToken: string, spreadsheetId: string, sheetTitle: string) => {
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) return;

    const meta = await metaRes.json();
    const exists = meta.sheets?.some((s: any) => s.properties?.title === sheetTitle);

    if (!exists) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                  gridProperties: { frozenRowCount: 1 }
                }
              }
            }
          ]
        })
      });
    }
  } catch (e) {
    console.warn('ensureSheetTab error (non-fatal):', e);
  }
};

/**
 * Sync Bookings to Google Sheets
 */
export const syncBookings = async (
  accessToken: string,
  spreadsheetId: string,
  bookings: BookingRequest[]
): Promise<void> => {
  await ensureSheetTab(accessToken, spreadsheetId, 'คำขอใช้รถยนต์');

  const rows: (string | number)[][] = [
    BOOKING_HEADERS,
    ...bookings.map((b) => [
      b.id,
      b.createdAt ? b.createdAt.substring(0, 10) : b.date,
      b.memoNo,
      b.name,
      b.position,
      b.department,
      b.purpose,
      b.destination,
      b.destProvince || 'พังงา',
      b.carName,
      b.driverType === 'self' ? `${b.name} (ขับเอง)` : b.driverName || 'พนักงานขับรถประจำสำนักงาน',
      b.date,
      b.endDate || b.date,
      `${b.startTime || '08:30'} - ${b.endTime || '16:30'} น.`,
      b.passengerCount || 1,
      b.passengerNames || '-',
      translateStatus(b.status),
      b.approvedAt ? b.approvedAt.substring(0, 10) : '-'
    ])
  ];

  // Clear previous content in this tab first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'คำขอใช้รถยนต์'!A:R:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write all rows
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'คำขอใช้รถยนต์'!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: "'คำขอใช้รถยนต์'!A1",
      majorDimension: 'ROWS',
      values: rows
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`บันทึกข้อมูลคำขอไม่สำเร็จ: ${err}`);
  }
};

/**
 * Sync Fuel Logs to Google Sheets
 */
export const syncFuelLogs = async (
  accessToken: string,
  spreadsheetId: string,
  fuelLogs: FuelLog[]
): Promise<void> => {
  await ensureSheetTab(accessToken, spreadsheetId, 'บันทึกการใช้น้ำมัน');

  const rows: (string | number)[][] = [
    FUEL_HEADERS,
    ...fuelLogs.map((f) => [
      f.id,
      f.date,
      f.carPlate,
      f.driverName,
      f.distance,
      f.litres,
      f.cost,
      f.endMileage,
      f.fuelStation,
      f.receiptNo || '-'
    ])
  ];

  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'บันทึกการใช้น้ำมัน'!A:J:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'บันทึกการใช้น้ำมัน'!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: "'บันทึกการใช้น้ำมัน'!A1",
      majorDimension: 'ROWS',
      values: rows
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`บันทึกข้อมูลน้ำมันไม่สำเร็จ: ${err}`);
  }
};

/**
 * Sync Maintenance Records to Google Sheets
 */
export const syncMaintenanceRecords = async (
  accessToken: string,
  spreadsheetId: string,
  records: MaintenanceRecord[]
): Promise<void> => {
  await ensureSheetTab(accessToken, spreadsheetId, 'บำรุงรักษาและงานทะเบียน');

  const rows: (string | number)[][] = [
    MAINTENANCE_HEADERS,
    ...records.map((m) => [
      m.id,
      m.date,
      m.carName,
      m.title,
      m.serviceTypeLabel || m.serviceType,
      m.mileageAtService,
      m.cost,
      m.serviceCenter,
      m.invoiceNo || '-',
      m.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ',
      m.nextDueMileage ? `ไมล์ ${m.nextDueMileage.toLocaleString()} กม. / ${m.nextDueDate || '-'}` : m.nextDueDate || '-'
    ])
  ];

  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'บำรุงรักษาและงานทะเบียน'!A:K:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'บำรุงรักษาและงานทะเบียน'!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: "'บำรุงรักษาและงานทะเบียน'!A1",
      majorDimension: 'ROWS',
      values: rows
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`บันทึกงานซ่อมบำรุงไม่สำเร็จ: ${err}`);
  }
};

/**
 * Sync all data in batch
 */
export const syncAllFleetDataToSheets = async (
  accessToken: string,
  spreadsheetId: string,
  bookings: BookingRequest[],
  fuelLogs: FuelLog[],
  maintenanceRecords: MaintenanceRecord[]
): Promise<{ success: boolean; syncedAt: string }> => {
  await syncBookings(accessToken, spreadsheetId, bookings);
  await syncFuelLogs(accessToken, spreadsheetId, fuelLogs);
  await syncMaintenanceRecords(accessToken, spreadsheetId, maintenanceRecords);

  const syncedAt = new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    success: true,
    syncedAt
  };
};
