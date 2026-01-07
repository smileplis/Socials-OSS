
import { initializeApp } from "firebase/app";
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
  Timestamp 
} from "firebase/firestore";
import { BrandContext, HistoryItem } from "./types";

/**
 * CONFIGURATION SETTINGS
 * These values are primarily driven by Environment Variables in Vercel/GitHub.
 * Your specific App ID and Measurement ID have been hardcoded as fallbacks.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "", // Get this from Firebase Console > Project Settings
  projectId: process.env.FIREBASE_PROJECT_ID || "", // e.g. "mccia-socials-project"
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "538110982632",
  appId: process.env.FIREBASE_APP_ID || "1:538110982632:web:54cc9d4b9e01f4b3370c5d",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-NKMY7SK048"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Client ID Logic
 * Creates a persistent unique ID for the user's browser to sync their specific brand and history.
 */
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
  try {
    await setDoc(doc(db, "users", clientId), {
      ...brand,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error saving profile to Firestore:", error);
    localStorage.setItem('mccia_brand_backup', JSON.stringify(brand));
  }
};

export const getUserProfile = async (): Promise<BrandContext | null> => {
  const clientId = getClientId();
  try {
    const docSnap = await getDoc(doc(db, "users", clientId));
    if (docSnap.exists()) {
      return docSnap.data() as BrandContext;
    }
  } catch (error) {
    console.error("Error fetching profile from Firestore:", error);
    const backup = localStorage.getItem('mccia_brand_backup');
    if (backup) return JSON.parse(backup);
  }
  return null;
};

export const addHistoryToCloud = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const clientId = getClientId();
  const historyRef = collection(db, "users", clientId, "history");
  try {
    const docRef = await addDoc(historyRef, {
      ...item,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding history to Firestore:", error);
    return 'temp_' + Date.now();
  }
};

export const getHistoryFromCloud = async (): Promise<HistoryItem[]> => {
  const clientId = getClientId();
  const historyRef = collection(db, "users", clientId, "history");
  try {
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        content: data.content,
        meta: data.meta,
        timestamp: data.timestamp?.toMillis() || Date.now()
      } as HistoryItem;
    });
  } catch (error) {
    console.error("Error fetching history from Firestore:", error);
    return [];
  }
};
