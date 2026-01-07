
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  Firestore
} from "firebase/firestore";
import { BrandContext, HistoryItem } from "./types";

/**
 * Safely access environment variables in the browser.
 * This prevents the "process is not defined" error which causes blank screens.
 */
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env) ? (process.env[key] || "") : "";
  } catch {
    return "";
  }
};

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY"),
  projectId: getEnv("FIREBASE_PROJECT_ID"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || (getEnv("FIREBASE_PROJECT_ID") ? `${getEnv("FIREBASE_PROJECT_ID")}.firebaseapp.com` : ""),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || (getEnv("FIREBASE_PROJECT_ID") ? `${getEnv("FIREBASE_PROJECT_ID")}.appspot.com` : ""),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || "538110982632",
  appId: getEnv("FIREBASE_APP_ID") || "1:538110982632:web:54cc9d4b9e01f4b3370c5d",
  measurementId: getEnv("FIREBASE_MEASUREMENT_ID") || "G-NKMY7SK048"
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// Initialize Firebase safely
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  } else {
    console.warn("Firebase config incomplete. Using local storage only.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db };

export const getClientId = () => {
  let id = localStorage.getItem('mccia_client_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mccia_client_id', id);
  }
  return id;
};

export const saveUserProfile = async (brand: BrandContext) => {
  const clientId = getClientId();
  // Always save locally first
  localStorage.setItem('mccia_brand_backup', JSON.stringify(brand));
  
  if (!db) return;
  try {
    await setDoc(doc(db, "users", clientId), {
      ...brand,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Cloud save failed:", error);
  }
};

export const getUserProfile = async (): Promise<BrandContext | null> => {
  const clientId = getClientId();
  
  // Try local first for instant load and offline resilience
  const backup = localStorage.getItem('mccia_brand_backup');
  if (backup) {
    try {
      return JSON.parse(backup);
    } catch (e) {
      console.error("Local data corruption", e);
    }
  }

  if (!db) return null;
  
  try {
    const docSnap = await getDoc(doc(db, "users", clientId));
    if (docSnap.exists()) {
      const cloudData = docSnap.data() as BrandContext;
      localStorage.setItem('mccia_brand_backup', JSON.stringify(cloudData));
      return cloudData;
    }
  } catch (error) {
    console.error("Cloud fetch failed:", error);
  }
  return null;
};

export const addHistoryToCloud = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const clientId = getClientId();
  const tempId = 'local_' + Date.now();
  
  // Update local history immediately
  const localHistory = JSON.parse(localStorage.getItem('mccia_history_backup') || '[]');
  const newItem = { ...item, id: tempId, timestamp: Date.now() };
  localStorage.setItem('mccia_history_backup', JSON.stringify([newItem, ...localHistory].slice(0, 50)));

  if (!db) return tempId;

  const historyRef = collection(db, "users", clientId, "history");
  try {
    const docRef = await addDoc(historyRef, {
      ...item,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Cloud history save failed:", error);
    return tempId;
  }
};

export const getHistoryFromCloud = async (): Promise<HistoryItem[]> => {
  const clientId = getClientId();
  
  // Get local history for instant display
  let history: HistoryItem[] = [];
  const backup = localStorage.getItem('mccia_history_backup');
  if (backup) {
    try {
      history = JSON.parse(backup);
    } catch (e) {
      console.error("History data corruption", e);
    }
  }

  if (!db) return history;

  const historyRef = collection(db, "users", clientId, "history");
  try {
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    
    const cloudHistory = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        content: data.content,
        meta: data.meta,
        timestamp: data.timestamp?.toMillis() || Date.now()
      } as HistoryItem;
    });

    if (cloudHistory.length > 0) {
      localStorage.setItem('mccia_history_backup', JSON.stringify(cloudHistory));
      return cloudHistory;
    }
  } catch (error) {
    console.error("Cloud history fetch failed:", error);
  }
  return history;
};
