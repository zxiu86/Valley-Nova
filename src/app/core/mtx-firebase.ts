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
  deleteDoc,
  getDocFromServer,
  collection,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  getFirebaseClientConfig,
  getFirebaseOAuthClientId,
  getFirestoreDatabaseId,
  getMissingFirebaseSecretKeys,
  isFirebaseConfigComplete,
} from './firebase-config';
import {
  ChapterConflictState,
  FullAccountProfile,
  FullNovelMtxArchive,
  LogicalChapter,
  NovelCard,
  NovelSection,
  PrivacySettings,
  PublishedNovelRecord,
  PublicProfile,
  UserRoleRecord,
  UsernameCheckResult,
  VerifiedWriterStatus,
  WorkReport,
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

export const ADMIN_EXCLUSIVE_USERNAME = 'zid';

const DESIGNATED_ADMIN_EMAILS = new Set(['zly30257@gmail.com']);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let persistencePromise: Promise<void> | null = null;

export function isFirebaseConfigured(): boolean {
  return isFirebaseConfigComplete();
}

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    const existing = getApps();
    appInstance = existing.length > 0 ? existing[0] : initializeApp(getFirebaseClientConfig());
  }
  return appInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    const dbId = getFirestoreDatabaseId();
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

export function setFirebaseAuthLanguage(lang: 'ar' | 'en'): void {
  if (authInstance) {
    authInstance.languageCode = lang;
  }
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    const app = getFirebaseApp();
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

export async function ensureAuthPersistence(): Promise<void> {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return;
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
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return null;
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
  if (!isFirebaseConfigured()) {
    const missing = getMissingFirebaseSecretKeys();
    if (missing.length > 0) {
      console.warn(`Firebase configuration incomplete. Missing keys: ${missing.join(', ')}`);
    }
    return false;
  }
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
  if (!isFirebaseConfigured()) {
    throw Object.assign(new Error('Firebase is not configured.'), { code: 'auth/invalid-api-key' });
  }
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
  if (!isFirebaseConfigured()) {
    throw Object.assign(new Error('Firebase is not configured.'), { code: 'auth/invalid-api-key' });
  }
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
  if (!isFirebaseConfigured()) {
    throw Object.assign(new Error('Firebase is not configured.'), { code: 'auth/invalid-api-key' });
  }
  getFirebaseOAuthClientId();
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
  if (!isFirebaseConfigured()) return;
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!isFirebaseConfigured()) return () => undefined;
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

export function subscribeToTokenState(callback: (user: User | null) => void): Unsubscribe {
  if (!isFirebaseConfigured()) return () => undefined;
  const auth = getFirebaseAuth();
  return onIdTokenChanged(auth, callback);
}

// ================= USERNAME HELPERS (CASE-INSENSITIVE & ATOMIC) ================= //

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsernameFormat(
  raw: string,
  options?: { isAdmin?: boolean }
): {
  valid: boolean;
  normalized: string;
  reserved?: boolean;
  reason?: string;
} {
  const normalized = normalizeUsername(raw);
  if (!normalized) {
    return { valid: false, normalized, reason: 'يرجى كتابة اسم مستخدم.' };
  }
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason: 'يُسمح فقط بالأحرف اللاتينية (a-z) والأرقام والشرطة السفلية (_).',
    };
  }
  if (normalized === ADMIN_EXCLUSIVE_USERNAME) {
    if (options?.isAdmin) {
      return { valid: true, normalized };
    }
    return {
      valid: false,
      normalized,
      reserved: true,
      reason: 'اسم المستخدم @zid محجوز حصرياً للإدارة الرسمية ولا يمكن استخدامه.',
    };
  }
  if (normalized.length < 4 || normalized.length > 24) {
    return {
      valid: false,
      normalized,
      reason: 'يجب أن يتراوح طول اسم المستخدم بين ٤ و٢٤ حرفاً.',
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
  currentSavedUsername?: string,
  isAdmin = false
): Promise<UsernameCheckResult> {
  const validation = validateUsernameFormat(rawUsername, { isAdmin });
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

  if (!isFirebaseConfigured()) {
    return {
      status: 'invalid',
      normalized: validation.normalized,
      message: 'خدمة التحقق السحابية غير مهيأة في هذه البيئة.',
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
      (s) => s.length >= 4 && s.length <= 24 && !RESERVED_USERNAMES.has(s) && s !== ADMIN_EXCLUSIVE_USERNAME
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
  if (
    !isFirebaseConfigured() ||
    !normalized ||
    (normalized !== ADMIN_EXCLUSIVE_USERNAME && !/^[a-z0-9_]{4,24}$/.test(normalized))
  ) {
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
  if (!isFirebaseConfigured()) return;
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

    // Bootstrap official Founder seal & role idempotently for designated Founder email
    if (user.emailVerified === true && DESIGNATED_ADMIN_EMAILS.has(initialEmail)) {
      const founderRef = doc(db, 'founders', user.uid);
      const roleRef = doc(db, 'user_roles', user.uid);
      const [founderSnap, roleSnap] = await Promise.all([
        getDoc(founderRef).catch(() => null),
        getDoc(roleRef).catch(() => null),
      ]);
      const founderBatch = writeBatch(db);
      let needsFounderWrite = false;
      if (!founderSnap || !founderSnap.exists()) {
        founderBatch.set(founderRef, {
          uid: user.uid,
          badge: 'founder',
          handle: ADMIN_EXCLUSIVE_USERNAME,
          titleAr: 'مؤسس رواق الخلود — المشرف الرسمي',
          titleEn: 'Founder of Eternity Corridors — Official Admin',
          active: true,
          updatedAt: now,
        });
        needsFounderWrite = true;
      }
      if (!roleSnap || !roleSnap.exists() || (roleSnap.data() as UserRoleRecord)?.role !== 'founder') {
        founderBatch.set(roleRef, {
          userId: user.uid,
          role: 'founder',
          roles: ['founder', 'author'],
          status: 'active',
          canPublish: true,
          assignedBy: user.uid,
          assignedAt: now,
        });
        needsFounderWrite = true;
      }
      if (needsFounderWrite) {
        await founderBatch.commit().catch((err) => {
          console.warn('Founder seal bootstrap warning:', err);
        });
      }
    }
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
    throw error;
  }
}

export async function loadOwnerAccountProfile(uid: string): Promise<FullAccountProfile | null> {
  if (!isFirebaseConfigured()) return null;
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
  if (!isFirebaseConfigured()) return { state: 'not_found' };
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

  const isCallerAdmin =
    Boolean(auth.currentUser) &&
    auth.currentUser?.uid === uid &&
    ((auth.currentUser?.emailVerified === true &&
      Boolean(auth.currentUser?.email && DESIGNATED_ADMIN_EMAILS.has(auth.currentUser.email))) ||
      (await getVerifiedWriterStatus(uid).then((s) => s.isAdmin).catch(() => false)));

  if (nextRaw) {
    const validation = validateUsernameFormat(nextRaw, { isAdmin: isCallerAdmin });
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

  // Fallback to compact rasterized WebP/PNG/JPEG data URI only (reject SVG/scripts)
  const isSafeRasterFallback =
    typeof fallbackDataUrl === 'string' &&
    fallbackDataUrl.length <= 420000 &&
    /^data:image\/(webp|png|jpeg);base64,/i.test(fallbackDataUrl);

  try {
    const storage = getFirebaseStorage();
    const path = `users/${uid}/${kind}_${Date.now()}.webp`;
    const fileRef = storageRef(storage, path);

    const uploadTask = uploadBytes(fileRef, blob, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 2500)
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
    if (isSafeRasterFallback) {
      return fallbackDataUrl;
    }
    throw new Error('تعذر معالجة الصورة. يرجى تجربة ملف أصغر حجماً بصيغة JPG أو PNG أو WebP.');
  }
}

// ================= BOOKMARKS & READING HISTORY SYNC ================= //

export async function saveBookmarkToFirestore(
  userId: string,
  novel: Pick<NovelCard, 'id' | 'title' | 'author' | 'genre' | 'coverUrl'>,
  totalSavedCount?: number
): Promise<void> {
  if (!isFirebaseConfigured()) return;
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
  if (!isFirebaseConfigured()) return;
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
  if (!isFirebaseConfigured()) return;
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
  if (!isFirebaseConfigured()) return [];
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
  if (!isFirebaseConfigured()) return 0;
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
  if (!isFirebaseConfigured()) return 0;
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
  if (!isFirebaseConfigured()) {
    return {
      isWriterBadge: false,
      canPublish: false,
      isAdmin: false,
      roleKind: 'none',
      roleRecord: null,
    };
  }
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  const isCurrentDesignatedAdmin =
    Boolean(currentUser) &&
    currentUser?.uid === userId &&
    currentUser?.emailVerified === true &&
    Boolean(currentUser?.email && DESIGNATED_ADMIN_EMAILS.has(currentUser.email));

  const db = getDb();
  try {
    const [roleSnap, founderSnap] = await Promise.all([
      getDoc(doc(db, 'user_roles', userId)).catch(() => null),
      getDoc(doc(db, 'founders', userId)).catch(() => null),
    ]);

    const hasPublicFounderSeal = Boolean(
      founderSnap &&
        founderSnap.exists() &&
        (founderSnap.data() as { active?: boolean; badge?: string })?.active === true &&
        (founderSnap.data() as { badge?: string })?.badge === 'founder'
    );

    if (roleSnap && roleSnap.exists()) {
      const record = roleSnap.data() as UserRoleRecord;
      const isActive = record.status === 'active';
      const hasAuthorRole =
        record.role === 'author' ||
        record.role === 'founder' ||
        (Array.isArray(record.roles) &&
          (record.roles.includes('author') || record.roles.includes('founder')));

      const isFounder = isCurrentDesignatedAdmin || hasPublicFounderSeal || (record.role === 'founder' && isActive);
      const isBadge = isFounder || (isActive && hasAuthorRole);
      const canPublish = isFounder || (isActive && hasAuthorRole && record.canPublish === true);

      return {
        isWriterBadge: isBadge,
        canPublish,
        isAdmin: isFounder,
        roleKind: isFounder ? 'founder' : isBadge ? 'author' : 'none',
        roleRecord: record,
      };
    }

    if (isCurrentDesignatedAdmin || hasPublicFounderSeal) {
      return {
        isWriterBadge: true,
        canPublish: true,
        isAdmin: true,
        roleKind: 'founder',
        roleRecord: null,
      };
    }
  } catch (err) {
    console.warn('Error fetching user role:', err);
  }

  return {
    isWriterBadge: isCurrentDesignatedAdmin,
    canPublish: isCurrentDesignatedAdmin,
    isAdmin: isCurrentDesignatedAdmin,
    roleKind: isCurrentDesignatedAdmin ? 'founder' : 'none',
    roleRecord: null,
  };
}

export async function getWriterApplicationFromFirestore(
  userId: string
): Promise<WriterApplication | null> {
  if (!isFirebaseConfigured()) return null;
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
  if (!isFirebaseConfigured()) return [];
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
  const auth = getFirebaseAuth();
  if (!auth.currentUser || auth.currentUser.uid !== adminUid) {
    throw new Error('غير مصرح بتنفيذ هذا الإجراء الإداري.');
  }
  const callerStatus = await getVerifiedWriterStatus(adminUid);
  if (!callerStatus.isAdmin) {
    throw new Error('صلاحيات المشرف الرسمي مطلوبة لمراجعة طلبات الكتاب.');
  }
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

export async function fetchAuthorPublishedNovels(
  authorId: string,
  includeDraftsAndRemoved = false
): Promise<PublishedNovelRecord[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  const auth = getFirebaseAuth();
  try {
    if (auth.currentUser?.uid === authorId) {
      const q = query(collection(db, 'novels'), where('authorId', '==', authorId), limit(60));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as PublishedNovelRecord);
      return includeDraftsAndRemoved
        ? list
        : list.filter((n) => n.isPublished === true && n.moderationStatus !== 'rejected_removed');
    }

    const q = query(collection(db, 'novels'), where('isPublished', '==', true), limit(100));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as PublishedNovelRecord)
      .filter((n) => n.authorId === authorId && n.moderationStatus !== 'rejected_removed');
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'novels');
    }
    console.warn('Could not fetch author published novels:', err);
    return [];
  }
}

export async function fetchAllPublishedNovels(): Promise<PublishedNovelRecord[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  try {
    const q = query(collection(db, 'novels'), where('isPublished', '==', true), limit(60));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as PublishedNovelRecord)
      .filter((n) => n.moderationStatus !== 'rejected_removed');
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
  if (!isFirebaseConfigured()) return;
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
  if (!isFirebaseConfigured()) return null;
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as StoredUserProfile) : null;
  } catch {
    return null;
  }
}

