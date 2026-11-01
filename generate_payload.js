const fs = require('fs');
const path = require('path');

const filesToDeploy = [
  'index.html',
  'engine.js',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'vercel.json'
];

const filesPayload = filesToDeploy.map(filename => {
  const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  return {
    file: filename,
    data: content,
    encoding: 'utf-8'
  };
});

const payload = {
  requestBody: {
    name: 'pipelab-simulator',
    project: 'prj_lGsNlWEdGAZactNlVj9T4f8AgXoQ',
    target: 'production',
    files: filesPayload
  }
};

fs.writeFileSync('deploy_payload.json', JSON.stringify(payload), 'utf8');
console.log('Payload generated. Size:', fs.statSync('deploy_payload.json').size, 'bytes');
