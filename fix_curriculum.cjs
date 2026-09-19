const fs = require('fs');

let content = fs.readFileSync('src/data/verifiedCurriculumList.ts', 'utf8');

// Find where Mầm non starts and ends.
// Let's remove ALL lines from 'Lĩnh vực Phát triển thể chất_Nhà trẻ' to 'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo lớn'

const regex = /  'Lĩnh vực Phát triển thể chất_Nhà trẻ \(24-36 tháng\)': \{[\s\S]*?'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo lớn \(5-6 tuổi\)': \{\n    themes: \['Chương trình Mầm non'\],\n    lessons: \[\n      'Hát ngẫu hứng, sáng tạo lời ca mới theo bài quen thuộc',\n      'Đóng kịch phân vai theo cốt truyện sáng tạo của nhóm'\n    \]\n  \}/g;

const matches = content.match(regex);
if (matches) {
    // Keep only the first occurrence which is our newly updated one (actually wait, let me check where the duplicates are).
}
