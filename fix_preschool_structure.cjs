const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const regex = /YÊU CẦU BẮT BUỘC:[\s\S]*?"stemMaterials": \[\]\n  \}\n\}\`;/;

const newPrompt = `YÊU CẦU BẮT BUỘC:
- Kiến thức (knowledge): Trẻ nhận biết, hiểu được gì...
- Kỹ năng (subjectCompetencies): Các kỹ năng vận động, kỹ năng tư duy...
- Phẩm chất (qualities): BẮT BUỘC gắn với 4 phẩm chất cốt lõi (Yêu thương, Tôn trọng, Trung thực, Trách nhiệm). Ví dụ: "Yêu thương: ...", "Tôn trọng: ...".
- Năng lực (generalCompetencies): BẮT BUỘC gắn với 5 năng lực nền tảng (Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng). Ví dụ: "Tự lực: ...", "Thích ứng: ...".
- Tích hợp (digitalCompetencies): Quyền Trẻ em, Tích hợp Công nghệ/AI...
- Chuẩn bị của cô (equipment.teacher): Bắt buộc có "Môi trường và không gian: ...", "Đồ dùng, học liệu của giáo viên: ...".
- Chuẩn bị của trẻ (equipment.student): Trang phục, đồ dùng, tâm thế...

Yêu cầu: Trả về JSON với cấu trúc:
{
  "objectives": {
    "knowledge": ["- ..."],
    "subjectCompetencies": ["- ..."],
    "generalCompetencies": ["Tự lực: ...", "Thích ứng: ...", "Giao tiếp: ..."],
    "qualities": ["Yêu thương: ...", "Tôn trọng: ...", "Trung thực: ...", "Trách nhiệm: ..."],
    "digitalCompetencies": ["Quyền Trẻ em: ...", "Tích hợp Công nghệ/AI: ..."],
    "aiCompetencies": [],
    "stemCompetencies": []
  },
  "equipment": {
    "teacher": ["- Môi trường và không gian: ...", "- Đồ dùng, học liệu của giáo viên: ..."],
    "student": ["Trang phục, đồ dùng, tâm thế..."],
    "digitalAssets": [],
    "stemMaterials": []
  }
}\`;`;

code = code.replace(regex, newPrompt);
fs.writeFileSync('server.ts', code);
