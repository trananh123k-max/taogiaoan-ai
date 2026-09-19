const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const \[res1, res2, res3, res4\] = await Promise\.all\(\[\s*wrap\(taskObjectivesEquipment, 1\),\s*wrap\(taskActivities1And2, 2\),\s*wrap\(taskActivities3And4, 3\),\s*wrap\(taskMatrixAndAppendix, 4\),\s*\]\);/m;

const sequentialCode = `
  // Changed to sequential execution to avoid hitting Gemini Free Tier 429 rate limit (15 req/min)
  const res1 = await wrap(taskObjectivesEquipment, 1);
  const res2 = await wrap(taskActivities1And2, 2);
  const res3 = await wrap(taskActivities3And4, 3);
  const res4 = await wrap(taskMatrixAndAppendix, 4);
`;

code = code.replace(regex, sequentialCode);
fs.writeFileSync('server.ts', code);
console.log('Sequential logic applied!');
