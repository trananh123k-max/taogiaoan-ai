const fs = require('fs');

let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

code = code.replace(
  '                II. Thiết bị dạy học và học liệu',
  '                {isPreschool ? \'II. Chuẩn bị\' : \'II. Thiết bị dạy học và học liệu\'}'
);

code = code.replace(
  '              <h4 className="font-bold text-slate-900">1. Đối với giáo viên:</h4>',
  '              <h4 className="font-bold text-slate-900">{isPreschool ? \'1. Chuẩn bị của cô:\' : \'1. Đối với giáo viên:\'}</h4>'
);

code = code.replace(
  '              <h4 className="font-bold text-slate-900 pt-2">2. Đối với học sinh:</h4>',
  '              <h4 className="font-bold text-slate-900 pt-2">{isPreschool ? \'2. Chuẩn bị của trẻ:\' : \'2. Đối với học sinh:\'}</h4>'
);

fs.writeFileSync('src/components/RightResultEditor.tsx', code);
