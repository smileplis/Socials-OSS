
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
 */
const getEnvVar = (key: string): string => {
  const prefixes = ['', 'VITE_', 'REACT_APP_', 'NEXT_PUBLIC_'];
  
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    for (const p of prefixes) {
      // @ts-ignore
      const val = process.env[p + key];
      if (val) return val;
    }
  }

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

/**
 * Smart Parser for Firebase Config
 * Handles both strict JSON and the raw JS snippet copied from Firebase Console
 */
const parseFirebaseConfig = (input: string) => {
  if (!input) return null;
  
  try {
    // 1. Try strict JSON parse first
    return JSON.parse(input);
  } catch (e) {
    try {
      // 2. Try to clean up JS object syntax
      let clean = input
        // Remove comments
        .replace(/\/\/.*$/gm, '')
        // Remove variable declaration (const firebaseConfig = ...)
        .replace(/^(const|let|var)\s+\w+\s*=\s*/, '')
        // Remove trailing semicolon
        .replace(/;$/, '')
        // Quote unquoted keys (key: "value" -> "key": "value")
        .replace(/(\w+):/g, '"$1":')
        // Convert single quotes to double quotes
        .replace(/'/g, '"')
        // Remove trailing commas
        .replace(/,(\s*})/g, '$1');

      return JSON.parse(clean);
    } catch (e2) {
      console.error("Failed to parse Firebase config", e2);
      return null;
    }
  }
};

let db: Firestore | undefined;
let app: FirebaseApp | undefined;

const initFirebase = () => {
  try {
    // 1. Try Manual Config from LocalStorage
    const manualConfigStr = localStorage.getItem('mccia_firebase_config_manual');
    const manualConfig = parseFirebaseConfig(manualConfigStr || '');

    if (manualConfig && manualConfig.apiKey && manualConfig.projectId) {
      app = getApps().length === 0 ? initializeApp(manualConfig) : getApps()[0];
      db = getFirestore(app);
      console.log("Firebase initialized via manual config.");
      return;
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
export const saveManualFirebaseConfig = (rawConfig: string) => {
  // Validate it parses before saving
  const parsed = parseFirebaseConfig(rawConfig);
  if (parsed && parsed.apiKey) {
    localStorage.setItem('mccia_firebase_config_manual', rawConfig);
    window.location.reload(); 
  } else {
    alert("Invalid Firebase Configuration. Please check the snippet.");
  }
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
