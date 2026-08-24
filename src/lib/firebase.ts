import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirebaseClientConfig } from "./env";

const firebaseConfig = getFirebaseClientConfig();

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
