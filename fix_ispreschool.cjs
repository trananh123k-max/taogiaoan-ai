const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

const oldHeader = `  const isPreschool = (plan as any)?.schoolLevel === 'Mầm non';
  
  if (isGenerating) {`;

code = code.replace("if (isGenerating) {", "  const isPreschool = (plan as any)?.schoolLevel === 'Mầm non';\n\n  if (isGenerating) {");

fs.writeFileSync('src/components/RightResultEditor.tsx', code);
