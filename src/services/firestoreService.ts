import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { app, auth } from './googleAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  BookingRequest,
  Vehicle,
  FuelLog,
  MaintenanceRecord,
  User,
  NotificationItem
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firestore with robust persistent offline cache support and long-polling for iframe/proxy compatibility
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

function initFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      },
      databaseId || undefined
    );
  } catch {
    try {
      return initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true
        },
        databaseId || undefined
      );
    } catch {
      return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    }
  }
}

export const db: Firestore = initFirestoreInstance();

// Health check / connection test as mandated by Firebase integration guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Backend connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is operating in offline mode with cached data.');
    } else {
      console.info('[Firestore] Connection note (offline-first):', error);
    }
    return false;
  }
}

// Trigger connection test safely on module boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 100);
}

export interface FirestoreSyncCallbacks {
  onBookingsChange?: (bookings: BookingRequest[]) => void;
  onVehiclesChange?: (vehicles: Vehicle[]) => void;
  onFuelLogsChange?: (fuelLogs: FuelLog[]) => void;
  onMaintenanceChange?: (records: MaintenanceRecord[]) => void;
  onUsersChange?: (users: User[]) => void;
  onNotificationsChange?: (notifications: NotificationItem[]) => void;
  onStatusChange?: (status: 'connected' | 'syncing' | 'error') => void;
}

// Convert Firestore document or sanitize object before storing
const cleanForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const copy: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      copy[key] = cleanForFirestore(val);
    }
  }
  return copy;
};

// Real-time synchronization subscription
export const subscribeToFirestore = (
  callbacks: FirestoreSyncCallbacks,
  initialData?: {
    bookings?: BookingRequest[];
    vehicles?: Vehicle[];
    fuelLogs?: FuelLog[];
    maintenanceRecords?: MaintenanceRecord[];
    users?: User[];
    notifications?: NotificationItem[];
  }
) => {
  const unsubscribers: (() => void)[] = [];

  const handleSnapshotError = (colName: string, error: any) => {
    if (
      error?.code === 'unavailable' ||
      error?.message?.includes('offline') ||
      error?.message?.includes('unavailable')
    ) {
      console.info(`[Firestore] ${colName} is operating in offline cache mode.`);
      callbacks.onStatusChange?.('connected');
    } else {
      handleFirestoreError(error, OperationType.GET, colName);
      callbacks.onStatusChange?.('error');
    }
  };

  try {
    callbacks.onStatusChange?.('syncing');

    // 1. Bookings collection
    const bookingsCol = collection(db, 'bookings');
    const unsubBookings = onSnapshot(
      bookingsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as BookingRequest);
          if (initialData?.bookings && initialData.bookings.length > 0) {
            const existingIds = new Set(snapshot.docs.map((d) => d.id));
            const missing = initialData.bookings.filter((b) => b && b.id && !existingIds.has(b.id));
            if (missing.length > 0) {
              seedCollection('bookings', missing);
              items.push(...missing);
            }
          }
          // Sort latest first
          items.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
          callbacks.onBookingsChange?.(items);
        } else if (initialData?.bookings && initialData.bookings.length > 0) {
          // Seed if completely empty
          seedCollection('bookings', initialData.bookings);
        }
        callbacks.onStatusChange?.('connected');
      },
      (error: any) => handleSnapshotError('bookings', error)
    );
    unsubscribers.push(unsubBookings);

    // 2. Vehicles collection
    const vehiclesCol = collection(db, 'vehicles');
    const unsubVehicles = onSnapshot(
      vehiclesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as Vehicle);
          if (initialData?.vehicles && initialData.vehicles.length > 0) {
            const existingIds = new Set(snapshot.docs.map((d) => d.id));
            const missing = initialData.vehicles.filter((v) => v && v.id && !existingIds.has(v.id));
            if (missing.length > 0) {
              seedCollection('vehicles', missing);
              items.push(...missing);
            }
          }
          callbacks.onVehiclesChange?.(items);
        } else if (initialData?.vehicles && initialData.vehicles.length > 0) {
          seedCollection('vehicles', initialData.vehicles);
        }
      },
      (error) => handleSnapshotError('vehicles', error)
    );
    unsubscribers.push(unsubVehicles);

    // 3. Fuel Logs collection
    const fuelCol = collection(db, 'fuelLogs');
    const unsubFuel = onSnapshot(
      fuelCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as FuelLog);
          if (initialData?.fuelLogs && initialData.fuelLogs.length > 0) {
            const existingIds = new Set(snapshot.docs.map((d) => d.id));
            const missing = initialData.fuelLogs.filter((f) => f && f.id && !existingIds.has(f.id));
            if (missing.length > 0) {
              seedCollection('fuelLogs', missing);
              items.push(...missing);
            }
          }
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callbacks.onFuelLogsChange?.(items);
        } else if (initialData?.fuelLogs && initialData.fuelLogs.length > 0) {
          seedCollection('fuelLogs', initialData.fuelLogs);
        }
      },
      (error) => handleSnapshotError('fuelLogs', error)
    );
    unsubscribers.push(unsubFuel);

    // 4. Maintenance collection
    const mntCol = collection(db, 'maintenanceRecords');
    const unsubMnt = onSnapshot(
      mntCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as MaintenanceRecord);
          if (initialData?.maintenanceRecords && initialData.maintenanceRecords.length > 0) {
            const existingIds = new Set(snapshot.docs.map((d) => d.id));
            const missing = initialData.maintenanceRecords.filter((m) => m && m.id && !existingIds.has(m.id));
            if (missing.length > 0) {
              seedCollection('maintenanceRecords', missing);
              items.push(...missing);
            }
          }
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callbacks.onMaintenanceChange?.(items);
        } else if (initialData?.maintenanceRecords && initialData.maintenanceRecords.length > 0) {
          seedCollection('maintenanceRecords', initialData.maintenanceRecords);
        }
      },
      (error) => handleSnapshotError('maintenanceRecords', error)
    );
    unsubscribers.push(unsubMnt);

    // 5. Users collection
    const usersCol = collection(db, 'users');
    const unsubUsers = onSnapshot(
      usersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as User);
          if (initialData?.users && initialData.users.length > 0) {
            const existingIds = new Set(snapshot.docs.map((d) => d.id));
            const missing = initialData.users.filter((u) => u && u.id && !existingIds.has(u.id));
            if (missing.length > 0) {
              seedCollection('users', missing);
              items.push(...missing);
            }
          }
          callbacks.onUsersChange?.(items);
        } else if (initialData?.users && initialData.users.length > 0) {
          seedCollection('users', initialData.users);
        }
      },
      (error) => handleSnapshotError('users', error)
    );
    unsubscribers.push(unsubUsers);

    // 6. Notifications collection
    const notifCol = collection(db, 'notifications');
    const unsubNotif = onSnapshot(
      notifCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as NotificationItem);
          callbacks.onNotificationsChange?.(items);
        } else if (initialData?.notifications && initialData.notifications.length > 0) {
          seedCollection('notifications', initialData.notifications);
        }
      },
      (error) => handleSnapshotError('notifications', error)
    );
    unsubscribers.push(unsubNotif);

  } catch (err) {
    console.error('Failed to subscribe to Firestore:', err);
    callbacks.onStatusChange?.('error');
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    });
  };
};