export interface AuthorAppearance {
  photoURL: string;
  coverURL: string;
  displayName: string;
  username?: string;
}

export async function getPublicAuthorAppearance(
  authorUid: string
): Promise<AuthorAppearance | null> {
  if (!authorUid || !isFirebaseConfigured()) return null;
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'public_profiles', authorUid));
    if (!snap.exists()) return null;
    const pub = snap.data() as PublicProfile;
    if (!pub.isPublic) return null;
    return {
      photoURL: pub.photoURL || '',
      coverURL: pub.coverURL || '',
      displayName: pub.showProfileInfo ? pub.displayName || '' : '',
      username: pub.username || '',
    };
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

// ================= WRITER STUDIO: NOVELS, SECTIONS, CHAPTERS, VERIFIED READS & REPORTS ================= //

export async function uploadNovelCoverAsset(
  uid: string,
  novelId: string,
  blob: Blob,
  fallbackDataUrl: string,
  previousUrl?: string
): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('انقطع الاتصال بالإنترنت أثناء رفع الغلاف. يرجى المحاولة لاحقاً.');
  }

  const isSafeRasterFallback =
    typeof fallbackDataUrl === 'string' &&
    fallbackDataUrl.length <= 420000 &&
    /^data:image\/(webp|png|jpeg);base64,/i.test(fallbackDataUrl);

  try {
    const storage = getFirebaseStorage();
    const path = `novels/${uid}/${novelId}/cover_${Date.now()}.webp`;
    const fileRef = storageRef(storage, path);

    const uploadTask = uploadBytes(fileRef, blob, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 3000)
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
    if (isSafeRasterFallback) {
      return fallbackDataUrl;
    }
    throw new Error('تعذر رفع أو ضغط صورة الغلاف. يرجى اختيار صورة أصغر بصيغة JPG أو PNG أو WebP.');
  }
}

