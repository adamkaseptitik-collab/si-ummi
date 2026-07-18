import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  writeBatch,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import localFirebaseConfig from '../firebase-applet-config.json';

// Use type casting to prevent TS errors if Vite client types are not loaded globally
const env = (import.meta as any).env || {};

// Support production Environment Variables (e.g. for Vercel) falling back to sandboxed config
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || localFirebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || localFirebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence for resilience
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed-precondition (multiple tabs open)');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence unimplemented in this browser');
  } else {
    console.warn('Firestore persistence error:', err);
  }
});

/**
 * Universal helper to save/update a document in Firestore
 */
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
  }
}

/**
 * Universal helper to delete a document from Firestore
 */
export async function deleteDocument(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
  }
}

let globalSeededStatus: boolean | null = null;

/**
 * Seed a collection if it is currently empty
 */
export async function seedCollectionIfEmpty(collectionName: string, initialData: any[]) {
  try {
    // If we have already checked and confirmed seeding is complete in this session, skip entirely
    if (globalSeededStatus === true) {
      return;
    }

    const seedDocRef = doc(db, 'config', 'seeding');

    // If we haven't checked Firestore yet, do so
    if (globalSeededStatus === null) {
      try {
        const seedDocSnap = await getDoc(seedDocRef);
        if (seedDocSnap.exists() && seedDocSnap.data()?.seeded) {
          globalSeededStatus = true;
          return;
        }
      } catch (err) {
        console.warn("Failed to check global seed status from Firestore:", err);
      }
    }

    // Double check if it was set to true by another concurrent call
    if (globalSeededStatus === true) {
      return;
    }

    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && initialData.length > 0) {
      console.log(`Seeding collection ${collectionName} with ${initialData.length} items...`);
      const batch = writeBatch(db);
      initialData.forEach((item) => {
        // Ensure every item has an id or code as its document name
        const id = item.id || item.code || Math.random().toString(36).substring(2, 9);
        const docRef = doc(db, collectionName, id);
        batch.set(docRef, { ...item, id });
      });
      await batch.commit();
      console.log(`Seeding collection ${collectionName} complete.`);
    }

    // Mark as seeded in Firestore so that subsequent loads never re-seed
    try {
      await setDoc(seedDocRef, { seeded: true }, { merge: true });
      globalSeededStatus = true;
    } catch (err) {
      console.warn("Failed to set global seed status in Firestore:", err);
    }
  } catch (error) {
    console.warn(`Error seeding ${collectionName} (usually harmless if offline):`, error);
  }
}

/**
 * Setup a real-time listener for a collection
 */
export function listenCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  initialFallback: T[] = []
) {
  const colRef = collection(db, collectionName);
  
  // Set up real-time listener immediately so that it can return cached values instantly or listen when online
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as T);
    });
    
    // If items are retrieved, update the state
    if (items.length > 0) {
      onUpdate(items);
    } else if (!snapshot.metadata.fromCache) {
      // If we are online and the collection is empty, then it is truly empty (e.g. user deleted all items)
      onUpdate([]);
    } else if (initialFallback.length > 0 && snapshot.metadata.fromCache && items.length === 0) {
      // If snapshot is empty but we are reading from cache, fallback to local state
      onUpdate(initialFallback);
    }
  }, (error) => {
    console.error(`Error listening to ${collectionName}:`, error);
  });

  // Seed collection in the background without blocking the snapshot listener
  seedCollectionIfEmpty(collectionName, initialFallback).catch((error) => {
    console.warn(`Background seeding for ${collectionName} failed:`, error);
  });

  return unsubscribe;
}
