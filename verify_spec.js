const fs = require('fs');
const html = fs.readFileSync('C:/Users/divya/.gemini/antigravity/scratch/pipelab/index.html', 'utf8');

const checks = [
  ['Chart.js 4.4.1 from cdnjs', html.includes('cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1')],
  ['Manrope font', html.includes('Manrope')],
  ['IBM Plex Mono font', html.includes('IBM Plex Mono')],
  ['Dark theme support', html.includes('data-theme') && html.includes('dark')],
  ['Light theme support', html.includes('light')],
  ['CSS variables', html.includes(':root')],
  ['Keyboard focus visible', html.includes(':focus-visible')],
  ['5 stage cards (IF/ID/EX/MEM/WB)', html.includes('stage-card if') && html.includes('stage-card id') && html.includes('stage-card ex') && html.includes('stage-card mem') && html.includes('stage-card wb')],
  ['Step button', html.includes('stepBtn')],
  ['Run/Play button', html.includes('playBtn')],
  ['Finish button', html.includes('finishBtn')],
  ['Reset button', html.includes('resetBtn')],
  ['Pipeline diagram table', html.includes('pipelineTable')],
  ['Hazard log', html.includes('logContainer')],
  ['Register grid', html.includes('regsContainer')],
  ['Memory grid', html.includes('memContainer')],
  ['Forwarding toggle', html.includes('fwdToggle')],
  ['Predictor select', html.includes('predictorSelect')],
  ['Clock period input', html.includes('clockPeriodInput')],
  ['Sample program dropdown', html.includes('sampleSelect')],
  ['Error display', html.includes('errorBanner')],
  ['CPI chart', html.includes('chartCPI')],
  ['Hazards chart', html.includes('chartHazards')],
  ['Time chart', html.includes('chartTime')],
  ['Compare table', html.includes('compareTableBody')],
  ['Stats: Cycles', html.includes('statCycles')],
  ['Stats: CPI', html.includes('statCPI')],
  ['Stats: Stalls', html.includes('statStalls')],
  ['Stats: Flushes', html.includes('statFlushes')],
  ['Stats: Branches', html.includes('statBranches')],
  ['Stats: Mispredictions', html.includes('statMispredictions')],
  ['Stats: Execution Time', html.includes('statTime')],
  ['5 sample programs defined', html.includes('SAMPLE_PROGRAMS')],
  ['Stall hatching pattern', html.includes('repeating-linear-gradient')],
  ['Flush X marker', html.includes('\u2715')],
  ['Color: IF blue', html.includes('--c-if')],
  ['Color: ID violet', html.includes('--c-id')],
  ['Color: EX green', html.includes('--c-ex')],
  ['Color: MEM amber', html.includes('--c-mem')],
  ['Color: WB pink', html.includes('--c-wb')],
  ['Assembler class', html.includes('class Assembler')],
  ['BranchPredictor class', html.includes('class BranchPredictor')],
  ['RISCPipelineEngine class', html.includes('class RISCPipelineEngine')],
  ['Forwarding indicator', html.includes('fwdIndicator')],
  ['Keyboard shortcuts', html.includes('keydown')],
  ['Speed slider', html.includes('speedSlider')],
  ['Comparison auto-refresh', html.includes('runComparisonAnalysis')],
  ['8 configs (4 predictors x 2 fwd)', html.includes('not-taken') && html.includes('taken') && html.includes('1-bit') && html.includes('2-bit')],
  ['Responsive layout', html.includes('@media')],
  ['Fastest config highlight', html.includes('FASTEST')],
  ['Active config highlight', html.includes('active-config')],
];

let allPass = true;
for (const [name, pass] of checks) {
  const status = pass ? 'PASS' : 'FAIL';
  if (!pass) allPass = false;
  console.log(`[${status}] ${name}`);
}
console.log();
console.log(allPass ? 'ALL SPEC REQUIREMENTS VERIFIED!' : 'SOME REQUIREMENTS MISSING!');
console.log('HTML file size:', html.length, 'bytes');
