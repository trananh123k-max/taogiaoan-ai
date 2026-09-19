const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const oldJsonTemplate1 = `Trả về JSON dạng:
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
      "step1": { "title": "* GV giao nhiệm vụ học tập 1", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
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
      "step1": { "title": "* GV giao nhiệm vụ học tập 1", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo, thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    }
  ]
}`;

const newJsonTemplate1 = `Trả về JSON dạng (NẾU MẦM NON THÌ BỎ TRỐNG step2, step3, step4):
{
  "activities": [
    {
      "id": "act-1",
      "index": 1,
      "name": "\${config.periods >= 2 ? '[TIẾT 1] ' : ''}\${isPreschool ? '1. Khởi động' : 'Hoạt động 1: Mở đầu / Khởi động'}",
      "duration": "7-10 phút",
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
      "id": "act-2",
      "index": 2,
      "name": "\${config.periods >= 2 ? '[TIẾT 1] ' : ''}\${isPreschool ? '2. Khám phá - Trải nghiệm' : 'Hoạt động 2: Hình thành kiến thức mới'}",
      "duration": "25-30 phút",
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

content = content.replace(oldJsonTemplate1, newJsonTemplate1);
fs.writeFileSync(path, content, 'utf8');
