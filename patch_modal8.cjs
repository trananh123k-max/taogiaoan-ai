const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

content = content.replace(
  "['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (12-36 tháng)'",
  "{['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (12-36 tháng)'"
);
content = content.replace(
  "['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (12-36 tháng)'",
  "{['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (12-36 tháng)'"
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
