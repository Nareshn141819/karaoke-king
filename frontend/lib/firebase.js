import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAZow_pi5ip1kTxt49X-0FlUrj6p2a3sf8",
    authDomain: "karoke-king.firebaseapp.com",
    projectId: "karoke-king",
    storageBucket: "karoke-king.firebasestorage.app",
    messagingSenderId: "828200409578",
    appId: "1:828200409578:web:8259af8596984c59d97a93"
};

const app = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
