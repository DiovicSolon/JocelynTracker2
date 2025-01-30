import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAMcOaJwpJEpVd2X-hgRJTLc1wBem4qHk0",
    authDomain: "jocelyn-164e5.firebaseapp.com",
    projectId: "jocelyn-164e5",
    storageBucket: "jocelyn-164e5.appspot.com", // Fixed typo in storageBucket
    messagingSenderId: "942302611824",
    appId: "1:942302611824:web:4b1e01d3a5aa99a054a7b5",
    measurementId: "G-85GGC1F5HD"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;