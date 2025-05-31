import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
    apiKey: "AIzaSyCQJ3dX_ZcxVKzlCD8H19JM3KYh7qf8wYk",
    authDomain: "form-ca7cc.firebaseapp.com",
    databaseURL: "https://form-ca7cc-default-rtdb.firebaseio.com",
    projectId: "form-ca7cc",
    storageBucket: "form-ca7cc.firebasestorage.app",
    messagingSenderId: "1054208318782",
    appId: "1:1054208318782:web:f64f43412902afcd7aa06f",
    measurementId: "G-CQSLK7PCFQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // optional

export { auth, db, storage };// <-- This line exports both db and storage
