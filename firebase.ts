
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
 * Robust Environment Variable Loader
 * Checks process.env, import.meta.env, and standard prefixes (VITE_, REACT_APP_)
 */
const getEnvVar = (key: string): string => {
  const prefixes = ['', 'VITE_', 'REACT_APP_', 'NEXT_PUBLIC_'];
  
  // Check process.env
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    for (const p of prefixes) {
      // @ts-ignore
      const val = process.env[p + key];
      if (val) return val;
    }
  }

  // Check import.meta.env (Vite standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const p of prefixes) {
      // @ts-ignore
      const val = import.meta.env[p + key];
      if (val) return val;
    }
  }
  
  return "";
};

let db: Firestore | undefined;
let app: FirebaseApp | undefined;

const initFirebase = () => {
  try {
    // 1. Try Manual Config from LocalStorage (User pasted JSON)
    const manualConfigStr = localStorage.getItem('mccia_firebase_config_manual');
    if (manualConfigStr) {
      try {
        const config = JSON.parse(manualConfigStr);
        if (config.apiKey && config.projectId) {
          app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
          db = getFirestore(app);
          console.log("Firebase initialized via manual config.");
          return;
        }
      } catch (e) {
        console.error("Invalid manual Firebase config", e);
      }
    }

    // 2. Try Environment Variables
    const envConfig = {
      apiKey: getEnvVar("FIREBASE_API_KEY"),
      projectId: getEnvVar("FIREBASE_PROJECT_ID"),
      authDomain: getEnvVar("FIREBASE_AUTH_DOMAIN"),
      storageBucket: getEnvVar("FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: getEnvVar("FIREBASE_MESSAGING_SENDER_ID"),
      appId: getEnvVar("FIREBASE_APP_ID")
    };

    if (envConfig.apiKey && envConfig.projectId) {
      app = getApps().length === 0 ? initializeApp(envConfig) : getApps()[0];
      db = getFirestore(app);
      console.log("Firebase initialized via environment variables.");
    } else {
      console.warn("Firebase credentials missing. App running in offline mode.");
    }
  } catch (error) {
    console.error("Firebase startup error:", error);
  }
};

// Initialize immediately
initFirebase();

export { db };

// Helper to save manual config and reload
export const saveManualFirebaseConfig = (jsonConfig: string) => {
  localStorage.setItem('mccia_firebase_config_manual', jsonConfig);
  window.location.reload(); 
};

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
