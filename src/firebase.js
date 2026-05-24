import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXxwlyKUMrojueC0cM1Pp7qzzP_WFxnkc",
  authDomain: "web-pocket-scrapbook.firebaseapp.com",
  projectId: "web-pocket-scrapbook",
  storageBucket: "web-pocket-scrapbook.firebasestorage.app",
  messagingSenderId: "994756428548",
  appId: "1:994756428548:web:282392ee1870ac4056c651",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);