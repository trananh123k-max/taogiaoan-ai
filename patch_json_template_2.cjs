const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const oldJsonTemplate2 = `Trả về JSON dạng:
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
      "step1": { "title": "* GV giao nhiệm vụ học tập 1", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
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
      "step1": { "title": "* GV giao nhiệm vụ học tập 1", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo, thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    }
  ]
}`;

const newJsonTemplate2 = `Trả về JSON dạng (NẾU MẦM NON THÌ BỎ TRỐNG step2, step3, step4):
{
  "activities": [
    {
      "id": "act-3",
      "index": 3,
      "name": "\${config.periods >= 2 ? '[TIẾT 2] ' : ''}\${isPreschool ? '3. Chia sẻ / Thực hành' : 'Hoạt động 3: Luyện tập'}",
      "duration": "10-12 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "\${isPreschool ? '' : '* GV giao nhiệm vụ học tập 1'}", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "\${isPreschool ? '' : '* HS thực hiện nhiệm vụ'}", "teacherAction": "\${isPreschool ? '' : '...'}", "studentAction": "\${isPreschool ? '' : '...'}", "productExpected": "\${isPreschool ? '' : '...'}", "digitalOrAiTool": "..." },
      "step3": { "title": "\${isPreschool ? '' : '* Báo cáo, thảo luận'}", "teacherAction": "\${isPreschool ? '' : '...'}", "studentAction": "\${isPreschool ? '' : '...'}", "productExpected": "\${isPreschool ? '' : '...'}", "digitalOrAiTool": "..." },
      "step4": { "title": "\${isPreschool ? '' : '* Kết luận, nhận định'}", "teacherAction": "\${isPreschool ? '' : '...'}", "studentAction": "\${isPreschool ? '' : '...'}", "productExpected": "\${isPreschool ? '' : '...'}", "digitalOrAiTool": "..." }
    },
    {
      "id": "act-4",
      "index": 4,
      "name": "\${config.periods >= 2 ? '[TIẾT 2] ' : ''}\${isPreschool ? '4. Đánh giá - Hồi tĩnh' : 'Hoạt động 4: Vận dụng'}",
      "duration": "5-8 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "\${isPreschool ? '' : '* GV giao nhiệm vụ học tập 1'}", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "\${isPreschool ? '' : '* HS thực hiện nhiệm vụ'}", "teacherAction": "\${isPreschool ? '' : '...'}", "studentAction": "\${isPreschool ? '' : '...'}", "productExpected": "\${isPreschool ? '' : '...'}", "digitalOrAiTool": "..." },
      "step3": { "title": "\${isPreschool ? '' : '* Báo cáo, thảo luận'}", "teacherAction": "\${isPreschool ? '' : '...'}", "studentAction": "\${isPreschool ? '' : '...'}", "productExpected": "\${isPreschool ? '' : '...'}", "digitalOrAiTool": "..." },
      "step4": { "title": "\${isPreschool ? '' : '* Kết luận, nhận định'}", "teacherAction": "\${isPreschool ? '' : '...'}", "studentAction": "\${isPreschool ? '' : '...'}", "productExpected": "\${isPreschool ? '' : '...'}", "digitalOrAiTool": "..." }
    }
  ]
}`;

content = content.replace(oldJsonTemplate2, newJsonTemplate2);
fs.writeFileSync(path, content, 'utf8');
