
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

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Get or create a unique Client ID for this device
export const getClientId = () => {
  let id = localStorage.getItem('mccia_client_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mccia_client_id', id);
  }
  return id;
};

export const saveUserProfile = async (brand: BrandContext) => {
  const clientId = getClientId();
  await setDoc(doc(db, "users", clientId), {
    ...brand,
    updatedAt: Timestamp.now()
  });
};

export const getUserProfile = async (): Promise<BrandContext | null> => {
  const clientId = getClientId();
  const docSnap = await getDoc(doc(db, "users", clientId));
  if (docSnap.exists()) {
    return docSnap.data() as BrandContext;
  }
  return null;
};

export const addHistoryToCloud = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const clientId = getClientId();
  const historyRef = collection(db, "users", clientId, "history");
  const docRef = await addDoc(historyRef, {
    ...item,
    timestamp: Timestamp.now()
  });
  return docRef.id;
};

export const getHistoryFromCloud = async (): Promise<HistoryItem[]> => {
  const clientId = getClientId();
  const historyRef = collection(db, "users", clientId, "history");
  const q = query(historyRef, orderBy("timestamp", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type,
      content: data.content,
      meta: data.meta,
      timestamp: data.timestamp.toMillis()
    } as HistoryItem;
  });
};
