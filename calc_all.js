const fs = require('fs');
const crypto = require('crypto');

const files = ['manifest.json', 'sw.js', 'icon.svg', 'engine.js', 'index.html'];

const info = {};
for (const f of files) {
  const content = fs.readFileSync(f);
  const sha1 = crypto.createHash('sha1').update(content).digest('hex');
  info[f] = {
    sha1,
    size: content.length,
    base64: content.toString('base64')
  };
}

fs.writeFileSync('files_info.json', JSON.stringify(info, null, 2), 'utf8');
console.log('Processed', Object.keys(info).length, 'files');
for (const f of Object.keys(info)) {
  console.log(`${f}: sha1=${info[f].sha1}, size=${info[f].size}`);
}
