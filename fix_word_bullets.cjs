const fs = require('fs');
let code = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const old1 = `  elements.push(createSubHeading('3. Phẩm chất', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createBulletListItem(q, fontName)));`;

const new1 = `  elements.push(createSubHeading('3. Phẩm chất', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createDashListItem(q, fontName)));`;

const old2 = `  elements.push(createSubHeading('4. Năng lực', fontName));
  plan.objectives.generalCompetencies.forEach(c => elements.push(createBulletListItem(c, fontName)));`;

const new2 = `  elements.push(createSubHeading('4. Năng lực', fontName));
  plan.objectives.generalCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));`;

code = code.replace(old1, new1).replace(old2, new2);
fs.writeFileSync('src/utils/docxExporter.ts', code);
