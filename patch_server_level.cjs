const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /grade: grade,/,
  "grade: grade,\n    schoolLevel: config.schoolLevel || '',"
);

fs.writeFileSync(path, content, 'utf8');
