const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

// Update imports
content = content.replace(
  "import { SUBJECTS_LIST, getVerifiedLessons } from '../data/curriculumData';",
  "import { SUBJECTS_LIST, MAM_NON_SUBJECTS_LIST, getVerifiedLessons } from '../data/curriculumData';"
);

// Add dynamic subject list logic
const dynamicLogic = `  const isMamNon = newGrade.includes('Nhà trẻ') || newGrade.includes('Mẫu giáo');
  const currentSubjectsList = isMamNon ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;
`;

// Insert it somewhere around the beginning of the component
content = content.replace(
  "  const [newSubject, setNewSubject] = useState('Tin học');",
  dynamicLogic + "\n  const [newSubject, setNewSubject] = useState('Tin học');"
);

// Replace hardcoded options in upload_ppct
content = content.replace(
  /\{SUBJECTS_LIST\.map\(\(subj\)/g,
  "{currentSubjectsList.map((subj)"
);

// Replace hardcoded options in upload_new
content = content.replace(
  /\{?\['Tin học', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử & Địa lý', 'Công nghệ', 'Tiếng Anh', 'GDCD'\]\}?\.map\(\(s\)/g,
  "{currentSubjectsList.map((s)"
);

// Also change label to Lĩnh vực/Môn học
content = content.replace(
  /<label className="text-xs font-bold text-slate-700">Môn học<\/label>/g,
  '<label className="text-xs font-bold text-slate-700">{isMamNon ? "Lĩnh vực" : "Môn học"}</label>'
);
content = content.replace(
  /<label className="font-bold text-slate-700 block mb-1">Môn học:<\/label>/g,
  '<label className="font-bold text-slate-700 block mb-1">{isMamNon ? "Lĩnh vực:" : "Môn học:"}</label>'
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
