const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

const oldAct = `          {/* IV. PHIẾU HỌC TẬP & PHỤ LỤC */}
          {(plan as any).schoolLevel !== 'Mầm non' && plan.appendix && plan.appendix.worksheetContent && (
            <section className="space-y-4">`;

const newAct = `          {/* IV. PHIẾU HỌC TẬP & PHỤ LỤC */}
          {!isPreschool && plan.appendix && plan.appendix.worksheetContent && (
            <section className="space-y-4">`;

code = code.replace(oldAct, newAct);
fs.writeFileSync('src/components/RightResultEditor.tsx', code);
