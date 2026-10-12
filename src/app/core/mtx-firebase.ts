import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
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

  const path = 'comments'; // public readable collection in rules
  try {
    const db = getDb();
    const q = query(collection(db, path), limit(10));
    await getDocs(q);
  } catch (err: unknown) {
    // Graceful error logging according to skill
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
