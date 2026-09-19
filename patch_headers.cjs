const fs = require('fs');
const path = 'src/utils/docxExporter.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /text: 'Hoạt động của Giáo viên và Học sinh',/g,
  `text: isPreschool ? 'Hoạt động của giáo viên' : 'Hoạt động của Giáo viên và Học sinh',`
);

content = content.replace(
  /text: 'Sản phẩm',/g,
  `text: isPreschool ? 'Hoạt động của trẻ' : 'Sản phẩm',`
);

fs.writeFileSync(path, content, 'utf8');
