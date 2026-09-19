const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const effectLogic = `
  useEffect(() => {
    const isMam = newGrade.includes('Nhà trẻ') || newGrade.includes('Mẫu giáo');
    const validList = isMam ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;
    if (!validList.includes(newSubject)) {
      setNewSubject(validList[0] || 'Tin học');
    }
  }, [newGrade, newSubject]);
`;

content = content.replace(
  "  // Form upload state (Môn học, Khối lớp, Tên bộ sách, Tệp PDF)",
  effectLogic + "\n  // Form upload state (Môn học, Khối lớp, Tên bộ sách, Tệp PDF)"
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
