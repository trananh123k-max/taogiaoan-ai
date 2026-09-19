const fs = require('fs');

// 1. UPDATE verifiedCurriculumList.ts
let curriculumContent = fs.readFileSync('src/data/verifiedCurriculumList.ts', 'utf8');

const updatedPreschoolCurriculum = `
  'Lĩnh vực Phát triển thể chất_Nhà trẻ (24-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Đi trong đường hẹp mang vật trên tay; Bật tại chỗ',
      'Lăn bóng, bắt bóng cùng cô; Xâu vòng hoa to'
    ]
  },
  'Lĩnh vực Phát triển tình cảm - xã hội_Nhà trẻ (24-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Bé nhận biết tên mình, đồ dùng cá nhân của bé',
      'Bé chơi ngoan cùng bạn, chào hỏi lễ phép'
    ]
  },
  'Lĩnh vực Phát triển ngôn ngữ_Nhà trẻ (24-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Nghe và phát âm các từ đơn giản; Xem sách tranh',
      'Thơ/Đồng dao: Lời chào của bé, Giờ ăn'
    ]
  },
  'Lĩnh vực Phát triển nhận thức_Nhà trẻ (24-36 tháng)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Nhận biết đồ vật màu Đỏ - Vàng; Hình tròn',
      'Nhận biết số lượng: 1 và nhiều; Đồ vật To - Nhỏ'
    ]
  },
  'Lĩnh vực Phát triển nghệ thuật_Nhà trẻ (24-36 tháng)': {
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
      'Tung bóng lên cao và bắt bóng bằng 2 tay',
      'Tung bắt bóng với người đối diện',
      'Bật liên tục về phía trước',
      'Đập và bắt bóng bằng 2 tay'
    ]
  },
  'Lĩnh vực Phát triển tình cảm - xã hội_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Trò chuyện về trường mầm non Tân Thành của bé',
      'Trò chuyện về cô giáo và các cô các bác trong trường',
      'Bé vui Tết Trung thu',
      'Quy tắc lớp học của bé'
    ]
  },
  'Lĩnh vực Phát triển ngôn ngữ_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Truyện: Vì sao bé Bin nín khóc',
      'Thơ: Nghe lời cô giáo',
      'Truyện: Sự tích Tết Trung thu',
      'Thơ: Cảm ơn (Lời cảm ơn)'
    ]
  },
  'Lĩnh vực Phát triển nhận thức_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Đếm đến 1, làm quen chữ số 1',
      'Xếp tương ứng 1-1, ghép đôi',
      'So sánh hình tròn - hình tam giác',
      'Đếm đến 2, làm quen chữ số 2'
    ]
  },
  'Lĩnh vực Phát triển nghệ thuật_Mẫu giáo nhỡ (4-5 tuổi)': {
    themes: ['Chương trình Mầm non'],
    lessons: [
      'Dạy hát: Vui đến trường',
      'Làm khung tranh tặng cô giáo',
      'Nhạc kịch: Câu chuyện Trăng Trung thu',
      'Trang trí bông hoa quy tắc lớp học'
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
  }
`;

curriculumContent = curriculumContent.replace(
  /  'Lĩnh vực Phát triển thể chất_Nhà trẻ \(24-36 tháng\)': \{\n[\s\S]*?    \]\n  \}/,
  updatedPreschoolCurriculum.trim()
);

fs.writeFileSync('src/data/verifiedCurriculumList.ts', curriculumContent);

// 2. UPDATE server.ts (MAM_NON_STANDARDS)
let serverContent = fs.readFileSync('server.ts', 'utf8');

