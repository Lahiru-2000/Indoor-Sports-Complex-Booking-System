import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC9OkdSCkAcCzniIvyRHJiHK_J4brCeIhw",
  authDomain: "futsal-indoor-stadium1.firebaseapp.com",
  projectId: "futsal-indoor-stadium1",
  storageBucket: "futsal-indoor-stadium1.firebasestorage.app",
  messagingSenderId: "662418708910",
  appId: "1:662418708910:web:d249b9022679e065ee503f"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;



















