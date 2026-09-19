const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldTask12Regex = /\/\/ Task 2: Activity 1 \(Khởi động\) & Activity 2 \(Hình thành kiến thức mới\)[\s\S]*?(?=  \/\/ Task 3: Activity 3 \(Luyện tập\) & Activity 4)/;

const newTask12 = `// Task 2: Activity 1 (Khởi động) & Activity 2 (Hình thành kiến thức mới)
  const taskActivities1And2 = async () => {
    const periodNote = config.periods >= 2 ? 'LƯU Ý PHÂN PHỐI TIẾT: Hoạt động 1 và Hoạt động 2 thuộc TIẾT 1. Đặt tên hoạt động có tiền tố "[TIẾT 1]" (ví dụ "[TIẾT 1] Hoạt động 1: Mở đầu / Khởi động", "[TIẾT 1] Hoạt động 2: Hình thành kiến thức mới").' : '';
    let prompt = '';
    
    if (isPreschool) {
      prompt = \`\${baseContext}
Hãy soạn chi tiết phần 1 của Tiến trình hoạt động Mầm non (Các bước: 1. Khởi động, 2. Khám phá). 
TUYỆT ĐỐI KHÔNG dùng 4 bước CV 5512. Mỗi hoạt động chỉ dùng duy nhất step1 để chứa Hoạt động của cô (teacherAction) và Hoạt động của trẻ (studentAction). Để trống step2, 3, 4.
Trả về JSON chứa mảng activities gồm 2 phần tử:
{
  "activities": [
    {
      "id": "act-1",
      "index": 1,
      "name": "1. Khởi động – Tạo hứng thú",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    },
    {
      "id": "act-2",
      "index": 2,
      "name": "2. Khám phá – Trải nghiệm nhiệm vụ",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    }
  ]
}\`;
    } else {
      prompt = \`\${baseContext}
Hãy soạn chi tiết HOẠT ĐỘNG 1 (Xác định vấn đề / Khởi động) và HOẠT ĐỘNG 2 (Hình thành kiến thức mới) theo chuẩn 4 bước của Công văn 5512.
\${periodNote}
Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ.
\${config.imageSlots && config.imageSlots.length > 0 ? 'Nếu có thẻ {{IMAGE_SLOT_X}} trong nội dung tham khảo, hãy chèn đúng thẻ đó vào vị trí tương ứng.' : 'TUYỆT ĐỐI KHÔNG tự bịa thẻ ảnh giữ chỗ như {{IMAGE_SLOT_1}} hay {{IMAGESLOT1}}, hãy thay bằng câu hỏi thảo luận hoặc bài tập tương ứng.'}
- step1: Chuyển giao nhiệm vụ học tập (title, teacherAction, studentAction, productExpected, digitalOrAiTool)
- step2: Thực hiện nhiệm vụ học tập (title, teacherAction, studentAction, productExpected, digitalOrAiTool)
- step3: Báo cáo kết quả và thảo luận (title, teacherAction, studentAction, productExpected, digitalOrAiTool)
- step4: Kết luận, nhận định (title, teacherAction, studentAction, productExpected, digitalOrAiTool)
Cột productExpected phải chi tiết công thức, định nghĩa, nội dung ghi vở của học sinh. Mọi gạch đầu dòng dùng dấu trừ (-).
Trả về JSON dạng:
{
  "activities": [
    {
      "id": "act-1",
      "index": 1,
      "name": "\${config.periods >= 2 ? '[TIẾT 1] ' : ''}Hoạt động 1: Mở đầu / Khởi động",
      "duration": "7-10 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "* GV giao nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo, thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    },
    {
      "id": "act-2",
      "index": 2,
      "name": "\${config.periods >= 2 ? '[TIẾT 1] ' : ''}Hoạt động 2: Hình thành kiến thức mới",
      "duration": "25-30 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "* GV giao nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo, thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    }
  ]
}\`;
    }
    const res = await generateContentWithRetryAndFallback({
      contents: prompt,
      apiKey,
      config: { responseMimeType: 'application/json' },
    });
    return parseJSONRobust(res.text);
  };
`;

code = code.replace(oldTask12Regex, newTask12);

fs.writeFileSync('server.ts', code);
