import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  deleteUser,
  signOut,
  updateProfile,
  onAuthStateChanged,
  onIdTokenChanged,
  Unsubscribe,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  collection,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../../../firebase-applet-config.json';
import {
  FullAccountProfile,
  NovelCard,
  PrivacySettings,
  PublishedNovelRecord,
  PublicProfile,
  UserRoleRecord,
  UsernameCheckResult,
  VerifiedWriterStatus,
  WriterApplication,
} from './models/library.models';

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

export interface StoredUserProfile {
  id: string;
  email: string;
  displayName?: string;
  username?: string;
  bio?: string;
  photoURL?: string;
  coverURL?: string;
  isPublic?: boolean;
  showSavedNovels?: boolean;
  showReadingHistory?: boolean;
  showProfileInfo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'support',
  'help',
  'root',
  'system',
  'moderator',
  'mod',
  'staff',
  'founder',
  'api',
  'auth',
  'login',
  'register',
  'profile',
  'settings',
  'explore',
  'reading',
  'details',
  'mtx',
  'official',
  'null',
  'undefined',
  'account',
  'writer',
  'author',
]);

const DESIGNATED_ADMIN_EMAILS = new Set(['alsaid66900@gmail.com', 'zly30257@gmail.com']);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let persistencePromise: Promise<void> | null = null;

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
    const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    dbInstance = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
  }
  return dbInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
    authInstance.languageCode = 'ar';
  }
  return authInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    const app = getFirebaseApp();
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

export async function ensureAuthPersistence(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!persistencePromise) {
    const auth = getFirebaseAuth();
    persistencePromise = setPersistence(auth, indexedDBLocalPersistence)
      .catch(() => setPersistence(auth, browserLocalPersistence))
      .catch((err) => {
        console.warn('Auth persistence setup fallback warning:', err);
      });
  }
  return persistencePromise;
}

export async function waitForAuthSessionReady(): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  await ensureAuthPersistence();
  const auth = getFirebaseAuth();
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  return auth.currentUser;
}

export async function refreshAuthTokenIfNeeded(user: User | null): Promise<void> {
  if (!user) return;
  try {
    await user.getIdToken(false);
  } catch (err) {
    console.warn('Session token check warning:', err);
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
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

function isPermissionDeniedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions');
}

export async function verifyFirestoreConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || msg.includes('unavailable')) {
      console.error('Please check your Firebase configuration (Firestore offline/unreachable):', msg);
      return false;
    }
    // A permission-denied or not-found response from getDocFromServer confirms the server is reachable
    return true;
  }
}

// ================= AUTHENTICATION SERVICES ================= //

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  await ensureAuthPersistence();
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  if (credential.user) {
    await ensureUserDocumentsOnLogin(credential.user).catch((err) => {
      console.warn('Login Firestore doc sync warning:', err);
    });
  }
  return credential.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  await ensureAuthPersistence();
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  if (credential.user) {
    await ensureUserDocumentsOnLogin(credential.user, displayName).catch((err) => {
      console.warn('Register Firestore doc sync warning:', err);
    });
  }
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  await ensureAuthPersistence();
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  if (credential.user) {
    await ensureUserDocumentsOnLogin(credential.user).catch((err) => {
      console.warn('Google login Firestore doc sync warning:', err);
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

export function subscribeToTokenState(callback: (user: User | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  return onIdTokenChanged(auth, callback);
}

// ================= USERNAME HELPERS (CASE-INSENSITIVE & ATOMIC) ================= //

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsernameFormat(raw: string): {
  valid: boolean;
  normalized: string;
  reserved?: boolean;
  reason?: string;
} {
  const normalized = normalizeUsername(raw);
  if (!normalized) {
    return { valid: false, normalized, reason: 'يرجى كتابة اسم مستخدم.' };
  }
  if (normalized.length < 3 || normalized.length > 24) {
    return {
      valid: false,
      normalized,
      reason: 'يجب أن يتراوح طول اسم المستخدم بين ٣ و٢٤ حرفاً.',
    };
  }
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason: 'يُسمح فقط بالأحرف اللاتينية (a-z) والأرقام والشرطة السفلية (_).',
    };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      valid: false,
      normalized,
      reserved: true,
      reason: 'هذا الاسم محجوز للنظام ولا يمكن استخدامه.',
    };
  }
  return { valid: true, normalized };
}

export async function checkUsernameAvailability(
  rawUsername: string,
  currentUid?: string,
  currentSavedUsername?: string
): Promise<UsernameCheckResult> {
  const validation = validateUsernameFormat(rawUsername);
  if (!validation.normalized) {
    return {
      status: 'idle',
      normalized: '',
      message: '',
      suggestions: [],
    };
  }

  if (validation.reserved) {
    return {
      status: 'reserved',
      normalized: validation.normalized,
      message: validation.reason || 'هذا الاسم محجوز للنظام.',
      suggestions: [],
    };
  }

  if (!validation.valid) {
    return {
      status: 'invalid',
      normalized: validation.normalized,
      message: validation.reason || 'صيغة اسم المستخدم غير صالحة.',
      suggestions: [],
    };
  }

  if (currentSavedUsername && normalizeUsername(currentSavedUsername) === validation.normalized) {
    return {
      status: 'unchanged',
      normalized: validation.normalized,
      message: 'هذا هو اسم المستخدم الحالي الخاص بك.',
      suggestions: [],
    };
  }

  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'usernames', validation.normalized));
    if (!snap.exists()) {
      return {
        status: 'available',
        normalized: validation.normalized,
        message: `الاسم @${validation.normalized} متاح ويمكنك اعتماده.`,
        suggestions: [],
      };
    }

    const ownerUid = (snap.data() as { uid?: string })?.uid;
    if (currentUid && ownerUid === currentUid) {
      return {
        status: 'unchanged',
        normalized: validation.normalized,
        message: 'هذا الاسم مسجل باسم حسابك حالياً.',
        suggestions: [],
      };
    }

    const base = validation.normalized.slice(0, 20);
    const candidateExamples = [`${base}5`, `${base}_5`, `${base}2`].filter(
      (s) => s.length <= 24 && !RESERVED_USERNAMES.has(s)
    );
    const suggestions: string[] = [];
    for (const candidate of candidateExamples) {
      try {
        const cSnap = await getDoc(doc(db, 'usernames', candidate));
        if (!cSnap.exists()) {
          suggestions.push(candidate);
        }
      } catch {
        suggestions.push(candidate);
      }
      if (suggestions.length >= 2) break;
    }

    return {
      status: 'taken',
      normalized: validation.normalized,
      message: `الاسم @${validation.normalized} محجوز لحساب آخر، يمكنك إجراء تعديل بسيط أو تجربة أمثلة متاحة.`,
      suggestions,
    };
  } catch (err) {
    console.warn('Username availability check warning:', err);
    return {
      status: 'invalid',
      normalized: validation.normalized,
      message: 'تعذر التحقق من توفر الاسم حالياً، تأكد من اتصالك بالإنترنت.',
      suggestions: [],
    };
  }
}

