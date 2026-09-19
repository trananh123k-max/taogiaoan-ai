const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const prompt = \`Hãy nâng cấp lại Hoạt động sau đây của bài dạy \(\$\{subject\} - \$\{grade\}\) theo đúng chuẩn Công văn 5512 \(4 bước rõ ràng\):[\s\S]*?digitalOrAiTool\.\`;/;

const strNew = `const isPreschool = grade?.toLowerCase().includes('mầm non') || subject?.toLowerCase().includes('mầm non');
    const prompt = \`Hãy nâng cấp lại Hoạt động sau đây của bài dạy (\${subject} - \${grade}) \${isPreschool ? 'dành cho Mầm non (Không dùng CV 5512, giữ nguyên dạng 1 step1 cho cả hoạt động)' : 'theo đúng chuẩn Công văn 5512 (4 bước rõ ràng)'}:

Hoạt động hiện tại:
\${JSON.stringify(activity, null, 2)}

Yêu cầu điều chỉnh từ giáo viên:
"\${instruction}"

Yêu cầu: Trả về đối tượng JSON cho duy nhất Hoạt động này, giữ nguyên cấu trúc các trường: id, index, name, duration, objective, content, productSummary, step1, step2, step3, step4, nlsFocus, aiFocus. \${isPreschool ? 'Chỉ sử dụng step1, bỏ trống step 2, 3, 4.' : 'Mỗi step phải có: title, teacherAction, studentAction, productExpected, digitalOrAiTool.'}\`;`;

content = content.replace(regex, strNew);

fs.writeFileSync(path, content, 'utf8');
