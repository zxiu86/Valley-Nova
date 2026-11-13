const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  FIREBASE_SECRET_KEYS,
  loadDotEnvIfPresent,
  readAndValidateFirebaseEnv,
  getAngularDefineArgs,
  assertNoAdminSecretsInBrowserBuild,
} = require('./write-firebase-config');

const rootDir = path.join(__dirname, '..');

function resolveNgBinary() {
  const localNg = path.join(
    rootDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'ng.cmd' : 'ng'
  );
  if (fs.existsSync(localNg)) {
    return localNg;
  }
  return 'npx';
}

function verifyInjectedKeysInBundle(browserDir, validatedValues) {
  const files = fs
    .readdirSync(browserDir)
    .filter((name) => name.endsWith('.js') || name.endsWith('.mjs'));

  if (files.length === 0) {
    throw new Error('No compiled JavaScript bundles found in dist/app/browser.');
  }

  let combinedJs = '';
  for (const file of files) {
    combinedJs += fs.readFileSync(path.join(browserDir, file), 'utf8');
  }

  const missingFromBundle = [];
  for (const key of FIREBASE_SECRET_KEYS) {
    if (!combinedJs.includes(validatedValues[key])) {
      missingFromBundle.push(key);
    }
  }

  if (missingFromBundle.length > 0) {
    throw new Error(
      `Build verification failed: keys were not injected into Angular bundle: ${missingFromBundle.join(', ')}`
    );
  }
}

function main() {
  loadDotEnvIfPresent(rootDir);

  let validated;
  try {
    validated = readAndValidateFirebaseEnv(process.env);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  console.log(
    `✓ All ${FIREBASE_SECRET_KEYS.length} Firebase build keys verified. Compiling Angular production bundle...`
  );

  const ngBin = resolveNgBinary();
  const baseArgs = ngBin === 'npx' ? ['ng', 'build', '--base-href=./'] : ['build', '--base-href=./'];
  const defineArgs = getAngularDefineArgs(validated);

  execFileSync(ngBin, [...baseArgs, ...defineArgs], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  const prepareArgs = [path.join(__dirname, 'prepare-gh-pages.js')];
  if (process.argv.includes('--with-docs')) {
    prepareArgs.push('--with-docs');
  }
  execFileSync(process.execPath, prepareArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  const browserDir = path.join(rootDir, 'dist', 'app', 'browser');
  assertNoAdminSecretsInBrowserBuild(browserDir);
  verifyInjectedKeysInBundle(browserDir, validated);

  console.log(
    `✓ Verified all ${FIREBASE_SECRET_KEYS.length} Firebase configuration values in Angular bundle with zero private key leakage.`
  );
}

main();