export async function fetchNovelByIdFromFirestore(
  novelId: string
): Promise<PublishedNovelRecord | null> {
  if (!isFirebaseConfigured() || !novelId) return null;
  const db = getDb();
  try {
    const snap = await getDoc(doc(db, 'novels', novelId));
    return snap.exists() ? (snap.data() as PublishedNovelRecord) : null;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, `novels/${novelId}`);
    }
    return null;
  }
}

export async function updateNovelRecordInFirestore(
  novelId: string,
  patch: Partial<PublishedNovelRecord>
): Promise<PublishedNovelRecord> {
  const db = getDb();
  const ref = doc(db, 'novels', novelId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('NOVEL_NOT_FOUND');
    }
    const current = snap.data() as PublishedNovelRecord;
    const updated: PublishedNovelRecord = {
      ...current,
      ...patch,
      id: current.id,
      authorId: current.authorId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, updated);
    return updated;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `novels/${novelId}`);
    }
    throw err;
  }
}

export async function deleteNovelTreeFromFirestore(
  novelId: string,
  coverUrl?: string
): Promise<void> {
  const db = getDb();
  const subcollections = ['chapters', 'chapter_slots', 'sections', 'read_sessions', 'verified_reads'];
  try {
    for (const sub of subcollections) {
      const snap = await getDocs(collection(db, 'novels', novelId, sub)).catch(() => null);
      if (snap && !snap.empty) {
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = writeBatch(db);
          snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
    }
    await deleteDoc(doc(db, 'novels', novelId));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `novels/${novelId}`);
    }
    throw err;
  }

  if (coverUrl && coverUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const storage = getFirebaseStorage();
      await deleteObject(storageRef(storage, coverUrl));
    } catch {
      // Non-fatal storage cleanup
    }
  }
}

