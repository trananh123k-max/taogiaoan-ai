const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "    options.primaryModel || 'gemini-3.7-flash',\n    'gemini-flash-latest',\n    'gemini-3.1-flash-lite',\n    'gemini-3.7-flash',",
  "    options.primaryModel || 'gemini-3.7-flash',\n    'gemini-3.5-flash',\n    'gemini-2.5-flash',\n    'gemini-flash-latest',"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed model fallbacks!');
