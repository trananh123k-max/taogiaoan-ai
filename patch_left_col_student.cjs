const fs = require('fs');
const path = 'src/utils/docxExporter.ts';
let content = fs.readFileSync(path, 'utf8');

const str = `  // Student Action
  if (step.studentAction && step.studentAction.trim()) {`;
content = content.replace(str, `  // Student Action
  if (!isPreschool && step.studentAction && step.studentAction.trim()) {`);

fs.writeFileSync(path, content, 'utf8');
