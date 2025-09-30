#!/usr/bin/env node

/**
 * Script to generate PWA icons for GrabtoGo
 * This creates simple placeholder icons with the app branding
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon template for GrabtoGo (food delivery theme)
const createSVGIcon = (
  size
) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <!-- Fork and Knife icon -->
    <path fill="white" d="M ${size * 0.15} ${size * 0.1} L ${size * 0.15} ${size * 0.55} M ${size * 0.1} ${size * 0.1} L ${size * 0.1} ${size * 0.25} M ${size * 0.2} ${size * 0.1} L ${size * 0.2} ${size * 0.25}"
          stroke="white" stroke-width="${size * 0.03}" stroke-linecap="round"/>
    <!-- Shopping bag -->
    <path fill="none" stroke="white" stroke-width="${size * 0.04}" stroke-linecap="round" stroke-linejoin="round"
          d="M ${size * 0.35} ${size * 0.15} L ${size * 0.35} ${size * 0.25} Q ${size * 0.35} ${size * 0.15} ${size * 0.425} ${size * 0.15} Q ${size * 0.5} ${size * 0.15} ${size * 0.5} ${size * 0.25} L ${size * 0.5} ${size * 0.15}"/>
    <rect x="${size * 0.32}" y="${size * 0.2}" width="${size * 0.21}" height="${size * 0.35}"
          fill="none" stroke="white" stroke-width="${size * 0.04}" rx="${size * 0.02}"/>
  </g>
  <text x="50%" y="${size * 0.85}" font-family="Arial, sans-serif" font-size="${size * 0.12}"
        font-weight="bold" fill="white" text-anchor="middle">GrabtoGo</text>
</svg>`;

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
const sizes = [16, 32, 144, 192, 512];
sizes.forEach((size) => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svgContent);
  console.log(`✓ Generated icon-${size}x${size}.svg`);
});

console.log('\n⚠️  Note: SVG icons have been created as placeholders.');
console.log('To convert to PNG, you can use:');
console.log('  - Online tools like https://cloudconvert.com/svg-to-png');
console.log('  - ImageMagick: convert icon.svg icon.png');
console.log('  - Or use a design tool like Figma/Photoshop\n');
