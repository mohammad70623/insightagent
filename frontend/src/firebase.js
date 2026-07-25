import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";

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
    console.error("Google Authentication Popup Error:", error);
    
    // Catch popup blocked or closed scenarios
    const popupErrorCodes = [
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request"
    ];
    
    if (popupErrorCodes.includes(error.code) || (error.message && error.message.includes("popup"))) {
      console.warn("Popup blocked or closed. Attempting Google redirect fallback...");
      try {
        await signInWithRedirect(auth, provider);
        return { redirecting: true, success: true };
      } catch (redirectError) {
        console.error("Google Redirect Fallback Error:", redirectError);
        return { error: redirectError.message, success: false };
      }
    }
    
    return { error: error.message, success: false };
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      const token = await user.getIdToken();
      return { user, token, success: true };
    }
    return null;
  } catch (error) {
    console.error("Google Redirect Result Error:", error);
    return { error: error.message, success: false };
  }
};

