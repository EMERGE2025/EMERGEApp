import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAEiGlA0G2gZDq4c2sFwO2YNBETcgzB4jg",
  authDomain: "emergetech-5b202.firebaseapp.com",
  projectId: "emergetech-5b202",
  storageBucket: "emergetech-5b202.firebasestorage.app",
  appId: "1:628831092464:web:e70742607207a2890ccc35",
  measurementId: "G-997XLMTJF5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();