export async function resolveUsernameToUid(rawUsername: string): Promise<{
  uid: string | null;
  redirectedTo?: string;
}> {
  const normalized = normalizeUsername(rawUsername);
  if (!normalized || !/^[a-z0-9_]{3,24}$/.test(normalized)) {
    return { uid: null };
  }
  const db = getDb();
  try {
    const activeSnap = await getDoc(doc(db, 'usernames', normalized));
    if (activeSnap.exists()) {
      const data = activeSnap.data() as { uid?: string };
      return { uid: data.uid || null };
    }

    const redirectSnap = await getDoc(doc(db, 'username_redirects', normalized));
    if (redirectSnap.exists()) {
      const data = redirectSnap.data() as { uid?: string; currentUsername?: string };
      return {
        uid: data.uid || null,
        redirectedTo: data.currentUsername || undefined,
      };
    }
    return { uid: null };
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, `usernames/${normalized}`);
    }
    console.warn('Error resolving username:', err);
    throw err;
  }
}

// ================= USER INITIALIZATION & PROFILE CRUD ================= //

export async function ensureUserDocumentsOnLogin(
  user: User,
  overrideDisplayName?: string
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const userRef = doc(db, 'users', user.uid);
  const publicRef = doc(db, 'public_profiles', user.uid);
  const bioRef = doc(db, 'public_profiles', user.uid, 'details', 'bio');
  const savedStatRef = doc(db, 'public_profiles', user.uid, 'stats', 'saved');
  const readingStatRef = doc(db, 'public_profiles', user.uid, 'stats', 'reading');

  const initialDisplayName =
    overrideDisplayName?.trim() || user.displayName?.trim() || 'قارئ أروقة الخلود';
  const initialEmail = user.email || '';
  const initialPhoto = user.photoURL || '';

  try {
    const [userSnap, publicSnap] = await Promise.all([getDoc(userRef), getDoc(publicRef)]);
    const batch = writeBatch(db);
    let hasWrites = false;

    if (!userSnap.exists()) {
      batch.set(userRef, {
        id: user.uid,
        email: initialEmail,
        displayName: initialDisplayName,
        username: '',
        bio: '',
        photoURL: initialPhoto,
        coverURL: '',
        isPublic: true,
        showSavedNovels: true,
        showReadingHistory: true,
        showProfileInfo: true,
        createdAt: now,
        updatedAt: now,
      });
      hasWrites = true;
    }

    if (!publicSnap.exists()) {
      const existingPrivate = userSnap.exists() ? (userSnap.data() as StoredUserProfile) : null;
      batch.set(publicRef, {
        uid: user.uid,
        displayName: existingPrivate?.displayName || initialDisplayName,
        username: existingPrivate?.username || '',
        photoURL: existingPrivate?.photoURL || initialPhoto,
        coverURL: existingPrivate?.coverURL || '',
        isPublic: existingPrivate?.isPublic ?? true,
        showSavedNovels: existingPrivate?.showSavedNovels ?? true,
        showReadingHistory: existingPrivate?.showReadingHistory ?? true,
        showProfileInfo: existingPrivate?.showProfileInfo ?? true,
        createdAt: existingPrivate?.createdAt || now,
        updatedAt: now,
      });
      batch.set(bioRef, {
        uid: user.uid,
        bio: existingPrivate?.bio || '',
        updatedAt: now,
      });
      batch.set(savedStatRef, { uid: user.uid, count: 0, updatedAt: now });
      batch.set(readingStatRef, { uid: user.uid, count: 0, updatedAt: now });
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
    }
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
    throw error;
  }
}

