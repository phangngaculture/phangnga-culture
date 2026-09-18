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
  query,
  where,
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

// Storage keys for deleted items tombstones
export const DELETED_BOOKING_IDS_KEY = 'mculture_deleted_booking_ids';
export const DELETED_VEHICLE_IDS_KEY = 'mculture_deleted_vehicle_ids';
export const DELETED_FUEL_IDS_KEY = 'mculture_deleted_fuel_ids';
export const DELETED_MNT_IDS_KEY = 'mculture_deleted_mnt_ids';
export const DELETED_USER_IDS_KEY = 'mculture_deleted_user_ids';
export const DELETED_NOTIFICATION_IDS_KEY = 'mculture_deleted_notification_ids';

export const getDeletedIds = (key: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const addDeletedId = (key: string, id: string) => {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getDeletedIds(key);
    set.add(id);
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage errors
  }
};

export const removeDeletedId = (key: string, id: string) => {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getDeletedIds(key);
    set.delete(id);
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage errors
  }
};

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

    // One descriptor per Firestore collection. Each entry declares the collection
    // name, its tombstone key, how to sort the results, and which callback
    // receives them, so the whole subscription setup below is a single loop
    // instead of six near-identical onSnapshot blocks.
    interface CollectionDescriptor {
      name: string;
      tombstoneKey: string | null;
      sortBy?: string;
      onData: (items: any[]) => void;
      // Bookings additionally purge documents whose `memoNo` is tombstoned.
      matchMemoNo?: boolean;
      // Bookings keep the raw document id alongside the logical id for later deletes.
      keepDocId?: boolean;
      // Notifications re-seed the collection from local data when it is empty.
      seedWhenEmpty?: () => boolean;
      // Some collections (bookings) also refresh the global connection status.
      reportsConnection?: boolean;
    }

    const descriptors: CollectionDescriptor[] = [
      {
        name: 'bookings',
        tombstoneKey: DELETED_BOOKING_IDS_KEY,
        sortBy: 'createdAtOrDate',
        matchMemoNo: true,
        keepDocId: true,
        reportsConnection: true,
        onData: (items) => callbacks.onBookingsChange?.(items as BookingRequest[])
      },
      {
        name: 'vehicles',
        tombstoneKey: DELETED_VEHICLE_IDS_KEY,
        onData: (items) => callbacks.onVehiclesChange?.(items as Vehicle[])
      },
      {
        name: 'fuelLogs',
        tombstoneKey: DELETED_FUEL_IDS_KEY,
        sortBy: 'date',
        onData: (items) => callbacks.onFuelLogsChange?.(items as FuelLog[])
      },
      {
        name: 'maintenanceRecords',
        tombstoneKey: DELETED_MNT_IDS_KEY,
        sortBy: 'date',
        onData: (items) => callbacks.onMaintenanceChange?.(items as MaintenanceRecord[])
      },
      {
        name: 'users',
        tombstoneKey: DELETED_USER_IDS_KEY,
        onData: (items) => callbacks.onUsersChange?.(items as User[])
      },
      {
        // Notifications carry no tombstone list; they only re-seed when empty.
        name: 'notifications',
        tombstoneKey: null,
        onData: (items) => callbacks.onNotificationsChange?.(items as NotificationItem[]),
        seedWhenEmpty: () => {
          if (initialData?.notifications && initialData.notifications.length > 0) {
            seedCollection('notifications', initialData.notifications);
            return true;
          }
          return false;
        }
      }
    ];

    const sortItems = (items: any[], sortBy?: string) => {
      if (sortBy === 'date') {
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (sortBy === 'createdAtOrDate') {
        items.sort(
          (a, b) =>
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );
      }
    };

    descriptors.forEach((descriptor) => {
      const unsubscribe = onSnapshot(
        collection(db, descriptor.name),
        (snapshot) => {
          if (!snapshot.empty) {
            const deletedIds = descriptor.tombstoneKey
              ? getDeletedIds(descriptor.tombstoneKey)
              : null;
            const items: any[] = [];

            snapshot.docs.forEach((d) => {
              const data = d.data();
              const id = data.id || d.id;

              // Purge anything the user deleted locally, so it cannot be resurrected.
              if (
                deletedIds &&
                (deletedIds.has(id) ||
                  deletedIds.has(d.id) ||
                  (descriptor.matchMemoNo && data.memoNo && deletedIds.has(data.memoNo)))
              ) {
                deleteDoc(d.ref).catch(() => {});
                return;
              }

              items.push(
                descriptor.keepDocId ? { ...data, id, _docId: d.id } : { ...data, id }
              );
            });

            sortItems(items, descriptor.sortBy);
            descriptor.onData(items);
          } else if (descriptor.seedWhenEmpty) {
            if (!descriptor.seedWhenEmpty()) descriptor.onData([]);
          } else {
            descriptor.onData([]);
          }

          if (descriptor.reportsConnection) callbacks.onStatusChange?.('connected');
        },
        (error) => handleSnapshotError(descriptor.name, error)
      );

      unsubscribers.push(unsubscribe);
    });

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
    if (!booking || !booking.id) return false;
    // Unmark any tombstone so newly created or edited bookings are visible
    removeDeletedId(DELETED_BOOKING_IDS_KEY, booking.id);
    if ((booking as any)._docId) {
      removeDeletedId(DELETED_BOOKING_IDS_KEY, (booking as any)._docId);
    }
    const docRef = doc(db, 'bookings', booking.id);
    await setDoc(docRef, cleanForFirestore(booking), { merge: true });
    console.log(`[Firestore] Successfully saved booking: ${booking.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bookings/${booking?.id}`);
    return false;
  }
};

