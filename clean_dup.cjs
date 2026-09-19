const fs = require('fs');

const content = fs.readFileSync('src/data/verifiedCurriculumList.ts', 'utf8');
const lines = content.split('\n');

const startIndex1 = lines.findIndex(l => l.includes("'Lĩnh vực Phát triển thể chất_Nhà trẻ (24-36 tháng)': {"));
// Find the end of the original block (it ends around line 159).
// Let's find the second 'Lĩnh vực Phát triển thể chất_Nhà trẻ'
const startIndex2 = lines.findIndex((l, idx) => idx > startIndex1 && l.includes("'Lĩnh vực Phát triển thể chất_Nhà trẻ (24-36 tháng)': {"));

console.log(startIndex1, startIndex2);

// Let's remove from startIndex1 up to startIndex2 - 1.
if (startIndex1 !== -1 && startIndex2 !== -1) {
  lines.splice(startIndex1, startIndex2 - startIndex1);
  fs.writeFileSync('src/data/verifiedCurriculumList.ts', lines.join('\n'));
  console.log('Removed duplicates successfully');
}