export async function loadOwnerAccountProfile(uid: string): Promise<FullAccountProfile | null> {
  const db = getDb();
  const auth = getFirebaseAuth();
  try {
    const [initialUserSnap, initialPublicSnap, initialBioSnap, bookmarksSnap, historySnap] =
      await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'public_profiles', uid)),
        getDoc(doc(db, 'public_profiles', uid, 'details', 'bio')).catch(() => null),
        getDocs(query(collection(db, 'users', uid, 'bookmarks'), limit(200))).catch(() => null),
        getDocs(query(collection(db, 'users', uid, 'history'), limit(500))).catch(() => null),
      ]);

    let userSnap = initialUserSnap;
    let publicSnap = initialPublicSnap;
    let bioSnap = initialBioSnap;

    // Self-heal if authenticated user's initial Firestore docs were never created yet
    if ((!userSnap.exists() || !publicSnap.exists()) && auth.currentUser?.uid === uid) {
      await ensureUserDocumentsOnLogin(auth.currentUser);
      [userSnap, publicSnap, bioSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'public_profiles', uid)),
        getDoc(doc(db, 'public_profiles', uid, 'details', 'bio')).catch(() => null),
      ]);
    }

    const priv = userSnap.exists() ? (userSnap.data() as StoredUserProfile) : null;
    const pub = publicSnap.exists() ? (publicSnap.data() as PublicProfile) : null;
    const bioDoc = bioSnap && bioSnap.exists() ? (bioSnap.data() as { bio?: string }) : null;

    if (!priv && !pub) return null;

    const savedCount = bookmarksSnap ? bookmarksSnap.size : 0;
    const readCount = historySnap ? historySnap.size : 0;

    return {
      uid,
      email: priv?.email || auth.currentUser?.email || '',
      displayName: pub?.displayName || priv?.displayName || 'قارئ أروقة الخلود',
      username: pub?.username || priv?.username || '',
      bio: bioDoc?.bio ?? priv?.bio ?? '',
      photoURL: pub?.photoURL ?? priv?.photoURL ?? '',
      coverURL: pub?.coverURL ?? priv?.coverURL ?? '',
      isPublic: pub?.isPublic ?? priv?.isPublic ?? true,
      showSavedNovels: pub?.showSavedNovels ?? priv?.showSavedNovels ?? true,
      showReadingHistory: pub?.showReadingHistory ?? priv?.showReadingHistory ?? true,
      showProfileInfo: pub?.showProfileInfo ?? priv?.showProfileInfo ?? true,
      savedNovelsCount: savedCount,
      readChaptersCount: readCount,
      createdAt: pub?.createdAt || priv?.createdAt,
      updatedAt: pub?.updatedAt || priv?.updatedAt,
    };
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
    throw err;
  }
}

export async function loadVisitorAccountProfile(targetUid: string): Promise<{
  state: 'ok' | 'private' | 'not_found' | 'error';
  profile?: FullAccountProfile;
  savedNovels?: NovelCard[];
}> {
  const db = getDb();
  let pubSnap;
  try {
    pubSnap = await getDoc(doc(db, 'public_profiles', targetUid));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      return { state: 'private' };
    }
    return { state: 'error' };
  }

  if (!pubSnap.exists()) {
    return { state: 'not_found' };
  }

  const pub = pubSnap.data() as PublicProfile;
  if (!pub.isPublic) {
    return { state: 'private' };
  }

  // Read privacy-gated subdocuments independently (Firestore rules enforce visibility server-side)
  let bio = '';
  if (pub.showProfileInfo) {
    try {
      const bioSnap = await getDoc(doc(db, 'public_profiles', targetUid, 'details', 'bio'));
      if (bioSnap.exists()) {
        bio = (bioSnap.data() as { bio?: string })?.bio || '';
      }
    } catch {
      bio = '';
    }
  }

  let savedNovelsCount: number | null = null;
  let savedNovels: NovelCard[] = [];
  if (pub.showSavedNovels) {
    try {
      const [statSnap, savedSnap] = await Promise.all([
        getDoc(doc(db, 'public_profiles', targetUid, 'stats', 'saved')),
        getDocs(query(collection(db, 'public_profiles', targetUid, 'saved_novels'), limit(50))),
      ]);
      savedNovels = savedSnap.docs.map((d) => {
        const data = d.data() as {
          novelId?: string;
          novelTitle?: string;
          author?: string;
          genre?: string;
          coverUrl?: string;
        };
        return {
          id: data.novelId || d.id,
          title: data.novelTitle || 'عمل أدبي محفوظ',
          author: data.author || 'أروقة الخلود',
          genre: data.genre || 'رواية',
          coverUrl: data.coverUrl || '/images/writers_sanctuary_bg.jpg',
          coverAlt: data.novelTitle || 'غلاف الرواية',
        };
      });
      savedNovelsCount = statSnap.exists()
        ? Number((statSnap.data() as { count?: number })?.count ?? savedNovels.length)
        : savedNovels.length;
    } catch {
      savedNovelsCount = null;
    }
  }

  let readChaptersCount: number | null = null;
  if (pub.showReadingHistory) {
    try {
      const readSnap = await getDoc(doc(db, 'public_profiles', targetUid, 'stats', 'reading'));
      if (readSnap.exists()) {
        readChaptersCount = Number((readSnap.data() as { count?: number })?.count ?? 0);
      } else {
        readChaptersCount = 0;
      }
    } catch {
      readChaptersCount = null;
    }
  }

  return {
    state: 'ok',
    profile: {
      ...pub,
      bio: pub.showProfileInfo ? bio : '',
      displayName: pub.showProfileInfo ? pub.displayName : 'قارئ في أروقة الخلود',
      savedNovelsCount,
      readChaptersCount,
    },
    savedNovels,
  };
}

