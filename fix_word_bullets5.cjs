const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/utils/docxExporter.ts', 'utf8');

const old1 = `  plan.objectives.qualities.forEach(q => elements.push(createDashListItem(q, fontName)));`;
const new1 = `  plan.objectives.qualities.forEach(q => elements.push(createBulletListItem(q, fontName)));`;

const old2 = `  plan.objectives.generalCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));`;
const new2 = `  plan.objectives.generalCompetencies.forEach(c => elements.push(createBulletListItem(c, fontName)));`;

code = code.replace(old1, new1).replace(old2, new2);
fs.writeFileSync('/app/applet/src/utils/docxExporter.ts', code);

code = fs.readFileSync('/app/applet/src/components/RightResultEditor.tsx', 'utf8');
const uiOld1 = `                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>`;
const uiNew1 = `                        <span className="font-bold text-slate-900 shrink-0">•</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>`;

const uiOld2 = `                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>`;
const uiNew2 = `                        <span className="font-bold text-slate-900 shrink-0">•</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>`;

code = code.replace(uiOld1, uiNew1).replace(uiOld2, uiNew2);
fs.writeFileSync('/app/applet/src/components/RightResultEditor.tsx', code);

