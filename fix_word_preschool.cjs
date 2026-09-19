const fs = require('fs');
let code = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const oldAppendix = `          ...((!isHDTN && !isPreschool)`;

const newAppendix = `          ...((!isHDTN && !isPreschool) ?`;

code = code.replace(oldAppendix, newAppendix);
fs.writeFileSync('src/utils/docxExporter.ts', code);
