const fs = require('fs');
const path = 'src/utils/docxExporter.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const hideTeacherPrefix = \/\^\(-\|\\\*\)\?\\s\*\(\(GV\|Giáo viên\)\\b\)\/i\.test\(step\.teacherAction\.trim\(\)\) \|\| \/\^\\\*\\s\*\(\(GV\|HS\)\)\/i\.test\(stepTitle\);/,
  `const hideTeacherPrefix = isPreschool || /^(-|\\*)?\\s*(GV|Giáo viên)\\b/i.test(step.teacherAction.trim()) || /^\\*\\s*(GV|HS)/i.test(stepTitle);`
);

content = content.replace(
  /const hideStudentPrefix = \/\^\(-\|\\\*\)\?\\s\*\(\(HS\|Học sinh\)\\b\)\/i\.test\(step\.studentAction\.trim\(\)\) \|\| \/\^\\\*\\s\*\(\(GV\|HS\)\)\/i\.test\(stepTitle\);/,
  `const hideStudentPrefix = isPreschool || /^(-|\\*)?\\s*(HS|Học sinh)\\b/i.test(step.studentAction.trim()) || /^\\*\\s*(GV|HS)/i.test(stepTitle);`
);

fs.writeFileSync(path, content, 'utf8');
