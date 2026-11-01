/**
 * PipeLab - Pure JavaScript 5-Stage RISC Pipeline Simulation Engine
 *
 * Implements: IF, ID, EX, MEM, WB with configurable forwarding and branch prediction.
 * No DOM dependencies - runs in Node.js and browser environments.
 */

class Assembler {
  static parse(sourceCode) {
    const lines = sourceCode.split('\n');
    const labels = new Map();
    const rawInstructions = [];
    const errors = [];

    // Pass 1: Strip comments, collect labels and raw instruction lines
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      let line = lines[i];

      // Remove comments (# or ;)
      const commentIdx = line.search(/[#;]/);
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = line.trim();
      if (!line) continue;

      // Check for labels (may be standalone or prefixed before instruction)
      while (true) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) break;

        const labelPart = line.substring(0, colonIdx).trim();
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(labelPart)) {
          errors.push(`Line ${lineNum}: Invalid label name '${labelPart}'`);
          break;
        }
        if (labels.has(labelPart.toUpperCase())) {
          errors.push(`Line ${lineNum}: Duplicate label '${labelPart}'`);
          break;
        }

        // Target PC will be the index in rawInstructions
        labels.set(labelPart.toUpperCase(), rawInstructions.length);
        line = line.substring(colonIdx + 1).trim();
      }

      if (line) {
        rawInstructions.push({
          lineNum,
          text: line,
          pc: rawInstructions.length
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors, instructions: [], labels };
    }

    // Pass 2: Parse instructions and validate registers & operands
    const instructions = [];
    const REG_REGEX = /^R([0-9]|1[0-5])$/i;

    function parseReg(token, lineNum, fieldName) {
      if (!token) {
        errors.push(`Line ${lineNum}: Missing register for ${fieldName}`);
        return null;
      }
      const match = token.trim().match(REG_REGEX);
      if (!match) {
        errors.push(`Line ${lineNum}: Invalid register '${token}'. Expected R0-R15`);
        return null;
      }
      return parseInt(match[1], 10);
    }

    function parseMemOperand(token, lineNum) {
      // Format: off(rs) e.g. 0(R1), -4(R2), 20(R0)
      const memMatch = token.trim().match(/^(-?\d+)\s*\(\s*R([0-9]|1[0-5])\s*\)$/i);
      if (!memMatch) {
        errors.push(`Line ${lineNum}: Invalid memory operand '${token}'. Expected format: offset(Rs), e.g. 0(R1)`);
        return { offset: 0, rs: null };
      }
      return {
        offset: parseInt(memMatch[1], 10),
        rs: parseInt(memMatch[2], 10)
      };
    }

    for (const raw of rawInstructions) {
      const lineNum = raw.lineNum;
      const pc = raw.pc;
      const text = raw.text;

      // Split opcode and arguments
      const spaceIdx = text.search(/\s/);
      let op = '';
      let argsStr = '';
      if (spaceIdx === -1) {
        op = text.toUpperCase();
        argsStr = '';
      } else {
        op = text.substring(0, spaceIdx).trim().toUpperCase();
        argsStr = text.substring(spaceIdx).trim();
      }

      // Split arguments by comma
      const args = argsStr ? argsStr.split(',').map(s => s.trim()) : [];

      let parsed = {
        pc,
        lineNum,
        raw: text,
        op,
        rd: null,
        rs: null,
        rt: null,
        imm: null,
        offset: null,
        label: null,
        targetPc: null
      };

      switch (op) {
        case 'ADD':
        case 'SUB':
        case 'AND':
        case 'OR': {
          if (args.length !== 3) {
            errors.push(`Line ${lineNum}: ${op} expects 3 arguments: ${op} rd, rs, rt`);
          } else {
            parsed.rd = parseReg(args[0], lineNum, 'rd');
            parsed.rs = parseReg(args[1], lineNum, 'rs');
            parsed.rt = parseReg(args[2], lineNum, 'rt');
          }
          break;
        }

        case 'ADDI': {
          if (args.length !== 3) {
            errors.push(`Line ${lineNum}: ADDI expects 3 arguments: ADDI rd, rs, imm`);
          } else {
            parsed.rd = parseReg(args[0], lineNum, 'rd');
            parsed.rs = parseReg(args[1], lineNum, 'rs');
            const immVal = parseInt(args[2], 10);
            if (isNaN(immVal)) {
              errors.push(`Line ${lineNum}: Invalid immediate value '${args[2]}'`);
            } else {
              parsed.imm = immVal;
            }
          }
          break;
        }

        case 'LW':
        case 'SW': {
          if (args.length !== 2) {
            errors.push(`Line ${lineNum}: ${op} expects 2 arguments: ${op} rt, off(rs)`);
          } else {
            parsed.rt = parseReg(args[0], lineNum, 'rt');
            const mem = parseMemOperand(args[1], lineNum);
            parsed.offset = mem.offset;
            parsed.rs = mem.rs;
          }
          break;
        }

        case 'BEQ':
        case 'BNE': {
          if (args.length !== 3) {
            errors.push(`Line ${lineNum}: ${op} expects 3 arguments: ${op} rs, rt, label`);
          } else {
            parsed.rs = parseReg(args[0], lineNum, 'rs');
            parsed.rt = parseReg(args[1], lineNum, 'rt');
            const labelTarget = args[2].trim().toUpperCase();
            parsed.label = labelTarget;
            if (!labels.has(labelTarget)) {
              errors.push(`Line ${lineNum}: Unknown branch target label '${args[2]}'`);
            } else {
              parsed.targetPc = labels.get(labelTarget);
            }
          }
          break;
        }

        case 'NOP': {
          // No arguments required
          break;
        }

        default:
          errors.push(`Line ${lineNum}: Unknown instruction '${op}'`);
          break;
      }

      instructions.push(parsed);
    }

    if (errors.length > 0) {
      return { success: false, errors, instructions: [], labels };
    }

    return { success: true, errors: [], instructions, labels };
  }
}

class BranchPredictor {
  constructor(type) {
    this.type = type; // 'not-taken', 'taken', '1-bit', '2-bit'
    // Per-branch history keyed by PC
    this.table = new Map();
  }

  predict(pc) {
    switch (this.type) {
      case 'not-taken':
        return false;
      case 'taken':
        return true;
      case '1-bit': {
        if (!this.table.has(pc)) {
          this.table.set(pc, false); // Initial: not taken
        }
        return this.table.get(pc);
      }
      case '2-bit': {
        // States:
        // 0: Strongly Not-Taken
        // 1: Weakly Not-Taken (initial)
        // 2: Weakly Taken
        // 3: Strongly Taken
        if (!this.table.has(pc)) {
          this.table.set(pc, 1); // starts weakly not-taken
        }
        const state = this.table.get(pc);
        return state >= 2;
      }
      default:
        return false;
    }
  }

  update(pc, actualTaken) {
    switch (this.type) {
      case '1-bit': {
        this.table.set(pc, actualTaken);
        break;
      }
      case '2-bit': {
        let state = this.table.has(pc) ? this.table.get(pc) : 1;
        if (actualTaken) {
          state = Math.min(3, state + 1);
        } else {
          state = Math.max(0, state - 1);
        }
        this.table.set(pc, state);
        break;
      }
      default:
        break;
    }
  }

  getState(pc) {
    return this.table.get(pc);
  }
}

class RISCPipelineEngine {
  constructor(sourceCode, config = {}) {
    this.sourceCode = sourceCode;
    this.forwardingEnabled = config.forwarding !== undefined ? config.forwarding : true;
    this.predictorType = config.predictor || 'not-taken';
    this.clockPeriodNs = config.clockPeriodNs !== undefined ? config.clockPeriodNs : 1.0;

    // Assemble program
    const assembleResult = Assembler.parse(sourceCode);
    if (!assembleResult.success) {
      throw new Error(assembleResult.errors.join('\n'));
    }
    this.program = assembleResult.instructions;
    this.labels = assembleResult.labels;

    this.predictor = new BranchPredictor(this.predictorType);
    this.reset();
  }

  reset() {
    this.predictor = new BranchPredictor(this.predictorType);

    // Architectural registers R0..R15
    this.registers = new Array(16).fill(0);

    // Data memory: 64 words, mem[i] = 10 * (i + 1)
    this.memory = new Array(64);
    for (let i = 0; i < 64; i++) {
      this.memory[i] = 10 * (i + 1);
    }

    // Program Counter
    this.pc = 0;
    this.cycle = 0;
    this.instructionsRetired = 0;
    this.stallCycles = 0;
    this.flushCycles = 0;
    this.branchCount = 0;
    this.mispredictionCount = 0;
    this.isHalted = false;

    // Stage latches (represent instructions entering the stages in the current cycle)
    // latch_ID: instruction waiting in ID stage
    // latch_EX: instruction waiting in EX stage
    // latch_MEM: instruction waiting in MEM stage
    // latch_WB: instruction waiting in WB stage
    this.latch_ID = null;
    this.latch_EX = null;
    this.latch_MEM = null;
    this.latch_WB = null;

    // Held in IF flag (when ID stalls, IF is held)
    this.held_IF = null;

    // Pipeline history for visualization: array of dynamic instructions
    this.dynamicInstructions = [];
    this.dynamicIdCounter = 0;

    // Event logs: array of { cycle, type: 'STALL'|'FLUSH'|'INFO', message }
    this.logs = [];

    // Track recently modified registers and memory addresses for UI highlights
    this.lastModifiedReg = null;
    this.lastModifiedMem = null;

    // Snapshot of stages in the current cycle for UI display
    this.currentStages = {
      IF: null,
      ID: null,
      EX: null,
      MEM: null,
      WB: null
    };

    // Cycle history stack for step-back / undo capability
    this.historyStack = [];
  }

  // Capture deep state snapshot for cycle undo
  _captureSnapshot() {
    return {
      pc: this.pc,
      cycle: this.cycle,
      registers: [...this.registers],
      memory: [...this.memory],
      instructionsRetired: this.instructionsRetired,
      stallCycles: this.stallCycles,
      flushCycles: this.flushCycles,
      branchCount: this.branchCount,
      mispredictionCount: this.mispredictionCount,
      isHalted: this.isHalted,
      latch_ID: this.latch_ID,
      latch_EX: this.latch_EX,
      latch_MEM: this.latch_MEM,
      latch_WB: this.latch_WB,
      held_IF: this.held_IF,
      lastModifiedReg: this.lastModifiedReg,
      lastModifiedMem: this.lastModifiedMem,
      currentStages: { ...this.currentStages },
      logsCount: this.logs.length,
      predictorTable: new Map(this.predictor.table),
      dynamicInstCount: this.dynamicInstructions.length,
      dynamicStates: this.dynamicInstructions.map(d => ({
        id: d.id,
        status: d.status,
        stages: { ...d.stages },
        predictedTaken: d.predictedTaken,
        actualTaken: d.actualTaken,
        valA: d.valA,
        valB: d.valB,
        aluResult: d.aluResult,
        memData: d.memData,
        storeVal: d.storeVal,
        result: d.result,
        dest: d.dest
      }))
    };
  }

  // Create a new dynamic instruction instance
  _createDynamicInst(inst, pc) {
    const dyn = {
      id: ++this.dynamicIdCounter,
      inst,
      pc,
      asm: inst.raw,
      lineNum: inst.lineNum,
      stages: {}, // cycle -> stage label: 'IF', 'ID', 'EX', 'MEM', 'WB', 'ID (stall)', '✕' (flushed)
      status: 'active', // 'active', 'retired', 'flushed'
      predictedTaken: false,
      actualTaken: null,
      valA: 0,
      valB: 0,
      aluResult: 0,
      memData: 0,
      storeVal: 0,
      result: 0,
      dest: null
    };
    this.dynamicInstructions.push(dyn);
    return dyn;
  }

  logEvent(type, message) {
    this.logs.push({
      cycle: this.cycle,
      type,
      message
    });
  }

  /**
   * One call to step() equals one clock cycle.
   * Process order per specification:
   * 1. fetch (IF)
   * 2. WB
   * 3. MEM
   * 4. EX
   * 5. Hazard check in ID
   * 6. Advance stage latches
   */
  step() {
    if (this.isHalted) {
      return false;
    }

    if (!this.historyStack) this.historyStack = [];
    this.historyStack.push(this._captureSnapshot());

    this.cycle++;
    this.lastModifiedReg = null;
    this.lastModifiedMem = null;

    let current_IF = null;
    let nextPC = this.pc;

    // -------------------------------------------------------------
    // 1. IF Stage: Fetch instruction at PC
    // -------------------------------------------------------------
    if (this.held_IF !== null) {
      // IF was held from previous cycle stall
      current_IF = this.held_IF;
      current_IF.stages[this.cycle] = 'IF (held)';
    } else if (this.pc >= 0 && this.pc < this.program.length) {
      const inst = this.program[this.pc];
      current_IF = this._createDynamicInst(inst, this.pc);
      current_IF.stages[this.cycle] = 'IF';

      // For a branch, ask the predictor
      if (inst.op === 'BEQ' || inst.op === 'BNE') {
        const pred = this.predictor.predict(this.pc);
        current_IF.predictedTaken = pred;
        if (pred) {
          this.pc = inst.targetPc;
        } else {
          this.pc = this.pc + 1;
        }
      } else {
        this.pc = this.pc + 1;
      }
    } else {
      current_IF = null;
    }

    // Temporary stages view for this cycle
    const stage_WB = this.latch_WB;
    const stage_MEM = this.latch_MEM;
    const stage_EX = this.latch_EX;
    const stage_ID = this.latch_ID;

    // -------------------------------------------------------------
    // 2. WB Stage: Write register file in first half of cycle
    // -------------------------------------------------------------
    if (stage_WB && stage_WB.status === 'active') {
      stage_WB.stages[this.cycle] = 'WB';
      if (stage_WB.dest !== null && stage_WB.dest !== 0) {
        this.registers[stage_WB.dest] = stage_WB.result;
        this.lastModifiedReg = stage_WB.dest;
      }
      // Ensure R0 is always 0
      this.registers[0] = 0;
      this.instructionsRetired++;
      stage_WB.status = 'retired';
    }

    // -------------------------------------------------------------
    // 3. MEM Stage: Loads read memory, stores write memory
    // -------------------------------------------------------------
    if (stage_MEM && stage_MEM.status === 'active') {
      stage_MEM.stages[this.cycle] = 'MEM';
      const op = stage_MEM.inst.op;

      if (op === 'LW') {
        const addr = stage_MEM.aluResult;
        if (addr >= 0 && addr < 64) {
          stage_MEM.memData = this.memory[addr];
          stage_MEM.result = stage_MEM.memData;
        } else {
          stage_MEM.memData = 0;
          stage_MEM.result = 0;
          this.logEvent('INFO', `LW address ${addr} out of range (0-63)`);
        }
      } else if (op === 'SW') {
        const addr = stage_MEM.aluResult;
        const val = stage_MEM.storeVal;
        if (addr >= 0 && addr < 64) {
          this.memory[addr] = val;
          this.lastModifiedMem = addr;
        } else {
          this.logEvent('INFO', `SW address ${addr} out of range (0-63)`);
        }
      } else {
        // ALU operations
        stage_MEM.result = stage_MEM.aluResult;
      }
    }

    // -------------------------------------------------------------
    // 4. EX Stage: Compute ALU results, read operands (forwarding or regs), resolve branches
    // -------------------------------------------------------------
    let branchMispredicted = false;
    let redirectPC = null;

    if (stage_EX && stage_EX.status === 'active') {
      stage_EX.stages[this.cycle] = 'EX';
      const inst = stage_EX.inst;

      // Determine operand A (rs)
      let valA = 0;
      if (inst.rs !== null) {
        if (inst.rs === 0) {
          valA = 0;
        } else if (this.forwardingEnabled && stage_MEM && stage_MEM.status === 'active' && stage_MEM.dest === inst.rs) {
          // Forwarding from instruction in MEM
          valA = stage_MEM.result;
        } else {
          // Read from register file (already updated by WB in step 2)
          valA = this.registers[inst.rs];
        }
      }
      stage_EX.valA = valA;

      // Determine operand B (rt)
      let valB = 0;
      if (inst.rt !== null) {
        if (inst.rt === 0) {
          valB = 0;
        } else if (this.forwardingEnabled && stage_MEM && stage_MEM.status === 'active' && stage_MEM.dest === inst.rt) {
          // Forwarding from instruction in MEM
          valB = stage_MEM.result;
        } else {
          // Read from register file
          valB = this.registers[inst.rt];
        }
      }
      stage_EX.valB = valB;

      // Execute operation
      switch (inst.op) {
        case 'ADD':
          stage_EX.aluResult = (valA + valB) | 0;
          stage_EX.dest = inst.rd;
          break;
        case 'SUB':
          stage_EX.aluResult = (valA - valB) | 0;
          stage_EX.dest = inst.rd;
          break;
        case 'AND':
          stage_EX.aluResult = (valA & valB) | 0;
          stage_EX.dest = inst.rd;
          break;
        case 'OR':
          stage_EX.aluResult = (valA | valB) | 0;
          stage_EX.dest = inst.rd;
          break;
        case 'ADDI':
          stage_EX.aluResult = (valA + inst.imm) | 0;
          stage_EX.dest = inst.rd;
          break;
        case 'LW':
          stage_EX.aluResult = (valA + inst.offset) | 0;
          stage_EX.dest = inst.rt;
          break;
        case 'SW':
          stage_EX.aluResult = (valA + inst.offset) | 0;
          stage_EX.storeVal = valB;
          stage_EX.dest = null;
          break;
        case 'BEQ':
        case 'BNE': {
          stage_EX.dest = null;
          this.branchCount++;
          const actualTaken = (inst.op === 'BEQ') ? (valA === valB) : (valA !== valB);
          stage_EX.actualTaken = actualTaken;

          // Update branch predictor with actual outcome
          this.predictor.update(stage_EX.pc, actualTaken);

          // Check for misprediction
          if (actualTaken !== stage_EX.predictedTaken) {
            branchMispredicted = true;
            this.mispredictionCount++;
            this.flushCycles += 2;

            if (actualTaken) {
              redirectPC = inst.targetPc;
            } else {
              redirectPC = stage_EX.pc + 1;
            }

            this.logEvent('FLUSH', `Branch misprediction for '${stage_EX.asm}' (predicted ${stage_EX.predictedTaken ? 'Taken' : 'Not-Taken'}, actual ${actualTaken ? 'Taken' : 'Not-Taken'}). Flushing IF and ID.`);
          }
          break;
        }
        case 'NOP':
          stage_EX.dest = null;
          break;
      }
    }

    // -------------------------------------------------------------
    // 5. Branch misprediction handling: Flush IF and ID
    // -------------------------------------------------------------
    if (branchMispredicted) {
      if (current_IF && current_IF.status === 'active') {
        current_IF.status = 'flushed';
        current_IF.stages[this.cycle] = '✕';
        current_IF = null;
      }
      if (stage_ID && stage_ID.status === 'active') {
        stage_ID.status = 'flushed';
        stage_ID.stages[this.cycle] = '✕';
      }
      this.held_IF = null;
      this.pc = redirectPC;
    }

    // -------------------------------------------------------------
    // 6. Hazard detection in ID Stage
    // -------------------------------------------------------------
    let stallID = false;
    let stallReason = '';

    if (!branchMispredicted && stage_ID && stage_ID.status === 'active') {
      const inst = stage_ID.inst;
      const neededRegs = [];

      // Determine which registers stage_ID needs
      if (inst.rs !== null && inst.rs !== 0) {
        neededRegs.push(inst.rs);
      }
      if (inst.rt !== null && inst.rt !== 0) {
        // rt is read in: ADD, SUB, AND, OR, SW, BEQ, BNE
        // rt is destination (not read) in LW, and unused in ADDI
        if (inst.op !== 'LW' && inst.op !== 'ADDI') {
          neededRegs.push(inst.rt);
        }
      }

      if (!this.forwardingEnabled) {
        // Forwarding OFF: stall while a producer of a needed register is in EX or MEM
        for (const reg of neededRegs) {
          if (stage_EX && stage_EX.status === 'active' && stage_EX.dest === reg) {
            stallID = true;
            stallReason = `${inst.op} needs R${reg}, produced by ${stage_EX.inst.op} in EX`;
            break;
          }
          if (stage_MEM && stage_MEM.status === 'active' && stage_MEM.dest === reg) {
            stallID = true;
            stallReason = `${inst.op} needs R${reg}, produced by ${stage_MEM.inst.op} in MEM`;
            break;
          }
        }
      } else {
        // Forwarding ON: stall one cycle only for a load-use hazard (producer is a LW in EX)
        for (const reg of neededRegs) {
          if (stage_EX && stage_EX.status === 'active' && stage_EX.inst.op === 'LW' && stage_EX.dest === reg) {
            stallID = true;
            stallReason = `${inst.op} needs R${reg}, produced by LW in EX (load-use hazard)`;
            break;
          }
        }
      }

      if (stallID) {
        this.stallCycles++;
        stage_ID.stages[this.cycle] = 'ID (stall)';
        this.logEvent('STALL', stallReason);
      } else {
        stage_ID.stages[this.cycle] = 'ID';
      }
    }

    // Store current live stage state for UI display
    this.currentStages = {
      IF: current_IF,
      ID: stage_ID,
      EX: stage_EX,
      MEM: stage_MEM,
      WB: stage_WB
    };

    // -------------------------------------------------------------
    // 7. Advance stage latches
    // -------------------------------------------------------------
    if (branchMispredicted) {
      // Branches mispredicted flushes IF and ID
      this.latch_WB = stage_MEM;
      this.latch_MEM = stage_EX;
      this.latch_EX = null;
      this.latch_ID = null;
      this.held_IF = null;
      // PC was already redirected in step 5
    } else if (stallID) {
      // Stall holds IF and ID, and inserts a bubble into EX
      this.latch_WB = stage_MEM;
      this.latch_MEM = stage_EX;
      this.latch_EX = null; // bubble
      this.latch_ID = stage_ID; // held
      this.held_IF = current_IF; // held
      // PC is not advanced while IF is held (already pointing to next instruction)
    } else {
      // Normal advance
      this.latch_WB = stage_MEM;
      this.latch_MEM = stage_EX;
      this.latch_EX = stage_ID;
      this.latch_ID = current_IF;
      this.held_IF = null;
    }

    // -------------------------------------------------------------
    // 8. Termination Check
    // Stop when PC is past the end and all stages are empty, or 5000 cycle safety limit
    // -------------------------------------------------------------
    const allStagesEmpty = !this.latch_ID && !this.latch_EX && !this.latch_MEM && !this.latch_WB && !this.held_IF;
    if ((this.pc >= this.program.length && allStagesEmpty) || this.cycle >= 5000) {
      this.isHalted = true;
      if (this.cycle >= 5000) {
        this.logEvent('INFO', '5000-cycle safety limit reached. Terminating simulation.');
      }
      return false;
    }

    return true;
  }

