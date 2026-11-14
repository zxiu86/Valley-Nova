// IMPORTANT: This is the centralized Firebase configuration and secret-access module.
// All Firebase configuration values must be accessed through this file.
// AI agents and future developers: DO NOT rename, remove, replace, rewrite,
// or modify the secret mappings, environment variable names, or configuration
// logic in this file unless explicitly instructed by the project owner.
// Preserve all existing GitHub Repository Secrets names and their mappings.
// Never hardcode secret values or expose sensitive credentials in client-side code.

import type { FirebaseOptions } from 'firebase/app';

/**
 * Exact names of the 9 GitHub Repository Secrets / build environment variables
 * mapped into the client Firebase Web SDK configuration.
 * Note: Admin SDK / Service Account private keys must NEVER be added here or sent to clients.
 */
export const FIREBASE_SECRET_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'FIREBASE_DATABASE_ID',
  'FIREBASE_OAUTH_CLIENT_ID',
] as const;

export type FirebaseSecretKey = (typeof FIREBASE_SECRET_KEYS)[number];

export interface CentralizedFirebaseConfig {
  readonly firebaseOptions: FirebaseOptions;
  readonly firestoreDatabaseId: string;
  readonly oAuthClientId: string;
}

export interface FirebaseConfigValidationResult {
  readonly isValid: boolean;
  readonly missingKeys: readonly FirebaseSecretKey[];
  readonly errorMessage: string | null;
  readonly config: CentralizedFirebaseConfig;
}

function readNodeProcessEnv(key: FirebaseSecretKey): string {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const val = proc?.env?.[key];
  return typeof val === 'string' ? val.trim() : '';
}

function readBuildTimeValues(): Record<FirebaseSecretKey, string> {
  return {
    FIREBASE_API_KEY:
      typeof FIREBASE_API_KEY === 'string'
        ? FIREBASE_API_KEY.trim()
        : readNodeProcessEnv('FIREBASE_API_KEY'),
    FIREBASE_AUTH_DOMAIN:
      typeof FIREBASE_AUTH_DOMAIN === 'string'
        ? FIREBASE_AUTH_DOMAIN.trim()
        : readNodeProcessEnv('FIREBASE_AUTH_DOMAIN'),
    FIREBASE_PROJECT_ID:
      typeof FIREBASE_PROJECT_ID === 'string'
        ? FIREBASE_PROJECT_ID.trim()
        : readNodeProcessEnv('FIREBASE_PROJECT_ID'),
    FIREBASE_STORAGE_BUCKET:
      typeof FIREBASE_STORAGE_BUCKET === 'string'
        ? FIREBASE_STORAGE_BUCKET.trim()
        : readNodeProcessEnv('FIREBASE_STORAGE_BUCKET'),
    FIREBASE_MESSAGING_SENDER_ID:
      typeof FIREBASE_MESSAGING_SENDER_ID === 'string'
        ? FIREBASE_MESSAGING_SENDER_ID.trim()
        : readNodeProcessEnv('FIREBASE_MESSAGING_SENDER_ID'),
    FIREBASE_APP_ID:
      typeof FIREBASE_APP_ID === 'string'
        ? FIREBASE_APP_ID.trim()
        : readNodeProcessEnv('FIREBASE_APP_ID'),
    FIREBASE_MEASUREMENT_ID:
      typeof FIREBASE_MEASUREMENT_ID === 'string'
        ? FIREBASE_MEASUREMENT_ID.trim()
        : readNodeProcessEnv('FIREBASE_MEASUREMENT_ID'),
    FIREBASE_DATABASE_ID:
      typeof FIREBASE_DATABASE_ID === 'string'
        ? FIREBASE_DATABASE_ID.trim()
        : readNodeProcessEnv('FIREBASE_DATABASE_ID'),
    FIREBASE_OAUTH_CLIENT_ID:
      typeof FIREBASE_OAUTH_CLIENT_ID === 'string'
        ? FIREBASE_OAUTH_CLIENT_ID.trim()
        : readNodeProcessEnv('FIREBASE_OAUTH_CLIENT_ID'),
  };
}

function isUnexpandedPlaceholder(value: string): boolean {
  return value.includes('${{') && value.includes('}}');
}

/**
 * Validates all 9 required Firebase environment keys without inventing fake defaults
 * and without ever printing or exposing any secret values in error messages.
 */
