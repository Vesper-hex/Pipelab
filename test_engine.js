const { Assembler, RISCPipelineEngine } = require('./engine.js');

function runTest(testName, fn) {
  try {
    fn();
    console.log(`[PASS] ${testName}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${testName}: ${err.message}`);
    if (err.stack) console.error(err.stack);
    return false;
  }
}

let passed = 0;
let total = 0;

console.log('--- RUNNING PIPELAB TEST SUITE ---');

// Test 1: 6 independent instructions (any config: 10 cycles, 0 stalls)
total++;
if (runTest('Test 1: 6 independent instructions (10 cycles, 0 stalls)', () => {
  const prog = `
    ADDI R1, R0, 10
    ADDI R2, R0, 20
    ADDI R3, R0, 30
    ADDI R4, R0, 40
    ADDI R5, R0, 50
    ADDI R6, R0, 60
  `;
  const engine = new RISCPipelineEngine(prog, { forwarding: true, predictor: 'not-taken' });
  engine.run();
  const stats = engine.getStats();

  if (stats.cycles !== 10) throw new Error(`Expected 10 cycles, got ${stats.cycles}`);
  if (stats.stallCycles !== 0) throw new Error(`Expected 0 stalls, got ${stats.stallCycles}`);
  if (stats.instructionsRetired !== 6) throw new Error(`Expected 6 retired, got ${stats.instructionsRetired}`);
})) passed++;

// Test 2: 5-instruction dependent ALU chain (forwarding on: 9 cycles, 0 stalls)
total++;
if (runTest('Test 2: 5-instruction dependent ALU chain (forwarding on: 9 cycles, 0 stalls)', () => {
  const prog = `
    ADDI R1, R0, 1
    ADD R2, R1, R1
    ADD R3, R2, R1
    ADD R4, R3, R2
    ADD R5, R4, R3
  `;
  const engine = new RISCPipelineEngine(prog, { forwarding: true, predictor: 'not-taken' });
  engine.run();
  const stats = engine.getStats();

  if (stats.cycles !== 9) throw new Error(`Expected 9 cycles, got ${stats.cycles}`);
  if (stats.stallCycles !== 0) throw new Error(`Expected 0 stalls, got ${stats.stallCycles}`);
  if (stats.instructionsRetired !== 5) throw new Error(`Expected 5 retired, got ${stats.instructionsRetired}`);
})) passed++;

// Test 3: Same chain (forwarding off: 17 cycles, 8 stalls)
total++;
if (runTest('Test 3: 5-instruction dependent ALU chain (forwarding off: 17 cycles, 8 stalls)', () => {
  const prog = `
    ADDI R1, R0, 1
    ADD R2, R1, R1
    ADD R3, R2, R1
    ADD R4, R3, R2
    ADD R5, R4, R3
  `;
  const engine = new RISCPipelineEngine(prog, { forwarding: false, predictor: 'not-taken' });
  engine.run();
  const stats = engine.getStats();

  if (stats.cycles !== 17) throw new Error(`Expected 17 cycles, got ${stats.cycles}`);
  if (stats.stallCycles !== 8) throw new Error(`Expected 8 stalls, got ${stats.stallCycles}`);
  if (stats.instructionsRetired !== 5) throw new Error(`Expected 5 retired, got ${stats.instructionsRetired}`);
})) passed++;

// Test 4: LW, ADD (uses it), LW, SUB (uses it), SW (forwarding on: 11 cycles, 2 stalls)
total++;
if (runTest('Test 4: LW, ADD (uses it), LW, SUB (uses it), SW (forwarding on: 11 cycles, 2 stalls)', () => {
  const prog = `
    LW R1, 0(R0)
    ADD R2, R1, R1
    LW R3, 1(R0)
    SUB R4, R3, R1
    SW R4, 2(R0)
  `;
  const engine = new RISCPipelineEngine(prog, { forwarding: true, predictor: 'not-taken' });
  engine.run();
  const stats = engine.getStats();

  if (stats.cycles !== 11) throw new Error(`Expected 11 cycles, got ${stats.cycles}`);
  if (stats.stallCycles !== 2) throw new Error(`Expected 2 stalls, got ${stats.stallCycles}`);
  if (stats.instructionsRetired !== 5) throw new Error(`Expected 5 retired, got ${stats.instructionsRetired}`);
})) passed++;

