
import { initializeApp, getApps } from "firebase/app";
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
 */
const getSafeEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || "";
    }
  } catch (e) {}
  return "";
};

const firebaseConfig = {
  apiKey: getSafeEnv("FIREBASE_API_KEY"),
  projectId: getSafeEnv("FIREBASE_PROJECT_ID"),
  authDomain: getSafeEnv("FIREBASE_AUTH_DOMAIN"),
  storageBucket: getSafeEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getSafeEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getSafeEnv("FIREBASE_APP_ID")
};

let db: Firestore | undefined;

// Initialize Firebase only if we have the critical keys
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase credentials missing. Using local mode (data saved to browser).");
  }
} catch (error) {
  console.error("Firebase startup error:", error);
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
  // Always save locally first for instant availability
  localStorage.setItem('mccia_brand_profile', JSON.stringify(brand));
  
  if (!db) return;
  try {
    await setDoc(doc(db, "users", clientId), {
      ...brand,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Cloud sync failed:", error);
  }
};

export const getUserProfile = async (): Promise<BrandContext | null> => {
  // Check local first
  const local = localStorage.getItem('mccia_brand_profile');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }

  if (!db) return null;
  const clientId = getClientId();
  try {
    const docSnap = await getDoc(doc(db, "users", clientId));
    if (docSnap.exists()) {
      const data = docSnap.data() as BrandContext;
      localStorage.setItem('mccia_brand_profile', JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.error("Cloud fetch failed:", error);
  }
  return null;
};

export const addHistoryToCloud = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const localHistory = JSON.parse(localStorage.getItem('mccia_history') || '[]');
  const tempId = 'item_' + Date.now();
  const newItem = { ...item, id: tempId, timestamp: Date.now() };
  localStorage.setItem('mccia_history', JSON.stringify([newItem, ...localHistory].slice(0, 50)));

  if (!db) return tempId;

  const clientId = getClientId();
  try {
    const docRef = await addDoc(collection(db, "users", clientId, "history"), {
      ...item,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    return tempId;
  }
};

export const getHistoryFromCloud = async (): Promise<HistoryItem[]> => {
  const localHistory = JSON.parse(localStorage.getItem('mccia_history') || '[]');
  
  if (!db) return localHistory;

  const clientId = getClientId();
  try {
    const q = query(
      collection(db, "users", clientId, "history"), 
      orderBy("timestamp", "desc"), 
      limit(50)
    );
    const querySnapshot = await getDocs(q);
      
    const cloudHistory = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toMillis() || Date.now()
      } as HistoryItem;
    });

    if (cloudHistory.length > 0) {
      localStorage.setItem('mccia_history', JSON.stringify(cloudHistory));
      return cloudHistory;
    }
  } catch (error) {
    console.error("History fetch error:", error);
  }
  
  return localHistory;
};
