'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeFirebase } from './firebase';
import {
  UserRole,
  AppUserProfile,
  DEFAULT_PERMISOS_BY_ROLE,
} from './types';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemo?: boolean;
  role: UserRole;
  permisos: AppUserProfile['permisos'];
  isSuperAdmin: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, displayName?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (email?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseConnected: false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  loginDemo: () => {},
  signOut: async () => {},
});

/**
 * Reads the user's role from Firestore user_profiles/{uid}.
 * If the profile doesn't exist yet, creates it in Firestore with the given defaultRole.
 */
async function loadOrCreateProfile(
  db: ReturnType<typeof import('firebase/firestore').getFirestore>,
  fbUser: FirebaseUser,
  defaultRole: UserRole = 'cajero'
): Promise<AppUser> {
  const profileRef = doc(db, 'user_profiles', fbUser.uid);
  let profile: AppUserProfile | null = null;

  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      profile = snap.data() as AppUserProfile;
    }
  } catch (err) {
    console.error('Error reading user profile from Firestore:', err);
  }

  if (!profile) {
    profile = {
      uid: fbUser.uid,
      email: fbUser.email ?? '',
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
      role: defaultRole,
      permisos: DEFAULT_PERMISOS_BY_ROLE[defaultRole],
      activo: true,
      fechaCreacion: new Date().toISOString(),
    };
    try {
      await setDoc(profileRef, profile);
    } catch (err) {
      console.error('Error creating user profile in Firestore:', err);
    }
  }

  const role: UserRole = profile.role;
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: profile.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
    role,
    permisos: {
      ...DEFAULT_PERMISOS_BY_ROLE[role],
      ...(profile.permisos || {}),
    },
    isSuperAdmin: role === 'superadmin',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  useEffect(() => {
    const { auth, db, isConfigured } = initializeFirebase();
    setIsFirebaseConnected(isConfigured && !!auth);

    if (isConfigured && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const appUser = await loadOrCreateProfile(db, fbUser);
          setUser(appUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { auth, db, isConfigured } = initializeFirebase();
    if (isConfigured && auth && db) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const appUser = await loadOrCreateProfile(db, cred.user);
        setUser(appUser);
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al iniciar sesión';
        return { success: false, error: errorMsg };
      }
    }
    return {
      success: false,
      error: 'No hay conexión activa con la base de datos Firebase.',
    };
  };

  const signUp = async (
    email: string,
    pass: string,
    displayName?: string,
    role: UserRole = 'cajero'
  ) => {
    const { db, isConfigured } = initializeFirebase();
    const config = (await import('./firebase')).getActiveFirebaseConfig();
    if (isConfigured && db && config) {
      const secondaryAppName = `registro-temp-${Date.now()}`;
      const secondaryApp = initializeApp(config, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        const resolvedName = displayName || email.split('@')[0];
        const profileRef = doc(db, 'user_profiles', cred.user.uid);
        const profile: AppUserProfile = {
          uid: cred.user.uid,
          email,
          displayName: resolvedName,
          role,
          permisos: DEFAULT_PERMISOS_BY_ROLE[role],
          activo: true,
          fechaCreacion: new Date().toISOString(),
        };
        await setDoc(profileRef, profile);
        return { success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al registrar usuario';
        return { success: false, error: errorMsg };
      } finally {
        try {
          await fbSignOut(secondaryAuth);
        } catch {
          // ignore
        }
        try {
          await deleteApp(secondaryApp);
        } catch {
          // ignore
        }
      }
    }
    return {
      success: false,
      error: 'No hay conexión activa con la base de datos Firebase.',
    };
  };

  const loginDemo = () => {
    // Local demo mode removed; all authentication requires Firebase
  };

  const signOut = async () => {
    const { auth } = initializeFirebase();
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {
        // ignore
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConnected,
        signIn,
        signUp,
        loginDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
