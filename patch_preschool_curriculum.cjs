const fs = require('fs');
let content = fs.readFileSync('src/data/verifiedCurriculumList.ts', 'utf8');

const preschoolData = `
  // === MẦM NON ===
  'Lĩnh vực Phát triển thể chất_Nhà trẻ (12-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Đi trong đường hẹp mang vật trên tay; Bật tại chỗ',
      'Lăn bóng, bắt bóng cùng cô; Xâu vòng hoa to'
    ]
  },
  'Lĩnh vực Phát triển tình cảm - xã hội_Nhà trẻ (12-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Bé nhận biết tên mình, đồ dùng cá nhân của bé',
      'Bé chơi ngoan cùng bạn, chào hỏi lễ phép'
    ]
  },
  'Lĩnh vực Phát triển ngôn ngữ_Nhà trẻ (12-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Nghe và phát âm các từ đơn giản; Xem sách tranh',
      'Thơ/Đồng dao: Lời chào của bé, Giờ ăn'
    ]
  },
  'Lĩnh vực Phát triển nhận thức_Nhà trẻ (12-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Nhận biết đồ vật màu Đỏ - Vàng; Hình tròn',
      'Nhận biết số lượng: 1 và nhiều; Đồ vật To - Nhỏ'
    ]
  },
  'Lĩnh vực Phát triển nghệ thuật_Nhà trẻ (12-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Hát và nhún nhảy theo nhạc: Bé đi nhà trẻ',
      'Di màu tự do, vò giấy, chấm màu trang trí'
    ]
  },

  'Lĩnh vực Phát triển thể chất_Mẫu giáo bé (3-4 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Đi thăng bằng trên ghế thể dục; Bò chui qua cổng',
      'Tung bóng lên cao và bắt bóng; Rửa tay bằng xà phòng'
    ]
  },
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo bé (3-4 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Nhận biết cảm xúc Vui - Buồn của bản thân và bạn',
      'Bé cất đồ chơi đúng nơi quy định, biết xin phép'
    ]
  },
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo bé (3-4 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Truyện: Đôi bạn nhỏ, Gấu con chia quà',
      'Làm quen tư thế ngồi xem sách, lật giở từng trang'
    ]
  },
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo bé (3-4 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Nhận biết phân biệt: Hình vuông - Hình chữ nhật',
      'Đếm đến 3, nhận biết chữ số 3; So sánh Cao - Thấp'
    ]
  },
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo bé (3-4 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Dạy hát: Trường chúng cháu là trường mầm non',
      'Xé dán dải màu, nặn quả tròn quen thuộc'
    ]
  },

  'Lĩnh vực Phát triển thể chất_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Bật liên tục về phía trước; Tung và bắt bóng 2 tay',
      'Trèo lên xuống thang dây; Rèn kỹ năng tự phục vụ'
    ]
  },
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Bé tìm hiểu công việc của cô giáo, bác cấp dưỡng',
      'Thực hành chia sẻ đồ chơi và xếp hàng chờ đến lượt'
    ]
  },
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Thơ: Nghe lời cô giáo, Lời cảm ơn',
      'Làm quen quy ước đọc viết: từ trái sang phải'
    ]
  },
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Xếp tương ứng 1 - 1; Đếm đến 4, tạo nhóm trong PV 4',
      'Phân loại đồ dùng học tập theo 2 dấu hiệu màu sắc/hình'
    ]
  },
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Gõ đệm theo tiết tấu chậm bài hát; Hát múa tự nhiên',
      'Trang trí khung tranh, hoa tặng cô từ vật liệu tái chế'
    ]
  },

  'Lĩnh vực Phát triển thể chất_Mẫu giáo lớn (5-6 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Ném trúng đích thẳng đứng xa 2m; Bật sâu 30cm',
      'Chuyền bắt bóng qua đầu qua chân; Chuỗi liên hoàn 3 vận động'
    ]
  },
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo lớn (5-6 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Bé chuẩn bị tâm thế vào lớp Một; Ý thức trách nhiệm',
      'Hợp tác làm việc nhóm, thương lượng giải quyết mâu thuẫn'
    ]
  },
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo lớn (5-6 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Làm quen 29 chữ cái tiếng Việt: Chữ O, Ô, Ơ, A, Ă, Â...',
      'Tập tô nét cơ bản, sao chép tên của mình đúng dòng kẻ'
    ]
  },
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo lớn (5-6 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Tách gộp nhóm 10 đối tượng; Đo độ dài bằng thước đo',
      'Khám phá quy trình công nghệ đơn giản; Thí nghiệm STEM'
    ]
  },
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo lớn (5-6 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Hát ngẫu hứng, sáng tạo lời ca mới theo bài quen thuộc',
      'Đóng kịch phân vai theo cốt truyện sáng tạo của nhóm'
    ]
  },
`;

content = content.replace("export const VERIFIED_KNTT_CURRICULUM: Record<string, CurriculumItem> = {", "export const VERIFIED_KNTT_CURRICULUM: Record<string, CurriculumItem> = {" + preschoolData);

fs.writeFileSync('src/data/verifiedCurriculumList.ts', content);
