import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAhOko1wWPgh5D18DBxum3xIVIOLCvbikI",
  authDomain: "fir-chat-112df.firebaseapp.com",
  projectId: "fir-chat-112df",
  storageBucket: "fir-chat-112df.firebasestorage.app", 
  messagingSenderId: "78011103062",
  appId: "1:78011103062:web:8d9326d88e5eb4a1a488f7"
};


const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };