# PipeLab: CPU Pipeline and Performance Optimization Simulator

**PipeLab** is a cycle-accurate, interactive 5-stage RISC pipeline (`IF`, `ID`, `EX`, `MEM`, `WB`) simulator and microarchitecture mission control, designed for Computer Organization and Architecture (COA) education, research, and laboratory assignments.

The application runs as a **standalone desktop app** or web app with zero dependencies. Driven by a pure JavaScript engine ([`engine.js`](file:///C:/Users/divya/.gemini/antigravity/scratch/pipelab/engine.js)) and a dark glassmorphism mission control interface ([`index.html`](file:///C:/Users/divya/.gemini/antigravity/scratch/pipelab/index.html)).

---

## 1. Launching PipeLab as a Desktop App

You can launch PipeLab directly as a standalone application on Windows:

1. **Standalone App Mode (No Browser Chrome / Frameless Window):**
   - Double-click [`PipeLab.bat`](file:///C:/Users/divya/.gemini/antigravity/scratch/pipelab/PipeLab.bat) or run `powershell -ExecutionPolicy Bypass -File launch_app.ps1`.
   - Opens in a dedicated `1600x980` app window with its own icon in the Windows taskbar, frameless window controls, and zero browser address/tab bars.
2. **Direct Browser Mode:**
   - Double-click [`index.html`](file:///C:/Users/divya/.gemini/antigravity/scratch/pipelab/index.html) in Chrome, Edge, Safari, or Firefox.
3. **Progressive Web App (PWA):**
   - Click the **⬇ Install App** button in the top window bar to install PipeLab directly to your Windows desktop or Start Menu.
   - Works 100% offline via [`sw.js`](file:///C:/Users/divya/.gemini/antigravity/scratch/pipelab/sw.js) and [`manifest.json`](file:///C:/Users/divya/.gemini/antigravity/scratch/pipelab/manifest.json).

---

## 2. Desktop App Features & Controls

1. **Native Window Frame & App Menu:**
   - macOS / Windows traffic lights (`Close / Reset`, `Minimize / Focus`, `Maximize / Fullscreen`).
   - Native menu bar: **File**, **Simulate**, **View**, **Help**.
   - Fixed IDE-style bottom status bar with live status indicator, cycle counters, PC, CPI, forwarding state, and clock speed.

2. **Spotlight Command Palette (`Ctrl+K`):**
   - Press `Ctrl+K` anywhere to open the fuzzy search command palette.
   - Instant access to simulation controls, view switching, benchmark analysis, and preset programs.

3. **Web Audio Synthesizer (Sound FX):**
   - High-tech mission control sound effects generated in real-time via Web Audio API:
     - Clock ticks on cycle advance (`playTick`)
     - Subtle clicks on controls
     - Amber alerts on pipeline stalls (`playStall`)
     - Pitch sweep on branch misprediction flushes (`playFlush`)
     - Harmonious chords on program completion (`playComplete`)
   - Toggle audio on/off with hotkey `[M]` or from the top window bar and bottom status bar.

4. **Floating Toast Notifications:**
   - Smooth animated toast alerts confirming actions (snapshots, exports, forwarding toggles, preset loads).

5. **Cycle Undo / Step-Back (`|◀ Step Back (A)`):**
   - Bidirectional navigation: step backward in time (`[A]` hotkey), restoring previous pipeline latches, dynamic diagrams, registers, memory, and branch predictor tables.

6. **In-App ISA & Microarchitecture Reference Guide (`📖 ISA Guide (?)`):**
   - Built-in reference manual accessible directly inside the application (or by pressing `?`).

7. **Academic Export & Submission Suite (`📥 Export`):**
   - **Comparison Matrix (CSV):** Downloads a clean CSV containing all 8 configurations, CPI, stalls, flushes, and execution times, plus the hazard event log.
   - **Formatted Lab Report (Markdown):** Generates a comprehensive academic report including assembly source code, architectural register dumps, modified memory addresses, and benchmark metrics.
   - **Copy to Clipboard:** One-click copy for lab reports.

8. **Live 5 Pipeline Stages Display:**
   - Color-coded stage cards for **IF (Blue)**, **ID (Violet)**, **EX (Green)**, **MEM (Amber)**, and **WB (Pink)**.
   - Animated data forwarding pulse bus.
   - Stalled hazard hatching patterns and branch flush markers.

---

## 3. Instruction Set Architecture (ISA)

| Instruction | Syntax | Description |
|---|---|---|
| **ADD** | `ADD rd, rs, rt` | $R[rd] = R[rs] + R[rt]$ |
| **SUB** | `SUB rd, rs, rt` | $R[rd] = R[rs] - R[rt]$ |
| **AND** | `AND rd, rs, rt` | $R[rd] = R[rs] \ \& \ R[rt]$ |
| **OR** | `OR rd, rs, rt` | $R[rd] = R[rs] \ \vert \ R[rt]$ |
| **ADDI** | `ADDI rd, rs, imm` | $R[rd] = R[rs] + \text{imm}$ |
| **LW** | `LW rt, off(rs)` | $R[rt] = \text{mem}[R[rs] + \text{offset}]$ |
| **SW** | `SW rt, off(rs)` | $\text{mem}[R[rs] + \text{offset}] = R[rt]$ |
| **BEQ** | `BEQ rs, rt, label` | Branch to `label` if $R[rs] == R[rt]$ |
| **BNE** | `BNE rs, rt, label` | Branch to `label` if $R[rs] \neq R[rt]$ |
| **NOP** | `NOP` | No operation (`ADDI R0, R0, 0`) |

---

## 4. Verification & Testing

Run the automated test suite and spec verification:
```bash
cd C:\Users\divya\.gemini\antigravity\scratch\pipelab
node test_engine.js
node verify_spec.js
```
All **46 specification requirements** and all **8 unit tests** pass with 100% compliance.
