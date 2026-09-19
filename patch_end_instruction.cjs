const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const oldEnd = `YÊU CẦU: Trả về đối tượng JSON hoàn chỉnh với 4 hoạt động sư phạm theo Công văn 5512 (Khởi động, Hình thành kiến thức mới, Luyện tập, Vận dụng), mỗi hoạt động đủ 4 bước chi tiết (Bước 1 đến Bước 4), kèm bảng ma trận NLS và AI, bám sát bộ sách Kết nối tri thức với cuộc sống.`;
const newEnd = `\${isPreschool 
  ? 'YÊU CẦU: Trả về đối tượng JSON hoàn chỉnh theo mẫu Giáo dục Mầm non, chia 2 cột Hoạt động của giáo viên và Hoạt động của trẻ (Sử dụng duy nhất step1 cho mỗi hoạt động, để trống step2, 3, 4).' 
  : 'YÊU CẦU: Trả về đối tượng JSON hoàn chỉnh với 4 hoạt động sư phạm theo Công văn 5512 (Khởi động, Hình thành kiến thức mới, Luyện tập, Vận dụng), mỗi hoạt động đủ 4 bước chi tiết (Bước 1 đến Bước 4), kèm bảng ma trận NLS và AI, bám sát bộ sách Kết nối tri thức với cuộc sống.'}`;

content = content.replace(oldEnd, newEnd);
fs.writeFileSync(path, content, 'utf8');
