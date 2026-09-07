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
  Firestore
} from 'firebase/firestore';
import { app } from './googleAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  BookingRequest,
  Vehicle,
  FuelLog,
  MaintenanceRecord,
  User,
  NotificationItem
} from '../types';

// Initialize Firestore with robust persistent offline cache support
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    databaseId || undefined
  );
} catch {
  // If already initialized, retrieve instance
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db: Firestore = firestoreInstance;

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
        } else if (initialData?.bookings && initialData.bookings.length > 0) {
          // Seed if completely empty
          seedCollection('bookings', initialData.bookings);
        }
        callbacks.onStatusChange?.('connected');
      },
      (error: any) => {
        // Handle code=unavailable gracefully (offline or transient connectivity)
        if (error?.code === 'unavailable') {
          console.info('Firestore is operating in offline mode with cached data.');
          callbacks.onStatusChange?.('connected');
        } else {
          console.warn('Firestore bookings snapshot error:', error);
          callbacks.onStatusChange?.('error');
        }
      }
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
        } else if (initialData?.vehicles && initialData.vehicles.length > 0) {
          seedCollection('vehicles', initialData.vehicles);
        }
      },
      (error) => {
        console.warn('Firestore vehicles snapshot error:', error);
      }
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
        } else if (initialData?.fuelLogs && initialData.fuelLogs.length > 0) {
          seedCollection('fuelLogs', initialData.fuelLogs);
        }
      },
      (error) => {
        console.warn('Firestore fuelLogs snapshot error:', error);
      }
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
        } else if (initialData?.maintenanceRecords && initialData.maintenanceRecords.length > 0) {
          seedCollection('maintenanceRecords', initialData.maintenanceRecords);
        }
      },
      (error) => {
        console.warn('Firestore maintenance snapshot error:', error);
      }
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
        } else if (initialData?.users && initialData.users.length > 0) {
          seedCollection('users', initialData.users);
        }
      },
      (error) => {
        console.warn('Firestore users snapshot error:', error);
      }
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
      (error) => {
        console.warn('Firestore notifications snapshot error:', error);
      }
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
export const saveBookingToFirestore = async (booking: BookingRequest) => {
  try {
    const docRef = doc(db, 'bookings', booking.id);
    await setDoc(docRef, cleanForFirestore(booking), { merge: true });
  } catch (err) {
    console.error('Error saving booking to Firestore:', err);
  }
};

export const deleteBookingFromFirestore = async (bookingId: string) => {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting booking from Firestore:', err);
  }
};

export const saveVehicleToFirestore = async (vehicle: Vehicle) => {
  try {
    const docRef = doc(db, 'vehicles', vehicle.id);
    await setDoc(docRef, cleanForFirestore(vehicle), { merge: true });
  } catch (err) {
    console.error('Error saving vehicle to Firestore:', err);
  }
};

export const deleteVehicleFromFirestore = async (vehicleId: string) => {
  try {
    const docRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting vehicle from Firestore:', err);
  }
};

export const saveFuelLogToFirestore = async (log: FuelLog) => {
  try {
    const docRef = doc(db, 'fuelLogs', log.id);
    await setDoc(docRef, cleanForFirestore(log), { merge: true });
  } catch (err) {
    console.error('Error saving fuel log to Firestore:', err);
  }
};

export const saveMaintenanceToFirestore = async (record: MaintenanceRecord) => {
  try {
    const docRef = doc(db, 'maintenanceRecords', record.id);
    await setDoc(docRef, cleanForFirestore(record), { merge: true });
  } catch (err) {
    console.error('Error saving maintenance to Firestore:', err);
  }
};

export const saveUserToFirestore = async (user: User) => {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, cleanForFirestore(user), { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
};

export const deleteUserFromFirestore = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
};

export const saveNotificationToFirestore = async (notification: NotificationItem) => {
  try {
    const docRef = doc(db, 'notifications', notification.id);
    await setDoc(docRef, cleanForFirestore(notification), { merge: true });
  } catch (err) {
    console.error('Error saving notification to Firestore:', err);
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
