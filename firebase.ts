// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVxd4sRiwn5jToKWfsAqg2cg-oII4Scn4",
  authDomain: "chat-app-102ec.firebaseapp.com",
  projectId: "chat-app-102ec",
  storageBucket: "chat-app-102ec.firebasestorage.app",
  messagingSenderId: "1001243592479",
  appId: "1:1001243592479:web:e9ed182eb00a21eaed922a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };
