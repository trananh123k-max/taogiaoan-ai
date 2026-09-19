const fs = require('fs');

let content = fs.readFileSync('src/components/PedagogicalTable.tsx', 'utf8');

content = content.replace(
  'if (!detail.studentAction) return null;',
  'if (!detail || !detail.studentAction) return null;'
);

fs.writeFileSync('src/components/PedagogicalTable.tsx', content);
