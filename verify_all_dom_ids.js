const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all document.getElementById calls in scripts
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const queriedIds = new Set();
while ((match = idRegex.exec(html)) !== null) {
  queriedIds.add(match[1]);
}

console.log(`Total unique IDs queried in JS: ${queriedIds.size}`);

const missing = [];
for (const id of queriedIds) {
  // Check if this id exists in html tags (outside <script>)
  const idPattern = new RegExp(`\\bid=["']${id}["']`);
  if (!idPattern.test(html)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('MISSING DOM IDs DETECTED:', missing);
  process.exit(1);
} else {
  console.log('PERFECT! 100% of queried IDs exist in the DOM!');
}
