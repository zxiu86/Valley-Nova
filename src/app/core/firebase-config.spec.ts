import { describe, it, expect, afterEach } from 'vitest';
import {
  FIREBASE_SECRET_KEYS,
  FirebaseSecretKey,
  getFirebaseClientConfig,
  getFirebaseOAuthClientId,
  getFirestoreDatabaseId,
  getMissingFirebaseSecretKeys,
  isFirebaseConfigComplete,
  validateFirebaseConfig,
} from './firebase-config';
import { isFirebaseConfigured } from './mtx-firebase';

const SAMPLE_ENV: Record<FirebaseSecretKey, string> = {
  FIREBASE_API_KEY: 'test-public-web-key-01',
  FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'test-project-id',
  FIREBASE_STORAGE_BUCKET: 'test-project.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: '123456789012',
  FIREBASE_APP_ID: '1:123456789012:web:abcdef123456',
  FIREBASE_MEASUREMENT_ID: 'G-TEST12345',
  FIREBASE_DATABASE_ID: '(default)',
  FIREBASE_OAUTH_CLIENT_ID: '123456789012-testclient.apps.googleusercontent.com',
};

function getNodeEnv(): Record<string, string | undefined> {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (!proc) {
    throw new Error('process.env is unavailable in test runtime.');
  }
  if (!proc.env) {
    proc.env = {};
  }
  return proc.env;
}

describe('Centralized Firebase Configuration & 9 GitHub Secrets Mapping', () => {
  const originalEnv: Partial<Record<FirebaseSecretKey, string | undefined>> = {};

  afterEach(() => {
    const env = getNodeEnv();
    for (const key of FIREBASE_SECRET_KEYS) {
      if (key in originalEnv) {
        if (originalEnv[key] === undefined) {
          delete env[key];
        } else {
          env[key] = originalEnv[key];
        }
        delete originalEnv[key];
      }
    }
  });

  function setEnvForTest(values: Partial<Record<FirebaseSecretKey, string | undefined>>): void {
    const env = getNodeEnv();
    for (const key of FIREBASE_SECRET_KEYS) {
      if (!(key in originalEnv)) {
        originalEnv[key] = env[key];
      }
      const next = values[key];
      if (next === undefined) {
        delete env[key];
      } else {
        env[key] = next;
      }
    }
  }

  it('should define the exact 9 GitHub Repository Secrets keys without renaming or adding extra keys', () => {
    expect(FIREBASE_SECRET_KEYS).toEqual([
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
      'FIREBASE_MEASUREMENT_ID',
      'FIREBASE_DATABASE_ID',
      'FIREBASE_OAUTH_CLIENT_ID',
    ]);
    expect(FIREBASE_SECRET_KEYS.length).toBe(9);
  });

  it('should validate and expose all 9 values cleanly through centralized accessors when present', () => {
    setEnvForTest(SAMPLE_ENV);

    expect(isFirebaseConfigComplete()).toBe(true);
    expect(isFirebaseConfigured()).toBe(true);
    expect(getMissingFirebaseSecretKeys()).toEqual([]);

    const clientCfg = getFirebaseClientConfig();
    expect(clientCfg).toEqual({
      apiKey: SAMPLE_ENV.FIREBASE_API_KEY,
      authDomain: SAMPLE_ENV.FIREBASE_AUTH_DOMAIN,
      projectId: SAMPLE_ENV.FIREBASE_PROJECT_ID,
      storageBucket: SAMPLE_ENV.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: SAMPLE_ENV.FIREBASE_MESSAGING_SENDER_ID,
      appId: SAMPLE_ENV.FIREBASE_APP_ID,
      measurementId: SAMPLE_ENV.FIREBASE_MEASUREMENT_ID,
    });
    expect(getFirestoreDatabaseId()).toBe(SAMPLE_ENV.FIREBASE_DATABASE_ID);
    expect(getFirebaseOAuthClientId()).toBe(SAMPLE_ENV.FIREBASE_OAUTH_CLIENT_ID);
  });

  it('should fail validation when ANY of the 9 keys is missing without using fake defaults or leaking secret values', () => {
    for (const omittedKey of FIREBASE_SECRET_KEYS) {
      const partial: Partial<Record<FirebaseSecretKey, string>> = { ...SAMPLE_ENV };
      delete partial[omittedKey];

      const result = validateFirebaseConfig(partial);
      expect(result.isValid).toBe(false);
      expect(result.missingKeys).toContain(omittedKey);
      expect(result.errorMessage).toContain(omittedKey);

      for (const key of FIREBASE_SECRET_KEYS) {
        if (partial[key] && partial[key] !== '(default)') {
          expect(result.errorMessage).not.toContain(partial[key]);
        }
      }
    }
  });

  it('should reject unexpanded GitHub Actions placeholder strings', () => {
    const withPlaceholder = {
      ...SAMPLE_ENV,
      FIREBASE_API_KEY: '${{ secrets.FIREBASE_API_KEY }}',
    };
    const result = validateFirebaseConfig(withPlaceholder);
    expect(result.isValid).toBe(false);
    expect(result.missingKeys).toEqual(['FIREBASE_API_KEY']);
  });

  it('should throw clear missing-key error without exposing secrets when accessors are called unconfigured', () => {
    setEnvForTest({});
    expect(isFirebaseConfigured()).toBe(false);
    expect(() => getFirebaseClientConfig()).toThrow(/FIREBASE_API_KEY/);
    expect(() => getFirestoreDatabaseId()).toThrow(/FIREBASE_DATABASE_ID/);
    expect(() => getFirebaseOAuthClientId()).toThrow(/FIREBASE_OAUTH_CLIENT_ID/);
  });
});
