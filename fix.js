const fs = require('fs');
const files = [
  'frontend/src/pages/CustomerTracker.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/([a-zA-Z0-9_]+):\s*(\d+(?:\.\d+)?)(rem|px|vw|vh|em)\b/g, "$1: '$2$3'");
  fs.writeFileSync(f, content);
  console.log("Fixed " + f);
});
