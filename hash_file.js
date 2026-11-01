const fs = require('fs');
const crypto = require('crypto');

const content = fs.readFileSync('vercel.json');
const sha1 = crypto.createHash('sha1').update(content).digest('hex');
const size = content.length;
const base64 = content.toString('base64');

console.log('SHA1:', sha1);
console.log('Size:', size);
console.log('Base64:', base64);
