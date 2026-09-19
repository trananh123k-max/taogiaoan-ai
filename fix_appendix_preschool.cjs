const fs = require('fs');
let code = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const oldAppendix = `          // IV. HỒ SƠ DẠY HỌC & PHỤ LỤC (KHÔNG XUẤT CHO MÔN HĐTN-HN THEO YÊU CẦU SOẠN THUẦN 5512)
          ...(!isHDTN`;

const newAppendix = `          // IV. HỒ SƠ DẠY HỌC & PHỤ LỤC (KHÔNG XUẤT CHO MÔN HĐTN-HN THEO YÊU CẦU SOẠN THUẦN 5512)
          ...((!isHDTN && !isPreschool)`;

code = code.replace(oldAppendix, newAppendix);
fs.writeFileSync('src/utils/docxExporter.ts', code);
