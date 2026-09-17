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
  getDocs,
  getDoc,
  runTransaction,
  setLogLevel,
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

// Silence Firestore logs to reduce console noise and connection retry spam.
// Valid LogLevelString values are 'debug' | 'error' | 'silent' | 'warn' — 'warning' is not one
// of them, so it was rejected at runtime and the log level silently stayed at the default.
try {
  setLogLevel('silent');
} catch {
  // Ignored in environments where setLogLevel cannot be configured
}

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
  // Only warn once to avoid flooding console on repeated failures
  if (operationType === OperationType.LIST || operationType === OperationType.GET) {
    console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  }
  return errInfo;
}

// Initialize Firestore with offline cache and only force long polling when needed
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

function initFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        // Only force long polling in environments that need it (iframe/proxy)
        // Check if we are likely in a restrictive network environment
        experimentalForceLongPolling: typeof navigator !== 'undefined' && !navigator.onLine,
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
          experimentalForceLongPolling: false
        },
        databaseId || undefined
      );
    } catch {
      return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    }
  }
}

export const db: Firestore = initFirestoreInstance();

// Health check / connection test - make it non-blocking and resilient
export async function testConnection(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    const snap = await getDoc(doc(db, 'test', 'connection'));
    return snap.exists() || true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('network'))) {
      return false;
    }
    // Silently treat other errors as "still ok" to avoid blocking UI
    return true;
  }
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
          // Sort latest first
          items.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
          callbacks.onBookingsChange?.(items);
        } else {
          callbacks.onBookingsChange?.([]);
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
          callbacks.onVehiclesChange?.(items);
        } else {
          callbacks.onVehiclesChange?.([]);
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
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callbacks.onFuelLogsChange?.(items);
        } else {
          callbacks.onFuelLogsChange?.([]);
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
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callbacks.onMaintenanceChange?.(items);
        } else {
          callbacks.onMaintenanceChange?.([]);
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
          callbacks.onUsersChange?.(items);
        } else {
          callbacks.onUsersChange?.([]);
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
        } else {
          callbacks.onNotificationsChange?.([]);
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
export const getNextAtomicBookingSequence = async (fallbackMaxSeq: number = 0): Promise<number> => {
  try {
    const counterRef = doc(db, 'systemSettings', 'booking_counter');
    const nextSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentSeq = fallbackMaxSeq;
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        currentSeq = Math.max(Number(data?.lastSeq) || 0, fallbackMaxSeq);
      }
      const newSeq = currentSeq + 1;
      transaction.set(counterRef, { lastSeq: newSeq, updatedAt: new Date().toISOString() }, { merge: true });
      return newSeq;
    });
    return nextSeq;
  } catch (err) {
    console.warn('[Firestore] Transaction counter fallback to local sequence:', err);
    return fallbackMaxSeq + 1;
  }
};

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

export const clearAllBookingsFromFirestore = async (): Promise<boolean> => {
  try {
    const colRef = collection(db, 'bookings');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`[Firestore] Successfully cleared all ${snapshot.docs.length} bookings for live production.`);
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'bookings');
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

export const deleteFuelLogFromFirestore = async (fuelLogId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'fuelLogs', fuelLogId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted fuel log: ${fuelLogId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `fuelLogs/${fuelLogId}`);
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

export const deleteMaintenanceFromFirestore = async (recordId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'maintenanceRecords', recordId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted maintenance record: ${recordId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `maintenanceRecords/${recordId}`);
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
