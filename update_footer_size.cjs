const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('text-xs sm:text-[13px]', 'text-[11px] sm:text-xs text-amber-500');
code = code.replace(/w-4 h-4/g, 'w-3.5 h-3.5');

fs.writeFileSync('src/App.tsx', code);
console.log('Updated footer sizes');
