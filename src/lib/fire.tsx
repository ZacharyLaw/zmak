"use client";

import { getApps, initializeApp ,getApp} from "firebase/app";
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIRE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIRE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIRE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIRE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIRE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIRE_APP_ID
};
export const firebaseApp =
  !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(firebaseApp);
