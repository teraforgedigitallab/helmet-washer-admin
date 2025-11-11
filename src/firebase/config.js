import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDpnAkHeuTxV0nTdtr-cNrT6GsagHdwd1Q",
  authDomain: "helmetwasherapp.firebaseapp.com",
  projectId: "helmetwasherapp",
  storageBucket: "helmetwasherapp.firebasestorage.app",
  messagingSenderId: "209500363111",
  appId: "1:209500363111:web:3ab084350f07738dbb77c2",
  measurementId: "G-JBLVC667CM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;