const fs = require('fs');
const path = require('path');

const possibleBrowserDirs = [
  path.join(__dirname, '..', 'dist', 'app', 'browser'),
  path.join(__dirname, '..', 'dist', 'app')
];

let browserDir = possibleBrowserDirs.find(d => fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html')));
if (!browserDir) {
  browserDir = possibleBrowserDirs.find(d => fs.existsSync(d));
}

const docsDir = path.join(__dirname, '..', 'docs');

console.log('--- Preparing GitHub Pages Static Build ---');

if (!browserDir || !fs.existsSync(browserDir)) {
  console.error('Error: Build directory not found in dist/app');
  process.exit(1);
}

console.log('Using build output from:', browserDir);

// 1. Ensure index.html exists in browserDir and has relative base href for GitHub Pages
const targetIndexHtml = path.join(browserDir, 'index.html');
const candidateCsrHtml = path.join(browserDir, 'index.csr.html');

if (!fs.existsSync(targetIndexHtml) && fs.existsSync(candidateCsrHtml)) {
  fs.copyFileSync(candidateCsrHtml, targetIndexHtml);
  console.log('✓ Created index.html from index.csr.html');
}

if (fs.existsSync(targetIndexHtml)) {
  let indexContent = fs.readFileSync(targetIndexHtml, 'utf8');
  // Ensure base href is relative (./) so GitHub Pages repo subpaths work without 404
  if (indexContent.includes('<base href="/"')) {
    indexContent = indexContent.replace('<base href="/"', '<base href="./"');
    fs.writeFileSync(targetIndexHtml, indexContent);
    console.log('✓ Updated base href to relative ("./") in index.html');
  }
} else {
  console.error('Warning: index.html was not found in', browserDir);
}

// 2. Create 404.html from index.html (Vital for GitHub Pages SPA routing fallback)
if (fs.existsSync(targetIndexHtml)) {
  const target404Html = path.join(browserDir, '404.html');
  fs.copyFileSync(targetIndexHtml, target404Html);
  console.log('✓ Created 404.html for GitHub Pages SPA routing');
}

// 3. Create .nojekyll (Prevents GitHub Pages from ignoring files with underscores)
const noJekyllPath = path.join(browserDir, '.nojekyll');
fs.writeFileSync(noJekyllPath, '');
console.log('✓ Created .nojekyll in build directory');

// 4. Synchronize all static files to root /docs folder for direct GitHub Pages hosting
try {
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(docsDir, { recursive: true });

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
  
  // Ensure .nojekyll exists directly in docs
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  console.log('✓ Synchronized all static files to /docs folder for direct GitHub Pages hosting');
} catch (err) {
  console.warn('Notice: Could not copy to /docs:', err.message);
}

console.log('✓ GitHub Pages preparation completed successfully!');