// ---- Sections ---- //

export async function fetchNovelSections(novelId: string): Promise<NovelSection[]> {
  if (!isFirebaseConfigured() || !novelId) return [];
  const db = getDb();
  try {
    const snap = await getDocs(query(collection(db, 'novels', novelId, 'sections'), limit(100)));
    return snap.docs
      .map((d) => d.data() as NovelSection)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, `novels/${novelId}/sections`);
    }
    return [];
  }
}

export async function upsertNovelSection(section: NovelSection): Promise<NovelSection> {
  const db = getDb();
  const clean: NovelSection = {
    ...section,
    title: section.title.trim().slice(0, 120),
    ...(section.titleEn?.trim() ? { titleEn: section.titleEn.trim().slice(0, 120) } : {}),
    updatedAt: new Date().toISOString(),
  };
  if (!clean.titleEn) {
    delete clean.titleEn;
  }
  try {
    await setDoc(doc(db, 'novels', clean.novelId, 'sections', clean.id), clean);
    return clean;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `novels/${clean.novelId}/sections/${clean.id}`);
    }
    throw err;
  }
}

export async function deleteNovelSection(novelId: string, sectionId: string): Promise<void> {
  const db = getDb();
  try {
    await deleteDoc(doc(db, 'novels', novelId, 'sections', sectionId));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `novels/${novelId}/sections/${sectionId}`);
    }
    throw err;
  }
}

