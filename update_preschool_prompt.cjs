const fs = require('fs');

const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

const newPrompt = `\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:
- BẮT BUỘC soạn theo Kế hoạch tổ chức hoạt động giáo dục Mầm non, TUYỆT ĐỐI KHÔNG dùng Công văn 5512. Bám sát Chương trình giáo dục mầm non thí điểm từ năm học 2026-2027 (Quyết định số 388/QĐ-BGDĐT).
- Ngôn ngữ, hoạt động phải phù hợp với tâm lý lứa tuổi mầm non (cô và trẻ).
- Tích hợp phát triển 4 phẩm chất cốt lõi: Yêu thương, Tôn trọng, Trung thực, Trách nhiệm.
- Tích hợp phát triển 5 năng lực nền tảng: Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng.
- Phát triển toàn diện qua 5 lĩnh vực: Thể chất, Tình cảm - xã hội, Ngôn ngữ, Nhận thức, Nghệ thuật.
- CẤU TRÚC GIÁO ÁN PHẢI TUÂN THỦ NGHIÊM NGẶT FORM SAU:
I. Mục đích - yêu cầu
1. Kiến thức:
2. Kỹ năng (Gắn với 5 năng lực nền tảng):
3. Phẩm chất (Gắn với 4 phẩm chất cốt lõi):
II. Chuẩn bị
1. Chuẩn bị của cô
2. Chuẩn bị của trẻ
III. Tiến trình hoạt động
Bảng chia 2 cột: "Hoạt động của giáo viên" và "Hoạt động của trẻ" (Các bước thường gồm: 1. Khởi động, 2. Khám phá - Trải nghiệm, 3. Chia sẻ, 4. Thực hành - Vận dụng, 5. Đánh giá - Hồi tĩnh)
- TRÌNH BÀY RÕ RÀNG VÀ CHI TIẾT: Các hoạt động 1, 2, 3, 4, 5 (Tiến trình hoạt động) PHẢI SOẠN RẤT CHI TIẾT, ĐẦY ĐỦ VÀ SÂU SẮC. Bắt buộc mô tả cụ thể từng lời nói, câu lệnh, câu hỏi gợi mở của giáo viên và hành động, lời đáp, thái độ dự kiến của trẻ. Không viết chung chung sơ sài.
- Mỗi mục, mỗi ý (trong Mục đích, Chuẩn bị, hoặc các bước Tiến hành) BẮT BUỘC phải xuống dòng. Sử dụng gạch đầu dòng (-) rõ ràng ở mỗi ý con, các hoạt động cần phân tách rành mạch.`;

const regex = /const preschoolPrompt = `\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:[\s\S]*?- NĂNG LỰC SỐ \(Nếu có\): Hướng đến việc cô giáo ứng dụng công cụ số và cho trẻ làm quen với các tương tác đơn giản\.`;/g;

code = code.replace(regex, `const preschoolPrompt = \`${newPrompt}\`;`);

fs.writeFileSync(path, code);
