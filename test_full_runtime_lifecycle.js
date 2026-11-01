const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Build a robust mock DOM to test the entire client script execution
function createMockElement(id = '', tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      toggle(c) { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c); },
      contains(c) { return this._classes.has(c); }
    },
    dataset: {},
    value: '250',
    checked: true,
    disabled: false,
    _listeners: {},
    addEventListener(evt, fn) {
      if (!this._listeners[evt]) this._listeners[evt] = [];
      this._listeners[evt].push(fn);
    },
    dispatchEvent(evt) {
      const type = typeof evt === 'string' ? evt : evt.type;
      if (this._listeners[type]) {
        this._listeners[type].forEach(fn => fn({ target: this, type }));
      }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k] || null; },
    appendChild(child) { return child; },
    remove() {},
    innerHTML: '',
    textContent: '',
    querySelectorAll() { return []; },
    querySelector() { return null; },
    scrollIntoView() {},
    focus() {}
  };
  return el;
}

const elementsMap = new Map();
const idRegex = /\bid=["']([^'"]+)["']/g;
let m;
while ((m = idRegex.exec(html)) !== null) {
  elementsMap.set(m[1], createMockElement(m[1]));
}

// Special element attributes
if (elementsMap.get('sampleSelect')) elementsMap.get('sampleSelect').value = '4';
if (elementsMap.get('clockPeriodInput')) elementsMap.get('clockPeriodInput').value = '1.0';
if (elementsMap.get('speedSlider')) elementsMap.get('speedSlider').value = '250';
if (elementsMap.get('asmEditor')) elementsMap.get('asmEditor').value = 'ADDI R1, R0, 10\n';

const mockDoc = {
  documentElement: createMockElement('html'),
  body: createMockElement('body'),
  getElementById: (id) => elementsMap.get(id) || createMockElement(id),
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (tag) => createMockElement('', tag),
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDoc,
  localStorage: { getItem: () => null, setItem: () => {} },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  setInterval: () => 123,
  clearInterval: () => {},
  setTimeout: (fn) => fn(),
  addEventListener: () => {},
  Chart: class { constructor() {} destroy() {} update() {} },
  AudioContext: class {
    constructor() { this.state = 'running'; this.currentTime = 0; }
    createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
  }
};
mockWindow.window = mockWindow;

const scriptContent = html.match(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/i)[1];
const vm = require('vm');
const context = vm.createContext(mockWindow);

try {
  vm.runInContext(scriptContent, context);
  console.log('[PASS] Script loaded into VM context without error.');

  // Run init()
  vm.runInContext('init();', context);
  console.log('[PASS] init() executed successfully!');

  // Run stepSimulation() 5 times
  for (let i = 1; i <= 5; i++) {
    vm.runInContext('stepSimulation();', context);
    const cycle = vm.runInContext('currentEngine.cycle', context);
    console.log(`[PASS] Cycle ${cycle}: stepSimulation() succeeded.`);
  }

  // Run stepBackSimulation() 2 times
  vm.runInContext('stepBackSimulation();', context);
  let cycle = vm.runInContext('currentEngine.cycle', context);
  console.log(`[PASS] Step-back succeeded, cycle rolled back to ${cycle}.`);

  // Run finishSimulation()
  vm.runInContext('finishSimulation();', context);
  cycle = vm.runInContext('currentEngine.cycle', context);
  const halted = vm.runInContext('currentEngine.isHalted', context);
  console.log(`[PASS] finishSimulation() succeeded: halted=${halted}, final cycles=${cycle}.`);

  // Run initOrResetEngine()
  vm.runInContext('initOrResetEngine();', context);
  cycle = vm.runInContext('currentEngine.cycle', context);
  console.log(`[PASS] initOrResetEngine() succeeded, cycle reset to ${cycle}.`);

  // Test command palette
  vm.runInContext('openCommandPalette();', context);
  console.log('[PASS] openCommandPalette() executed successfully.');

  console.log('\n--- ALL RUNTIME SIMULATION CHECKS PASSED WITH ZERO ERRORS! ---');
} catch (err) {
  console.error('[FAIL] Runtime Error during simulation:', err);
  process.exit(1);
}
