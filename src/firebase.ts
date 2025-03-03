import { getApp, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { FirebaseOptions, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbDmmkCaTF3z2v2Z_Ol5OHfBAuJOICVZ4",
  authDomain: "h2-earlycrew.firebaseapp.com",
  projectId: "h2-earlycrew",
  storageBucket: "h2-earlycrew.firebasestorage.app",
  messagingSenderId: "342853006463",
  appId: "1:342853006463:web:4700f3ef31ff1aaa943b4a",
};

interface FirebaseConfig extends FirebaseOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function createFirebaseApp(config: FirebaseConfig): FirebaseApp {
  try {
    return getApp();
  } catch {
    const app = initializeApp(config);
    initializeFirestore(app, { localCache: persistentLocalCache() });
    return app;
  }
}
createFirebaseApp(firebaseConfig);

const auth = getAuth();
const googleAuthProvider = new GoogleAuthProvider();
const firestore = getFirestore();

export { auth, googleAuthProvider, firestore };
