import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore as getFirestoreFromFirebase } from "firebase/firestore";
import { clientConfig } from "../config/client-config";

export const getFirebaseApp = () => {
  if (getApps().length) {
    return getApp();
  }

  const config = { ...clientConfig };

  // Set authDomain to current host when running in browser with HTTPS, otherwise signInWithRedirect will fail on localhost environments
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    config.authDomain = window.location.host;
  }

  return initializeApp(config);
};

export const getFirestore = () => {
  const app = getFirebaseApp();
  return getFirestoreFromFirebase(app);
};

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());

  // App relies only on server token. We make sure Firebase does not store credentials in the browser.
  // See: https://github.com/awinogrodzki/next-firebase-auth-edge/issues/143
  setPersistence(auth, inMemoryPersistence);

  if (process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST) {
    // https://stackoverflow.com/questions/73605307/firebase-auth-emulator-fails-intermittently-with-auth-emulator-config-failed
    (auth as unknown as any)._canInitEmulator = true;
    connectAuthEmulator(
      auth,
      `http://${process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST}`,
      {
        disableWarnings: true,
      },
    );
  }

  return auth;
}
