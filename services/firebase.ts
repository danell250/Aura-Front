import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDmr4WusWj7jTOcx_h8dFqiNoGeDWRF-Sk",
  authDomain: "aura-2d406.firebaseapp.com",
  projectId: "aura-2d406",
  storageBucket: "aura-2d406.firebasestorage.app",
  messagingSenderId: "788922070688",
  appId: "1:788922070688:web:59c8e18dd93be22fdb3bc5",
  measurementId: "G-K8VP4H8599"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, googleProvider, signInWithPopup, analytics };
