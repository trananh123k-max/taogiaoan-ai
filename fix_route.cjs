const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeStr = code.substring(code.indexOf('/**\n * Extract PPCT metadata'));

// Remove the route from its current position
code = code.replace(routeStr, '');
code = code.replace('startServer();\n\n', 'startServer();\n');

// Find where to insert it
const insertPoint = code.indexOf('// Vite middleware / Static serving setup');

code = code.substring(0, insertPoint) + routeStr + '\n\n' + code.substring(insertPoint);

fs.writeFileSync('server.ts', code);
console.log('Fixed route placement!');
