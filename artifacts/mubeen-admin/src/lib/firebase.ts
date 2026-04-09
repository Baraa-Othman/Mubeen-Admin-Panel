import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAz114uMV8M2kkfABy58xvxgzcxQglFpeI",
  authDomain: "mubeen-eb436.firebaseapp.com",
  projectId: "mubeen-eb436",
  storageBucket: "mubeen-eb436.firebasestorage.app",
  messagingSenderId: "712969723490",
  appId: "1:712969723490:web:673236e156ad391b77fb3b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
