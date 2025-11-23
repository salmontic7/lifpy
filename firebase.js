// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCe65usVaCmYJxUwSVic_5SwQTMN6obh7o",
  authDomain: "salman-fares.firebaseapp.com",
  projectId: "salman-fares",
  storageBucket: "salman-fares.firebasestorage.app",
  messagingSenderId: "995924812508",
  appId: "1:995924812508:web:d127f57e940a411c8c0a19"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
console.log("Firebase loaded");