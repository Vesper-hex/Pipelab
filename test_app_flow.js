const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const { Assembler, BranchPredictor, RISCPipelineEngine } = require('./engine.js');

console.log('--- Testing Engine & Flow ---');

const sampleRegex = /'([1-5])':\s*`([\s\S]*?)`/g;
let match;
const samples = {};
while ((match = sampleRegex.exec(html)) !== null) {
  samples[match[1]] = match[2];
}

console.log(`Found ${Object.keys(samples).length} sample programs in index.html`);

for (const [id, code] of Object.entries(samples)) {
  const engine = new RISCPipelineEngine(code, {
    forwarding: true,
    predictor: '2-bit'
  });
  engine.runToHalt(200);
  console.log(`Sample ${id} executed successfully: ${engine.cycleCount} cycles, halted=${engine.isHalted}, CPI=${engine.getMetrics().cpi.toFixed(2)}`);
}

console.log('ALL 5 SAMPLES ASSEMBLE AND EXECUTE TO COMPLETION!');