// Test 5: Loop of 8 iterations (not-taken vs 2-bit: 2-bit has fewer mispredictions and fewer cycles)
// Also verify functional result: loop sum program leaves 36 in memory word 20
total++;
if (runTest('Test 5: Loop of 8 iterations (2-bit vs not-taken & functional leaves 36 in mem[20])', () => {
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

  // Run with Always Not-Taken
  const engineNT = new RISCPipelineEngine(prog, { forwarding: true, predictor: 'not-taken' });
  engineNT.run();
  const statsNT = engineNT.getStats();

  // Run with 2-bit Saturating Counter
  const engine2Bit = new RISCPipelineEngine(prog, { forwarding: true, predictor: '2-bit' });
  engine2Bit.run();
  const stats2Bit = engine2Bit.getStats();

  console.log(`  Always Not-Taken: ${statsNT.cycles} cycles, ${statsNT.mispredictions} mispredictions`);
  console.log(`  2-bit Saturating: ${stats2Bit.cycles} cycles, ${stats2Bit.mispredictions} mispredictions`);

  if (engineNT.memory[20] !== 36) {
    throw new Error(`Expected memory[20] = 36, got ${engineNT.memory[20]}`);
  }
  if (engine2Bit.memory[20] !== 36) {
    throw new Error(`Expected memory[20] = 36, got ${engine2Bit.memory[20]}`);
  }

  if (stats2Bit.mispredictions >= statsNT.mispredictions) {
    throw new Error(`2-bit predictor should have fewer mispredictions (${stats2Bit.mispredictions}) than not-taken (${statsNT.mispredictions})`);
  }
  if (stats2Bit.cycles >= statsNT.cycles) {
    throw new Error(`2-bit predictor should have fewer cycles (${stats2Bit.cycles}) than not-taken (${statsNT.cycles})`);
  }
})) passed++;

// Test 6: Array sum functional result: stores 210 in word 30
total++;
if (runTest('Test 6: Array sum program stores 210 in memory word 30', () => {
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
  const engine = new RISCPipelineEngine(prog, { forwarding: true, predictor: '2-bit' });
  engine.run();

  if (engine.memory[30] !== 210) {
    throw new Error(`Expected memory[30] = 210, got ${engine.memory[30]}`);
  }
})) passed++;

// Test 7: Assembler error reporting with line numbers
total++;
if (runTest('Test 7: Assembler reports errors with line numbers', () => {
  const badProg = `
    ADDI R1, R0, 10
    BADOP R2, R1, R1
    ADD R16, R1, R2
    BEQ R1, R2, NONEXISTENT
  `;
  const result = Assembler.parse(badProg);
  if (result.success) throw new Error('Expected assembler to fail on bad program');
  if (result.errors.length !== 3) {
    throw new Error(`Expected 3 errors, got ${result.errors.length}: ${result.errors.join('; ')}`);
  }
  if (!result.errors.some(e => e.includes('Line 3') && e.includes('BADOP'))) {
    throw new Error(`Expected Line 3 BADOP error, got ${result.errors[0]}`);
  }
  if (!result.errors.some(e => e.includes('Line 4') && e.includes('R16'))) {
    throw new Error(`Expected Line 4 R16 error, got ${result.errors[1]}`);
  }
  if (!result.errors.some(e => e.includes('Line 5') && e.includes('NONEXISTENT'))) {
    throw new Error(`Expected Line 5 NONEXISTENT error, got ${result.errors[2]}`);
  }
})) passed++;

// Test 8: Execution Trace Step-Back / Undo functionality
total++;
if (runTest('Test 8: Cycle Undo / Step-Back functionality', () => {
  const prog = `
    ADDI R1, R0, 10
    ADDI R2, R1, 20
    ADD R3, R1, R2
  `;
  const engine = new RISCPipelineEngine(prog, { forwarding: true });
  for (let i = 0; i < 5; i++) engine.step();
  if (engine.cycle !== 5) throw new Error(`Expected cycle 5, got ${engine.cycle}`);

  const snapCycle3 = { ...engine.getStats() };

  // Step back 2 cycles -> should be at cycle 3
  engine.stepBack();
  engine.stepBack();
  if (engine.cycle !== 3) throw new Error(`Expected cycle 3 after 2 stepBack calls, got ${engine.cycle}`);

  // Step forward 2 cycles -> should return to cycle 5
  engine.step();
  engine.step();
  if (engine.cycle !== 5) throw new Error(`Expected cycle 5 after stepping forward again, got ${engine.cycle}`);
})) passed++;

console.log(`\nTEST SUMMARY: ${passed}/${total} passed`);
if (passed === total) {
  console.log('ALL SECTION 8 TEST CASES PASSED PERFECTLY!');
} else {
  process.exit(1);
}
