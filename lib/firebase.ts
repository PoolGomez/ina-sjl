import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseConfigParams } from './types';

const STORAGE_KEY_FIREBASE = 'eventos_ina_custom_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfigParams | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveStoredFirebaseConfig(config: FirebaseConfigParams | null) {
  if (typeof window === 'undefined') return;
  if (!config) {
    localStorage.removeItem(STORAGE_KEY_FIREBASE);
  } else {
    localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));
  }
}

export function getActiveFirebaseConfig(): FirebaseConfigParams | null {
  const custom = getStoredFirebaseConfig();
  if (custom && custom.apiKey && custom.projectId) {
    return custom;
  }

  const envConfig: FirebaseConfigParams = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initializeFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null; isConfigured: boolean } {
  const config = getActiveFirebaseConfig();

  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }

    if (!authInstance && appInstance) {
      authInstance = getAuth(appInstance);
    }

    if (!dbInstance && appInstance) {
      dbInstance = getFirestore(appInstance);
    }

    return {
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
      isConfigured: true,
    };
  } catch (err) {
    console.warn('Firebase initialization error, will fallback to local storage mode:', err);
    return { app: null, auth: null, db: null, isConfigured: false };
  }
}

export function isFirebaseReady(): boolean {
  return !!getActiveFirebaseConfig();
}
