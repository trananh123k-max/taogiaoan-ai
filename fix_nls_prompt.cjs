const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Also import NLS_DICTIONARY at the top
if (!code.includes('NLS_DICTIONARY')) {
    code = `import { NLS_DICTIONARY } from './src/data/nlsDictionary';\n` + code;
}

// Append dictionary to systemInstruction in generate-lesson-plan
code = code.replace(
  `405-10. Định dạng trả về: JSON thuần tuý theo cấu trúc yêu cầu.\`;`,
  `405-10. Định dạng trả về: JSON thuần tuý theo cấu trúc yêu cầu.\n\n\${NLS_DICTIONARY}\`;`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed NLS prompt');
