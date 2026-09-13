export type UserRole = 'admin' | 'director' | 'officer' | 'driver';

export type DashboardSubView = 'overview' | 'bookings' | 'vehicles';

export type MenuKey =
  | 'dashboard'
  | 'calendar'
  | 'booking'
  | 'director'
  | 'driver_mission'
  | 'asset_register'
  | 'asset_inspection'
  | 'fuel'
  | 'fleet'
  | 'analytics'
  | 'tracking'
  | 'backup'
  | 'users'
  | 'website_customizer';

export interface SystemBackupData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  source: string;
  firestoreDatabaseId?: string;
  summary: {
    bookingsCount: number;
    vehiclesCount: number;
    fuelLogsCount: number;
    maintenanceRecordsCount: number;
    usersCount: number;
    notificationsCount: number;
  };
  data: {
    bookings: BookingRequest[];
    vehicles: Vehicle[];
    fuelLogs: FuelLog[];
    maintenanceRecords: MaintenanceRecord[];
    users: User[];
    notifications?: NotificationItem[];
  };
}

export interface MenuDefinition {
  id: MenuKey;
  label: string;
  desc: string;
  badge?: string;
  color: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  position: string;
  department: string;
  role: UserRole;
  roleTitle: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  signatureUrl?: string; // ลายมือชื่อดิจิทัลของเจ้าหน้าที่ (Data URL หรือ PNG)
  signatureType?: 'draw' | 'image' | 'electronic';
  signatureUpdatedAt?: string;
  status?: 'active' | 'inactive';
  allowedMenus?: MenuKey[];
  createdAt?: string;
  lineUserId?: string; // LINE User ID สำหรับรับการแจ้งเตือน
  lineNotifyToken?: string; // Token สำหรับ LINE Notify / Custom Webhook
  lineNotificationEnabled?: boolean; // เปิด/ปิดการแจ้งเตือน LINE
}

// 'pending_director' = submitted and awaiting director sign-off
// 'pending_admin'    = approved, awaiting vehicle/driver assignment
export type BookingStatus =
  | 'pending'
  | 'pending_director'
  | 'pending_admin'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';
export type MissionSubStatus = 'not_started' | 'in_progress' | 'returning' | 'completed' | 'cancelled';

// Single source of truth for asset inspection results.
// Previously types.ts, AssetInspectionModal.tsx and App.tsx each declared a different
// set of literals, so the printed memo checked the wrong condition value.
export type AssetInspectionStatus = 'pending' | 'accepted' | 'rejected';
export type AssetInspectionCondition = 'normal' | 'needs_cleaning' | 'needs_maintenance';

export interface BookingRequest {
  id: string;
  memoNo: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  userId?: string; // ID ของผู้ยื่นคำขอ
  name: string;
  username: string;
  position: string;
  department: string;
  purpose: string;
  destination: string;
  destProvince: string;
  destAmphoe: string;
  destTambon: string;
  destDetail: string;
  destinationsList?: string[]; // รายการสถานที่ปลายทาง (กรณีระบุหลายจุด)
  estimatedDistance?: number;  // ระยะทางไป-กลับโดยประมาณ (กิโลเมตร)
  carId: string;
  carName: string;
  driverType: 'driver' | 'self';
  driverName: string;
  driverId?: string;       // User ID ของพนักงานขับรถ หรือผู้ขอขับเอง
  driverUsername?: string; // Username ของพนักงานขับรถ หรือผู้ขอขับเอง
  passengerCount: number;
  passengerNames?: string;
  attachmentName?: string;
  status: BookingStatus;
  missionStatus?: MissionSubStatus; // สถานะย่อยของภารกิจงานขับรถ
  directorComment?: string;
  approvedAt?: string;
  approvedBy?: string;
  directorSignature?: string;
  signatureType?: 'draw' | 'electronic';
  signatureData?: string;
  createdAt: string;

  // Requester Signature (ลายมือชื่อผู้ขอใช้รถราชการสำหรับประทับในใบคำขอ)
  requesterSignature?: string;
  requesterSignatureType?: 'draw' | 'image' | 'electronic';
  requesterSignedAt?: string;

