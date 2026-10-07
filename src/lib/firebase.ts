import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const isDevPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_PREVIEW === "true";

const firebaseConfig = isDevPreview
    ? {
          apiKey: "dev-preview-api-key",
          appId: "dev-preview-app-id",
          authDomain: "dev-preview.local",
          messagingSenderId: "dev-preview-sender",
          projectId: "dev-preview-project",
          storageBucket: "dev-preview.local",
      }
    : {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      };

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