export async function saveAccountProfileChanges(
  uid: string,
  updates: {
    displayName: string;
    username: string;
    bio: string;
    photoURL: string;
    coverURL: string;
  },
  previousUsername: string,
  privacy: PrivacySettings
): Promise<{ savedUsername: string }> {
  const db = getDb();
  const auth = getFirebaseAuth();
  const now = new Date().toISOString();

  const cleanDisplayName = updates.displayName.trim().slice(0, 80);
  if (!cleanDisplayName) {
    throw new Error('يرجى إدخال اسم العرض.');
  }

  const cleanBio = updates.bio.trim().slice(0, 320);
  const prevNorm = normalizeUsername(previousUsername || '');
  const nextRaw = updates.username.trim();
  let nextNorm = prevNorm;

  if (nextRaw) {
    const validation = validateUsernameFormat(nextRaw);
    if (!validation.valid) {
      throw new Error(validation.reason || 'اسم المستخدم غير صالح.');
    }
    nextNorm = validation.normalized;
  } else {
    nextNorm = '';
  }

  try {
    await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'users', uid);
      const publicRef = doc(db, 'public_profiles', uid);
      const bioRef = doc(db, 'public_profiles', uid, 'details', 'bio');

      const [userSnap, publicSnap] = await Promise.all([tx.get(userRef), tx.get(publicRef)]);
      const sameUsernameRef = nextNorm && nextNorm === prevNorm ? doc(db, 'usernames', nextNorm) : null;
      const sameUsernameSnap = sameUsernameRef ? await tx.get(sameUsernameRef) : null;
      const email = auth.currentUser?.email || (userSnap.data() as StoredUserProfile | undefined)?.email || '';

      if (nextNorm && nextNorm !== prevNorm) {
        const nextUsernameRef = doc(db, 'usernames', nextNorm);
        const existingClaim = await tx.get(nextUsernameRef);
        if (existingClaim.exists() && (existingClaim.data() as { uid?: string })?.uid !== uid) {
          throw new Error('USERNAME_TAKEN');
        }

        if (prevNorm) {
          const oldUsernameRef = doc(db, 'usernames', prevNorm);
          const oldSnap = await tx.get(oldUsernameRef);
          if (oldSnap.exists() && (oldSnap.data() as { uid?: string })?.uid === uid) {
            tx.delete(oldUsernameRef);
          }
          tx.set(doc(db, 'username_redirects', prevNorm), {
            uid,
            currentUsername: nextNorm,
            updatedAt: now,
          });
        }

        tx.set(nextUsernameRef, {
          uid,
          username: nextNorm,
          isPublic: privacy.isPublic,
          updatedAt: now,
        });
      } else if (sameUsernameRef) {
        if (sameUsernameSnap && sameUsernameSnap.exists()) {
          tx.update(sameUsernameRef, {
            isPublic: privacy.isPublic,
            updatedAt: now,
          });
        } else if (nextNorm) {
          tx.set(sameUsernameRef, {
            uid,
            username: nextNorm,
            isPublic: privacy.isPublic,
            updatedAt: now,
          });
        }
      }

      if (!publicSnap.exists()) {
        tx.set(publicRef, {
          uid,
          displayName: cleanDisplayName,
          username: nextNorm,
          photoURL: updates.photoURL,
          coverURL: updates.coverURL,
          isPublic: privacy.isPublic,
          showSavedNovels: privacy.showSavedNovels,
          showReadingHistory: privacy.showReadingHistory,
          showProfileInfo: privacy.showProfileInfo,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        tx.update(publicRef, {
          displayName: cleanDisplayName,
          username: nextNorm,
          photoURL: updates.photoURL,
          coverURL: updates.coverURL,
          updatedAt: now,
        });
      }

      tx.set(bioRef, {
        uid,
        bio: cleanBio,
        updatedAt: now,
      });

      if (!userSnap.exists()) {
        tx.set(userRef, {
          id: uid,
          email,
          displayName: cleanDisplayName,
          username: nextNorm,
          bio: cleanBio,
          photoURL: updates.photoURL,
          coverURL: updates.coverURL,
          isPublic: privacy.isPublic,
          showSavedNovels: privacy.showSavedNovels,
          showReadingHistory: privacy.showReadingHistory,
          showProfileInfo: privacy.showProfileInfo,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        tx.update(userRef, {
          displayName: cleanDisplayName,
          username: nextNorm,
          bio: cleanBio,
          photoURL: updates.photoURL,
          coverURL: updates.coverURL,
          updatedAt: now,
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'USERNAME_TAKEN') {
      throw new Error(`اسم المستخدم @${nextNorm} محجوز بالفعل لحساب آخر.`);
    }
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `public_profiles/${uid}`);
    }
    throw err;
  }

  if (auth.currentUser) {
    const profilePatch: { displayName?: string; photoURL?: string } = {
      displayName: cleanDisplayName,
    };
    if (updates.photoURL && updates.photoURL.startsWith('http')) {
      profilePatch.photoURL = updates.photoURL;
    }
    await updateProfile(auth.currentUser, profilePatch).catch(() => false);
  }

  return { savedUsername: nextNorm };
}

export async function savePrivacySettingsToFirestore(
  uid: string,
  privacy: PrivacySettings,
  currentUsername?: string
): Promise<void> {
  const db = getDb();
  const auth = getFirebaseAuth();
  const now = new Date().toISOString();
  const normUsername = normalizeUsername(currentUsername || '');

  try {
    const publicRef = doc(db, 'public_profiles', uid);
    const userRef = doc(db, 'users', uid);
    const usernameRef = normUsername ? doc(db, 'usernames', normUsername) : null;

    const [publicSnap, userSnap, usernameSnap] = await Promise.all([
      getDoc(publicRef),
      getDoc(userRef),
      usernameRef ? getDoc(usernameRef) : Promise.resolve(null),
    ]);

    const batch = writeBatch(db);
    if (publicSnap.exists()) {
      batch.update(publicRef, {
        isPublic: privacy.isPublic,
        showSavedNovels: privacy.showSavedNovels,
        showReadingHistory: privacy.showReadingHistory,
        showProfileInfo: privacy.showProfileInfo,
        updatedAt: now,
      });
    } else {
      batch.set(publicRef, {
        uid,
        displayName: auth.currentUser?.displayName || 'قارئ أروقة الخلود',
        username: normUsername,
        photoURL: auth.currentUser?.photoURL || '',
        coverURL: '',
        isPublic: privacy.isPublic,
        showSavedNovels: privacy.showSavedNovels,
        showReadingHistory: privacy.showReadingHistory,
        showProfileInfo: privacy.showProfileInfo,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (userSnap.exists()) {
      batch.update(userRef, {
        isPublic: privacy.isPublic,
        showSavedNovels: privacy.showSavedNovels,
        showReadingHistory: privacy.showReadingHistory,
        showProfileInfo: privacy.showProfileInfo,
        updatedAt: now,
      });
    } else {
      batch.set(userRef, {
        id: uid,
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.displayName || 'قارئ أروقة الخلود',
        username: normUsername,
        bio: '',
        photoURL: auth.currentUser?.photoURL || '',
        coverURL: '',
        isPublic: privacy.isPublic,
        showSavedNovels: privacy.showSavedNovels,
        showReadingHistory: privacy.showReadingHistory,
        showProfileInfo: privacy.showProfileInfo,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (usernameRef && usernameSnap && usernameSnap.exists()) {
      batch.update(usernameRef, {
        isPublic: privacy.isPublic,
        updatedAt: now,
      });
    }

    await batch.commit();
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `public_profiles/${uid}`);
    }
    throw err;
  }
}

// ================= PROFILE IMAGE STORAGE UPLOAD ================= //

export async function uploadProfileImageAsset(
  uid: string,
  kind: 'avatar' | 'banner',
  blob: Blob,
  fallbackDataUrl: string,
  previousUrl?: string
): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('انقطع الاتصال بالإنترنت أثناء رفع الصورة. يرجى المحاولة لاحقاً.');
  }

  try {
    const storage = getFirebaseStorage();
    const path = `users/${uid}/${kind}_${Date.now()}.webp`;
    const fileRef = storageRef(storage, path);

    const uploadTask = uploadBytes(fileRef, blob, {
      contentType: blob.type || 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 2000)
    );

    const snap = await Promise.race([uploadTask, timeoutPromise]);
    const url = await getDownloadURL(snap.ref);

    if (previousUrl && previousUrl.includes('firebasestorage.googleapis.com')) {
      try {
        await deleteObject(storageRef(storage, previousUrl));
      } catch {
        // Ignore stale image cleanup failure
      }
    }
    return url;
  } catch {
    // Seamless fallback to compact WebP data URI when Cloud Storage is not enabled or requires Blaze plan
    if (fallbackDataUrl && fallbackDataUrl.length <= 420000) {
      return fallbackDataUrl;
    }
    throw new Error('تعذر معالجة الصورة. يرجى تجربة ملف أصغر حجماً.');
  }
}

// ================= BOOKMARKS & READING HISTORY SYNC ================= //

export async function saveBookmarkToFirestore(
  userId: string,
  novel: Pick<NovelCard, 'id' | 'title' | 'author' | 'genre' | 'coverUrl'>,
  totalSavedCount?: number
): Promise<void> {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    const payload = {
      userId,
      novelId: novel.id,
      novelTitle: novel.title,
      author: novel.author || 'أروقة الخلود',
      genre: novel.genre || 'رواية',
      coverUrl: novel.coverUrl || '/images/writers_sanctuary_bg.jpg',
      createdAt: now,
    };

    batch.set(doc(db, 'users', userId, 'bookmarks', novel.id), payload);
    batch.set(doc(db, 'public_profiles', userId, 'saved_novels', novel.id), payload);
    if (typeof totalSavedCount === 'number') {
      batch.set(doc(db, 'public_profiles', userId, 'stats', 'saved'), {
        uid: userId,
        count: totalSavedCount,
        updatedAt: now,
      });
    }
    await batch.commit();
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/bookmarks/${novel.id}`);
    }
    console.warn('Could not save bookmark to Firestore:', error);
  }
}

export async function removeBookmarkFromFirestore(
  userId: string,
  novelId: string,
  totalSavedCount?: number
): Promise<void> {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', userId, 'bookmarks', novelId));
    batch.delete(doc(db, 'public_profiles', userId, 'saved_novels', novelId));
    if (typeof totalSavedCount === 'number') {
      batch.set(doc(db, 'public_profiles', userId, 'stats', 'saved'), {
        uid: userId,
        count: totalSavedCount,
        updatedAt: now,
      });
    }
    await batch.commit();
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/bookmarks/${novelId}`);
    }
    console.warn('Could not remove bookmark from Firestore:', error);
  }
}

export async function syncSavedNovelsCountToFirestore(
  userId: string,
  count: number
): Promise<void> {
  try {
    const db = getDb();
    await setDoc(doc(db, 'public_profiles', userId, 'stats', 'saved'), {
      uid: userId,
      count,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `public_profiles/${userId}/stats/saved`);
    }
    console.warn('Could not sync saved count:', err);
  }
}

export async function getUserBookmarksFromFirestore(userId: string): Promise<string[]> {
  try {
    const db = getDb();
    const q = query(collection(db, 'users', userId, 'bookmarks'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/bookmarks`);
    }
    console.warn('Could not fetch bookmarks from Firestore:', error);
    return [];
  }
}

export async function recordChapterReadInFirestore(
  userId: string,
  novelId: string,
  novelTitle: string,
  chapterId: number,
  chapterTitle: string
): Promise<number> {
  const db = getDb();
  const safeNovel = novelId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const historyDocId = `${safeNovel}__ch_${chapterId}`;
  const now = new Date().toISOString();

  try {
    await setDoc(doc(db, 'users', userId, 'history', historyDocId), {
      userId,
      novelId,
      novelTitle,
      chapterId,
      chapterTitle,
      readAt: now,
    });
    const historySnap = await getDocs(query(collection(db, 'users', userId, 'history'), limit(500)));
    const count = historySnap.size;
    await setDoc(doc(db, 'public_profiles', userId, 'stats', 'reading'), {
      uid: userId,
      count,
      updatedAt: now,
    });
    return count;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/history/${historyDocId}`);
    }
    console.warn('Could not record reading history:', err);
    return 0;
  }
}

export async function getUserReadChaptersCount(userId: string): Promise<number> {
  try {
    const db = getDb();
    const historySnap = await getDocs(query(collection(db, 'users', userId, 'history'), limit(500)));
    return historySnap.size;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/history`);
    }
    return 0;
  }
}

// ================= WRITER ROLE VERIFICATION & APPLICATIONS ================= //

export async function getVerifiedWriterStatus(userId: string): Promise<VerifiedWriterStatus> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  const isCurrentDesignatedAdmin =
    Boolean(currentUser) &&
    currentUser?.uid === userId &&
    currentUser?.emailVerified === true &&
    Boolean(currentUser?.email && DESIGNATED_ADMIN_EMAILS.has(currentUser.email));

  const db = getDb();
  try {
    const roleSnap = await getDoc(doc(db, 'user_roles', userId));
    if (roleSnap.exists()) {
      const record = roleSnap.data() as UserRoleRecord;
      const isActive = record.status === 'active';
      const hasAuthorRole =
        record.role === 'author' ||
        record.role === 'founder' ||
        (Array.isArray(record.roles) &&
          (record.roles.includes('author') || record.roles.includes('founder')));

      const isFounder = record.role === 'founder' && isActive;
      const isBadge = isCurrentDesignatedAdmin || (isActive && hasAuthorRole);
      const canPublish =
        isCurrentDesignatedAdmin || isFounder || (isActive && hasAuthorRole && record.canPublish === true);

      return {
        isWriterBadge: isBadge,
        canPublish,
        isAdmin: isCurrentDesignatedAdmin || isFounder,
        roleRecord: record,
      };
    }
  } catch (err) {
    console.warn('Error fetching user role:', err);
  }

  return {
    isWriterBadge: isCurrentDesignatedAdmin,
    canPublish: isCurrentDesignatedAdmin,
    isAdmin: isCurrentDesignatedAdmin,
    roleRecord: null,
  };
}

export async function getWriterApplicationFromFirestore(
  userId: string
): Promise<WriterApplication | null> {
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'writer_applications', userId));
    if (!snap.exists()) return null;
    return snap.data() as WriterApplication;
  } catch (err) {
    console.warn('Could not load writer application:', err);
    return null;
  }
}

export async function submitWriterApplicationToFirestore(
  userId: string,
  payload: {
    penName: string;
    shortBio: string;
    genres: string[];
    writingSample: string;
  }
): Promise<WriterApplication> {
  const db = getDb();
  const now = new Date().toISOString();
  const appRef = doc(db, 'writer_applications', userId);
  const existing = await getDoc(appRef);

  if (existing.exists()) {
    const prev = existing.data() as WriterApplication;
    if (prev.status === 'pending') {
      throw new Error('لديك طلب قيد المراجعة حالياً، لا يمكن إرسال طلب مكرر.');
    }
    if (prev.status === 'approved') {
      throw new Error('تمت الموافقة على طلبك مسبقاً.');
    }

    const updatedPayload = {
      penName: payload.penName.trim(),
      shortBio: payload.shortBio.trim(),
      genres: payload.genres,
      writingSample: payload.writingSample.trim(),
      status: 'pending' as const,
      submittedAt: now,
      updatedAt: now,
    };

    try {
      await updateDoc(appRef, updatedPayload);
      return {
        ...prev,
        ...updatedPayload,
      };
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, `writer_applications/${userId}`);
      }
      throw err;
    }
  }

  const newApplication: WriterApplication = {
    userId,
    penName: payload.penName.trim(),
    shortBio: payload.shortBio.trim(),
    genres: payload.genres,
    writingSample: payload.writingSample.trim(),
    status: 'pending',
    submittedAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(appRef, newApplication);
    return newApplication;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `writer_applications/${userId}`);
    }
    throw err;
  }
}

export async function fetchPendingWriterApplicationsForAdmin(): Promise<WriterApplication[]> {
  const db = getDb();
  try {
    const q = query(
      collection(db, 'writer_applications'),
      where('status', '==', 'pending'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as WriterApplication);
  } catch (err) {
    console.warn('Admin applications fetch warning:', err);
    return [];
  }
}

export async function reviewWriterApplicationAsAdmin(
  applicantUid: string,
  decision: 'approved' | 'rejected',
  adminUid: string,
  reviewNote = ''
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const batch = writeBatch(db);

  batch.update(doc(db, 'writer_applications', applicantUid), {
    status: decision,
    reviewNote: reviewNote.trim(),
    reviewedBy: adminUid,
    reviewedAt: now,
    updatedAt: now,
  });

  if (decision === 'approved') {
    batch.set(doc(db, 'user_roles', applicantUid), {
      userId: applicantUid,
      role: 'author',
      roles: ['author'],
      status: 'active',
      canPublish: true,
      assignedBy: adminUid,
      assignedAt: now,
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `writer_applications/${applicantUid}`);
    }
    throw err;
  }
}

// ================= PUBLISHED NOVELS (PUBLIC CONTENT) ================= //

export async function publishNovelToFirestore(
  novel: PublishedNovelRecord
): Promise<PublishedNovelRecord> {
  const db = getDb();
  try {
    await setDoc(doc(db, 'novels', novel.id), novel);
    return novel;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `novels/${novel.id}`);
    }
    throw err;
  }
}

export async function fetchAuthorPublishedNovels(authorId: string): Promise<PublishedNovelRecord[]> {
  const db = getDb();
  const auth = getFirebaseAuth();
  try {
    // Use single-field queries so no manual Firestore composite index is required
    if (auth.currentUser?.uid === authorId) {
      const q = query(collection(db, 'novels'), where('authorId', '==', authorId), limit(50));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => d.data() as PublishedNovelRecord)
        .filter((n) => n.isPublished !== false);
    }

    const q = query(collection(db, 'novels'), where('isPublished', '==', true), limit(100));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as PublishedNovelRecord)
      .filter((n) => n.authorId === authorId);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'novels');
    }
    console.warn('Could not fetch author published novels:', err);
    return [];
  }
}

export async function fetchAllPublishedNovels(): Promise<PublishedNovelRecord[]> {
  const db = getDb();
  try {
    const q = query(collection(db, 'novels'), where('isPublished', '==', true), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PublishedNovelRecord);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'novels');
    }
    return [];
  }
}

// ================= ACCOUNT RE-AUTH & PERMANENT DELETION ================= //

export async function reauthenticateUserForDeletion(password?: string): Promise<User> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('لم يتم العثور على جلسة مستخدم نشطة.');
  }

  const usesPassword = user.providerData.some((p) => p.providerId === 'password');
  const usesGoogle = user.providerData.some((p) => p.providerId === 'google.com');

  if (usesGoogle && !password) {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await reauthenticateWithPopup(user, provider);
    return res.user;
  }

  if (usesPassword && user.email) {
    if (!password) {
      throw new Error('PASSWORD_REQUIRED');
    }
    const cred = EmailAuthProvider.credential(user.email, password);
    const res = await reauthenticateWithCredential(user, cred);
    return res.user;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  const res = await reauthenticateWithPopup(user, provider);
  return res.user;
}

export async function deleteAppAccountAndData(
  uid: string,
  options: {
    username?: string;
    photoURL?: string;
    coverURL?: string;
    passwordForReauth?: string;
  }
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user || user.uid !== uid) {
    throw new Error('انتهت جلسة المستخدم، يرجى تسجيل الدخول مجدداً لإتمام الحذف.');
  }

  // Re-authenticate first if last sign-in is older than 4 minutes so we never delete Firestore data and then fail deleteUser()
  const lastSignInMs = user.metadata.lastSignInTime
    ? Date.parse(user.metadata.lastSignInTime)
    : 0;
  if (!lastSignInMs || Date.now() - lastSignInMs > 4 * 60 * 1000) {
    await reauthenticateUserForDeletion(options.passwordForReauth);
  }

  const db = getDb();

  // Delete subcollections cleanly
  const [bookmarksSnap, historySnap, ratingsSnap, savedMirrorSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'bookmarks')).catch(() => null),
    getDocs(collection(db, 'users', uid, 'history')).catch(() => null),
    getDocs(collection(db, 'users', uid, 'ratings')).catch(() => null),
    getDocs(collection(db, 'public_profiles', uid, 'saved_novels')).catch(() => null),
  ]);

  const batch = writeBatch(db);
  bookmarksSnap?.docs.forEach((d) => batch.delete(d.ref));
  historySnap?.docs.forEach((d) => batch.delete(d.ref));
  ratingsSnap?.docs.forEach((d) => batch.delete(d.ref));
  savedMirrorSnap?.docs.forEach((d) => batch.delete(d.ref));

  batch.delete(doc(db, 'public_profiles', uid, 'details', 'bio'));
  batch.delete(doc(db, 'public_profiles', uid, 'stats', 'saved'));
  batch.delete(doc(db, 'public_profiles', uid, 'stats', 'reading'));
  batch.delete(doc(db, 'public_profiles', uid));
  batch.delete(doc(db, 'users', uid));
  batch.delete(doc(db, 'writer_applications', uid));

  const cleanUsername = normalizeUsername(options.username || '');
  if (cleanUsername) {
    const [unameSnap, redirectSnap] = await Promise.all([
      getDoc(doc(db, 'usernames', cleanUsername)).catch(() => null),
      getDoc(doc(db, 'username_redirects', cleanUsername)).catch(() => null),
    ]);
    if (unameSnap?.exists() && (unameSnap.data() as { uid?: string })?.uid === uid) {
      batch.delete(unameSnap.ref);
    }
    if (redirectSnap?.exists() && (redirectSnap.data() as { uid?: string })?.uid === uid) {
      batch.delete(redirectSnap.ref);
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
    throw err;
  }

  // Clean up Storage assets if present
  const storage = getFirebaseStorage();
  for (const url of [options.photoURL, options.coverURL]) {
    if (url && url.includes('firebasestorage.googleapis.com')) {
      try {
        await deleteObject(storageRef(storage, url));
      } catch {
        // Ignore non-fatal storage cleanup error
      }
    }
  }

  // Delete Firebase Auth record for this app only (never touches Google Account)
  try {
    await deleteUser(user);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('requires-recent-login')) {
      await reauthenticateUserForDeletion(options.passwordForReauth);
      await deleteUser(user);
    } else {
      throw err;
    }
  }
}

// Legacy compatibility wrapper
export async function saveUserProfileToFirestore(
  userId: string,
  data: Partial<StoredUserProfile>
): Promise<void> {
  try {
    const db = getDb();
    await setDoc(
      doc(db, 'users', userId),
      { ...data, id: userId, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save user profile to Firestore:', error);
  }
}

export async function getUserProfileFromFirestore(
  userId: string
): Promise<StoredUserProfile | null> {
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as StoredUserProfile) : null;
  } catch {
    return null;
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
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
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
