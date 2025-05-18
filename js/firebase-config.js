// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLpbVYHgWQZOBj48uoc--_V5Q4UlsDXQ4",
  authDomain: "flug-linkz.firebaseapp.com",
  projectId: "flug-linkz",
  storageBucket: "flug-linkz.firebasestorage.app",
  messagingSenderId: "936589541369",
  appId: "1:936589541369:web:06d7be675483f2f4338728"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
