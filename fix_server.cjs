const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/\$\{PRESCHOOL_CURRICULUM_MATRIX\}\n\n\$\{PRESCHOOL_CURRICULUM_MATRIX\}/g, '${PRESCHOOL_CURRICULUM_MATRIX}');

fs.writeFileSync('server.ts', content);
