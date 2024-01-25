import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAhIl5FEmHGAhqukRBD-eyXG5cP0tGc744",
    authDomain: "db-2-5981b.firebaseapp.com",
    projectId: "db-2-5981b",
    storageBucket: "db-2-5981b.appspot.com",
    messagingSenderId: "729941733704",
    appId: "1:729941733704:web:de94e03d16f992aa30c37d"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export default db;
