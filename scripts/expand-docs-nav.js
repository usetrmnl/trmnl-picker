#!/usr/bin/env node

/**
 * Automatically expand all accordion elements in documentation navigation
 */

const fs = require('fs');
const path = require('path');

const docsIndexPath = path.join(__dirname, '../doc/index.html');

if (!fs.existsSync(docsIndexPath)) {
  console.error('Error: doc/index.html not found');
  process.exit(1);
}

let html = fs.readFileSync(docsIndexPath, 'utf8');

// Remove 'display-none' from all toggle-target elements (handles both single and double quotes, and different class orderings)
html = html.replace(/class=['"]([^'"]*\s)?display-none\s+toggle-target([^'"]*)['"]/g, "class='$1toggle-target$2'");
html = html.replace(/class=['"]([^'"]*\s)?toggle-target\s+display-none([^'"]*)['"]/g, "class='$1toggle-target$2'");

// Change the toggle icon from ▸ (collapsed) to ▾ (expanded)
html = html.replace(/<span class='icon'>▸<\/span>/g, "<span class='icon'>▾</span>");

fs.writeFileSync(docsIndexPath, html);

console.log('✓ Expanded all navigation accordions in documentation');
