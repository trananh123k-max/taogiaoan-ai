const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  '    if (isHDTN || isPreschool) {',
  '    if (isHDTN) {'
);

fs.writeFileSync('server.ts', content);