// ---- Logical Bilingual Chapters & Atomic Slot Locking ---- //

export async function fetchNovelChapters(
  novelId: string,
  includeUnpublished = false
): Promise<LogicalChapter[]> {
  if (!isFirebaseConfigured() || !novelId) return [];
  const db = getDb();
  try {
    const colRef = collection(db, 'novels', novelId, 'chapters');
    const q = includeUnpublished
      ? query(colRef, limit(500))
      : query(colRef, where('isPublished', '==', true), limit(500));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as LogicalChapter)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, `novels/${novelId}/chapters`);
    }
    return [];
  }
}

export async function checkChapterSlotExists(
  novelId: string,
  chapterNumber: number
): Promise<boolean> {
  if (!isFirebaseConfigured() || !novelId || chapterNumber < 1) return false;
  const db = getDb();
  try {
    const slotSnap = await getDoc(
      doc(db, 'novels', novelId, 'chapter_slots', `slot_${chapterNumber}`)
    );
    return slotSnap.exists();
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, `novels/${novelId}/chapter_slots/slot_${chapterNumber}`);
    }
    return false;
  }
}

export async function createChapterWithSlotTransaction(
  chapter: LogicalChapter
): Promise<LogicalChapter> {
  const db = getDb();
  const now = new Date().toISOString();
  const slotId = `slot_${chapter.chapterNumber}`;
  const slotRef = doc(db, 'novels', chapter.novelId, 'chapter_slots', slotId);
  const chapterRef = doc(db, 'novels', chapter.novelId, 'chapters', chapter.id);

  const cleanChapter: LogicalChapter = {
    ...chapter,
    revision: 1,
    createdAt: chapter.createdAt || now,
    updatedAt: now,
  };
  if (!cleanChapter.titleEn) delete cleanChapter.titleEn;
  if (!cleanChapter.sectionId) delete cleanChapter.sectionId;

  try {
    await runTransaction(db, async (tx) => {
      const existingSlot = await tx.get(slotRef);
      if (existingSlot.exists()) {
        throw new Error('CHAPTER_NUMBER_EXISTS');
      }
      tx.set(chapterRef, cleanChapter);
      tx.set(slotRef, {
        chapterId: cleanChapter.id,
        chapterNumber: cleanChapter.chapterNumber,
        authorId: cleanChapter.authorId,
        createdAt: now,
      });
    });
    return cleanChapter;
  } catch (err) {
    if (err instanceof Error && err.message === 'CHAPTER_NUMBER_EXISTS') {
      throw err;
    }
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `novels/${chapter.novelId}/chapters/${chapter.id}`);
    }
    throw err;
  }
}

export async function updateChapterWithRevisionTransaction(
  chapter: LogicalChapter,
  expectedRevision: number,
  forceOverwrite = false
): Promise<
  | { ok: true; chapter: LogicalChapter }
  | { ok: false; conflict: Omit<ChapterConflictState, 'localSnapshot'> }
> {
  const db = getDb();
  const chapterRef = doc(db, 'novels', chapter.novelId, 'chapters', chapter.id);
  const now = new Date().toISOString();

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(chapterRef);
      if (!snap.exists()) {
        throw new Error('CHAPTER_NOT_FOUND');
      }
      const serverChapter = snap.data() as LogicalChapter;
      if (!forceOverwrite && serverChapter.revision !== expectedRevision) {
        return {
          ok: false as const,
          conflict: {
            novelId: chapter.novelId,
            chapterId: chapter.id,
            serverChapter,
          },
        };
      }

      const nextChapter: LogicalChapter = {
        ...chapter,
        id: serverChapter.id,
        authorId: serverChapter.authorId,
        chapterNumber: serverChapter.chapterNumber,
        revision: (serverChapter.revision || 1) + 1,
        createdAt: serverChapter.createdAt,
        updatedAt: now,
      };
      if (!nextChapter.titleEn) delete nextChapter.titleEn;
      if (!nextChapter.sectionId) delete nextChapter.sectionId;

      tx.set(chapterRef, nextChapter);
      return { ok: true as const, chapter: nextChapter };
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `novels/${chapter.novelId}/chapters/${chapter.id}`);
    }
    throw err;
  }
}

