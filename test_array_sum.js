const { RISCPipelineEngine } = require('./engine.js');

const prog = `
ADDI R1, R0, 0
ADDI R2, R0, 0
ADDI R3, R0, 6
LOOP:
LW R4, 0(R2)
ADD R1, R1, R4
ADDI R2, R2, 1
BNE R2, R3, LOOP
SW R1, 30(R0)
`;

const configs = [
  { fwd: true, pred: '2-bit', name: 'Fwd ON + 2-Bit' },
  { fwd: false, pred: '2-bit', name: 'Fwd OFF + 2-Bit' },
];

for (const c of configs) {
  const eng = new RISCPipelineEngine(prog, { forwarding: c.fwd, predictor: c.pred, clockPeriodNs: 1.0 });
  eng.run();
  console.log(c.name.padEnd(20), JSON.stringify(eng.getStats()), 'mem[30] =', eng.memory[30]);
}