  // Driver Trip Execution & Odometer Tracking
  startMileage?: number;
  startMileageTime?: string;
  actualDepartureTime?: string;
  endMileage?: number;
  endMileageTime?: string;
  actualReturnTime?: string;
  totalDistance?: number;
  fuelRefilledLiters?: number;
  fuelRefilledCost?: number;
  fuelStation?: string;
  fuelReceiptNo?: string;
  driverNotes?: string;
  tripRating?: string;
  registeredInAssetControl?: boolean;
  assetControlRecordedAt?: string;

  // Audit Trails for Mission Execution
  startedByUserId?: string;
  startedByName?: string;
  startedAt?: string;
  returningAt?: string;
  returningByName?: string;
  completedByUserId?: string;
  completedByName?: string;
  completedAt?: string;
  lastEditedByUserId?: string;
  lastEditedByName?: string;
  lastEditedAt?: string;

  // Asset Inspection & Vehicle Handover (การตรวจรับรถเสร็จสิ้นภารกิจโดยเจ้าหน้าที่พัสดุ)
  assetInspectorName?: string;
  assetInspectorPosition?: string;
  assetInspectedAt?: string;
  assetInspectionStatus?: AssetInspectionStatus;
  assetInspectionNote?: string;
  assetInspectionSignature?: string; // Digital signature data URL or electronic sign
  assetInspectionSignatureType?: 'draw' | 'electronic';
  assetInspectionVehicleCondition?: AssetInspectionCondition;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  seats: number;
  fuelType: string;
  status: 'available' | 'in_mission' | 'maintenance';
  odometer: number;
  driverName: string;
  colorTag: string;
  year?: number;
  taxExpiry?: string;
  actExpiry?: string;
  insuranceExpiry?: string;
  insuranceCompany?: string;
  nextServiceMileage?: number;
  fuelEfficiencyAvg?: number;
}

export type MaintenanceServiceType = 'oil_change' | 'tires' | 'brakes' | 'tax_act' | 'insurance' | 'general_repair';

export interface MaintenanceRecord {
  id: string;
  carId: string;
  carName: string;
  carPlate: string;
  serviceType: MaintenanceServiceType;
  serviceTypeLabel: string;
  title: string;
  serviceCenter: string;
  date: string;
  mileageAtService: number;
  nextDueMileage?: number;
  nextDueDate?: string;
  cost: number;
  invoiceNo?: string;
  technicianNotes?: string;
  status: 'completed' | 'in_progress' | 'scheduled';
}

export interface VehicleChecklist {
  tires: boolean;
  engineOil: boolean;
  coolant: boolean;
  brakesAndLights: boolean;
  cleanliness: boolean;
  emergencyTools: boolean;
}

export interface FuelLog {
  id: string;
  bookingId: string;
  carPlate: string;
  driverName: string;
  startMileage: number;
  endMileage: number;
  distance: number;
  litres: number;
  cost: number;
  fuelStation: string;
  receiptNo?: string;
  rating: string;
  checklist: VehicleChecklist;
  notes?: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'new' | 'approved' | 'rejected' | 'fuel' | 'system';
}

export interface PassengerDirectoryItem {
  id: string;
  name: string;
  position: string;
  department: string;
  phone?: string;
  isDefault?: boolean;
  addedAt?: string;
}

export type LineEventType =
  | 'new_booking'
  | 'booking_approved'
  | 'booking_rejected'
  | 'mission_started'
  | 'mission_completed'
  | 'test';

export interface LineNotificationPayload {
  recipientUserId?: string;
  recipientName: string;
  lineUserId?: string;
  token?: string;
  title: string;
  message: string;
  flex?: Record<string, unknown>;
  eventType: LineEventType;
  bookingId?: string;
  timestamp?: string;
}

export interface LineNotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  lineUserId?: string;
  title: string;
  message: string;
  status: 'success' | 'simulated' | 'failed';
  mode: 'messaging_api' | 'notify' | 'webhook' | 'simulation';
  eventType: LineEventType;
  bookingId?: string;
  details?: string;
}

export interface GlobalLineConfig {
  channelAccessToken?: string;
  channelSecret?: string;
  webhookUrl?: string;
  notifyToken?: string;
  appBaseUrl?: string;
  defaultEnabled: boolean;
  simulationModeOnly: boolean;
}
