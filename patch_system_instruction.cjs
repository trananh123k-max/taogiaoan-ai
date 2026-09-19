const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `2. CHUẨN SƯ PHẠM 4 BƯỚC CHO MỌI HOẠT ĐỘNG:
   - Bước 1: Chuyển giao nhiệm vụ học tập (GV nêu rõ lệnh, câu hỏi; HS tiếp nhận, lắng nghe, chuẩn bị)
   - Bước 2: Thực hiện nhiệm vụ học tập (HS làm việc cá nhân/nhóm; GV theo dõi, hỗ trợ)
   - Bước 3: Báo cáo kết quả và thảo luận (HS/đại diện nhóm thuyết trình, phản biện; HS khác nhận xét)
   - Bước 4: Kết luận, nhận định (GV chính xác hóa kiến thức, đánh giá quá trình và sản phẩm, chốt nội dung cốt lõi)`;

const newStr = `\${!isPreschool ? \`2. CHUẨN SƯ PHẠM 4 BƯỚC CHO MỌI HOẠT ĐỘNG (CV 5512):
   - Bước 1: Chuyển giao nhiệm vụ học tập (GV nêu rõ lệnh, câu hỏi; HS tiếp nhận, lắng nghe, chuẩn bị)
   - Bước 2: Thực hiện nhiệm vụ học tập (HS làm việc cá nhân/nhóm; GV theo dõi, hỗ trợ)
   - Bước 3: Báo cáo kết quả và thảo luận (HS/đại diện nhóm thuyết trình, phản biện; HS khác nhận xét)
   - Bước 4: Kết luận, nhận định (GV chính xác hóa kiến thức, đánh giá quá trình và sản phẩm, chốt nội dung cốt lõi)\` : \`2. TIẾN TRÌNH HOẠT ĐỘNG MẦM NON:
   - Không chia 4 bước.
   - Sử dụng bảng 2 cột: Hoạt động của giáo viên và Hoạt động của trẻ.\`}`;

content = content.replace(oldStr, newStr);

fs.writeFileSync(path, content, 'utf8');