export async function deleteChapterWithSlotTransaction(
  novelId: string,
  chapterId: string,
  chapterNumber: number
): Promise<void> {
  const db = getDb();
  const chapterRef = doc(db, 'novels', novelId, 'chapters', chapterId);
  const slotRef = doc(db, 'novels', novelId, 'chapter_slots', `slot_${chapterNumber}`);
  try {
    await runTransaction(db, async (tx) => {
      tx.delete(chapterRef);
      tx.delete(slotRef);
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `novels/${novelId}/chapters/${chapterId}`);
    }
    throw err;
  }
}

export async function recomputeNovelStatsInFirestore(novelId: string): Promise<{
  publishedChapterCount: number;
  publishedWordsAr: number;
  publishedWordsEn: number;
  readingHours: number;
}> {
  const db = getDb();
  const chapters = await fetchNovelChapters(novelId, true);
  const published = chapters.filter((ch) => ch.isPublished === true);

  const publishedChapterCount = published.length;
  const publishedWordsAr = published.reduce((acc, ch) => acc + (ch.wordCountAr || 0), 0);
  const publishedWordsEn = published.reduce((acc, ch) => acc + (ch.wordCountEn || 0), 0);
  const maxWords = Math.max(publishedWordsAr, publishedWordsEn);
  const readingHours = publishedChapterCount === 0 ? 1 : Math.max(1, Math.round(maxWords / 9000) || 1);

  try {
    const snap = await getDoc(doc(db, 'novels', novelId));
    if (snap.exists()) {
      const current = snap.data() as PublishedNovelRecord;
      await setDoc(doc(db, 'novels', novelId), {
        ...current,
        publishedChapterCount,
        publishedWordsAr,
        publishedWordsEn,
        readingHours,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `novels/${novelId}`);
    }
  }

  return {
    publishedChapterCount,
    publishedWordsAr,
    publishedWordsEn,
    readingHours,
  };
}

export async function importFullNovelArchiveToFirestore(
  authorId: string,
  authorName: string,
  archive: FullNovelMtxArchive,
  publishImmediately = true
): Promise<PublishedNovelRecord> {
  const db = getDb();
  const now = new Date().toISOString();
  const novelId = `novel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const totalAr = archive.chapters
    .filter((c) => c.isPublished || publishImmediately)
    .reduce((sum, c) => sum + (c.editions.ar?.wordCount || 0), 0);
  const totalEn = archive.chapters
    .filter((c) => c.isPublished || publishImmediately)
    .reduce((sum, c) => sum + (c.editions.en?.wordCount || 0), 0);

  const novelDoc: PublishedNovelRecord = {
    id: novelId,
    title: archive.novel.title,
    ...(archive.novel.titleEn ? { titleEn: archive.novel.titleEn } : {}),
    authorId,
    authorName: authorName || archive.novel.authorName || 'أروقة الخلود',
    workType: archive.novel.workType || 'original',
    ...(archive.novel.originalAuthor ? { originalAuthor: archive.novel.originalAuthor } : {}),
    ...(archive.novel.firstAuthor ? { firstAuthor: archive.novel.firstAuthor } : {}),
    ...(archive.novel.supportMethod ? { supportMethod: archive.novel.supportMethod } : {}),
    novelStatus: archive.novel.novelStatus || 'ongoing',
    moderationStatus: 'active',
    reportCount: 0,
    verifiedReadsCount: 0,
    publishedChapterCount: archive.chapters.length,
    publishedWordsAr: totalAr,
    publishedWordsEn: totalEn,
    genre: archive.novel.genre,
    categoryGroup: archive.novel.categoryGroup,
    coverUrl: archive.novel.coverUrl || '/images/writers_sanctuary_bg.jpg',
    description: archive.novel.description || '',
    readingHours: Math.max(1, Math.round(Math.max(totalAr, totalEn) / 9000) || 1),
    originLanguage: archive.novel.originLanguage || 'عربي أصيل',
    languageCode: archive.novel.languageCode || (totalAr === 0 && totalEn > 0 ? 'en' : 'ar'),
    ...(archive.novel.tags?.length ? { tags: archive.novel.tags } : {}),
    isPublished: publishImmediately,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'novels', novelId), novelDoc);

    const sectionIdMap = new Map<string, string>();
    for (let i = 0; i < archive.sections.length; i++) {
      const sec = archive.sections[i];
      const newSecId = `sec_${Date.now()}_${i}`;
      sectionIdMap.set(sec.id, newSecId);
      const secPayload: NovelSection = {
        id: newSecId,
        novelId,
        authorId,
        title: sec.title,
        ...(sec.titleEn ? { titleEn: sec.titleEn } : {}),
        orderIndex: sec.orderIndex ?? i,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'novels', novelId, 'sections', newSecId), secPayload);
    }

    for (let i = 0; i < archive.chapters.length; i++) {
      const ch = archive.chapters[i];
      const newChapterId = `ch_${ch.chapterNumber}_${Date.now()}_${i}`;
      const mappedSectionId = ch.sectionId ? sectionIdMap.get(ch.sectionId) : undefined;
      const chapterPayload: LogicalChapter = {
        id: newChapterId,
        novelId,
        authorId,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        ...(ch.titleEn ? { titleEn: ch.titleEn } : {}),
        ...(mappedSectionId ? { sectionId: mappedSectionId } : {}),
        chapterType: ch.chapterType,
        endStatus: ch.endStatus,
        languageMode: ch.languageMode,
        editions: ch.editions,
        wordCountAr: ch.editions.ar?.wordCount || 0,
        wordCountEn: ch.editions.en?.wordCount || 0,
        isPublished: publishImmediately ? true : ch.isPublished,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      await createChapterWithSlotTransaction(chapterPayload);
    }

    return novelDoc;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `novels/${novelId}`);
    }
    throw err;
  }
}

// ---- Server-Timed 60-Second Verified Reads ---- //

export async function startReadSessionWithServerTime(
  novelId: string,
  chapterId: string,
  readerKey: string,
  userId?: string
): Promise<{ alreadyVerified: boolean; sessionId: string | null }> {
  if (!isFirebaseConfigured() || !novelId || !readerKey) {
    return { alreadyVerified: false, sessionId: null };
  }
  const db = getDb();
  try {
    const verifiedSnap = await getDoc(doc(db, 'novels', novelId, 'verified_reads', readerKey));
    if (verifiedSnap.exists()) {
      return { alreadyVerified: true, sessionId: null };
    }

    const sessionId = `rs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'novels', novelId, 'read_sessions', sessionId), {
      sessionId,
      novelId,
      chapterId,
      readerKey,
      ...(userId ? { userId } : {}),
      startedAt: serverTimestamp(),
      consumed: false,
    });
    return { alreadyVerified: false, sessionId };
  } catch {
    return { alreadyVerified: false, sessionId: null };
  }
}

