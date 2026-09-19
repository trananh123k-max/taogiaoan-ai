const fs = require('fs');

let code = fs.readFileSync('src/data/curriculumData.ts', 'utf8');
const newList = `export const MAM_NON_SUBJECTS_LIST = [
  'Lĩnh vực Phát triển thể chất',
  'Lĩnh vực Phát triển tình cảm - xã hội',
  'Lĩnh vực Phát triển ngôn ngữ',
  'Lĩnh vực Phát triển nhận thức',
  'Lĩnh vực Phát triển nghệ thuật',
];`;

code = code.replace(/export const MAM_NON_SUBJECTS_LIST = \[[\s\S]*?\];/, newList);
fs.writeFileSync('src/data/curriculumData.ts', code);
