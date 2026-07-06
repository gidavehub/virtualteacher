import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBQF1B9nFwJFD8_JiaN7udBDozkObnZfBs",
  authDomain: "virtual-teacher-project-501606.firebaseapp.com",
  projectId: "virtual-teacher-project-501606",
  databaseURL: "https://virtual-teacher-project-501606-default-rtdb.firebaseio.com",
  storageBucket: "virtual-teacher-project-501606.firebasestorage.app",
  messagingSenderId: "270840241274",
  appId: "1:270840241274:web:cabea1f968d977b523efc3",
  measurementId: "G-FTR54NCXB7"
};

// Initialize Firebase client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export default app;