export async function commitVerifiedReadTransaction(
  novelId: string,
  sessionId: string,
  readerKey: string,
  chapterId: string,
  userId?: string
): Promise<{ counted: boolean; newCount?: number }> {
  if (!isFirebaseConfigured() || !novelId || !sessionId || !readerKey) {
    return { counted: false };
  }
  const db = getDb();
  const novelRef = doc(db, 'novels', novelId);
  const sessionRef = doc(db, 'novels', novelId, 'read_sessions', sessionId);
  const verifiedRef = doc(db, 'novels', novelId, 'verified_reads', readerKey);

  try {
    return await runTransaction(db, async (tx) => {
      const [novelSnap, sessionSnap, verifiedSnap] = await Promise.all([
        tx.get(novelRef),
        tx.get(sessionRef),
        tx.get(verifiedRef),
      ]);

      if (!novelSnap.exists() || !sessionSnap.exists() || verifiedSnap.exists()) {
        return { counted: false };
      }
      const novelData = novelSnap.data() as PublishedNovelRecord;
      const nextCount = (novelData.verifiedReadsCount || 0) + 1;

      tx.set(verifiedRef, {
        novelId,
        readerKey,
        chapterId,
        sessionId,
        ...(userId ? { userId } : {}),
        verifiedAt: serverTimestamp(),
      });
      tx.update(sessionRef, { consumed: true });
      tx.update(novelRef, {
        verifiedReadsCount: nextCount,
        lastVerifiedReadKey: readerKey,
      });

      return { counted: true, newCount: nextCount };
    });
  } catch (err) {
    // Expected permission-denied if called before 60s server time elapsed
    if (!isPermissionDeniedError(err)) {
      console.warn('Verified read commit warning:', err);
    }
    return { counted: false };
  }
}

// ---- Work Reports & @zid Moderation Triage ---- //