const updatedStandards = `
  const MAM_NON_STANDARDS = {
    // Nhà trẻ (12 - 36 tháng)
    'Đi trong đường hẹp mang vật trên tay; Bật tại chỗ': '[TC 3.1, TC 3.3] Giữ thăng bằng di chuyển và bật nhảy chân.',
    'Lăn bóng, bắt bóng cùng cô; Xâu vòng hoa to': '[TC 3.2, TC 4.1] Phối hợp tay - mắt, khéo léo cơ ngón tay.',
    'Bé nhận biết tên mình, đồ dùng cá nhân của bé': '[TX 1.1, TX 3.2] Nhận biết bản thân, gọi tên đồ dùng cá nhân.',
    'Bé chơi ngoan cùng bạn, chào hỏi lễ phép': '[TX 6.1, TX 7.1] Chơi cạnh bạn không tranh giành; biết chào cô.',
    'Nghe và phát âm các từ đơn giản; Xem sách tranh': '[NN 2.1, NN 4.1] Phát âm rõ tiếng quen thuộc; chủ động lật sách.',
    'Thơ/Đồng dao: Lời chào của bé, Giờ ăn': '[NN 3.2, NN 2.5] Đọc theo nhịp điệu, dùng từ ngữ lễ phép.',
    'Nhận biết đồ vật màu Đỏ - Vàng; Hình tròn': '[NT 3.1, NT 3.3] Nhận biết màu sắc nổi bật và hình phẳng.',
    'Nhận biết số lượng: 1 và nhiều; Đồ vật To - Nhỏ': '[NT 3.2, NT 4.1] Phân biệt kích thước và số lượng đơn giản.',
    'Hát và nhún nhảy theo nhạc: Bé đi nhà trẻ': '[NgT 2.2, NgT 2.3] Hát theo bài ngắn, vận động nhún nhảy.',
    'Di màu tự do, vò giấy, chấm màu trang trí': '[NgT 3.1, NgT 3.2] Thao tác tạo hình cơ bản với sáp màu/giấy.',

    // Mẫu giáo bé (3 - 4 tuổi)
    'Đi thăng bằng trên ghế thể dục; Bò chui qua cổng': '[TC 3.1, TC 3.2] Giữ thăng bằng thân người; phối hợp tay chân.',
    'Tung bóng lên cao và bắt bóng; Rửa tay bằng xà phòng': '[TC 3.2, TC 6.1] Bắt bóng khéo léo; thực hành vệ sinh cá nhân.',
    'Nhận biết cảm xúc Vui - Buồn của bản thân và bạn': '[TX 2.1, TX 5.1] Gọi tên cảm xúc cơ bản của mình và người khác.',
    'Bé cất đồ chơi đúng nơi quy định, biết xin phép': '[TX 8.1, TX 4.2] Chấp hành quy định của lớp; ứng xử thân thiện.',
    'Truyện: Đôi bạn nhỏ, Gấu con chia quà': '[NN 1.2, NN 2.3] Lắng nghe, trả lời được câu hỏi và kể lại sự việc.',
    'Làm quen tư thế ngồi xem sách, lật giở từng trang': '[NN 4.1, NN 5.2] Giở sách đúng cách từ trước ra sau.',
    'Nhận biết phân biệt: Hình vuông - Hình chữ nhật': '[NT 3.4, NT 4.1] Chỉ ra đặc điểm phẳng của các hình cơ bản.',
    'Đếm đến 3, nhận biết chữ số 3; So sánh Cao - Thấp': '[NT 3.4, NT 4.4] Đếm số lượng trong phạm vi 3; so sánh kích thước.',
    'Dạy hát: Trường chúng cháu là trường mầm non': '[NgT 2.1, NgT 2.5] Hát đúng giai điệu, thể hiện tình cảm vui tươi.',
    'Xé dán dải màu, nặn quả tròn quen thuộc': '[NgT 3.2, NgT 6.1] Kỹ năng nặn, xé dán tạo sản phẩm theo gợi ý.',

    // Mẫu giáo nhỡ (4 - 5 tuổi) - Full 20 lessons
    'Tung bóng lên cao và bắt bóng bằng 2 tay': '[TC 3.2] Phối hợp tay - mắt, kiểm soát bóng khi bắt.',
    'Tung bắt bóng với người đối diện': '[TC 3.2] Vận động với người khác, phối hợp nhịp nhàng.',
    'Bật liên tục về phía trước': '[TC 3.1] Bật tiến liên tục, tiếp đất giữ thăng bằng.',
    'Đập và bắt bóng bằng 2 tay': '[TC 3.2] Đập bóng xuống sàn nảy lên và bắt bóng khéo léo.',
    'Trò chuyện về trường mầm non Tân Thành của bé': '[TX 3.1, TX 4.3] Nhận biết vị trí của trẻ trong trường, lớp.',
    'Trò chuyện về cô giáo và các cô các bác trong trường': '[TX 3.2, TX 3.4] Nhận biết các thành viên và công việc trong trường.',
    'Bé vui Tết Trung thu': '[TX 3.3, TX 5.2] Nhận biết lễ hội truyền thống, gắn kết bạn bè.',
    'Quy tắc lớp học của bé': '[TX 8.1, TX 6.4] Thực hiện quy định lớp học, nền nếp văn minh.',
    'Đếm đến 1, làm quen chữ số 1': '[NT 3.4, NT 4.4] Đếm số lượng 1 và nhận biết chữ số 1.',
    'Xếp tương ứng 1-1, ghép đôi': '[NT 3.5, NT 4.4] Ghép đôi tương ứng 1-1 giữa 2 nhóm đối tượng.',
    'So sánh hình tròn - hình tam giác': '[NT 3.4, NT 4.1] Nhận biết và so sánh hình dạng đặc trưng.',
    'Đếm đến 2, làm quen chữ số 2': '[NT 3.4, NT 4.4] Đếm tạo nhóm số lượng 2 và nhận biết chữ số 2.',
    'Truyện: Vì sao bé Bin nín khóc': '[NN 1.2, NN 3.1] Nghe hiểu truyện, kể lại hành động nhân vật.',
    'Thơ: Nghe lời cô giáo': '[NN 2.1, NN 3.2] Đọc thơ diễn cảm, phát âm rõ ràng, lễ phép.',
    'Truyện: Sự tích Tết Trung thu': '[NN 1.2, NN 2.3] Nghe hiểu câu chuyện dân gian, kể sự việc chính.',
    'Thơ: Cảm ơn (Lời cảm ơn)': '[NN 2.5, NN 3.2] Sử dụng từ ngữ nghi thức, chào hỏi lễ phép.',
    'Dạy hát: Vui đến trường': '[NgT 2.1, NgT 2.5] Hát đúng nhạc, thể hiện tình cảm rộn ràng.',
    'Làm khung tranh tặng cô giáo': '[NgT 3.1, NgT 6.1] Phối hợp vật liệu, kỹ năng dán/đính sáng tạo.',
    'Nhạc kịch: Câu chuyện Trăng Trung thu': '[NgT 4.2, NgT 7.2] Vận động theo nhạc kết hợp đóng vai hoạt cảnh.',
    'Trang trí bông hoa quy tắc lớp học': '[NgT 3.2, NgT 6.3] Tạo hình bông hoa trang trí lớp học đẹp mắt.',

    // Mẫu giáo lớn (5 - 6 tuổi)
    'Ném trúng đích thẳng đứng xa 2m; Bật sâu 30cm': '[TC 3.2, TC 1.4] Thực hiện vận động thử thách có độ chính xác cao.',
    'Chuyền bắt bóng qua đầu qua chân; Chuỗi liên hoàn 3 vận động': '[TC 3.4, TC 1.3] Phối hợp nhóm; thực hiện chuỗi vận động liền mạch.',
    'Bé chuẩn bị tâm thế vào lớp Một; Ý thức trách nhiệm': '[TX 7.3, TX 6.1] Thích ứng môi trường mới; hiểu quyền và bổn phận.',
    'Hợp tác làm việc nhóm, thương lượng giải quyết mâu thuẫn': '[TX 4.4, TX 4.5] Kỹ năng thương lượng, hòa giải tích cực không bạo lực.',
    'Làm quen 29 chữ cái tiếng Việt: Chữ O, Ô, Ơ, A, Ă, Â...': '[NN 5.1, NN 7.1] Nhận biết chữ cái, hiểu chữ viết thay thế lời nói.',
    'Tập tô nét cơ bản, sao chép tên của mình đúng dòng kẻ': '[NN 7.2, NN 7.3] Cầm bút chuẩn, sao chép chữ từ trái sang phải.',
    'Tách gộp nhóm 10 đối tượng; Đo độ dài bằng thước đo': '[NT 4.4, NT 4.5] Thành thạo tách gộp trong PV 10; kỹ năng đo lường.',
    'Khám phá quy trình công nghệ đơn giản; Thí nghiệm STEM': '[NT 3.3, NT 5.3] Ứng dụng khoa học kỹ thuật giải quyết vấn đề.',
    'Hát ngẫu hứng, sáng tạo lời ca mới theo bài quen thuộc': '[NgT 5.1, NgT 5.2] Sáng tạo âm nhạc, múa ngẫu hứng bộc lộ ý tưởng.',
    'Đóng kịch phân vai theo cốt truyện sáng tạo của nhóm': '[NgT 4.2, NgT 7.3] Biểu cảm diễn xuất, tự chủ đạo cụ và lời thoại vai kịch.',
  };
`;

