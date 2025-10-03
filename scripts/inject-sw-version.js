#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate build version from git commit hash or timestamp
let buildVersion;
try {
  // Try to get git commit hash
  buildVersion = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (error) {
  // Fallback to timestamp if git is not available
  buildVersion = Date.now().toString();
}

// Add timestamp to make it unique even for same commit
buildVersion = `${buildVersion}-${Date.now()}`;

console.log(`Injecting service worker version: ${buildVersion}`);

// Read service worker template
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace placeholder with actual version
swContent = swContent.replace(/__BUILD_VERSION__/g, buildVersion);

// Write back to the same file (it will be committed to source with placeholder)
// In production, this runs on each build to inject fresh version
fs.writeFileSync(swPath, swContent);

console.log('Service worker version injected successfully!');
