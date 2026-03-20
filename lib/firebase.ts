// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnVZNzJl2aHUTIXDtHtIzKeX10UtoNRJk",
  authDomain: "inclusivecode-75ea9.firebaseapp.com",
  projectId: "inclusivecode-75ea9",
  storageBucket: "inclusivecode-75ea9.firebasestorage.app",
  messagingSenderId: "1006398660094",
  appId: "1:1006398660094:web:7908e5b205773d2aab74af",
  measurementId: "G-7ZC829GC3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);