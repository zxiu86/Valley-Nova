const fs = require('fs');
const path = require('path');

const browserDir = path.join(__dirname, '..', 'dist', 'app', 'browser');
const docsDir = path.join(__dirname, '..', 'docs');

console.log('--- Preparing GitHub Pages Static Build ---');

if (!fs.existsSync(browserDir)) {
  console.error('Error: Browser build directory not found at:', browserDir);
  process.exit(1);
}

// 1. Ensure index.html exists in browserDir
const targetIndexHtml = path.join(browserDir, 'index.html');
const candidateCsrHtml = path.join(browserDir, 'index.csr.html');
const candidateLibraryHtml = path.join(browserDir, 'library', 'index.html');

if (!fs.existsSync(targetIndexHtml)) {
  if (fs.existsSync(candidateCsrHtml)) {
    fs.copyFileSync(candidateCsrHtml, targetIndexHtml);
    console.log('✓ Created dist/app/browser/index.html from index.csr.html');
  } else if (fs.existsSync(candidateLibraryHtml)) {
    fs.copyFileSync(candidateLibraryHtml, targetIndexHtml);
    console.log('✓ Created dist/app/browser/index.html from library/index.html');
  }
} else {
  console.log('✓ dist/app/browser/index.html already exists');
}

// 2. Create 404.html from index.html (Vital for GitHub Pages SPA routing)
if (fs.existsSync(targetIndexHtml)) {
  const target404Html = path.join(browserDir, '404.html');
  fs.copyFileSync(targetIndexHtml, target404Html);
  console.log('✓ Created dist/app/browser/404.html for GitHub Pages routing');
}

// 3. Create .nojekyll (Prevents GitHub Pages from ignoring files with underscores)
const noJekyllPath = path.join(browserDir, '.nojekyll');
fs.writeFileSync(noJekyllPath, '');
console.log('✓ Created dist/app/browser/.nojekyll');

// 4. Also copy all browser files to root /docs folder for users who choose "Deploy from /docs folder"
try {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDirRecursive(browserDir, docsDir);
  console.log('✓ Synchronized all static files to /docs folder for direct GitHub Pages hosting');
} catch (err) {
  console.warn('Notice: Could not copy to /docs:', err.message);
}

console.log('✓ GitHub Pages preparation completed successfully!');
