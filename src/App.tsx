import React, { useState, useEffect } from 'react';
import {
  BookingRequest,
  FuelLog,
  NotificationItem,
  User,
  Vehicle,
  MaintenanceRecord
} from './types';
import {
  SYSTEM_USERS,
  VEHICLES,
  INITIAL_BOOKINGS,
  INITIAL_FUEL_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MAINTENANCE_RECORDS,
  STORAGE_KEYS,
  loadSavedData,
  saveLocalData,
  getUserAllowedMenus
} from './data/mockData';
import { playAppSound } from './utils/thaiDate';
import { User as FirebaseUser } from 'firebase/auth';
import { initAuth, googleSignIn, googleLogout, getAccessToken } from './services/googleAuth';
import {
  findOrCreateSpreadsheet,
  syncAllFleetDataToSheets,
  SpreadsheetInfo
} from './services/googleSheetsService';
import {
  subscribeToFirestore,
  saveBookingToFirestore,
  deleteBookingFromFirestore,
  saveVehicleToFirestore,
  deleteVehicleFromFirestore,
  saveFuelLogToFirestore,
  saveMaintenanceToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveNotificationToFirestore
} from './services/firestoreService';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { BookingFormView } from './components/BookingFormView';
import { DirectorApprovalView } from './components/DirectorApprovalView';
import { FuelLogView } from './components/FuelLogView';
import { GpsTrackingView } from './components/GpsTrackingView';
import { AnalyticsView } from './components/AnalyticsView';
import { FleetMaintenanceView } from './components/FleetMaintenanceView';
import { UserManagementView } from './components/UserManagementView';
import { DriverMissionView } from './components/DriverMissionView';
import { OfficialMemoModal } from './components/OfficialMemoModal';
import { ApprovalSignatureModal } from './components/ApprovalSignatureModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { ToastBanner } from './components/ToastBanner';
import { LoginScreen } from './components/LoginScreen';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadSavedData<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, false)
  );

  // Load persistent state - reset to only admin as requested
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadSavedData<User[]>(STORAGE_KEYS.USERS, SYSTEM_USERS);
    // Keep only admin accounts or custom accounts, removing the old mock users
    const oldMockUsernames = ['director', 'user', 'guna', 'sarawut'];
    const filtered = (loaded && Array.isArray(loaded))
      ? loaded.filter((u) => !oldMockUsernames.includes(u.username.toLowerCase()))
      : [];

    let admin = filtered.find((u) => u.username.toLowerCase() === 'admin');
    if (!admin) {
      admin = { ...SYSTEM_USERS[0] };
    } else {
      admin = {
        ...admin,
        password: 'dekcom2537',
        role: 'admin',
        status: 'active',
        allowedMenus: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'fuel', 'fleet', 'analytics', 'tracking', 'users']
      };
    }

    // Only admin remains in the system
    const finalUsers = [admin];
    saveLocalData(STORAGE_KEYS.USERS, finalUsers);
    return finalUsers;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const loaded = loadSavedData<User>(STORAGE_KEYS.CURRENT_USER, SYSTEM_USERS[0]);
    if (!loaded || loaded.username.toLowerCase() !== 'admin') {
      const defaultAdmin = { ...SYSTEM_USERS[0] };
      saveLocalData(STORAGE_KEYS.CURRENT_USER, defaultAdmin);
      return defaultAdmin;
    }
    const adminUser: User = {
      ...loaded,
      password: 'dekcom2537',
      role: 'admin',
      allowedMenus: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'fuel', 'fleet', 'analytics', 'tracking', 'users']
    };
    saveLocalData(STORAGE_KEYS.CURRENT_USER, adminUser);
    return adminUser;
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    let loaded = loadSavedData<BookingRequest[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    
    // If user has existing localStorage with fewer than 10 items, complement with the 10 mock missions
    if (loaded && loaded.length < INITIAL_BOOKINGS.length) {
      const existingIds = new Set(loaded.map((b) => b.id));
      const missingMissions = INITIAL_BOOKINGS.filter((b) => !existingIds.has(b.id));
      loaded = [...loaded, ...missingMissions];
      saveLocalData(STORAGE_KEYS.BOOKINGS, loaded);
    }

    return loaded.map((b) => {
      let memo = b.memoNo || '';
      if (memo.includes('พง ๐๐๓๐.๑') || memo.includes('พง0030.1') || memo.includes('พง 0030.1')) {
        memo = memo
          .replace('พง ๐๐๓๐.๑/', 'พง ๐๐๓๒(พิเศษ)/')
          .replace('พง0030.1/', 'พง ๐๐๓๒(พิเศษ)/')
          .replace('พง 0030.1/', 'พง ๐๐๓๒(พิเศษ)/');
      }
      const approvedBy = b.approvedBy && b.approvedBy.includes('วัฒนชัย')
        ? 'นางสาวอุไรวรรณ แดงงาม'
        : b.approvedBy;
      return {
        ...b,
        memoNo: memo,
        approvedBy
      };
    });
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() =>
    loadSavedData<FuelLog[]>(STORAGE_KEYS.FUEL_LOGS, INITIAL_FUEL_LOGS)
  );

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() =>
    loadSavedData<MaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_RECORDS)
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadSavedData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    loadSavedData<boolean>(STORAGE_KEYS.SOUND_ENABLED, true)
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    loadSavedData<Vehicle[]>(STORAGE_KEYS.VEHICLES, VEHICLES)
  );
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Modals & sub-views
  const [selectedBookingForMemo, setSelectedBookingForMemo] = useState<BookingRequest | null>(null);
  const [signingBooking, setSigningBooking] = useState<BookingRequest | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [signatureInitialComment, setSignatureInitialComment] = useState<string>('');
  const [memoJustSigned, setMemoJustSigned] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);
  const [initialBookingDate, setInitialBookingDate] = useState<string | undefined>(undefined);

  // Toast
  const [toast, setToast] = useState<{ message: string | null; type?: 'success' | 'error' | 'info' }>({
    message: null,
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: null });
    }, 3800);
  };

  // Google Workspace & Sheets Integration State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(() =>
    loadSavedData<SpreadsheetInfo | null>(STORAGE_KEYS.GOOGLE_SHEET_INFO, null)
  );
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    loadSavedData<string | null>(STORAGE_KEYS.LAST_SYNCED_TIME, null)
  );
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'syncing' | 'error' | 'idle'>('syncing');

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToFirestore(
      {
        onBookingsChange: (cloudBookings) => {
          if (cloudBookings && cloudBookings.length > 0) {
            setBookings(cloudBookings);
          }
        },
        onVehiclesChange: (cloudVehicles) => {
          if (cloudVehicles && cloudVehicles.length > 0) {
            setVehicles(cloudVehicles);
          }
        },
        onFuelLogsChange: (cloudFuel) => {
          if (cloudFuel && cloudFuel.length > 0) {
            setFuelLogs(cloudFuel);
          }
        },
        onMaintenanceChange: (cloudMnt) => {
          if (cloudMnt && cloudMnt.length > 0) {
            setMaintenanceRecords(cloudMnt);
          }
        },
        onUsersChange: (cloudUsers) => {
          if (cloudUsers && cloudUsers.length > 0) {
            setUsers(cloudUsers);
          }
        },
        onNotificationsChange: (cloudNotif) => {
          if (cloudNotif && cloudNotif.length > 0) {
            setNotifications(cloudNotif);
          }
        },
        onStatusChange: (status) => {
          setFirestoreStatus(status);
        }
      },
      {
        bookings,
        vehicles,
        fuelLogs,
        maintenanceRecords,
        users,
        notifications
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    saveLocalData(STORAGE_KEYS.BOOKINGS, bookings);
  }, [bookings]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.FUEL_LOGS, fuelLogs);
  }, [fuelLogs]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.MAINTENANCE, maintenanceRecords);
  }, [maintenanceRecords]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.VEHICLES, vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.SOUND_ENABLED, soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.GOOGLE_SHEET_INFO, spreadsheetInfo);
  }, [spreadsheetInfo]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.LAST_SYNCED_TIME, lastSyncedAt);
  }, [lastSyncedAt]);

  useEffect(() => {
    saveLocalData(STORAGE_KEYS.IS_AUTHENTICATED, isAuthenticated);
  }, [isAuthenticated]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Background Auto-sync helper
  const triggerAutoSync = async (
    customBookings?: BookingRequest[],
    customFuel?: FuelLog[],
    customMnt?: MaintenanceRecord[]
  ) => {
    const token = getAccessToken();
    if (!token || !spreadsheetInfo?.spreadsheetId) return;

    try {
      const res = await syncAllFleetDataToSheets(
        token,
        spreadsheetInfo.spreadsheetId,
        customBookings || bookings,
        customFuel || fuelLogs,
        customMnt || maintenanceRecords
      );
      setLastSyncedAt(res.syncedAt);
    } catch (err) {
      console.warn('Auto sync skipped/failed:', err);
    }
  };

  // Google Connect Handler
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const { user, accessToken } = await googleSignIn();
      setGoogleUser(user);
      playAppSound('success', soundEnabled);

      // Locate or create official Google Sheet
      setIsSyncingSheets(true);
      const sheet = await findOrCreateSpreadsheet(accessToken);
      setSpreadsheetInfo(sheet);

      // Initial Sync
      const syncResult = await syncAllFleetDataToSheets(
        accessToken,
        sheet.spreadsheetId,
        bookings,
        fuelLogs,
        maintenanceRecords
      );
      setLastSyncedAt(syncResult.syncedAt);
      showToast('เชื่อมโยง Google Sheets และซิงค์ข้อมูลยานพาหนะเรียบร้อยแล้ว', 'success');
    } catch (error: any) {
      console.error('Google Connect Error:', error);
      showToast(error.message || 'ไม่สามารถเชื่อมต่อ Google ได้', 'error');
    } finally {
      setIsConnectingGoogle(false);
      setIsSyncingSheets(false);
    }
  };

  // Google Disconnect Handler
  const handleDisconnectGoogle = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      showToast('ออกจากระบบบัญชี Google สำเร็จ', 'info');
      playAppSound('click', soundEnabled);
    } catch (error: any) {
      console.error('Google Logout Error:', error);
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  // Manual Sync Handler
  const handleManualSyncSheets = async () => {
    let token = getAccessToken();
    if (!token) {
      // Prompt user to sign in first
      try {
        const { accessToken } = await googleSignIn();
        token = accessToken;
      } catch (err: any) {
        showToast('กรุณาเข้าสู่ระบบ Google เพื่อเริ่มซิงค์ข้อมูล', 'info');
        return;
      }
    }

    setIsSyncingSheets(true);
    try {
      let sheetId = spreadsheetInfo?.spreadsheetId;
      if (!sheetId) {
        const sheet = await findOrCreateSpreadsheet(token);
        setSpreadsheetInfo(sheet);
        sheetId = sheet.spreadsheetId;
      }

      const syncResult = await syncAllFleetDataToSheets(
        token,
        sheetId,
        bookings,
        fuelLogs,
        maintenanceRecords
      );
      setLastSyncedAt(syncResult.syncedAt);
      playAppSound('success', soundEnabled);
      showToast('ซิงค์ข้อมูลทั้งหมดลง Google Sheets สำเร็จเรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      console.error('Sync Error:', err);
      showToast(err.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลลง Google Sheets', 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Handle Switch User / Role
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    playAppSound('click', soundEnabled);
    showToast(`สลับผู้ใช้งานเป็น: ${user.name} (${user.roleTitle})`, 'info');

    // Automatically navigate if current tab is not allowed for this user
    const allowed = getUserAllowedMenus(user);
    if (
      activeTab !== 'dashboard' &&
      !allowed.includes(activeTab as any) &&
      !(activeTab === 'users' && user.role === 'admin')
    ) {
      const fallbackTab = allowed.length > 0 ? allowed[0] : 'dashboard';
      setActiveTab(fallbackTab);
    }
  };

  // Handle Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    playAppSound('click', soundEnabled);
    showToast(`ยินดีต้อนรับคุณ ${user.name} เข้าสู่ระบบ`, 'success');

    // Automatically navigate to an appropriate tab for the user role
    const allowed = getUserAllowedMenus(user);
    if (user.role === 'driver') {
      setActiveTab('driver_mission');
    } else if (user.role === 'director') {
      setActiveTab('director');
    } else if (allowed.includes('dashboard')) {
      setActiveTab('dashboard');
    } else if (allowed.length > 0) {
      setActiveTab(allowed[0]);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    playAppSound('click', soundEnabled);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Add User
  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    playAppSound('success', soundEnabled);
    showToast(`เพิ่มผู้ใช้งาน "${newUser.name}" เรียบร้อยแล้ว`, 'success');
  };

  // Bulk Add Multiple Users
  const handleBulkAddUsers = (newUsersData: Omit<User, 'id'>[]) => {
    if (!newUsersData || newUsersData.length === 0) return;
    const timestamp = Date.now();
    const createdUsers: User[] = newUsersData.map((u, index) => ({
      ...u,
      id: `usr-${timestamp}-${index}`,
      createdAt: new Date().toISOString()
    }));
    const updated = [...createdUsers, ...users];
    setUsers(updated);
    playAppSound('success', soundEnabled);
    showToast(`เพิ่มผู้ใช้งานสำเร็จจำนวน ${createdUsers.length} ท่าน`, 'success');
  };

  // Update User
  const handleUpdateUser = (id: string, data: Partial<User>) => {
    const updated = users.map((u) => (u.id === id ? ({ ...u, ...data } as User) : u));
    setUsers(updated);
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...data } as User));
    }
    playAppSound('success', soundEnabled);
    showToast('บันทึกการแก้ไขข้อมูลผู้ใช้งานสำเร็จ', 'success');
  };

  // Delete User
  const handleDeleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    if (currentUser.id === id) {
      const fallback = updated.find((u) => u.role === 'admin') || updated[0];
      if (fallback) setCurrentUser(fallback);
    }
    playAppSound('click', soundEnabled);
    showToast(`ลบผู้ใช้งาน "${target?.name || id}" เรียบร้อยแล้ว`, 'info');
  };

  // Vehicle CRUD Handlers
  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`
    };
    const updated = [...vehicles, newVehicle];
    setVehicles(updated);
    playAppSound('success', soundEnabled);
    showToast(`เพิ่มรถยนต์ "${newVehicle.name} (${newVehicle.plate})" สำเร็จ`, 'success');
  };

  const handleUpdateVehicle = (vehicleId: string, updatedData: Partial<Vehicle>) => {
    const updated = vehicles.map((v) => (v.id === vehicleId ? ({ ...v, ...updatedData } as Vehicle) : v));
    setVehicles(updated);

    // Keep booking records consistent if car name or plate changed
    if (updatedData.name || updatedData.plate) {
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.carId === vehicleId
            ? {
                ...b,
                carName: updatedData.name || b.carName
              }
            : b
        )
      );
    }

    playAppSound('success', soundEnabled);
    showToast('บันทึกการแก้ไขข้อมูลรถยนต์สำเร็จ', 'success');
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    const updated = vehicles.filter((v) => v.id !== vehicleId);
    setVehicles(updated);
    playAppSound('click', soundEnabled);
    showToast(`ลบข้อมูลรถ "${target?.name || vehicleId}" เรียบร้อยแล้ว`, 'info');
  };

  // Handle Tab Change with Access Control
  const handleTabChange = (tab: string) => {
    const allowed = getUserAllowedMenus(currentUser);
    const isAllowed =
      tab === 'dashboard' ||
      allowed.includes(tab as any) ||
      (tab === 'users' && currentUser.role === 'admin');

    if (!isAllowed) {
      playAppSound('alert', soundEnabled);
      showToast('คุณไม่มีสิทธิ์เข้าถึงเมนูนี้ กรุณาติดต่อผู้ดูแลระบบ (Admin)', 'error');
      return;
    }
    setActiveTab(tab);
    playAppSound('click', soundEnabled);
  };

  // Handle Toggle Sound
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) playAppSound('success', true);
    showToast(nextVal ? 'เปิดเสียงตอบรับเรียบร้อยแล้ว' : 'ปิดเสียงแจ้งเตือนแล้ว', 'info');
  };

  // Handle Open Booking Form
  const handleOpenBookingForm = (prefillDate?: string) => {
    setEditingBooking(null);
    setInitialBookingDate(prefillDate);
    setActiveTab('booking');
    playAppSound('click', soundEnabled);
  };

  // Handle Edit Booking
  const handleEditBooking = (b: BookingRequest) => {
    setEditingBooking(b);
    setInitialBookingDate(b.date);
    setActiveTab('booking');
    playAppSound('click', soundEnabled);
  };

  // Save Booking (Create or Update)
  const handleSaveBooking = (data: Partial<BookingRequest>, isEdit: boolean) => {
    if (isEdit && editingBooking) {
      const updated = bookings.map((item) =>
        item.id === editingBooking.id ? ({ ...item, ...data } as BookingRequest) : item
      );
      setBookings(updated);
      triggerAutoSync(updated);
      playAppSound('success', soundEnabled);
      showToast(`บันทึกการแก้ไขใบเบิก ${editingBooking.id} สำเร็จ`, 'success');
    } else {
      const seq = bookings.length + 1;
      const newId = `CAR-690${seq < 10 ? '0' + seq : seq}`;
      const memoSeq = seq < 10 ? `๐๑${seq}` : `๐${seq + 10}`;
      const newMemoNo = `พง ๐๐๓๒(พิเศษ)/ว ${memoSeq}`;

      const newBooking: BookingRequest = {
        id: newId,
        memoNo: newMemoNo,
        date: data.date || '2026-09-05',
        endDate: data.endDate || data.date,
        startTime: data.startTime || '08:30',
        endTime: data.endTime || '16:30',
        name: data.name || currentUser.name,
        username: currentUser.username,
        position: data.position || currentUser.position,
        department: data.department || currentUser.department,
        purpose: data.purpose || 'ปฏิบัติภารกิจราชการ',
        destination: data.destination || 'ศาลากลางจังหวัดพังงา',
        destProvince: data.destProvince || 'พังงา',
        destAmphoe: data.destAmphoe || 'เมืองพังงา',
        destTambon: data.destTambon || 'ท้ายช้าง',
        destDetail: data.destDetail || '',
        carId: data.carId || vehicles[0].id,
        carName: data.carName || vehicles[0].name,
        driverType: data.driverType || 'driver',
        driverName: data.driverName || vehicles[0].driverName,
        passengerCount: data.passengerCount || 1,
        passengerNames: data.passengerNames || '',
        attachmentName: data.attachmentName || 'คำสั่งปฏิบัติราชการ.pdf',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const updated = [newBooking, ...bookings];
      setBookings(updated);
      triggerAutoSync(updated);

      // Push notification
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'มีคำขอใช้รถยนต์ราชการใหม่',
        desc: `${newBooking.name} ส่งใบคำขอขอใช้รถยนต์ส่วนกลาง ${newBooking.id} (${newBooking.purpose}) เพื่อขออนุมัติ`,
        time: 'เมื่อสักครู่',
        read: false,
        type: 'new'
      };
      setNotifications((prev) => [newNotif, ...prev]);

      playAppSound('success', soundEnabled);
      showToast(`ส่งใบเบิก ${newId} สำเร็จ รอดำเนินการอนุมัติ`, 'success');
    }

    setActiveTab('dashboard');
    setEditingBooking(null);
  };

  // Handle Delete Booking
  const handleDeleteBooking = (bookingId: string) => {
    if (window.confirm(`คุณต้องการลบคำขอ ${bookingId} ใช่หรือไม่?`)) {
      const updated = bookings.filter((b) => b.id !== bookingId);
      setBookings(updated);
      triggerAutoSync(updated);
      playAppSound('click', soundEnabled);
      showToast(`ลบคำขอ ${bookingId} เรียบร้อยแล้ว`, 'info');
    }
  };

  // Handle Open Signature Modal for Director
  const handleOpenSignatureModal = (booking: BookingRequest, initialComment?: string) => {
    setSigningBooking(booking);
    setSignatureInitialComment(
      initialComment ||
        booking.directorComment ||
        'อนุมัติ ให้เดินทางโดยสวัสดิภาพและปฏิบัติตามกฎจราจรและระเบียบราชการอย่างเคร่งครัด'
    );
    setIsSignatureModalOpen(true);
  };

  // Handle Confirmed Approval with Signature (Draw or Electronic)
  const handleConfirmApprovalWithSignature = (
    bookingId: string,
    approvalData: {
      comment: string;
      signatureType: 'draw' | 'electronic';
      signatureData: string;
      signerName: string;
    }
  ) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    let updatedTargetBooking: BookingRequest | null = null;

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        const item: BookingRequest = {
          ...b,
          status: 'approved' as const,
          directorComment: approvalData.comment,
          approvedAt: new Date().toISOString(),
          approvedBy: approvalData.signerName || currentUser.name,
          signatureType: approvalData.signatureType,
          signatureData: approvalData.signatureData
        };
        updatedTargetBooking = item;
        return item;
      }
      return b;
    });

    setBookings(updated);
    saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
    triggerAutoSync(updated);

    // Update vehicle status to in_mission
    setVehicles((prev) => {
      const updatedVehicles = prev.map((v) =>
        v.id === target.carId ? { ...v, status: 'in_mission' as const } : v
      );
      saveLocalData(STORAGE_KEYS.VEHICLES, updatedVehicles);
      return updatedVehicles;
    });

    const approvedNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'คำขอได้รับการอนุมัติและลงนามแล้ว',
      desc: `ผู้อำนวยการลงนามอนุมัติคำขอ ${bookingId} (${target.purpose}) ด้วย${
        approvalData.signatureType === 'draw' ? 'ลายเซ็นสดดิจิทัล' : 'ลายเซ็นอิเล็กทรอนิกส์'
      } เรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'approved'
    };
    setNotifications((prev) => [approvedNotif, ...prev]);

    playAppSound('success', soundEnabled);
    showToast(`ลงนามอนุมัติคำขอ ${bookingId} เรียบร้อยแล้ว พร้อมแสดงใบคำขอขอใช้รถยนต์ส่วนกลาง`, 'success');

    // Close signature modal
    setIsSignatureModalOpen(false);
    setSigningBooking(null);

    // Promptly pop up OfficialMemoModal to verify the signed document as requested by user
    if (updatedTargetBooking) {
      setMemoJustSigned(true);
      setSelectedBookingForMemo(updatedTargetBooking);
    }
  };

  // Handle Approve by Director (Direct fallback)
  const handleApproveBooking = (bookingId: string, comment: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    // Trigger signature modal to let user choose draw or electronic signature
    handleOpenSignatureModal(target, comment);
  };

  // Handle Reject by Director
  const handleRejectBooking = (bookingId: string, comment: string) => {
    const updated = bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: 'rejected' as const,
            directorComment: comment
          }
        : b
    );

    setBookings(updated);
    triggerAutoSync(updated);

    const rejNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'คำขอไม่ได้รับการอนุมัติ',
      desc: `คำขอ ${bookingId} มีความเห็นส่งกลับ: "${comment}"`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'rejected'
    };
    setNotifications((prev) => [rejNotif, ...prev]);

    playAppSound('alert', soundEnabled);
    showToast(`ส่งกลับ / ปฏิเสธคำขอ ${bookingId}`, 'info');
  };

  // Handle Update Booking (Driver Start / Complete Mission, or status changes)
  const handleUpdateBooking = (updatedBooking: BookingRequest) => {
    const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
    setBookings(updated);
    triggerAutoSync(updated);

    // If started mission
    if (updatedBooking.status === 'in_progress') {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'พนักงานขับรถเริ่มปฏิบัติภารกิจแล้ว',
        desc: `คำขอ ${updatedBooking.id} (${updatedBooking.carName}) บันทึกไมล์ตอนไป ${updatedBooking.startMileage?.toLocaleString()} กม.`,
        time: 'เมื่อสักครู่',
        read: false,
        type: 'new'
      };
      setNotifications((prev) => [notif, ...prev]);
      playAppSound('success', soundEnabled);
      showToast(`เริ่มงานสำเร็จ! บันทึกไมล์ตอนไป ${updatedBooking.startMileage?.toLocaleString()} กม.`, 'success');
    }

    // If completed mission
    if (updatedBooking.status === 'completed') {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'ภารกิจเสร็จสิ้น & ลงทะเบียนคุมพัสดุแล้ว',
        desc: `คำขอ ${updatedBooking.id} (${updatedBooking.carName}) ไมล์กลับ ${updatedBooking.endMileage?.toLocaleString()} กม. (ระยะทาง ${updatedBooking.totalDistance} กม.) บันทึกเข้าสมุดทะเบียนคุมของเจ้าหน้าที่พัสดุแล้ว`,
        time: 'เมื่อสักครู่',
        read: false,
        type: 'approved'
      };
      setNotifications((prev) => [notif, ...prev]);
      playAppSound('success', soundEnabled);
      showToast(`ภารกิจเสร็จสิ้น! บันทึกลงสมุดทะเบียนคุมของเจ้าหน้าที่พัสดุแล้ว`, 'success');
    }
  };

  // Handle Update Vehicle Odometer from trip completion
  const handleUpdateVehicleOdometer = (carId: string, newOdometer: number) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === carId
          ? {
              ...v,
              odometer: Math.max(v.odometer, newOdometer),
              status: 'available'
            }
          : v
      )
    );
  };

  // Handle Add Fuel Log
  const handleAddFuelLog = (logData: Omit<FuelLog, 'id'>) => {
    const newId = `FL-2569-${String(fuelLogs.length + 1).padStart(3, '0')}`;
    const newFuelLog: FuelLog = {
      ...logData,
      id: newId
    };

    const updatedFuel = [newFuelLog, ...fuelLogs];
    setFuelLogs(updatedFuel);
    triggerAutoSync(undefined, updatedFuel);

    // Update vehicle odometer
    setVehicles((prev) =>
      prev.map((v) =>
        v.plate.includes(logData.carPlate.split(' ')[0])
          ? { ...v, odometer: logData.endMileage, status: 'available' }
          : v
      )
    );

    const fuelNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'บันทึกการใช้เชื้อเพลิงแล้ว',
      desc: `บันทึกเลขไมล์ ${newId} (${logData.distance} กม. / ${logData.cost} บาท) เรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'fuel'
    };
    setNotifications((prev) => [fuelNotif, ...prev]);

    playAppSound('success', soundEnabled);
    showToast(`บันทึกข้อมูลเชื้อเพลิง ${newId} สำเร็จ`, 'success');
  };

  // Handle Add Maintenance Record
  const handleAddMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id'>) => {
    const newId = `MNT-2569-${String(maintenanceRecords.length + 1).padStart(3, '0')}`;
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: newId
    };

    const updatedMnt = [newRecord, ...maintenanceRecords];
    setMaintenanceRecords(updatedMnt);
    triggerAutoSync(undefined, undefined, updatedMnt);

    // Update vehicle next service or odometer and expiry dates
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === recordData.carId) {
          return {
            ...v,
            odometer: Math.max(v.odometer, recordData.mileageAtService),
            nextServiceMileage: recordData.nextDueMileage || v.nextServiceMileage,
            taxExpiry:
              recordData.serviceType === 'tax_act' && recordData.nextDueDate
                ? recordData.nextDueDate
                : v.taxExpiry,
            actExpiry:
              recordData.serviceType === 'tax_act' && recordData.nextDueDate
                ? recordData.nextDueDate
                : v.actExpiry,
            insuranceExpiry:
              recordData.serviceType === 'insurance' && recordData.nextDueDate
                ? recordData.nextDueDate
                : v.insuranceExpiry,
            status: recordData.status === 'in_progress' ? 'maintenance' : 'available'
          };
        }
        return v;
      })
    );

    const mntNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'บันทึกการซ่อมบำรุง/งานบริการแล้ว',
      desc: `บันทึก ${newId} (${recordData.title}) ค่าใช้จ่าย ${recordData.cost.toLocaleString()} บาท`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'new'
    };
    setNotifications((prev) => [mntNotif, ...prev]);

    playAppSound('success', soundEnabled);
    showToast(`บันทึกงานซ่อมบำรุง ${newId} สำเร็จ`, 'success');
  };

  // Handle Update Vehicle Status
  const handleUpdateVehicleStatus = (vehicleId: string, status: Vehicle['status']) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status } : v))
    );
    playAppSound('click', soundEnabled);
    showToast(`ปรับปรุงสถานะรถยนต์ราชการเรียบร้อยแล้ว`, 'info');
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    playAppSound('click', soundEnabled);
    showToast('ทำเครื่องหมายอ่านการแจ้งเตือนทั้งหมดแล้ว', 'info');
  };

  // If not authenticated, show modern Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 selection:bg-orange-500 selection:text-white">
        <ToastBanner message={toast.message} type={toast.type} />
        <LoginScreen users={users} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      {/* Toast Banner */}
      <ToastBanner message={toast.message} type={toast.type} />

      {/* Slide-in Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Top Header Navbar */}
      <HeaderNav
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        firestoreStatus={firestoreStatus}
        onUpdateProfilePhoto={(userId, newAvatarUrl) => handleUpdateUser(userId, { avatarUrl: newAvatarUrl })}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            bookings={bookings}
            vehicles={vehicles}
            currentUser={currentUser}
            onOpenBookingForm={handleOpenBookingForm}
            onOpenFuelForm={() => setActiveTab('fuel')}
            onOpenCalendar={() => setActiveTab('calendar')}
            onOpenAnalytics={() => setActiveTab('analytics')}
            onOpenFleet={() => setActiveTab('fleet')}
            onViewMemo={(b) => setSelectedBookingForMemo(b)}
            onEditBooking={handleEditBooking}
            onDeleteBooking={handleDeleteBooking}
            onOpenDirectorApproval={() => setActiveTab('director')}
            onOpenSignatureModal={handleOpenSignatureModal}
            onOpenUsers={() => setActiveTab('users')}
            onOpenDriverMissions={() => setActiveTab('driver_mission')}
          />
        )}

        {activeTab === 'driver_mission' && (
          <DriverMissionView
            bookings={bookings}
            vehicles={vehicles}
            currentUser={currentUser}
            onUpdateBooking={handleUpdateBooking}
            onUpdateVehicleOdometer={handleUpdateVehicleOdometer}
            onViewMemo={(b) => setSelectedBookingForMemo(b)}
            onNavigateToTracking={() => setActiveTab('tracking')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            bookings={bookings}
            vehicles={vehicles}
            onSelectBookingForView={(b) => setSelectedBookingForMemo(b)}
            onOpenBookingForm={handleOpenBookingForm}
          />
        )}

        {activeTab === 'booking' && (
          <BookingFormView
            currentUser={currentUser}
            vehicles={vehicles}
            users={users}
            editingBooking={editingBooking}
            initialDate={initialBookingDate}
            onSaveBooking={handleSaveBooking}
            onCancel={() => {
              setActiveTab('dashboard');
              setEditingBooking(null);
            }}
          />
        )}

        {activeTab === 'director' && (
          <DirectorApprovalView
            bookings={bookings}
            currentUser={currentUser}
            onApprove={handleApproveBooking}
            onOpenSignatureModal={handleOpenSignatureModal}
            onReject={handleRejectBooking}
            onViewMemo={(b) => setSelectedBookingForMemo(b)}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelLogView
            fuelLogs={fuelLogs}
            bookings={bookings}
            vehicles={vehicles}
            currentUser={currentUser}
            onAddFuelLog={handleAddFuelLog}
          />
        )}

        {activeTab === 'fleet' && (
          <FleetMaintenanceView
            vehicles={vehicles}
            maintenanceRecords={maintenanceRecords}
            currentUser={currentUser}
            users={users}
            onAddMaintenanceRecord={handleAddMaintenanceRecord}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === 'tracking' && (
          <GpsTrackingView vehicles={vehicles} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            bookings={bookings}
            fuelLogs={fuelLogs}
            vehicles={vehicles}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementView
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onBulkAddUsers={handleBulkAddUsers}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {/* Access Restricted Notice if user somehow lands on an unpermitted tab */}
        {activeTab !== 'dashboard' &&
          activeTab !== 'users' &&
          !getUserAllowedMenus(currentUser).includes(activeTab as any) && (
            <div className="bg-white rounded-2xl border border-red-200 p-10 text-center shadow-xs my-6">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                สิทธิ์การเข้าถึงถูกจำกัด (Access Restricted)
              </h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
                บัญชีของคุณ ({currentUser.name} - {currentUser.roleTitle}) ไม่ได้รับสิทธิ์เข้าถึงเมนูนี้
                กรุณาติดต่อผู้ดูแลระบบ (Admin) เพื่อขออนุมัติและเปิดสิทธิ์การใช้งาน
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition"
              >
                กลับสู่หน้าหลักภาพรวม (Dashboard)
              </button>
            </div>
          )}
      </main>

      {/* Official Memorandum Modal (Full A4 Print & View) */}
      <OfficialMemoModal
        booking={selectedBookingForMemo}
        onClose={() => {
          setSelectedBookingForMemo(null);
          setMemoJustSigned(false);
        }}
        justApproved={memoJustSigned}
        onOpenSignatureModal={(b) => {
          setSelectedBookingForMemo(null);
          handleOpenSignatureModal(b);
        }}
      />

      {/* Approval Signature Modal (Draw or Electronic) */}
      <ApprovalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setSigningBooking(null);
        }}
        booking={signingBooking}
        currentUser={currentUser}
        approverName={currentUser.role === 'director' ? currentUser.name : 'นางสาวอุไรวรรณ แดงงาม'}
        approverRoleTitle={currentUser.role === 'director' ? (currentUser.position || 'วัฒนธรรมจังหวัดพังงา') : 'วัฒนธรรมจังหวัดพังงา'}
        initialComment={signatureInitialComment}
        onConfirm={handleConfirmApprovalWithSignature}
        onConfirmApproval={handleConfirmApprovalWithSignature}
      />

      {/* Google Sheets Synchronization Modal */}
      <GoogleSheetsSyncModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        googleUser={googleUser}
        spreadsheetInfo={spreadsheetInfo}
        isConnecting={isConnectingGoogle}
        isSyncing={isSyncingSheets}
        lastSyncedAt={lastSyncedAt}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        onManualSync={handleManualSyncSheets}
        bookingCount={bookings.length}
        fuelCount={fuelLogs.length}
        maintenanceCount={maintenanceRecords.length}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-xs py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">
              สำนักงานวัฒนธรรมจังหวัดพังงา (Phangnga Provincial Cultural Office)
            </span>
            <span>•</span>
            <span>กระทรวงวัฒนธรรม</span>
          </div>
          <div className="text-slate-600 font-medium">
            developer by Thon Saengsawang
          </div>
        </div>
      </footer>

    </div>
  );
}