export async function hasUserReportedNovel(novelId: string, uid: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !novelId || !uid) return false;
  const db = getDb();
  try {
    const snap = await getDoc(doc(db, 'work_reports', `${novelId}__${uid}`));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function submitWorkReportToFirestore(
  novelId: string,
  novelTitle: string,
  authorId: string,
  reason: string,
  details = ''
): Promise<{ reportCount: number; underReview: boolean }> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }
  const db = getDb();
  const reportId = `${novelId}__${user.uid}`;
  const reportRef = doc(db, 'work_reports', reportId);
  const novelRef = doc(db, 'novels', novelId);
  const now = new Date().toISOString();

  try {
    return await runTransaction(db, async (tx) => {
      const [existingReport, novelSnap] = await Promise.all([
        tx.get(reportRef),
        tx.get(novelRef),
      ]);
      if (existingReport.exists()) {
        throw new Error('ALREADY_REPORTED');
      }
      if (!novelSnap.exists()) {
        throw new Error('NOVEL_NOT_FOUND');
      }
      const novel = novelSnap.data() as PublishedNovelRecord;
      const nextCount = (novel.reportCount || 0) + 1;
      const nextModStatus =
        nextCount >= 3 ? 'under_review' : (novel.moderationStatus || 'active');

      const reportPayload: WorkReport = {
        id: reportId,
        novelId,
        novelTitle: novelTitle.slice(0, 140),
        authorId,
        reporterUid: user.uid,
        reason: reason.trim().slice(0, 120),
        ...(details.trim() ? { details: details.trim().slice(0, 1000) } : {}),
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };

      tx.set(reportRef, reportPayload);
      tx.update(novelRef, {
        reportCount: nextCount,
        moderationStatus: nextModStatus,
        updatedAt: now,
      });

      return {
        reportCount: nextCount,
        underReview: nextModStatus === 'under_review',
      };
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `work_reports/${reportId}`);
    }
    throw err;
  }
}

export async function fetchWorkReportsForAdmin(): Promise<WorkReport[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  try {
    const snap = await getDocs(query(collection(db, 'work_reports'), limit(100)));
    return snap.docs
      .map((d) => d.data() as WorkReport)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'work_reports');
    }
    return [];
  }
}

export async function fetchModeratedNovelsForAdmin(): Promise<PublishedNovelRecord[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getDb();
  try {
    const q = query(
      collection(db, 'novels'),
      where('moderationStatus', 'in', ['under_review', 'rejected_removed']),
      limit(60)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PublishedNovelRecord);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'novels');
    }
    return [];
  }
}

export async function resolveReportKeepNovelAsAdmin(
  novelId: string,
  adminUid: string,
  note = ''
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  try {
    const [novelSnap, reportsSnap] = await Promise.all([
      getDoc(doc(db, 'novels', novelId)),
      getDocs(query(collection(db, 'work_reports'), where('novelId', '==', novelId), limit(100))),
    ]);
    const batch = writeBatch(db);
    if (novelSnap.exists()) {
      const current = novelSnap.data() as PublishedNovelRecord;
      batch.set(doc(db, 'novels', novelId), {
        ...current,
        moderationStatus: 'active',
        moderationNote: note.trim(),
        reportCount: 0,
        isPublished: true,
        updatedAt: now,
      });
    }
    reportsSnap.docs.forEach((d) => {
      batch.update(d.ref, { status: 'reviewed_kept', updatedAt: now });
    });
    batch.set(doc(db, 'moderation_logs', `log_${Date.now()}`), {
      novelId,
      decidedBy: adminUid,
      decision: 'reviewed_kept',
      note: note.trim(),
      createdAt: now,
    });
    await batch.commit();
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `novels/${novelId}`);
    }
    throw err;
  }
}

export async function resolveReportRemoveNovelAsAdmin(
  novelId: string,
  adminUid: string,
  note = ''
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  try {
    const [novelSnap, reportsSnap] = await Promise.all([
      getDoc(doc(db, 'novels', novelId)),
      getDocs(query(collection(db, 'work_reports'), where('novelId', '==', novelId), limit(100))),
    ]);
    const batch = writeBatch(db);
    if (novelSnap.exists()) {
      const current = novelSnap.data() as PublishedNovelRecord;
      // Preserve author's writer role; only remove this specific work from public visibility
      batch.set(doc(db, 'novels', novelId), {
        ...current,
        moderationStatus: 'rejected_removed',
        moderationNote:
          note.trim() || 'تمت إزالة هذا العمل من العرض العام بعد المراجعة الإدارية.',
        isPublished: false,
        updatedAt: now,
      });
    }
    reportsSnap.docs.forEach((d) => {
      batch.update(d.ref, { status: 'rejected_removed', updatedAt: now });
    });
    batch.set(doc(db, 'moderation_logs', `log_${Date.now()}`), {
      novelId,
      decidedBy: adminUid,
      decision: 'rejected_removed',
      note: note.trim(),
      createdAt: now,
    });
    await batch.commit();
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `novels/${novelId}`);
    }
    throw err;
  }
}
