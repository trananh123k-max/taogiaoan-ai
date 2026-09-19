const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

const oldBullet1 = `                        <span className="font-bold text-slate-900 shrink-0">•</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>`;
const newBullet1 = `                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>`;

const oldBullet2 = `                        <span className="font-bold text-slate-900 shrink-0">•</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>`;
const newBullet2 = `                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>`;

code = code.replace(oldBullet1, newBullet1).replace(oldBullet2, newBullet2);
fs.writeFileSync('src/components/RightResultEditor.tsx', code);