serverContent = serverContent.replace(
  /  const MAM_NON_STANDARDS = \{[\s\S]*?\};\n/g,
  updatedStandards + '\n'
);

// Also we need to make sure the AI properly outputs line breaks for bullet points instead of keeping them on the same line.
// The user complained: "nội dung trong ảnh là mới soạn ra đang liền tù tì nhau. trên kho đã cập nhật lên kho mà không có tên bài chuẩn theo kho phân phối cập nhất thêm cho lớp 4-5 tuổi 10 bài nưa."
// Let's add instruction for preschool prompt: 
// "Mỗi ý (trong Mục đích, Chuẩn bị, hoặc Tiến trình) BẮT BUỘC phải xuống dòng và kết thúc bằng một dấu chấm hoặc chấm phẩy. Sử dụng gạch đầu dòng (-) hoặc dấu cộng (+) rõ ràng."
serverContent = serverContent.replace(
  /-- Mỗi mục, mỗi ý \(trong Mục đích, Chuẩn bị, hoặc các bước Tiến hành\) BẮT BUỘC phải xuống dòng\. Sử dụng gạch đầu dòng \(-\) rõ ràng ở mỗi ý con, các hoạt động cần phân tách rành mạch\./g,
  `-- Mỗi mục, mỗi ý (trong Mục đích, Chuẩn bị, hoặc các bước Tiến hành) BẮT BUỘC phải XUỐNG DÒNG. Các ý con phải bắt đầu bằng gạch đầu dòng (-) trên một dòng MỚI hoàn toàn.`
);

fs.writeFileSync('server.ts', serverContent);
