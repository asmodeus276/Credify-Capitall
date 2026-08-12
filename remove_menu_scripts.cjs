const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('views/pages', {recursive: true})
  .filter(f => f.endsWith('.ejs'))
  .map(f => path.join('views/pages', f));

let removedCount = 0;

const regex = /<script nonce="<%= nonce %>">\s*document\.addEventListener\("DOMContentLoaded", function \(\) {\s*var menuBtn = document\.getElementById\('mobile-menu-btn'\);[\s\S]*?if \(menuIcon\) menuIcon\.textContent = 'menu';\s*}\s*}\);\s*}\s*}\);\s*<\/script>\s*/m;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(f, content);
    removedCount++;
  }
});

console.log('Removed from ' + removedCount + ' files.');