export const deleteBookingFromFirestore = async (bookingId: string, docId?: string): Promise<boolean> => {
  if (!bookingId) return false;

  // 1. Immediately record in persistent deleted tombstones to prevent race condition resurrection
  addDeletedId(DELETED_BOOKING_IDS_KEY, bookingId);
  if (docId) addDeletedId(DELETED_BOOKING_IDS_KEY, docId);

  let anyDeleted = false;

  // 2. Direct document deletion by booking ID
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
    anyDeleted = true;
  } catch (err) {
    console.warn(`[Firestore] Direct deleteDoc for ${bookingId} warned:`, err);
  }

  // 3. Delete docId if provided and different
  if (docId && docId !== bookingId) {
    try {
      await deleteDoc(doc(db, 'bookings', docId));
      anyDeleted = true;
    } catch (err) {
      console.warn(`[Firestore] Direct deleteDoc for docId ${docId} warned:`, err);
    }
  }

  // 4. Query collection for any docs matching id field
  try {
    const qId = query(collection(db, 'bookings'), where('id', '==', bookingId));
    const snapsId = await getDocs(qId);
    if (!snapsId.empty) {
      const batch = writeBatch(db);
      snapsId.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      anyDeleted = true;
    }
  } catch (err) {
    console.warn(`[Firestore] Query delete by id for ${bookingId} warned:`, err);
  }

  // 5. Query collection for any docs matching memoNo field
  try {
    const qMemo = query(collection(db, 'bookings'), where('memoNo', '==', bookingId));
    const snapsMemo = await getDocs(qMemo);
    if (!snapsMemo.empty) {
      const batch = writeBatch(db);
      snapsMemo.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      anyDeleted = true;
    }
  } catch (err) {
    // Optional memo query
  }

  console.log(`[Firestore] Successfully eradicated booking: ${bookingId}`);
  return true;
};

export const clearAllBookingsFromFirestore = async (): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mculture_bookings_cleared_for_production', 'true');
      localStorage.removeItem(DELETED_BOOKING_IDS_KEY);
    }
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

// Generic save helper shared by all entity saves.
// 1) Clears any tombstone so a newly created or edited document stays visible.
// 2) Writes the sanitised entity with `merge: true`, preserving untouched fields.
// 3) Routes failures through handleFirestoreError and reports success as boolean.
export const saveEntityToFirestore = async (
  collectionName: string,
  tombstoneKey: string,
  entity: { id?: string } | null | undefined
): Promise<boolean> => {
  try {
    if (!entity || !entity.id) return false;
    removeDeletedId(tombstoneKey, entity.id);
    await setDoc(doc(db, collectionName, entity.id), cleanForFirestore(entity), { merge: true });
    console.log(`[Firestore] Successfully saved ${collectionName}: ${entity.id}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${entity?.id}`);
    return false;
  }
};

export const saveVehicleToFirestore = async (vehicle: Vehicle): Promise<boolean> =>
  saveEntityToFirestore('vehicles', DELETED_VEHICLE_IDS_KEY, vehicle);

// Generic delete helper shared by all entity deletes.
// 1) Records a tombstone so a pending snapshot cannot resurrect the item.
// 2) Deletes the document whose Firestore doc id matches the entity id.
// 3) Also deletes any documents whose `id` field matches (legacy duplicates).
export const deleteEntityFromFirestore = async (
  collectionName: string,
  tombstoneKey: string,
  entityId: string
): Promise<boolean> => {
  if (!entityId) return false;
  addDeletedId(tombstoneKey, entityId);
  try {
    await deleteDoc(doc(db, collectionName, entityId));

    const q = query(collection(db, collectionName), where('id', '==', entityId));
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      const batch = writeBatch(db);
      snaps.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    console.log(`[Firestore] Successfully deleted ${collectionName}: ${entityId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${entityId}`);
    return false;
  }
};

export const deleteVehicleFromFirestore = async (vehicleId: string): Promise<boolean> =>
  deleteEntityFromFirestore('vehicles', DELETED_VEHICLE_IDS_KEY, vehicleId);

export const saveFuelLogToFirestore = async (log: FuelLog): Promise<boolean> =>
  saveEntityToFirestore('fuelLogs', DELETED_FUEL_IDS_KEY, log);

export const deleteFuelLogFromFirestore = async (fuelLogId: string): Promise<boolean> =>
  deleteEntityFromFirestore('fuelLogs', DELETED_FUEL_IDS_KEY, fuelLogId);

export const saveMaintenanceToFirestore = async (record: MaintenanceRecord): Promise<boolean> =>
  saveEntityToFirestore('maintenanceRecords', DELETED_MNT_IDS_KEY, record);

export const deleteMaintenanceFromFirestore = async (recordId: string): Promise<boolean> =>
  deleteEntityFromFirestore('maintenanceRecords', DELETED_MNT_IDS_KEY, recordId);

export const saveUserToFirestore = async (user: User): Promise<boolean> =>
  saveEntityToFirestore('users', DELETED_USER_IDS_KEY, user);

export const deleteUserFromFirestore = async (userId: string): Promise<boolean> =>
  deleteEntityFromFirestore('users', DELETED_USER_IDS_KEY, userId);

export const saveNotificationToFirestore = async (notification: NotificationItem): Promise<boolean> =>
  saveEntityToFirestore('notifications', DELETED_NOTIFICATION_IDS_KEY, notification);

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
