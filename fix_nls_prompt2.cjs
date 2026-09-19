const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `? 'BẮT BUỘC TÍCH HỢP — Yêu cầu AI TỰ ĐỘNG XÁC ĐỊNH các miền NLS phù hợp nhất (Khai thác thông tin số, Giao tiếp hợp tác, Sáng tạo nội dung số, An toàn số, Giải quyết vấn đề), chỉ rõ công cụ số cụ thể (GeoGebra, PhET, Canva, Padlet, LMS, Google Forms...) và lập Bảng ma trận chỉ số hành vi NLS chi tiết.'`,
  `? 'BẮT BUỘC TÍCH HỢP Năng lực số (NLS) — AI phải tự động xác định và lựa chọn các mã năng lực TỪ KHUNG NLS CHUẨN ĐÃ CUNG CẤP sao cho phù hợp nhất với đặc thù môn học và bài học. TUYỆT ĐỐI không được bịa ra mã chỉ báo NLS ngoài danh sách Khung NLS chuẩn. Chỉ rõ công cụ số cụ thể (GeoGebra, PhET, Canva, LMS...) và lập Bảng ma trận chỉ số hành vi NLS chi tiết.'`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed NLS prompt part 2');
