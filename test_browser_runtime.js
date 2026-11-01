const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Test that all DOM IDs needed by updateUI and updateAppStatusBar exist
const requiredDomIds = [
  'statCycles', 'statRetired', 'statCPI', 'statStalls', 'statFlushes',
  'statBranches', 'statMispredictions', 'statTime', 'diagCycleCount',
  'topoPC', 'topoPred', 'topoS Hazard', 'topoALU', 'topoMem', 'topoWB',
  'fwdBusLine', 'fwdBusLabel', 'stepBackBtn', 'statusText', 'driftTextMain',
  'driftTextSub', 'driftBadge', 'barStalls', 'barFlushes', 'barBranches',
  'radialHealthVal', 'radialHealthPath', 'radialBranchVal', 'radialBranchPath',
  'badgeIF', 'instIF', 'detailIfPC', 'detailIfPred', 'badgeID', 'instID',
  'detailIdHazard', 'detailIdOperands', 'badgeEX', 'instEX', 'detailExAlu',
  'detailExFwd', 'badgeMEM', 'instMEM', 'detailMemAddr', 'detailMemOp',
  'badgeWB', 'instWB', 'detailWbDest', 'detailWbVal',
  'barCycles', 'barPC', 'barCPI', 'barFwd', 'barPredictor', 'barHazards',
  'barClockPeriod', 'barEngineStatus', 'barStatusDot', 'toastContainer'
];

let allExist = true;
for (const id of requiredDomIds) {
  if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    console.error(`CRITICAL MISSING DOM ID: ${id}`);
    allExist = false;
  }
}

if (allExist) {
  console.log(`ALL ${requiredDomIds.length} APP DOM ELEMENTS VERIFIED PRESENT!`);
} else {
  process.exit(1);
}
