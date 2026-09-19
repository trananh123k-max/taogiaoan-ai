const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Change the disabling logic
content = content.replace(
  '  if (isHDTN || isPreschool) {',
  '  if (isHDTN) {'
);

// 2. We need to inject the MAM_NON_STANDARDS logic and the Preschool AI/NLS logic.
// Find the `const preschoolPrompt = \`...` definition.
const newPreschoolPromptDef = `
  const MAM_NON_STANDARDS = {
    'Đi trong đường hẹp mang vật trên tay; Bật tại chỗ': 'Giữ thăng bằng di chuyển và bật nhảy chân.',
    'Lăn bóng, bắt bóng cùng cô; Xâu vòng hoa to': 'Phối hợp tay - mắt, khéo léo cơ ngón tay.',
    'Bé nhận biết tên mình, đồ dùng cá nhân của bé': 'Nhận biết bản thân, gọi tên đồ dùng cá nhân.',
    'Bé chơi ngoan cùng bạn, chào hỏi lễ phép': 'Chơi cạnh bạn không tranh giành; biết chào cô.',
    'Nghe và phát âm các từ đơn giản; Xem sách tranh': 'Phát âm rõ tiếng quen thuộc; chủ động lật sách.',
    'Thơ/Đồng dao: Lời chào của bé, Giờ ăn': 'Đọc theo nhịp điệu, dùng từ ngữ lễ phép.',
    'Nhận biết đồ vật màu Đỏ - Vàng; Hình tròn': 'Nhận biết màu sắc nổi bật và hình phẳng.',
    'Nhận biết số lượng: 1 và nhiều; Đồ vật To - Nhỏ': 'Phân biệt kích thước và số lượng đơn giản.',
    'Hát và nhún nhảy theo nhạc: Bé đi nhà trẻ': 'Hát theo bài ngắn, vận động nhún nhảy.',
    'Di màu tự do, vò giấy, chấm màu trang trí': 'Thao tác tạo hình cơ bản với sáp màu/giấy.',
    'Đi thăng bằng trên ghế thể dục; Bò chui qua cổng': 'Giữ thăng bằng thân người; phối hợp tay chân.',
    'Tung bóng lên cao và bắt bóng; Rửa tay bằng xà phòng': 'Bắt bóng khéo léo; thực hành vệ sinh cá nhân.',
    'Nhận biết cảm xúc Vui - Buồn của bản thân và bạn': 'Gọi tên cảm xúc cơ bản của mình và người khác.',
    'Bé cất đồ chơi đúng nơi quy định, biết xin phép': 'Chấp hành quy định của lớp; ứng xử thân thiện.',
    'Truyện: Đôi bạn nhỏ, Gấu con chia quà': 'Lắng nghe, trả lời được câu hỏi và kể lại sự việc.',
    'Làm quen tư thế ngồi xem sách, lật giở từng trang': 'Giở sách đúng cách từ trước ra sau.',
    'Nhận biết phân biệt: Hình vuông - Hình chữ nhật': 'Chỉ ra đặc điểm phẳng của các hình cơ bản.',
    'Đếm đến 3, nhận biết chữ số 3; So sánh Cao - Thấp': 'Đếm số lượng trong phạm vi 3; so sánh kích thước.',
    'Dạy hát: Trường chúng cháu là trường mầm non': 'Hát đúng giai điệu, thể hiện tình cảm vui tươi.',
    'Xé dán dải màu, nặn quả tròn quen thuộc': 'Kỹ năng nặn, xé dán tạo sản phẩm theo gợi ý.',
    'Bật liên tục về phía trước; Tung và bắt bóng 2 tay': 'Bật tiến liên tục giữ thăng bằng; bắt bóng chính xác.',
    'Trèo lên xuống thang dây; Rèn kỹ năng tự phục vụ': 'Phối hợp tay chân trèo mô hình; tự lau mặt, xúc ăn.',
    'Bé tìm hiểu công việc của cô giáo, bác cấp dưỡng': 'Nhận biết nghề nghiệp người thân trong trường.',
    'Thực hành chia sẻ đồ chơi và xếp hàng chờ đến lượt': 'Hợp tác cùng bạn, chờ đến lượt trong hoạt động.',
    'Thơ: Nghe lời cô giáo, Lời cảm ơn': 'Đọc diễn cảm; sử dụng chuẩn từ ngữ nghi thức.',
    'Làm quen quy ước đọc viết: từ trái sang phải': 'Theo dõi tranh chữ từ trái qua phải, trên xuống dưới.',
    'Xếp tương ứng 1 - 1; Đếm đến 4, tạo nhóm trong PV 4': 'Ghép đôi tương ứng; đếm thành thạo trong PV 4.',
    'Phân loại đồ dùng học tập theo 2 dấu hiệu màu sắc/hình': 'Phân loại đối tượng theo dấu hiệu chung.',
    'Gõ đệm theo tiết tấu chậm bài hát; Hát múa tự nhiên': 'Vận động nhịp nhàng và gõ đệm đúng tiết tấu.',
    'Trang trí khung tranh, hoa tặng cô từ vật liệu tái chế': 'Sử dụng đa dạng vật liệu làm đẹp môi trường.',
    'Ném trúng đích thẳng đứng xa 2m; Bật sâu 30cm': 'Thực hiện vận động thử thách có độ chính xác cao.',
    'Chuyền bắt bóng qua đầu qua chân; Chuỗi liên hoàn 3 vận động': 'Phối hợp nhóm; thực hiện chuỗi vận động liền mạch.',
    'Bé chuẩn bị tâm thế vào lớp Một; Ý thức trách nhiệm': 'Thích ứng môi trường mới; hiểu quyền và bổn phận.',
    'Hợp tác làm việc nhóm, thương lượng giải quyết mâu thuẫn': 'Kỹ năng thương lượng, hòa giải tích cực không bạo lực.',
    'Làm quen 29 chữ cái tiếng Việt: Chữ O, Ô, Ơ, A, Ă, Â...': 'Nhận biết chữ cái, hiểu chữ viết thay thế lời nói.',
    'Tập tô nét cơ bản, sao chép tên của mình đúng dòng kẻ': 'Cầm bút chuẩn, sao chép chữ từ trái sang phải.',
    'Tách gộp nhóm 10 đối tượng; Đo độ dài bằng thước đo': 'Thành thạo tách gộp trong PV 10; kỹ năng đo lường.',
    'Khám phá quy trình công nghệ đơn giản; Thí nghiệm STEM': 'Ứng dụng khoa học kỹ thuật giải quyết vấn đề.',
    'Hát ngẫu hứng, sáng tạo lời ca mới theo bài quen thuộc': 'Sáng tạo âm nhạc, múa ngẫu hứng bộc lộ ý tưởng.',
    'Đóng kịch phân vai theo cốt truyện sáng tạo của nhóm': 'Biểu cảm diễn xuất, tự chủ đạo cụ và lời thoại vai kịch.',
  };

  const yccdPreschool = MAM_NON_STANDARDS[lessonTitle] || '';
  const yccdInstruction = yccdPreschool ? \`\\n- BẮT BUỘC sử dụng nguyên văn nội dung sau làm Yêu cầu cần đạt (Kiến thức/Kỹ năng): "\${yccdPreschool}". KHÔNG ĐƯỢC TỰ BỊA THÊM.\` : '';

  const nlsInstruction = config.enableNLS ? \`\\n- TÍCH HỢP NĂNG LỰC SỐ (NLS) PHÙ HỢP VỚI TRẺ MẦM NON: Trẻ quan sát cô giáo thao tác, trải nghiệm công nghệ qua trò chơi tương tác đơn giản (ví dụ: chạm màn hình chọn hình đúng), xem video/mô phỏng. Tuyệt đối không yêu cầu trẻ thao tác thiết bị phức tạp.\` : '';
  const aiInstruction = config.enableAI ? \`\\n- TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI) PHÙ HỢP VỚI TRẺ MẦM NON: Giáo viên sử dụng AI để tạo ra hình ảnh, âm thanh, câu chuyện, hoặc tạo nhân vật ảo trò chuyện với trẻ. Trẻ tương tác với AI thông qua sự điều phối của giáo viên (ví dụ: 'Cô sẽ nhờ bạn Robot AI kể chuyện cho lớp mình nhé'). Đảm bảo an toàn và nhẹ nhàng.\` : '';

  const preschoolPrompt = \`\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:
\${PRESCHOOL_CURRICULUM_MATRIX}
\${yccdInstruction}\${nlsInstruction}\${aiInstruction}
`;

content = content.replace(
  "  const preschoolPrompt = `\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:\n${PRESCHOOL_CURRICULUM_MATRIX}",
  newPreschoolPromptDef
);

fs.writeFileSync('server.ts', content);
