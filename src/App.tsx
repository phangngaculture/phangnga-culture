import React, { useState, useEffect, useRef } from 'react';
import {
  BookingRequest,
  FuelLog,
  NotificationItem,
  User,
  Vehicle,
  MaintenanceRecord,
  DashboardSubView
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
import {
  VoiceSettings,
  getVoiceSettings,
  saveVoiceSettings,
  announceNewBooking,
  announceBookingApproved,
  announceBookingRejected,
  announceMissionStarted,
  announceMissionCompleted,
  announceAssetInspection
} from './utils/voiceAlerts';
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
  clearAllBookingsFromFirestore,
  saveVehicleToFirestore,
  deleteVehicleFromFirestore,
  saveFuelLogToFirestore,
  saveMaintenanceToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveNotificationToFirestore,
  manualForceSyncAllToFirestore
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
import { BackupRestoreView } from './components/BackupRestoreView';
import { DriverMissionView } from './components/DriverMissionView';
import { AssetRegisterView } from './components/AssetRegisterView';
import { AssetInspectionView } from './components/AssetInspectionView';
import { AssetInspectionModal } from './components/AssetInspectionModal';
import { OfficialMemoModal } from './components/OfficialMemoModal';
import { ApprovalSignatureModal } from './components/ApprovalSignatureModal';
import { ClearAllBookingsModal } from './components/ClearAllBookingsModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { ProfilePhotoModal } from './components/ProfilePhotoModal';
import { IPhoneInstallPrompt } from './components/IPhoneInstallPrompt';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileAppInstallBanner } from './components/MobileAppInstallBanner';
import { ToastBanner } from './components/ToastBanner';
import { LoginScreen } from './components/LoginScreen';
import { LineSimulatorModal } from './components/LineSimulatorModal';
import { VoiceAlertSettingsModal } from './components/VoiceAlertSettingsModal';
import { ShieldAlert } from 'lucide-react';
import { registerServiceWorker, updateAppBadge, clearAppBadge } from './services/badgingService';
import {
  notifyNewBooking,
  notifyBookingApproved,
  notifyBookingRejected,
  notifyMissionStarted,
  notifyMissionCompleted
} from './services/lineNotificationService';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadSavedData<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, false)
  );

  // Global LINE Simulator Modal State
  const [isGlobalLineSimulatorOpen, setIsGlobalLineSimulatorOpen] = useState(false);

  // Floating Profile Photo Studio Modal State
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);

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
        allowedMenus: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'fuel', 'fleet', 'analytics', 'tracking', 'backup', 'users']
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
      allowedMenus: ['dashboard', 'calendar', 'booking', 'director', 'driver_mission', 'fuel', 'fleet', 'analytics', 'tracking', 'backup', 'users']
    };
    saveLocalData(STORAGE_KEYS.CURRENT_USER, adminUser);
    return adminUser;
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    const isClearedForProduction =
      typeof window !== 'undefined' &&
      localStorage.getItem('mculture_bookings_cleared_for_production') === 'true';

    if (isClearedForProduction) {
      const loaded = loadSavedData<BookingRequest[]>(STORAGE_KEYS.BOOKINGS, []);
      return Array.isArray(loaded) ? loaded : [];
    }

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

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = loadSavedData<boolean | null>(STORAGE_KEYS.DARK_MODE, null);
    if (saved !== null) return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      saveLocalData(STORAGE_KEYS.DARK_MODE, true);
    } else {
      document.documentElement.classList.remove('dark');
      saveLocalData(STORAGE_KEYS.DARK_MODE, false);
    }
  }, [darkMode]);

  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    loadSavedData<Vehicle[]>(STORAGE_KEYS.VEHICLES, VEHICLES)
  );
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardSubView, setDashboardSubView] = useState<DashboardSubView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Modals & sub-views
  const [selectedBookingForMemo, setSelectedBookingForMemo] = useState<BookingRequest | null>(null);
  const [signingBooking, setSigningBooking] = useState<BookingRequest | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [signatureInitialComment, setSignatureInitialComment] = useState<string>('');
  const [isClearAllBookingsModalOpen, setIsClearAllBookingsModalOpen] = useState<boolean>(false);
  const [memoJustSigned, setMemoJustSigned] = useState<boolean>(false);
  const [inspectingBooking, setInspectingBooking] = useState<BookingRequest | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);
  const [targetMissionBooking, setTargetMissionBooking] = useState<BookingRequest | null>(null);
  const [initialBookingDate, setInitialBookingDate] = useState<string | undefined>(undefined);

  // Voice Alerts State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => getVoiceSettings());
  const [isVoiceSettingsModalOpen, setIsVoiceSettingsModalOpen] = useState<boolean>(false);
  const prevBookingsRef = useRef<BookingRequest[]>(bookings);
  const isInitialFirestoreLoadRef = useRef<boolean>(true);

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
          if (cloudBookings) {
            // Check for remote events (new booking created or approved on another device)
            if (!isInitialFirestoreLoadRef.current && prevBookingsRef.current.length > 0) {
              const prevIds = new Set(prevBookingsRef.current.map((b) => b.id));
              const newlyAdded = cloudBookings.find((b) => !prevIds.has(b.id));

              if (newlyAdded && newlyAdded.userId !== currentUser.id) {
                // Announce newly arrived booking from another client
                announceNewBooking(newlyAdded);
              } else {
                // Check if any booking's status changed
                for (const cb of cloudBookings) {
                  const prev = prevBookingsRef.current.find((b) => b.id === cb.id);
                  if (prev && prev.status !== cb.status) {
                    if (cb.status === 'approved' && cb.approvedBy !== currentUser.name) {
                      announceBookingApproved(cb);
                    } else if (cb.status === 'rejected') {
                      announceBookingRejected({ id: cb.id, comment: cb.directorComment });
                    }
                  }
                }
              }
            }

            isInitialFirestoreLoadRef.current = false;
            prevBookingsRef.current = cloudBookings;
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

  // Register Service Worker for PWA badging and background sync
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Automatically synchronize notification count to Mobile App Icon Badge (iOS / Android)
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      clearAppBadge();
      return;
    }

    const unreadNotifCount = notifications.filter((n) => !n.read).length;
    let pendingActionCount = 0;

    if (currentUser.role === 'director') {
      // Pending requests waiting for director's approval
      pendingActionCount = bookings.filter((b) => b.status === 'pending_director').length;
    } else if (currentUser.role === 'admin') {
      // Pending requests waiting for vehicle/driver assignment
      pendingActionCount = bookings.filter((b) => b.status === 'pending_admin').length;
    } else if (currentUser.role === 'driver') {
      // Missions assigned to current driver
      pendingActionCount = bookings.filter(
        (b) => b.driverId === currentUser.id && (b.status === 'approved' || b.status === 'in_progress')
      ).length;
    }

    const totalBadgeCount = unreadNotifCount + pendingActionCount;
    updateAppBadge(totalBadgeCount);
  }, [isAuthenticated, currentUser, notifications, bookings]);

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
  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    saveLocalData(STORAGE_KEYS.USERS, updated);
    await saveUserToFirestore(newUser);
    playAppSound('success', soundEnabled);
    showToast(`เพิ่มผู้ใช้งาน "${newUser.name}" เรียบร้อยแล้ว`, 'success');
  };

  // Bulk Add Multiple Users
  const handleBulkAddUsers = async (newUsersData: Omit<User, 'id'>[]) => {
    if (!newUsersData || newUsersData.length === 0) return;
    const timestamp = Date.now();
    const createdUsers: User[] = newUsersData.map((u, index) => ({
      ...u,
      id: `usr-${timestamp}-${index}`,
      createdAt: new Date().toISOString()
    }));
    const updated = [...createdUsers, ...users];
    setUsers(updated);
    saveLocalData(STORAGE_KEYS.USERS, updated);
    for (const u of createdUsers) {
      await saveUserToFirestore(u);
    }
    playAppSound('success', soundEnabled);
    showToast(`เพิ่มผู้ใช้งานสำเร็จจำนวน ${createdUsers.length} ท่าน`, 'success');
  };

  // Update User
  const handleUpdateUser = async (id: string, data: Partial<User>) => {
    let updatedUserObj: User | undefined;
    const updated = users.map((u) => {
      if (u.id === id) {
        updatedUserObj = { ...u, ...data } as User;
        return updatedUserObj;
      }
      return u;
    });
    setUsers(updated);
    saveLocalData(STORAGE_KEYS.USERS, updated);
    if (updatedUserObj) {
      await saveUserToFirestore(updatedUserObj);
    }
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...data } as User));
    }
    playAppSound('success', soundEnabled);
    showToast('บันทึกการแก้ไขข้อมูลผู้ใช้งานสำเร็จ', 'success');
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveLocalData(STORAGE_KEYS.USERS, updated);
    await deleteUserFromFirestore(id);
    if (currentUser.id === id) {
      const fallback = updated.find((u) => u.role === 'admin') || updated[0];
      if (fallback) setCurrentUser(fallback);
    }
    playAppSound('click', soundEnabled);
    showToast(`ลบผู้ใช้งาน "${target?.name || id}" เรียบร้อยแล้ว`, 'info');
  };

  // Vehicle CRUD Handlers
  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`
    };
    const updated = [...vehicles, newVehicle];
    setVehicles(updated);
    saveLocalData(STORAGE_KEYS.VEHICLES, updated);
    await saveVehicleToFirestore(newVehicle);
    playAppSound('success', soundEnabled);
    showToast(`เพิ่มรถยนต์ "${newVehicle.name} (${newVehicle.plate})" สำเร็จ`, 'success');
  };

  const handleUpdateVehicle = async (vehicleId: string, updatedData: Partial<Vehicle>) => {
    let updatedVehicleObj: Vehicle | undefined;
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        updatedVehicleObj = { ...v, ...updatedData } as Vehicle;
        return updatedVehicleObj;
      }
      return v;
    });
    setVehicles(updated);
    saveLocalData(STORAGE_KEYS.VEHICLES, updated);
    if (updatedVehicleObj) {
      await saveVehicleToFirestore(updatedVehicleObj);
    }

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

  const handleDeleteVehicle = async (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    const updated = vehicles.filter((v) => v.id !== vehicleId);
    setVehicles(updated);
    saveLocalData(STORAGE_KEYS.VEHICLES, updated);
    await deleteVehicleFromFirestore(vehicleId);
    playAppSound('click', soundEnabled);
    showToast(`ลบข้อมูลรถ "${target?.name || vehicleId}" เรียบร้อยแล้ว`, 'info');
  };

  // Handle Tab Change with Access Control
  const handleTabChange = (tab: string, subView?: DashboardSubView) => {
    let targetTab = tab;
    let targetSubView = subView;

    if (tab === 'dashboard_overview') {
      targetTab = 'dashboard';
      targetSubView = 'overview';
    } else if (tab === 'dashboard_bookings') {
      targetTab = 'dashboard';
      targetSubView = 'bookings';
    } else if (tab === 'dashboard_vehicles') {
      targetTab = 'dashboard';
      targetSubView = 'vehicles';
    }

    const allowed = getUserAllowedMenus(currentUser);
    const isAllowed =
      targetTab === 'dashboard' ||
      allowed.includes(targetTab as any) ||
      (targetTab === 'users' && currentUser.role === 'admin');

    if (!isAllowed) {
      playAppSound('alert', soundEnabled);
      showToast('คุณไม่มีสิทธิ์เข้าถึงเมนูนี้ กรุณาติดต่อผู้ดูแลระบบ (Admin)', 'error');
      return;
    }
    setActiveTab(targetTab);
    if (targetTab === 'dashboard' && targetSubView) {
      setDashboardSubView(targetSubView);
    }
    playAppSound('click', soundEnabled);
  };

  // Handle Toggle Sound
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) playAppSound('success', true);
    showToast(nextVal ? 'เปิดเสียงตอบรับเรียบร้อยแล้ว' : 'ปิดเสียงแจ้งเตือนแล้ว', 'info');
  };

  // Handle Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    playAppSound('click', soundEnabled);
    showToast(nextVal ? 'เปิดโหมดถนอมสายตา (Dark Mode) เรียบร้อยแล้ว' : 'เปลี่ยนเป็นโหมดสว่าง (Light Mode) เรียบร้อยแล้ว', 'info');
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
  const handleSaveBooking = async (data: Partial<BookingRequest>, isEdit: boolean) => {
    if (isEdit && editingBooking) {
      const updatedBooking: BookingRequest = { ...editingBooking, ...data } as BookingRequest;
      const updated = bookings.map((item) =>
        item.id === editingBooking.id ? updatedBooking : item
      );
      setBookings(updated);
      saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
      await saveBookingToFirestore(updatedBooking);
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
        userId: currentUser.id,
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
        destinationsList: data.destinationsList || (data.destDetail ? [data.destDetail] : []),
        estimatedDistance: data.estimatedDistance || 0,
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
      saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
      await saveBookingToFirestore(newBooking);
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
      await saveNotificationToFirestore(newNotif);

      // Trigger LINE Notification to Director & Admins
      notifyNewBooking(newBooking, users)
        .then((count) => {
          if (count > 0) {
            showToast(`ส่งการแจ้งเตือน LINE ไปยังผู้บริหาร/แอดมิน (${count} ท่าน)`, 'info');
          }
        })
        .catch((err) => console.warn('[LINE] notifyNewBooking error:', err));

      // Announce Voice Alert (Thai TTS)
      announceNewBooking(newBooking);

      playAppSound('success', soundEnabled);
      showToast(`ส่งใบเบิก ${newId} สำเร็จ รอดำเนินการอนุมัติ`, 'success');
    }

    setActiveTab('dashboard');
    setEditingBooking(null);
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm(`คุณต้องการลบคำขอ ${bookingId} ใช่หรือไม่?`)) {
      const updated = bookings.filter((b) => b.id !== bookingId);
      setBookings(updated);
      saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
      await deleteBookingFromFirestore(bookingId);
      triggerAutoSync(updated);
      playAppSound('click', soundEnabled);
      showToast(`ลบคำขอ ${bookingId} เรียบร้อยแล้ว`, 'info');
    }
  };

  // Handle Clear All Test Bookings (For launching real production)
  const handleClearAllBookings = async () => {
    try {
      // 1. Mark in localStorage to prevent initial mock re-seeding
      localStorage.setItem('mculture_bookings_cleared_for_production', 'true');

      // 2. Clear from Cloud Firestore
      await clearAllBookingsFromFirestore();

      // 3. Clear local state & LocalStorage
      setBookings([]);
      saveLocalData(STORAGE_KEYS.BOOKINGS, []);

      // 4. Reset any vehicle that was currently in mission back to available
      setVehicles((prev) => {
        const updated = prev.map((v) =>
          v.status === 'in_mission' ? { ...v, status: 'available' as const } : v
        );
        saveLocalData(STORAGE_KEYS.VEHICLES, updated);
        return updated;
      });

      // 5. Provide audio & visual feedback
      playAppSound('success', soundEnabled);
      showToast('ลบข้อมูลใบคำขอทดสอบทั้งหมดเรียบร้อยแล้ว ระบบพร้อมสำหรับการใช้งานจริง', 'success');

      // 6. Record official notification
      const prodNotif: NotificationItem = {
        id: `notif-prod-${Date.now()}`,
        title: 'ระบบเริ่มใช้งานจริง (ล้างข้อมูลทดสอบแล้ว)',
        desc: `ผู้ดูแลระบบ (${currentUser.name}) ได้ทำการล้างข้อมูลใบคำขอทดสอบทั้งหมดเรียบร้อยแล้ว ยานพาหนะทุกคันพร้อมใช้งานสำหรับการรับคำขอจริง`,
        time: 'เมื่อสักครู่',
        read: false,
        type: 'system'
      };
      setNotifications((prev) => [prodNotif, ...prev]);
      await saveNotificationToFirestore(prodNotif);

      // 7. Auto sync empty list to Google Sheets if connected
      triggerAutoSync([]);
    } catch (err) {
      console.error('Failed to clear all bookings:', err);
      playAppSound('alert', soundEnabled);
      showToast('เกิดข้อผิดพลาดในการล้างข้อมูลใบคำขอ', 'error');
      throw err;
    }
  };

  // Handle Quick Backup JSON export before clearing
  const handleExportBackupBeforeClear = () => {
    try {
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split('T')[0];
      const filename = `mculture-backup-before-clear-${dateStr}.json`;
      const backupData = {
        version: '5.2.0',
        exportedAt: timestamp.toISOString(),
        exportedBy: `${currentUser.name} (${currentUser.role})`,
        source: 'M-Culture Phangnga Fleet Management System',
        summary: {
          bookingsCount: bookings.length,
          vehiclesCount: vehicles.length,
          fuelLogsCount: fuelLogs.length,
          maintenanceRecordsCount: maintenanceRecords.length,
          usersCount: users.length
        },
        data: {
          bookings,
          vehicles,
          fuelLogs,
          maintenanceRecords,
          users,
          notifications
        }
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลดไฟล์สำรองข้อมูลก่อนล้างเรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error('Backup export error:', err);
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
  const handleConfirmApprovalWithSignature = async (
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
    if (updatedTargetBooking) {
      await saveBookingToFirestore(updatedTargetBooking);
    }
    triggerAutoSync(updated);

    // Update vehicle status to in_mission
    let updatedVehicleObj: Vehicle | undefined;
    setVehicles((prev) => {
      const updatedVehicles = prev.map((v) => {
        if (v.id === target.carId) {
          const uv: Vehicle = { ...v, status: 'in_mission' as const };
          updatedVehicleObj = uv;
          return uv;
        }
        return v;
      });
      saveLocalData(STORAGE_KEYS.VEHICLES, updatedVehicles);
      return updatedVehicles;
    });
    if (updatedVehicleObj) {
      await saveVehicleToFirestore(updatedVehicleObj);
    }

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
    await saveNotificationToFirestore(approvedNotif);

    // Announce Voice Alert (Thai TTS)
    if (updatedTargetBooking) {
      announceBookingApproved(updatedTargetBooking);
    }

    playAppSound('success', soundEnabled);
    showToast(`ลงนามอนุมัติคำขอ ${bookingId} เรียบร้อยแล้ว พร้อมแสดงใบคำขอขอใช้รถยนต์ส่วนกลาง`, 'success');

    // Trigger LINE Notification to Requester and Driver
    if (updatedTargetBooking) {
      notifyBookingApproved(updatedTargetBooking, users, approvalData.signerName || currentUser.name)
        .then((count) => {
          if (count > 0) {
            showToast(`ส่งแจ้งเตือนผลอนุมัติผ่าน LINE เรียบร้อยแล้ว (${count} ท่าน)`, 'info');
          }
        })
        .catch((err) => console.warn('[LINE] notifyBookingApproved error:', err));
    }

    // Close signature modal
    setIsSignatureModalOpen(false);
    setSigningBooking(null);

    // Promptly pop up OfficialMemoModal to verify the signed document as requested by user
    if (updatedTargetBooking) {
      setMemoJustSigned(true);
      setSelectedBookingForMemo(updatedTargetBooking);
    }
  };

  // Handle Open Asset Inspection Modal
  const handleOpenInspectionModal = (booking: BookingRequest) => {
    setInspectingBooking(booking);
    setIsInspectionModalOpen(true);
  };

  // Handle Confirm Asset Inspection by Logistics Officer
  const handleConfirmInspection = async (
    bookingId: string,
    data: {
      assetInspectorName: string;
      assetInspectorPosition: string;
      assetInspectedAt: string;
      assetInspectionStatus: 'accepted' | 'rejected' | 'pending';
      assetInspectionNote?: string;
      assetInspectionVehicleCondition: 'normal' | 'needs_cleaning' | 'needs_maintenance';
      assetInspectionSignature: string;
      assetInspectionSignatureType: 'draw' | 'electronic';
    }
  ) => {
    let updatedTargetBooking: BookingRequest | undefined;
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        const item: BookingRequest = {
          ...b,
          assetInspectorName: data.assetInspectorName,
          assetInspectorPosition: data.assetInspectorPosition,
          assetInspectedAt: data.assetInspectedAt,
          assetInspectionStatus: data.assetInspectionStatus,
          assetInspectionNote: data.assetInspectionNote,
          assetInspectionVehicleCondition: data.assetInspectionVehicleCondition,
          assetInspectionSignature: data.assetInspectionSignature,
          assetInspectionSignatureType: data.assetInspectionSignatureType
        };
        updatedTargetBooking = item;
        return item;
      }
      return b;
    });

    setBookings(updated);
    saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
    if (updatedTargetBooking) {
      await saveBookingToFirestore(updatedTargetBooking);
    }
    triggerAutoSync(updated);

    const inspectionNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'เจ้าหน้าที่พัสดุตรวจรับรถแล้ว',
      desc: `${data.assetInspectorName} (${data.assetInspectorPosition}) ได้ตรวจรับรถและลงลายมือชื่อในใบบันทึกขอใช้รถ ${bookingId} เรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'approved'
    };
    setNotifications((prev) => [inspectionNotif, ...prev]);
    await saveNotificationToFirestore(inspectionNotif);

    // Announce Voice Alert
    if (updatedTargetBooking) {
      announceAssetInspection(updatedTargetBooking);
    }

    playAppSound('success', soundEnabled);
    showToast(`เจ้าหน้าที่พัสดุตรวจรับรถและลงชื่อในใบบันทึกขอใช้รถ ${bookingId} สำเร็จ`, 'success');

    setIsInspectionModalOpen(false);
    setInspectingBooking(null);

    // Open Memo Modal to review updated official memo with logistics signature
    if (updatedTargetBooking) {
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
  const handleRejectBooking = async (bookingId: string, comment: string) => {
    let targetBooking: BookingRequest | undefined;
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        targetBooking = {
          ...b,
          status: 'rejected' as const,
          directorComment: comment
        };
        return targetBooking;
      }
      return b;
    });

    setBookings(updated);
    saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
    if (targetBooking) {
      await saveBookingToFirestore(targetBooking);
    }
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
    await saveNotificationToFirestore(rejNotif);

    if (targetBooking) {
      notifyBookingRejected(targetBooking, users, comment).catch((err) =>
        console.warn('[LINE] notifyBookingRejected error:', err)
      );
      announceBookingRejected({ id: bookingId, comment });
    }

    playAppSound('alert', soundEnabled);
    showToast(`ส่งกลับ / ปฏิเสธคำขอ ${bookingId}`, 'info');
  };

  // Handle Update Booking (Driver Start / Complete Mission, or status changes)
  const handleUpdateBooking = async (updatedBooking: BookingRequest) => {
    const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
    setBookings(updated);
    saveLocalData(STORAGE_KEYS.BOOKINGS, updated);
    await saveBookingToFirestore(updatedBooking);
    triggerAutoSync(updated);

    // If started mission
    if (updatedBooking.status === 'in_progress') {
      notifyMissionStarted(updatedBooking, users).catch((err) =>
        console.warn('[LINE] notifyMissionStarted error:', err)
      );
      announceMissionStarted(updatedBooking);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'พนักงานขับรถเริ่มปฏิบัติภารกิจแล้ว',
        desc: `คำขอ ${updatedBooking.id} (${updatedBooking.carName}) บันทึกไมล์ตอนไป ${updatedBooking.startMileage?.toLocaleString()} กม.`,
        time: 'เมื่อสักครู่',
        read: false,
        type: 'new'
      };
      setNotifications((prev) => [notif, ...prev]);
      await saveNotificationToFirestore(notif);
      playAppSound('success', soundEnabled);
      showToast(`เริ่มงานสำเร็จ! บันทึกไมล์ตอนไป ${updatedBooking.startMileage?.toLocaleString()} กม.`, 'success');
    }

    // If completed mission
    if (updatedBooking.status === 'completed') {
      notifyMissionCompleted(updatedBooking, users).catch((err) =>
        console.warn('[LINE] notifyMissionCompleted error:', err)
      );
      announceMissionCompleted(updatedBooking);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'ภารกิจเสร็จสิ้น & ลงทะเบียนคุมพัสดุแล้ว',
        desc: `คำขอ ${updatedBooking.id} (${updatedBooking.carName}) ไมล์กลับ ${updatedBooking.endMileage?.toLocaleString()} กม. (ระยะทาง ${updatedBooking.totalDistance} กม.) บันทึกเข้าสมุดทะเบียนคุมของเจ้าหน้าที่พัสดุแล้ว`,
        time: 'เมื่อสักครู่',
        read: false,
        type: 'approved'
      };
      setNotifications((prev) => [notif, ...prev]);
      await saveNotificationToFirestore(notif);
      playAppSound('success', soundEnabled);
      showToast(`ภารกิจเสร็จสิ้น! บันทึกลงสมุดทะเบียนคุมของเจ้าหน้าที่พัสดุแล้ว`, 'success');
    }
  };

  // Handle Update Vehicle Odometer from trip completion
  const handleUpdateVehicleOdometer = async (carId: string, newOdometer: number) => {
    let updatedVehicleObj: Vehicle | undefined;
    setVehicles((prev) => {
      const updated = prev.map((v) => {
        if (v.id === carId) {
          const uv: Vehicle = {
            ...v,
            odometer: Math.max(v.odometer, newOdometer),
            status: 'available'
          };
          updatedVehicleObj = uv;
          return uv;
        }
        return v;
      });
      saveLocalData(STORAGE_KEYS.VEHICLES, updated);
      return updated;
    });
    if (updatedVehicleObj) {
      await saveVehicleToFirestore(updatedVehicleObj);
    }
  };

  // Handle Add Fuel Log
  const handleAddFuelLog = async (logData: Omit<FuelLog, 'id'>) => {
    const newId = `FL-2569-${String(fuelLogs.length + 1).padStart(3, '0')}`;
    const newFuelLog: FuelLog = {
      ...logData,
      id: newId
    };

    const updatedFuel = [newFuelLog, ...fuelLogs];
    setFuelLogs(updatedFuel);
    saveLocalData(STORAGE_KEYS.FUEL_LOGS, updatedFuel);
    await saveFuelLogToFirestore(newFuelLog);
    triggerAutoSync(undefined, updatedFuel);

    // Update vehicle odometer
    let updatedVehicleObj: Vehicle | undefined;
    setVehicles((prev) => {
      const updated = prev.map((v) => {
        if (v.plate.includes(logData.carPlate.split(' ')[0])) {
          const uv: Vehicle = { ...v, odometer: logData.endMileage, status: 'available' };
          updatedVehicleObj = uv;
          return uv;
        }
        return v;
      });
      saveLocalData(STORAGE_KEYS.VEHICLES, updated);
      return updated;
    });
    if (updatedVehicleObj) {
      await saveVehicleToFirestore(updatedVehicleObj);
    }

    const fuelNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'บันทึกการใช้เชื้อเพลิงแล้ว',
      desc: `บันทึกเลขไมล์ ${newId} (${logData.distance} กม. / ${logData.cost} บาท) เรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'fuel'
    };
    setNotifications((prev) => [fuelNotif, ...prev]);
    await saveNotificationToFirestore(fuelNotif);

    playAppSound('success', soundEnabled);
    showToast(`บันทึกข้อมูลเชื้อเพลิง ${newId} สำเร็จ`, 'success');
  };

  // Handle Add Maintenance Record
  const handleAddMaintenanceRecord = async (recordData: Omit<MaintenanceRecord, 'id'>) => {
    const newId = `MNT-2569-${String(maintenanceRecords.length + 1).padStart(3, '0')}`;
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: newId
    };

    const updatedMnt = [newRecord, ...maintenanceRecords];
    setMaintenanceRecords(updatedMnt);
    saveLocalData(STORAGE_KEYS.MAINTENANCE, updatedMnt);
    await saveMaintenanceToFirestore(newRecord);
    triggerAutoSync(undefined, undefined, updatedMnt);

    // Update vehicle next service or odometer and expiry dates
    let updatedVehicleObj: Vehicle | undefined;
    setVehicles((prev) => {
      const updated = prev.map((v) => {
        if (v.id === recordData.carId) {
          const uv: Vehicle = {
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
          updatedVehicleObj = uv;
          return uv;
        }
        return v;
      });
      saveLocalData(STORAGE_KEYS.VEHICLES, updated);
      return updated;
    });
    if (updatedVehicleObj) {
      await saveVehicleToFirestore(updatedVehicleObj);
    }

    const mntNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'บันทึกการซ่อมบำรุง/งานบริการแล้ว',
      desc: `บันทึก ${newId} (${recordData.title}) ค่าใช้จ่าย ${recordData.cost.toLocaleString()} บาท`,
      time: 'เมื่อสักครู่',
      read: false,
      type: 'new'
    };
    setNotifications((prev) => [mntNotif, ...prev]);
    await saveNotificationToFirestore(mntNotif);

    playAppSound('success', soundEnabled);
    showToast(`บันทึกงานซ่อมบำรุง ${newId} สำเร็จ`, 'success');
  };

  // Handle Update Vehicle Status
  const handleUpdateVehicleStatus = async (vehicleId: string, status: Vehicle['status']) => {
    let updatedVehicleObj: Vehicle | undefined;
    setVehicles((prev) => {
      const updated = prev.map((v) => {
        if (v.id === vehicleId) {
          const uv: Vehicle = { ...v, status };
          updatedVehicleObj = uv;
          return uv;
        }
        return v;
      });
      saveLocalData(STORAGE_KEYS.VEHICLES, updated);
      return updated;
    });
    if (updatedVehicleObj) {
      await saveVehicleToFirestore(updatedVehicleObj);
    }
    playAppSound('click', soundEnabled);
    showToast(`ปรับปรุงสถานะรถยนต์ราชการเรียบร้อยแล้ว`, 'info');
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveLocalData(STORAGE_KEYS.NOTIFICATIONS, updated);
    for (const n of updated) {
      await saveNotificationToFirestore(n);
    }
    playAppSound('click', soundEnabled);
    showToast('ทำเครื่องหมายอ่านการแจ้งเตือนทั้งหมดแล้ว', 'info');
  };

  // Handle Full System Restore from imported JSON backup
  const handleRestoreAllData = async (backupData: {
    bookings: BookingRequest[];
    vehicles: Vehicle[];
    fuelLogs: FuelLog[];
    maintenanceRecords: MaintenanceRecord[];
    users: User[];
    notifications?: NotificationItem[];
  }) => {
    // 1. Update React States
    setBookings(backupData.bookings);
    setVehicles(backupData.vehicles);
    setFuelLogs(backupData.fuelLogs);
    setMaintenanceRecords(backupData.maintenanceRecords);
    if (backupData.bookings && backupData.bookings.length > 0) {
      localStorage.removeItem('mculture_bookings_cleared_for_production');
    }
    if (backupData.users && backupData.users.length > 0) {
      setUsers(backupData.users);
      saveLocalData(STORAGE_KEYS.USERS, backupData.users);
    }
    if (backupData.notifications && backupData.notifications.length > 0) {
      setNotifications(backupData.notifications);
      saveLocalData(STORAGE_KEYS.NOTIFICATIONS, backupData.notifications);
    }

    // 2. Persist to LocalStorage
    saveLocalData(STORAGE_KEYS.BOOKINGS, backupData.bookings);
    saveLocalData(STORAGE_KEYS.VEHICLES, backupData.vehicles);
    saveLocalData(STORAGE_KEYS.FUEL_LOGS, backupData.fuelLogs);
    saveLocalData(STORAGE_KEYS.MAINTENANCE, backupData.maintenanceRecords);

    // 3. Batch sync all restored data to Cloud Firestore
    await manualForceSyncAllToFirestore(
      backupData.bookings,
      backupData.vehicles,
      backupData.fuelLogs,
      backupData.maintenanceRecords,
      backupData.users
    );

    // 4. Trigger sound & notification
    playAppSound('success', soundEnabled);
    showToast('กู้คืนข้อมูลระบบทั้งหมดและบันทึกลง Cloud Firestore เรียบร้อยแล้ว', 'success');
  };

  // Handle Force Push Local to Cloud Firestore
  const handleForceCloudSync = async () => {
    await manualForceSyncAllToFirestore(bookings, vehicles, fuelLogs, maintenanceRecords, users);
    playAppSound('success', soundEnabled);
    showToast('ซิงค์ข้อมูลขึ้น Cloud Firestore เรียบร้อยแล้ว', 'success');
  };

  // If not authenticated, show modern Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 selection:bg-orange-500 selection:text-white">
        <ToastBanner message={toast.message} type={toast.type} />
        <LoginScreen users={users} onLogin={handleLogin} />
        <IPhoneInstallPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white transition-colors duration-200">
      
      {/* Toast Banner */}
      <ToastBanner message={toast.message} type={toast.type} />

      {/* Slide-in Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        dashboardSubView={dashboardSubView}
        onSelectTab={handleTabChange}
        currentUser={currentUser}
        allUsers={users}
        bookings={bookings}
        onLogout={handleLogout}
        bookingsCount={bookings.length}
        pendingBookingsCount={bookings.filter((b) => b.status === 'pending' || b.status === 'pending_director').length}
        vehiclesCount={vehicles.length}
        availableVehiclesCount={vehicles.filter((v) => v.status === 'available').length}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenVoiceSettings={() => setIsVoiceSettingsModalOpen(true)}
        voiceAlertsEnabled={voiceSettings.enabled}
        onOpenProfilePhoto={() => setIsProfilePhotoModalOpen(true)}
      />

      {/* Top Header Navbar */}
      <HeaderNav
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        voiceSettings={voiceSettings}
        onOpenVoiceSettings={() => setIsVoiceSettingsModalOpen(true)}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        firestoreStatus={firestoreStatus}
        onUpdateProfilePhoto={(userId, newAvatarUrl) => handleUpdateUser(userId, { avatarUrl: newAvatarUrl })}
        onOpenProfilePhoto={() => setIsProfilePhotoModalOpen(true)}
        onOpenLineSimulator={() => setIsGlobalLineSimulatorOpen(true)}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Mobile PWA Install Banner */}
      <MobileAppInstallBanner />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            bookings={bookings}
            vehicles={vehicles}
            currentUser={currentUser}
            allUsers={users}
            subView={dashboardSubView}
            onSubViewChange={setDashboardSubView}
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
            onOpenDriverMissions={(b) => {
              if (b) setTargetMissionBooking(b);
              setActiveTab('driver_mission');
            }}
            onOpenClearAllBookings={() => setIsClearAllBookingsModalOpen(true)}
          />
        )}

        {activeTab === 'driver_mission' && (
          <DriverMissionView
            bookings={bookings}
            vehicles={vehicles}
            currentUser={currentUser}
            allUsers={users}
            initialTargetBookingId={targetMissionBooking?.id}
            onClearInitialTargetBooking={() => setTargetMissionBooking(null)}
            onUpdateBooking={handleUpdateBooking}
            onUpdateVehicleOdometer={handleUpdateVehicleOdometer}
            onViewMemo={(b) => setSelectedBookingForMemo(b)}
            onNavigateToTracking={() => setActiveTab('tracking')}
            onNavigateToAssetRegister={() => setActiveTab('asset_register')}
          />
        )}

        {activeTab === 'asset_register' && (
          <AssetRegisterView
            bookings={bookings}
            vehicles={vehicles}
            onViewMemo={(b) => setSelectedBookingForMemo(b)}
            onNavigateToMissions={() => setActiveTab('driver_mission')}
          />
        )}

        {activeTab === 'asset_inspection' && (
          <AssetInspectionView
            bookings={bookings}
            vehicles={vehicles}
            currentUser={currentUser}
            onOpenInspectionModal={handleOpenInspectionModal}
            onViewMemo={(b) => setSelectedBookingForMemo(b)}
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
            bookings={bookings}
            editingBooking={editingBooking}
            initialDate={initialBookingDate}
            onSaveBooking={handleSaveBooking}
            onCancel={() => {
              setActiveTab('dashboard');
              setEditingBooking(null);
            }}
            onUpdateUser={handleUpdateUser}
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
            bookings={bookings}
            onAddUser={handleAddUser}
            onBulkAddUsers={handleBulkAddUsers}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'backup' && (
          <BackupRestoreView
            bookings={bookings}
            vehicles={vehicles}
            fuelLogs={fuelLogs}
            maintenanceRecords={maintenanceRecords}
            users={users}
            notifications={notifications}
            currentUser={currentUser}
            onRestoreAllData={handleRestoreAllData}
            firestoreStatus={firestoreStatus}
            onForceCloudSync={handleForceCloudSync}
            onOpenClearAllBookings={() => setIsClearAllBookingsModalOpen(true)}
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
        onOpenInspectionModal={(b) => {
          setSelectedBookingForMemo(null);
          handleOpenInspectionModal(b);
        }}
      />

      {/* Asset Inspection Sign-off Modal (Logistics Officer) */}
      <AssetInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setInspectingBooking(null);
        }}
        booking={inspectingBooking}
        currentUser={currentUser}
        onConfirmInspection={handleConfirmInspection}
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

      {/* Clear All Test Bookings Modal */}
      <ClearAllBookingsModal
        isOpen={isClearAllBookingsModalOpen}
        onClose={() => setIsClearAllBookingsModalOpen(false)}
        onConfirmClearAll={handleClearAllBookings}
        onConfirmClear={handleClearAllBookings}
        onExportBackup={handleExportBackupBeforeClear}
        bookingsCount={bookings.length}
        totalBookingsCount={bookings.length}
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
      <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-xs py-4 px-6 text-center text-xs text-slate-500 no-print mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <img src="/logo_mculture.svg" alt="ตราสัญลักษณ์กระทรวงวัฒนธรรม" className="w-4 h-5 object-contain inline-block" />
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

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenBookingForm={handleOpenBookingForm}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        currentUser={currentUser}
        pendingDirectorCount={bookings.filter((b) => b.status === 'pending_director').length}
        activeMissionsCount={bookings.filter((b) => b.status === 'in_progress' || b.status === 'approved').length}
        onPlaySound={() => playAppSound('click')}
      />

      {/* iPhone PWA Install Helper */}
      <IPhoneInstallPrompt />

      {/* Global LINE Simulator Modal */}
      <LineSimulatorModal
        isOpen={isGlobalLineSimulatorOpen}
        onClose={() => setIsGlobalLineSimulatorOpen(false)}
        currentUser={currentUser}
        users={users}
        bookings={bookings}
        onShowToast={showToast}
      />

      {/* Floating Profile Photo Studio Pop-up Modal */}
      <ProfilePhotoModal
        isOpen={isProfilePhotoModalOpen}
        user={currentUser}
        onClose={() => setIsProfilePhotoModalOpen(false)}
        onSave={(userId, newAvatarUrl) => {
          handleUpdateUser(userId, { avatarUrl: newAvatarUrl });
        }}
      />

      {/* Voice Alerts Settings & Testing Modal */}
      <VoiceAlertSettingsModal
        isOpen={isVoiceSettingsModalOpen}
        onClose={() => setIsVoiceSettingsModalOpen(false)}
        onSettingsChanged={(newSettings) => setVoiceSettings(newSettings)}
      />

    </div>
  );
}
