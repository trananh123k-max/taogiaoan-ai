const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const oldPrompt1 = "Hãy soạn chi tiết HOẠT ĐỘNG 1 (Xác định vấn đề / Khởi động) và HOẠT ĐỘNG 2 (Hình thành kiến thức mới) theo chuẩn 4 bước của Công văn 5512.";
const newPrompt1 = `\${isPreschool 
      ? 'Hãy soạn chi tiết Tiến trình hoạt động (phần 1: Khởi động và Khám phá). TUYỆT ĐỐI KHÔNG dùng 4 bước CV 5512. Mỗi hoạt động chỉ dùng duy nhất \`step1\` để chứa Hoạt động của cô (teacherAction) và Hoạt động của trẻ (studentAction). Để trống step2, 3, 4.' 
      : 'Hãy soạn chi tiết HOẠT ĐỘNG 1 (Xác định vấn đề / Khởi động) và HOẠT ĐỘNG 2 (Hình thành kiến thức mới) theo chuẩn 4 bước của Công văn 5512.'}`;

content = content.replace(oldPrompt1, newPrompt1);

const oldPrompt2 = "Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ:";
const newPrompt2 = `\${isPreschool ? 'Mỗi hoạt động chỉ dùng \`step1\`:' : 'Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ:'}`;
content = content.replace(oldPrompt2, newPrompt2);

const oldPrompt3 = "Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ (step1, step2, step3, step4).";
const newPrompt3 = `\${isPreschool ? 'Mỗi hoạt động chỉ dùng \`step1\` (để trống step 2,3,4).' : 'Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ (step1, step2, step3, step4).'}`;
content = content.replace(oldPrompt3, newPrompt3);

const oldPrompt4 = "Hãy soạn chi tiết HOẠT ĐỘNG 3 (Luyện tập) và HOẠT ĐỘNG 4 (Vận dụng & Hướng dẫn tự học) theo chuẩn 4 bước của Công văn 5512.";
const newPrompt4 = `\${isPreschool 
      ? 'Hãy soạn chi tiết Tiến trình hoạt động (phần 2: Thực hành và Đánh giá/Hồi tĩnh). TUYỆT ĐỐI KHÔNG dùng 4 bước CV 5512. Mỗi hoạt động chỉ dùng duy nhất \`step1\` để chứa Hoạt động của cô (teacherAction) và Hoạt động của trẻ (studentAction). Để trống step2, 3, 4.' 
      : 'Hãy soạn chi tiết HOẠT ĐỘNG 3 (Luyện tập) và HOẠT ĐỘNG 4 (Vận dụng & Hướng dẫn tự học) theo chuẩn 4 bước của Công văn 5512.'}`;
content = content.replace(oldPrompt4, newPrompt4);

fs.writeFileSync(path, content, 'utf8');