  // Run to completion
  run() {
    while (!this.isHalted) {
      this.step();
    }
  }

  // Step backward one clock cycle (undo)
  stepBack() {
    if (!this.historyStack || this.historyStack.length === 0) {
      return false;
    }

    const snap = this.historyStack.pop();
    this.pc = snap.pc;
    this.cycle = snap.cycle;
    this.registers = [...snap.registers];
    this.memory = [...snap.memory];
    this.instructionsRetired = snap.instructionsRetired;
    this.stallCycles = snap.stallCycles;
    this.flushCycles = snap.flushCycles;
    this.branchCount = snap.branchCount;
    this.mispredictionCount = snap.mispredictionCount;
    this.isHalted = snap.isHalted;
    this.latch_ID = snap.latch_ID;
    this.latch_EX = snap.latch_EX;
    this.latch_MEM = snap.latch_MEM;
    this.latch_WB = snap.latch_WB;
    this.held_IF = snap.held_IF;
    this.lastModifiedReg = snap.lastModifiedReg;
    this.lastModifiedMem = snap.lastModifiedMem;
    this.currentStages = snap.currentStages;
    this.logs.length = snap.logsCount;
    this.predictor.table = snap.predictorTable;
    this.dynamicInstructions.length = snap.dynamicInstCount;

    for (let i = 0; i < snap.dynamicStates.length; i++) {
      const ds = snap.dynamicStates[i];
      const d = this.dynamicInstructions[i];
      if (d) {
        d.status = ds.status;
        d.stages = { ...ds.stages };
        d.predictedTaken = ds.predictedTaken;
        d.actualTaken = ds.actualTaken;
        d.valA = ds.valA;
        d.valB = ds.valB;
        d.aluResult = ds.aluResult;
        d.memData = ds.memData;
        d.storeVal = ds.storeVal;
        d.result = ds.result;
        d.dest = ds.dest;
      }
    }

    return true;
  }

  // Calculate statistics
  getStats() {
    const cpi = this.instructionsRetired > 0
      ? (this.cycle / this.instructionsRetired)
      : 0;
    const executionTimeNs = this.cycle * this.clockPeriodNs;

    return {
      cycles: this.cycle,
      instructionsRetired: this.instructionsRetired,
      cpi: Number(cpi.toFixed(3)),
      stallCycles: this.stallCycles,
      flushCycles: this.flushCycles,
      branches: this.branchCount,
      mispredictions: this.mispredictionCount,
      executionTimeNs: Number(executionTimeNs.toFixed(2))
    };
  }
}

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Assembler, BranchPredictor, RISCPipelineEngine };
}
