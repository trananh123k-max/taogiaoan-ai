const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

// The problematic block:
const regex = /(  useEffect\(\(\) => \{\n    const isMam = newGrade\.includes\('Nhà trẻ'\) \|\| newGrade\.includes\('Mẫu giáo'\);\n    const validList = isMam \? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;\n    if \(\!validList\.includes\(newSubject\)\) \{\n      setNewSubject\(validList\[0\] \|\| 'Tin học'\);\n    \}\n  \}, \[newGrade, newSubject\]\);\n\n  \/\/ Form upload state \(Môn học, Khối lớp, Tên bộ sách, Tệp PDF\)\n  const isMamNon = newGrade\.includes\('Nhà trẻ'\) \|\| newGrade\.includes\('Mẫu giáo'\);\n  const currentSubjectsList = isMamNon \? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;\n\n  const \[newSubject, setNewSubject\] = useState\('Tin học'\);\n  const \[newGrade, setNewGrade\] = useState\('Nhiều khối lớp \(Tự động nhận diện\)'\);\n  const \[newBookSeries, setNewBookSeries\] = useState\('Kết nối tri thức với cuộc sống'\);\n  const \[newVolume, setNewVolume\] = useState\('Cả năm \/ Không phân tập'\);)/;

const replacement = `  // Form upload state (Môn học, Khối lớp, Tên bộ sách, Tệp PDF)
  const [newSubject, setNewSubject] = useState('Tin học');
  const [newGrade, setNewGrade] = useState('Nhiều khối lớp (Tự động nhận diện)');
  const [newBookSeries, setNewBookSeries] = useState('Kết nối tri thức với cuộc sống');
  const [newVolume, setNewVolume] = useState('Cả năm / Không phân tập');

  const isMamNon = newGrade.includes('Nhà trẻ') || newGrade.includes('Mẫu giáo');
  const currentSubjectsList = isMamNon ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;

  useEffect(() => {
    const isMam = newGrade.includes('Nhà trẻ') || newGrade.includes('Mẫu giáo');
    const validList = isMam ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;
    if (!validList.includes(newSubject)) {
      setNewSubject(validList[0] || 'Tin học');
    }
  }, [newGrade, newSubject]);`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
  console.log("Fixed successfully");
} else {
  console.log("Regex didn't match");
}
