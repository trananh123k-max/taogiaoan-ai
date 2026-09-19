const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const baseContextPatch = `
  const baseContext = \`Bài dạy: "\${lessonTitle}", Môn: \${subject}, Khối: \${grade}, Thời lượng: \${periods} tiết.
Bộ sách: \${bookSeries} (BẮT BUỘC bám sát 100% SGK Kết nối tri thức).
\${config.integratedNLSFromPPCT?.length > 0 ? \`Yêu cầu NLS từ PPCT: \${config.integratedNLSFromPPCT.join(', ')}\` : \`Tích hợp Năng lực số (NLS): \${config.enableNLS ? 'Có' : 'Không'}.\`}
\${config.integratedAIFromPPCT?.length > 0 ? \`Yêu cầu AI từ PPCT: \${config.integratedAIFromPPCT.join(', ')}\` : \`Tích hợp AI: \${config.enableAI ? 'Có (QĐ 2422)' : 'Không'}.\`}
\${config.oldPlanContent ? \`Nội dung tham khảo từ giáo án gốc:\\n"""\\n\${config.oldPlanContent.substring(0, 5000)}\\n"""\` : ''}\`;
`;

// Using regex to replace baseContext logic accurately
const replaceRegex = /const baseContext = `Bài dạy: "[^`]+`;/s;

code = code.replace(replaceRegex, baseContextPatch.trim());
fs.writeFileSync('server.ts', code);
