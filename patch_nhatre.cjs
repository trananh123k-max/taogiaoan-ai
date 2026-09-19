const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/Nhà trẻ \(12-36 tháng\)/g, 'Nhà trẻ (24-36 tháng)');
  fs.writeFileSync(path, content);
}

replaceFile('src/components/LeftConfigPanel.tsx');
replaceFile('src/components/FirebaseStorageModal.tsx');
replaceFile('src/data/verifiedCurriculumList.ts');
