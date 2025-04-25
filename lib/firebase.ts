import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBbDmmkCaTF3z2v2Z_Ol5OHfBAuJOICVZ4",
  authDomain: "h2-earlycrew.firebaseapp.com",
  projectId: "h2-earlycrew",
  storageBucket: "h2-earlycrew.firebasestorage.app",
  messagingSenderId: "342853006463",
  appId: "1:342853006463:web:4700f3ef31ff1aaa943b4a"
};


// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }
