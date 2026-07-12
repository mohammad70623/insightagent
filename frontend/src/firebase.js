import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID 
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize provider and strictly enforce custom prompt parameters
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account' // This CRUCIALLY forces the account selector window to pop up every time
});

export const signInWithGoogle = async () => {
  try {
    // Pass the fully configured provider instance here
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const token = await user.getIdToken();
    return { user, token, success: true };
  } catch (error) {
    console.error("Google Authentication Error:", error);
    return { error: error.message, success: false };
  }
};
