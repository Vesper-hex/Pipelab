const { RISCPipelineEngine } = require('./engine.js');

const prog = `
ADDI R1, R0, 0
ADDI R2, R0, 1
ADDI R3, R0, 9
LOOP:
ADD R1, R1, R2
ADDI R2, R2, 1
BNE R2, R3, LOOP
SW R1, 20(R0)
`;

const configs = [
  { fwd: true, pred: 'not-taken', name: 'Fwd ON + Not-Taken' },
  { fwd: true, pred: 'taken', name: 'Fwd ON + Taken' },
  { fwd: true, pred: '1-bit', name: 'Fwd ON + 1-Bit' },
  { fwd: true, pred: '2-bit', name: 'Fwd ON + 2-Bit' },
  { fwd: false, pred: 'not-taken', name: 'Fwd OFF + Not-Taken' },
  { fwd: false, pred: 'taken', name: 'Fwd OFF + Taken' },
  { fwd: false, pred: '1-bit', name: 'Fwd OFF + 1-Bit' },
  { fwd: false, pred: '2-bit', name: 'Fwd OFF + 2-Bit' },
];

console.log('--- ALL 8 CONFIGURATIONS RESULTS ---');
for (const c of configs) {
  const eng = new RISCPipelineEngine(prog, { forwarding: c.fwd, predictor: c.pred, clockPeriodNs: 1.0 });
  eng.run();
  console.log(c.name.padEnd(24), JSON.stringify(eng.getStats()));
}
