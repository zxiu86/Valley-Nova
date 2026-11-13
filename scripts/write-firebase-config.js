const fs = require('fs');
const path = require('path');

// Exact 9 GitHub Repository Secrets names — DO NOT rename or invent new secret names.
const FIREBASE_SECRET_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'FIREBASE_DATABASE_ID',
  'FIREBASE_OAUTH_CLIENT_ID',
];

// Restricted server-only Admin SDK / Service Account identifiers that must NEVER enter client builds.
const FORBIDDEN_CLIENT_SECRET_MARKERS = [
  'BEGIN PRIVATE KEY',
  'BEGIN RSA PRIVATE KEY',
  'BEGIN EC PRIVATE KEY',
  '"type": "service_account"',
  '"type":"service_account"',
];

const FORBIDDEN_ADMIN_ENV_KEYS = [
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_ADMIN_SDK_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
];

function loadDotEnvIfPresent(rootDir = path.join(__dirname, '..')) {
  if (process.env.CI === 'true') {
    return;
  }
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!FIREBASE_SECRET_KEYS.includes(key)) continue;
    if (process.env[key] && process.env[key].trim()) continue;
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) {
      process.env[key] = value;
    }
  }
}

function readAndValidateFirebaseEnv(envSource = process.env) {
  const missingKeys = [];
  const invalidKeys = [];
  const values = {};

  for (const key of FIREBASE_SECRET_KEYS) {
    const raw = typeof envSource[key] === 'string' ? envSource[key].trim() : '';
    if (!raw || (raw.includes('${{') && raw.includes('}}'))) {
      missingKeys.push(key);
      continue;
    }
    if (FORBIDDEN_CLIENT_SECRET_MARKERS.some((marker) => raw.includes(marker))) {
      invalidKeys.push(key);
      continue;
    }
    values[key] = raw;
  }

  if (invalidKeys.length > 0) {
    throw new Error(
      `Security violation: Admin/private key material detected in client Firebase variable(s): ${invalidKeys.join(', ')}.`
    );
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required Firebase secrets (${missingKeys.length}/${FIREBASE_SECRET_KEYS.length}): ` +
        `${missingKeys.join(', ')}. Configure all 9 keys in GitHub Repository Secrets without fallback defaults.`
    );
  }

  return values;
}

function getAngularDefineArgs(validatedValues) {
  const args = [];
  for (const key of FIREBASE_SECRET_KEYS) {
    args.push('--define', `${key}=${JSON.stringify(validatedValues[key])}`);
  }
  return args;
}

function assertNoAdminSecretsInBrowserBuild(browserDir) {
  if (!fs.existsSync(browserDir)) {
    throw new Error(`Build output directory not found: ${browserDir}`);
  }

  const stack = [browserDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (/\.(js|mjs|html|json)$/i.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const marker of FORBIDDEN_CLIENT_SECRET_MARKERS) {
          if (content.includes(marker)) {
            throw new Error(
              `Security violation: Restricted private key marker detected in build artifact (${path.basename(fullPath)}).`
            );
          }
        }
        for (const adminKey of FORBIDDEN_ADMIN_ENV_KEYS) {
          if (content.includes(adminKey)) {
            throw new Error(
              `Security violation: Restricted admin credential reference (${adminKey}) detected in client bundle.`
            );
          }
        }
      }
    }
  }
}

function main() {
  loadDotEnvIfPresent();
  let validated;
  try {
    validated = readAndValidateFirebaseEnv(process.env);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  console.log(
    `✓ Validated all ${FIREBASE_SECRET_KEYS.length} required Firebase keys from environment / GitHub Secrets.`
  );

  if (process.argv.includes('--write-json')) {
    const targetPath = path.join(__dirname, '..', 'firebase-applet-config.json');
    const jsonPayload = {
      projectId: validated.FIREBASE_PROJECT_ID,
      appId: validated.FIREBASE_APP_ID,
      apiKey: validated.FIREBASE_API_KEY,
      authDomain: validated.FIREBASE_AUTH_DOMAIN,
      firestoreDatabaseId: validated.FIREBASE_DATABASE_ID,
      storageBucket: validated.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: validated.FIREBASE_MESSAGING_SENDER_ID,
      measurementId: validated.FIREBASE_MEASUREMENT_ID,
      oAuthClientId: validated.FIREBASE_OAUTH_CLIENT_ID,
    };
    fs.writeFileSync(targetPath, JSON.stringify(jsonPayload, null, 2) + '\n', 'utf8');
    console.log('✓ Wrote gitignored firebase-applet-config.json.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  FIREBASE_SECRET_KEYS,
  FORBIDDEN_CLIENT_SECRET_MARKERS,
  FORBIDDEN_ADMIN_ENV_KEYS,
  loadDotEnvIfPresent,
  readAndValidateFirebaseEnv,
  getAngularDefineArgs,
  assertNoAdminSecretsInBrowserBuild,
};
