// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCe65usVaCmYJxUwSVic_5SwQTMN6obh7o",
    authDomain: "salman-fares.firebaseapp.com",
    projectId: "salman-fares",
    storageBucket: "salman-fares.appspot.com",
    messagingSenderId: "995924812508",
    appId: "1:995924812508:web:d127f57e940a411c8c0a19"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);