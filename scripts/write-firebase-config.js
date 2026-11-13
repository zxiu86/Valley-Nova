const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'firebase-applet-config.json');

const envConfig = {
  projectId: (process.env.FIREBASE_PROJECT_ID || '').trim(),
  appId: (process.env.FIREBASE_APP_ID || '').trim(),
  apiKey: (process.env.FIREBASE_API_KEY || '').trim(),
  authDomain: (process.env.FIREBASE_AUTH_DOMAIN || '').trim(),
  firestoreDatabaseId: (process.env.FIREBASE_DATABASE_ID || '(default)').trim() || '(default)',
  storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  measurementId: (process.env.FIREBASE_MEASUREMENT_ID || '').trim(),
  oAuthClientId: (process.env.FIREBASE_OAUTH_CLIENT_ID || '').trim(),
  recaptchaSiteKey: (process.env.FIREBASE_RECAPTCHA_SITE_KEY || '').trim(),
};

const hasEnvSecrets = Boolean(envConfig.apiKey && envConfig.projectId && envConfig.appId);

if (hasEnvSecrets) {
  fs.writeFileSync(targetPath, JSON.stringify(envConfig, null, 2) + '\n', 'utf8');
  console.log('✓ Generated firebase-applet-config.json from environment / GitHub Secrets.');
} else if (fs.existsSync(targetPath)) {
  console.log('✓ Existing local firebase-applet-config.json detected and preserved.');
} else {
  console.error(
    'Error: Missing Firebase configuration. Configure GitHub Repository Secrets ' +
      '(FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID, ' +
      'FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_MEASUREMENT_ID, FIREBASE_OAUTH_CLIENT_ID) ' +
      'or create local firebase-applet-config.json from firebase-applet-config.example.json.'
  );
  process.exit(1);
}