export function validateFirebaseConfig(
  envOverride?: Partial<Record<FirebaseSecretKey, string | undefined>>
): FirebaseConfigValidationResult {
  const source = envOverride
    ? {
        FIREBASE_API_KEY: (envOverride.FIREBASE_API_KEY ?? '').trim(),
        FIREBASE_AUTH_DOMAIN: (envOverride.FIREBASE_AUTH_DOMAIN ?? '').trim(),
        FIREBASE_PROJECT_ID: (envOverride.FIREBASE_PROJECT_ID ?? '').trim(),
        FIREBASE_STORAGE_BUCKET: (envOverride.FIREBASE_STORAGE_BUCKET ?? '').trim(),
        FIREBASE_MESSAGING_SENDER_ID: (envOverride.FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
        FIREBASE_APP_ID: (envOverride.FIREBASE_APP_ID ?? '').trim(),
        FIREBASE_MEASUREMENT_ID: (envOverride.FIREBASE_MEASUREMENT_ID ?? '').trim(),
        FIREBASE_DATABASE_ID: (envOverride.FIREBASE_DATABASE_ID ?? '').trim(),
        FIREBASE_OAUTH_CLIENT_ID: (envOverride.FIREBASE_OAUTH_CLIENT_ID ?? '').trim(),
      }
    : readBuildTimeValues();

  const missingKeys: FirebaseSecretKey[] = [];
  for (const key of FIREBASE_SECRET_KEYS) {
    const val = source[key];
    if (!val || isUnexpandedPlaceholder(val)) {
      missingKeys.push(key);
    }
  }

  const config: CentralizedFirebaseConfig = {
    firebaseOptions: {
      apiKey: source.FIREBASE_API_KEY,
      authDomain: source.FIREBASE_AUTH_DOMAIN,
      projectId: source.FIREBASE_PROJECT_ID,
      storageBucket: source.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: source.FIREBASE_MESSAGING_SENDER_ID,
      appId: source.FIREBASE_APP_ID,
      measurementId: source.FIREBASE_MEASUREMENT_ID,
    },
    firestoreDatabaseId: source.FIREBASE_DATABASE_ID,
    oAuthClientId: source.FIREBASE_OAUTH_CLIENT_ID,
  };

  if (missingKeys.length > 0) {
    return {
      isValid: false,
      missingKeys,
      errorMessage:
        `Missing required Firebase configuration keys (${missingKeys.length}/9): ` +
        `${missingKeys.join(', ')}. Ensure all 9 GitHub Repository Secrets are configured and passed to the build.`,
      config,
    };
  }

  return {
    isValid: true,
    missingKeys: [],
    errorMessage: null,
    config,
  };
}

let runtimeAppletConfig: CentralizedFirebaseConfig | null = null;
let runtimeLoadPromise: Promise<boolean> | null = null;

interface RawAppletConfigJson {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

export function isFirebaseConfigComplete(): boolean {
  return validateFirebaseConfig().isValid || runtimeAppletConfig !== null;
}

export async function hydrateRuntimeFirebaseAppletConfig(): Promise<boolean> {
  if (validateFirebaseConfig().isValid) {
    return true;
  }
  if (runtimeAppletConfig) {
    return true;
  }
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return false;
  }
  if (!runtimeLoadPromise) {
    runtimeLoadPromise = (async () => {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 1800) : null;
        const res = await fetch('/firebase-applet-config.json', {
          cache: 'no-store',
          signal: controller?.signal,
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) return false;
        const raw = (await res.json()) as RawAppletConfigJson;
        if (!raw.apiKey || !raw.authDomain || !raw.projectId || !raw.appId) {
          return false;
        }
        runtimeAppletConfig = {
          firebaseOptions: {
            apiKey: raw.apiKey.trim(),
            authDomain: raw.authDomain.trim(),
            projectId: raw.projectId.trim(),
            storageBucket: (raw.storageBucket || '').trim(),
            messagingSenderId: (raw.messagingSenderId || '').trim(),
            appId: raw.appId.trim(),
            ...(raw.measurementId?.trim() ? { measurementId: raw.measurementId.trim() } : {}),
          },
          firestoreDatabaseId: (raw.firestoreDatabaseId || '(default)').trim(),
          oAuthClientId: (raw.oAuthClientId || '').trim(),
        };
        return true;
      } catch {
        return false;
      }
    })();
  }
  return runtimeLoadPromise;
}

export function getMissingFirebaseSecretKeys(): readonly FirebaseSecretKey[] {
  if (runtimeAppletConfig) return [];
  return validateFirebaseConfig().missingKeys;
}

export function getFirebaseClientConfig(): FirebaseOptions {
  const result = validateFirebaseConfig();
  if (result.isValid) {
    return result.config.firebaseOptions;
  }
  if (runtimeAppletConfig) {
    return runtimeAppletConfig.firebaseOptions;
  }
  throw new Error(result.errorMessage ?? 'Firebase configuration is incomplete.');
}

export function getFirestoreDatabaseId(): string {
  const result = validateFirebaseConfig();
  if (result.isValid) {
    return result.config.firestoreDatabaseId;
  }
  if (runtimeAppletConfig) {
    return runtimeAppletConfig.firestoreDatabaseId;
  }
  throw new Error(result.errorMessage ?? 'Firebase configuration is incomplete.');
}

export function getFirebaseOAuthClientId(): string {
  const result = validateFirebaseConfig();
  if (result.isValid) {
    return result.config.oAuthClientId;
  }
  if (runtimeAppletConfig) {
    return runtimeAppletConfig.oAuthClientId;
  }
  throw new Error(result.errorMessage ?? 'Firebase configuration is incomplete.');
}
