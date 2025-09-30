#!/usr/bin/env node

/**
 * Convert SVG icons to PNG using Playwright
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const iconsDir = path.join(__dirname, '../public/icons');
  const sizes = [16, 32, 144, 192, 512];

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    // Read SVG content
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Create HTML page with SVG
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; }
          svg { display: block; }
        </style>
      </head>
      <body>${svgContent}</body>
      </html>
    `;

    // Set page content and take screenshot
    await page.setContent(html);
    await page.setViewportSize({ width: size, height: size });
    await page.screenshot({ path: pngPath, type: 'png' });

    console.log(`✓ Converted icon-${size}x${size}.svg to PNG`);
  }

  await browser.close();
  console.log('\n✅ All icons converted successfully!');
}

convertSvgToPng().catch(console.error);