// Seed helper
export const seedCollection = async (collectionName: string, items: any[]) => {
  if (!items || items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docId = item.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, collectionName, docId);
      batch.set(docRef, cleanForFirestore(item), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn(`Firestore seeding ${collectionName} warning:`, err);
  }
};

// Individual write helpers
export const saveBookingToFirestore = async (booking: BookingRequest): Promise<boolean> => {
  try {
    const docRef = doc(db, 'bookings', booking.id);
    await setDoc(docRef, cleanForFirestore(booking), { merge: true });
    console.log(`[Firestore] Successfully saved booking: ${booking.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bookings/${booking.id}`);
    return false;
  }
};

export const deleteBookingFromFirestore = async (bookingId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted booking: ${bookingId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `bookings/${bookingId}`);
    return false;
  }
};

export const saveVehicleToFirestore = async (vehicle: Vehicle): Promise<boolean> => {
  try {
    const docRef = doc(db, 'vehicles', vehicle.id);
    await setDoc(docRef, cleanForFirestore(vehicle), { merge: true });
    console.log(`[Firestore] Successfully saved vehicle: ${vehicle.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `vehicles/${vehicle.id}`);
    return false;
  }
};

export const deleteVehicleFromFirestore = async (vehicleId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted vehicle: ${vehicleId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `vehicles/${vehicleId}`);
    return false;
  }
};

export const saveFuelLogToFirestore = async (log: FuelLog): Promise<boolean> => {
  try {
    const docRef = doc(db, 'fuelLogs', log.id);
    await setDoc(docRef, cleanForFirestore(log), { merge: true });
    console.log(`[Firestore] Successfully saved fuel log: ${log.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `fuelLogs/${log.id}`);
    return false;
  }
};

export const saveMaintenanceToFirestore = async (record: MaintenanceRecord): Promise<boolean> => {
  try {
    const docRef = doc(db, 'maintenanceRecords', record.id);
    await setDoc(docRef, cleanForFirestore(record), { merge: true });
    console.log(`[Firestore] Successfully saved maintenance record: ${record.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `maintenanceRecords/${record.id}`);
    return false;
  }
};

export const saveUserToFirestore = async (user: User): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, cleanForFirestore(user), { merge: true });
    console.log(`[Firestore] Successfully saved user: ${user.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    return false;
  }
};

export const deleteUserFromFirestore = async (userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted user: ${userId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    return false;
  }
};

export const saveNotificationToFirestore = async (notification: NotificationItem): Promise<boolean> => {
  try {
    const docRef = doc(db, 'notifications', notification.id);
    await setDoc(docRef, cleanForFirestore(notification), { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `notifications/${notification.id}`);
    return false;
  }
};

export const manualForceSyncAllToFirestore = async (
  bookings: BookingRequest[],
  vehicles: Vehicle[],
  fuelLogs: FuelLog[],
  maintenanceRecords: MaintenanceRecord[],
  users: User[]
): Promise<void> => {
  await Promise.all([
    seedCollection('bookings', bookings),
    seedCollection('vehicles', vehicles),
    seedCollection('fuelLogs', fuelLogs),
    seedCollection('maintenanceRecords', maintenanceRecords),
    seedCollection('users', users)
  ]);
};
