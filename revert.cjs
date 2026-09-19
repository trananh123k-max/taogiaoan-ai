const fs = require('fs');

const path = 'src/utils/docxExporter.ts';
let code = fs.readFileSync(path, 'utf-8');

// I will just remove the first [ that caused the issue, or actually, let me fix it properly.
const startIdx = code.indexOf('function buildStandardDocxElements(');
let block = code.substring(startIdx);
block = block.replace('  return [\n[', '  return [');
code = code.substring(0, startIdx) + block;

fs.writeFileSync(path, code);
