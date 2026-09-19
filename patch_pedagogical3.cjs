const fs = require('fs');

let content = fs.readFileSync('src/components/PedagogicalTable.tsx', 'utf8');

content = content.replace(
  'if (detail.productExpected && detail.productExpected.trim()) {',
  'if (detail && detail.productExpected && detail.productExpected.trim()) {'
);

fs.writeFileSync('src/components/PedagogicalTable.tsx', content);
