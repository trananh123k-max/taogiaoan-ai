const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBaseContext = /\$\{config\.oldPlanContent \? \`Nội dung tham khảo từ giáo án gốc:\\n\"\"\"\\n\$\{config\.oldPlanContent\.substring\(0, 5000\)\}\\n\"\"\"\` : \'\'\}\`\;/;

const newBaseContext = `\${config.oldPlanContent ? \`Nội dung tham khảo từ giáo án gốc:\\n\"\"\"\\n\${config.oldPlanContent.substring(0, 15000)}\\n\"\"\"\` : ''}
\${config.imageSlots && config.imageSlots.length > 0 ? \`DANH SÁCH THẺ HÌNH ẢNH CẦN BẢO TỒN VỊ TRÍ (TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ XÓT):\\n\${config.imageSlots.map((s) => \`- \${s.slotTag}: \${s.name}\`).join('\\n')}\\n\\nCHÚ Ý QUAN TRỌNG: Nếu văn bản gốc có các thẻ như {{IMAGE_SLOT_1}}, {{IMAGE_SLOT_2}}... Bạn BẮT BUỘC phải đặt các thẻ {{IMAGE_SLOT_X}} này vào đúng ngữ cảnh, đúng bước của Hoạt động tương ứng (thường nằm ở teacherAction hoặc studentAction). KHÔNG ĐƯỢC tự ý xóa bỏ thẻ hình ảnh của giáo viên.\` : ''}\`;`;

code = code.replace(oldBaseContext, newBaseContext);

// Also let's check taskActivities1And2 prompt
const oldTask2 = /Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ:/;
const newTask2 = `Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ:
Nếu trong nội dung tham khảo có thẻ {{IMAGE_SLOT_X}}, BẮT BUỘC phải chèn lại đúng thẻ {{IMAGE_SLOT_X}} đó vào vị trí tương ứng trong teacherAction hoặc studentAction của bước đó.`;

code = code.replace(oldTask2, newTask2);

const oldTask3 = /Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ \(step1, step2, step3, step4\)\./;
const newTask3 = `Mỗi hoạt động BẮT BUỘC có 4 bước đầy đủ (step1, step2, step3, step4).
Nếu trong nội dung tham khảo có thẻ {{IMAGE_SLOT_X}}, BẮT BUỘC phải chèn lại đúng thẻ {{IMAGE_SLOT_X}} đó vào vị trí tương ứng trong teacherAction hoặc studentAction của bước đó.`;

code = code.replace(oldTask3, newTask3);

fs.writeFileSync('server.ts', code);
console.log('Patched baseContext and prompts for image slots.');
