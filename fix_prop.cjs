const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

code = code.replace(`                  (plan as any)?.schoolLevel === 'Mầm non'={(plan as any).schoolLevel === 'Mầm non'}`, `                  isPreschool={(plan as any).schoolLevel === 'Mầm non'}`);

fs.writeFileSync('src/components/RightResultEditor.tsx', code);
