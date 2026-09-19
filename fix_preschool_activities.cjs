const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldTask34Regex = /\/\/ Task 3: Activity 3 \(Luyện tập\) & Activity 4 \(Vận dụng & Hướng dẫn về nhà \/ Bài tiếp theo\)[\s\S]*?(?=  \/\/ Task 4: Competency Matrix & Appendix)/;

const newTask34 = `// Task 3: Activity 3 (Luyện tập) & Activity 4 (Vận dụng & Hướng dẫn về nhà / Bài tiếp theo)
  const taskActivities3And4 = async () => {
    const periodNote = config.periods >= 2 ? 'LƯU Ý PHÂN PHỐI TIẾT: Hoạt động 3 và Hoạt động 4 thuộc TIẾT 2. Đặt tên hoạt động có tiền tố "[TIẾT 2]" (ví dụ "[TIẾT 2] Hoạt động 3: Luyện tập", "[TIẾT 2] Hoạt động 4: Vận dụng & Hướng dẫn tự học").' : '';
    let prompt = '';
    
    if (isPreschool) {
      prompt = \`\${baseContext}
Hãy soạn chi tiết phần tiếp theo của Tiến trình hoạt động Mầm non (Các bước: 3. Chia sẻ, 4. Thực hành, 5. Đánh giá - Hồi tĩnh). 
TUYỆT ĐỐI KHÔNG dùng 4 bước CV 5512. Mỗi hoạt động chỉ dùng duy nhất step1 để chứa Hoạt động của cô (teacherAction) và Hoạt động của trẻ (studentAction). Để trống step2, 3, 4.
Trả về JSON chứa mảng activities gồm 3 phần tử (activity 3, 4, 5):
{
  "activities": [
    {
      "id": "act-3",
      "index": 3,
      "name": "3. Chia sẻ – hình thành cách thực hiện",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    },
    {
      "id": "act-4",
      "index": 4,
      "name": "4. Thực hành – Vận dụng",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    },
    {
      "id": "act-5",
      "index": 5,
      "name": "5. Chia sẻ – Đánh giá và Hồi tĩnh",
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
Hãy soạn chi tiết HOẠT ĐỘNG 3 (Luyện tập) và HOẠT ĐỘNG 4 (Vận dụng & Hướng dẫn tự học) theo chuẩn 4 bước của Công văn 5512.
\${periodNote}
Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ (step1, step2, step3, step4).
\${config.imageSlots && config.imageSlots.length > 0 ? 'Nếu có thẻ {{IMAGE_SLOT_X}} trong nội dung tham khảo, hãy chèn đúng thẻ đó vào vị trí tương ứng.' : 'TUYỆT ĐỐI KHÔNG tự bịa thẻ ảnh giữ chỗ như {{IMAGE_SLOT_1}} hay {{IMAGESLOT1}}, hãy thay bằng câu hỏi thảo luận hoặc bài tập tương ứng.'}
ĐẶC BIỆT BẮT BUỘC: Tại Hoạt động 4 (và mục hướng dẫn tự học), GV BẮT BUỘC phải dặn dò học sinh đọc trước SGK và chuẩn bị cụ thể TÊN BÀI HỌC HOẶC NỘI DUNG TIẾP THEO của SGK Kết nối tri thức.
Trả về JSON dạng:
{
  "activities": [
    {
      "id": "act-3",
      "index": 3,
      "name": "\${config.periods >= 2 ? '[TIẾT 2] ' : ''}Hoạt động 3: Luyện tập",
      "duration": "10-12 phút",
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
      "id": "act-4",
      "index": 4,
      "name": "\${config.periods >= 2 ? '[TIẾT 2] ' : ''}Hoạt động 4: Vận dụng",
      "duration": "5-8 phút",
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

code = code.replace(oldTask34Regex, newTask34);

fs.writeFileSync('server.ts', code);
