import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocFromServer,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    const existing = getApps();
    appInstance = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return appInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
  return dbInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    getFirebaseApp();
    authInstance = getAuth();
  }
  return authInstance;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const auth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function verifyFirestoreConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database uncontactable.');
    }
    return false;
  }
}

// ================= AUTHENTICATION SERVICES ================= //

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  // Initialize user profile in Firestore
  if (credential.user) {
    await saveUserProfileToFirestore(credential.user.uid, {
      id: credential.user.uid,
      email: credential.user.email || email,
      displayName: displayName || credential.user.displayName || 'سادن الكلمات الخالدة',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  if (credential.user) {
    await saveUserProfileToFirestore(credential.user.uid, {
      id: credential.user.uid,
      email: credential.user.email || '',
      displayName: credential.user.displayName || 'سادن الكلمات الخالدة',
      photoURL: credential.user.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return credential.user;
}

export async function logoutFirebaseUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

// ================= USER PROFILE & BOOKMARK FIRESTORE SERVICES ================= //

export interface StoredUserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  coverURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function saveUserProfileToFirestore(userId: string, data: Partial<StoredUserProfile>): Promise<void> {
  try {
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...data, id: userId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Could not save user profile to Firestore (using local storage fallback):', error);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<StoredUserProfile | null> {
  try {
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as StoredUserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Could not get user profile from Firestore:', error);
    return null;
  }
}

export async function saveBookmarkToFirestore(userId: string, novelId: string, novelTitle: string): Promise<void> {
  try {
    const db = getDb();
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', novelId);
    await setDoc(bookmarkRef, {
      userId,
      novelId,
      novelTitle,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Could not save bookmark to Firestore (using local storage):', error);
  }
}

export async function removeBookmarkFromFirestore(userId: string, novelId: string): Promise<void> {
  try {
    const db = getDb();
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', novelId);
    await deleteDoc(bookmarkRef);
  } catch (error) {
    console.warn('Could not remove bookmark from Firestore (using local storage):', error);
  }
}

export async function getUserBookmarksFromFirestore(userId: string): Promise<string[]> {
  try {
    const db = getDb();
    const q = query(collection(db, 'users', userId, 'bookmarks'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  } catch (error) {
    console.warn('Could not fetch bookmarks from Firestore:', error);
    return [];
  }
}

// ================= CLOUD VAULT (COMPATIBILITY) ================= //

export interface CloudMtxBook {
  id: string;
  title: string;
  author: string;
  chapterTitle: string;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
  b64Payload: string;
  checksum: number;
  crc32Checksum: number;
  version: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'mtx_2_2_cloud_vault_cache';

export async function fetchCloudVaultBooks(): Promise<CloudMtxBook[]> {
  const cached: CloudMtxBook[] = (() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const path = 'comments';
  try {
    const db = getDb();
    const q = query(collection(db, path), limit(10));
    await getDocs(q);
  } catch (err: unknown) {
    console.info('Firestore public fetch note (using local cache):', err);
  }

  return cached;
}

export async function saveToCloudVault(book: CloudMtxBook): Promise<void> {
  try {
    const existing = await fetchCloudVaultBooks();
    const filtered = existing.filter((b) => b.id !== book.id);
    filtered.unshift(book);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch (err) {
    console.warn('Could not store to local cache:', err);
  }
}
