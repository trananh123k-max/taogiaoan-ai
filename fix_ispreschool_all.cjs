const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

code = code.replace(/isPreschool/g, "(plan as any)?.schoolLevel === 'Mầm non'");

fs.writeFileSync('src/components/RightResultEditor.tsx', code);
