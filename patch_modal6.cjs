const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const regex1 = /\{?\['Nhiều khối lớp \(Tự động nhận diện\)','Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12'\]\}?\.map/g;
const regex2 = /\{?\['Nhiều khối lớp \(Tự động nhận diện\)', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'\]\}?\.map/g;

const replacement = "{['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (12-36 tháng)', 'Mẫu giáo bé (3-4 tuổi)', 'Mẫu giáo nhỡ (4-5 tuổi)', 'Mẫu giáo lớn (5-6 tuổi)', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12']}.map";

content = content.replace(regex1, replacement);
content = content.replace(regex2, replacement);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
