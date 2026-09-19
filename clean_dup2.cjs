const fs = require('fs');

const content = fs.readFileSync('src/data/verifiedCurriculumList.ts', 'utf8');
const lines = content.split('\n');

const toRemove = [
  'Lĩnh vực Phát triển tình cảm - xã hội_Nhà trẻ (24-36 tháng)',
  'Lĩnh vực Phát triển ngôn ngữ_Nhà trẻ (24-36 tháng)',
  'Lĩnh vực Phát triển nhận thức_Nhà trẻ (24-36 tháng)',
  'Lĩnh vực Phát triển nghệ thuật_Nhà trẻ (24-36 tháng)',
  'Lĩnh vực Phát triển thể chất_Mẫu giáo bé (3-4 tuổi)',
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo bé (3-4 tuổi)',
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo bé (3-4 tuổi)',
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo bé (3-4 tuổi)',
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo bé (3-4 tuổi)',
  'Lĩnh vực Phát triển thể chất_Mẫu giáo nhỡ (4-5 tuổi)',
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo nhỡ (4-5 tuổi)',
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo nhỡ (4-5 tuổi)',
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo nhỡ (4-5 tuổi)',
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo nhỡ (4-5 tuổi)',
  'Lĩnh vực Phát triển thể chất_Mẫu giáo lớn (5-6 tuổi)',
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo lớn (5-6 tuổi)',
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo lớn (5-6 tuổi)',
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo lớn (5-6 tuổi)',
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo lớn (5-6 tuổi)'
];

let currentIndex = 0;
while (currentIndex < lines.length) {
  let matched = false;
  for (const str of toRemove) {
    if (lines[currentIndex].includes(`'${str}': {`)) {
      // Find the second occurrence (the one further down, which is the original one because the first one is the new one)
      // Actually wait, let's just count occurrences.
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`'${str}': {`)) count++;
      }
      if (count > 1) {
        // Find the second occurrence
        let firstOcc = -1;
        let secondOcc = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`'${str}': {`)) {
            if (firstOcc === -1) firstOcc = i;
            else if (secondOcc === -1) {
              secondOcc = i;
              break;
            }
          }
        }
        
        if (secondOcc !== -1) {
          // Find the end of this block
          let end = secondOcc;
          while (end < lines.length && !lines[end].includes('},')) {
            end++;
          }
          if (lines[end].includes('},')) {
            lines.splice(secondOcc, end - secondOcc + 1);
            // Don't advance currentIndex, re-eval
            matched = true;
          }
        }
      }
      break;
    }
  }
  if (!matched) currentIndex++;
}

fs.writeFileSync('src/data/verifiedCurriculumList.ts', lines.join('\n'));
