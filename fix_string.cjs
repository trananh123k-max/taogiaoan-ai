const fs = require('fs');
let content = fs.readFileSync('src/data/preschoolCurriculum.ts', 'utf8');

content = content.replace(/\\\`;/g, '`;');
content = content.replace(/\\`/g, '`');

fs.writeFileSync('src/data/preschoolCurriculum.ts', content);
