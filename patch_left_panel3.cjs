const fs = require('fs');
let content = fs.readFileSync('src/components/LeftConfigPanel.tsx', 'utf8');

content = content.replace(/onChangeConfig\(\{ schoolLevel: newLevel, grade: newGrade, subject: newSubject \}\);/g, "onChangeConfig({ schoolLevel: newLevel, grade: newGrade, subject: newSubject, lessonTitle: '' });");
content = content.replace(/onChangeConfig\(\{ subject: e\.target\.value \}\);/g, "onChangeConfig({ subject: e.target.value, lessonTitle: '' });");
content = content.replace(/onChangeConfig\(\{ grade: e\.target\.value \}\)/g, "onChangeConfig({ grade: e.target.value, lessonTitle: '' })");

// Also for the other subject handler
content = content.replace(/onChangeConfig\(\{\n\s*subject: newSubj,\n\s*\.\.\.\(isNewHDTN \? \{ enableAI: false, enableNLS: false, enableSTEM: false \} : \{\}\),\n\s*\}\);/g, "onChangeConfig({\n                    subject: newSubj,\n                    lessonTitle: '',\n                    ...(isNewHDTN ? { enableAI: false, enableNLS: false, enableSTEM: false } : {}),\n                  });");

fs.writeFileSync('src/components/LeftConfigPanel.tsx', content);
