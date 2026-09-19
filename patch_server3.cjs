const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

// Replace `if (isHDTN) {` with `if (isHDTN || isPreschool) {`
content = content.replace(/if\s*\(isHDTN\)\s*\{\s*config\.enableAI\s*=\s*false;\s*config\.enableNLS\s*=\s*false;\s*config\.enableSTEM\s*=\s*false;\s*\}/g, 'if (isHDTN || isPreschool) {\\n    config.enableAI = false;\\n    config.enableNLS = false;\\n    config.enableSTEM = false;\\n  }');

content = content.replace(/if\s*\(isPreschool\)\s*\{\s*\/\/\s*Preserve NLS[\s\S]*?allowed\.\s*\}/, '');

content = content.replace(/wrap\(taskMatrixAndAppendix,\s*4\),/, 'wrap(async () => { if (isPreschool) return {}; return taskMatrixAndAppendix(); }, 4),');

fs.writeFileSync('server.ts', content);
