const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const newTask1 = `  // Task 1: Objectives & Equipment
  const taskObjectivesEquipment = async () => {
    let prompt = '';
    if (isPreschool) {
      prompt = \`\${baseContext}
Hãy soạn Mục I (MỤC ĐÍCH - YÊU CẦU) và Mục II (CHUẨN BỊ) theo CHUẨN MẦM NON MỚI (Quyết định số 388/QĐ-BGDĐT).
YÊU CẦU BẮT BUỘC:
- Kiến thức (knowledge): Trẻ nhận biết, hiểu được gì.
- Kỹ năng (generalCompetencies): BẮT BUỘC gắn với 5 năng lực nền tảng (Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng). Ví dụ: "Tự lực: ...", "Thích ứng: ...".
- Phẩm chất (qualities): BẮT BUỘC gắn với 4 phẩm chất cốt lõi (Yêu thương, Tôn trọng, Trung thực, Trách nhiệm). Ví dụ: "Yêu thương: ...", "Tôn trọng: ...".
- Tích hợp (digitalCompetencies): Quyền Trẻ em, Tích hợp Công nghệ/AI...
- Chuẩn bị của cô (equipment.teacher): Bắt buộc có "Môi trường và không gian: ...", "Đồ dùng, học liệu của giáo viên: ...".
- Chuẩn bị của trẻ (equipment.student): Trang phục, đồ dùng, tâm thế...

Yêu cầu: Trả về JSON với cấu trúc:
{
  "objectives": {
    "knowledge": ["- ..."],
    "generalCompetencies": ["Tự lực: ...", "Thích ứng: ...", "Giao tiếp: ..."],
    "subjectCompetencies": [],
    "digitalCompetencies": ["Quyền Trẻ em: ...", "Tích hợp Công nghệ/AI: ..."],
    "aiCompetencies": [],
    "stemCompetencies": [],
    "qualities": ["Yêu thương: ...", "Tôn trọng: ...", "Trung thực: ...", "Trách nhiệm: ..."]
  },
  "equipment": {
    "teacher": ["- Môi trường và không gian: ...", "- Đồ dùng, học liệu của giáo viên: ..."],
    "student": ["Trang phục, đồ dùng, tâm thế..."],
    "digitalAssets": [],
    "stemMaterials": []
  }
}\`;
    } else {
      prompt = \`\${baseContext}
Hãy soạn Mục I (MỤC TIÊU theo GDPT 2018, Công văn 5512, Thông tư 02/2025/TT-BGDĐT, Quyết định 2422/QĐ-BGDĐT) và Mục II (THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU).
QUY ĐỊNH BẮT BUỘC VỀ NĂNG LỰC CHUNG (generalCompetencies):
BẮT BUỘC có đủ 3 năng lực chung với đúng các tiêu đề sau:
- "Năng lực tự chủ và tự học: [mô tả cụ thể]"
- "Năng lực giao tiếp và hợp tác: [mô tả cụ thể]"
- "Năng lực giải quyết vấn đề và sáng tạo: [mô tả cụ thể]"

QUY ĐỊNH VỀ CÁC NĂNG LỰC TÍCH HỢP:
- Năng lực số (digitalCompetencies): \${config.enableNLS ? 'Sinh các mã chỉ báo NLS chuẩn theo TT 02/2025 và CV 3456 kèm mô tả' : 'Trả về mảng rỗng [] vì không tích hợp NLS'}
- Năng lực AI (aiCompetencies): \${config.enableAI ? 'Sinh các mã chỉ báo AI chuẩn theo QĐ 2422 (dạng [Lớp].[Mã chủ đề].[Số thứ tự]) kèm mô tả' : 'Trả về mảng rỗng [] vì không tích hợp AI'}
- Năng lực STEM (stemCompetencies): \${hasStem ? \`Sinh các mục tiêu S-T-E-M liên môn gắn với chủ đề "\${stemTopic}"\` : 'Trả về mảng rỗng [] vì không tích hợp STEM'}

\${hasStem ? \`LƯU Ý: Bài học có TÍCH HỢP STEM với chủ đề "\${stemTopic}". Hãy sinh mảng "stemCompetencies" trong objectives, "stemMaterials" trong equipment, và đối tượng "stemIntegration" ({ "topicTitle": "\${stemTopic}", "stemGoals": [...], "stemMaterials": [...], "stemProcess": [...], "expectedProduct": "...", "evaluationCriteria": "..." }).\` : ''}
Yêu cầu: Trả về JSON với cấu trúc:
{
  "objectives": {
    "knowledge": ["- ..."],
    "generalCompetencies": [
      "Năng lực tự chủ và tự học: ...",
      "Năng lực giao tiếp và hợp tác: ...",
      "Năng lực giải quyết vấn đề và sáng tạo: ..."
    ],
    "subjectCompetencies": ["- ..."],
    "digitalCompetencies": \${config.enableNLS ? '["Mã chỉ báo NLS chuẩn kèm mô tả..."]' : '[]'},
    "aiCompetencies": \${config.enableAI ? '["Mã chỉ báo AI chuẩn (ví dụ 6.A1.1, 10.C3.1) kèm mô tả..."]' : '[]'},
    "stemCompetencies": \${hasStem ? \`["Mục tiêu năng lực STEM liên môn gắn với chủ đề \${stemTopic}..."]\` : '[]'},
    "qualities": ["- ..."]
  },
  "equipment": {
    "teacher": ["- ..."],
    "student": ["- ..."],
    "digitalAssets": ["- ..."],
    "stemMaterials": \${hasStem ? '["Dụng cụ và vật liệu thực hành STEM..."]' : '[]'}
  }\${hasStem ? \`,
  "stemIntegration": {
    "topicTitle": "\${stemTopic}",
    "stemGoals": ["Khoa học (S): ...", "Công nghệ (T): ...", "Kỹ thuật (E): ...", "Toán học (M): ..."],
    "stemMaterials": ["Dụng cụ và vật liệu thí nghiệm/chế tạo/thực hành..."],
    "stemProcess": ["Bước 1: Xác định vấn đề...", "Bước 2: Thiết kế giải pháp...", "Bước 3: Chế tạo/thực hành...", "Bước 4: Thử nghiệm và đánh giá...", "Bước 5: Báo cáo và nghiệm thu..."],
    "expectedProduct": "Mô tả sản phẩm STEM cụ thể...",
    "evaluationCriteria": "Tiêu chí đánh giá, nghiệm thu sản phẩm STEM..."
  }\` : ''}
}\`;
    }`;

const oldTask1Regex = /  \/\/ Task 1: Objectives & Equipment[\s\S]*?(?=    const res = await generateContentWithRetryAndFallback\(\{)/;
code = code.replace(oldTask1Regex, newTask1 + '\n');

fs.writeFileSync('server.ts', code);
