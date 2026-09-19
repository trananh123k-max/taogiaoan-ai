const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update systemInstruction for extract-textbook-toc
code = code.replace(
  `"totalLessons": 17\n   }`,
  `"totalLessons": 17,\n     "detectedGrade": "Lớp 6",\n     "detectedSubject": "Toán học",\n     "detectedVolume": "Tập 1"\n   }\n5. NẾU khối lớp, môn học, tập sách chưa rõ ràng, BẮT BUỘC phải nhận diện từ tên file hoặc trang bìa/mục lục.`
);

code = code.replace(
  `JSON { "lessons": [...], "themes": [...], "totalLessons": number }.`,
  `JSON { "lessons": [...], "themes": [...], "totalLessons": number, "detectedGrade": string, "detectedSubject": string, "detectedVolume": string }.`
);

code = code.replace(
  `totalLessons: (parsed.lessons || []).length,`,
  `totalLessons: (parsed.lessons || []).length,\n      detectedGrade: parsed.detectedGrade || grade,\n      detectedSubject: parsed.detectedSubject || subject,\n      detectedVolume: parsed.detectedVolume || volume,`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts multi');
