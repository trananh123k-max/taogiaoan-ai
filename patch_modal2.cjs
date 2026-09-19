const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const filterLogic = `
  const getLevelFromGrade = (grade: string) => {
    if (!grade) return 'Khác';
    if (grade.includes('Nhà trẻ') || grade.includes('Mẫu giáo')) return 'Mầm non';
    const match = grade.match(/Lớp\s+(\d+)/i);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 5) return 'Tiểu học';
      if (num >= 6 && num <= 9) return 'THCS';
      if (num >= 10 && num <= 12) return 'THPT';
    }
    return 'Khác';
  };

  const filteredUploadedBooks = myUploadedBooks.filter(
    (b) => {
      const matchSearch = (b.title || '').toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                          (b.subject || '').toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                          (b.grade || '').toLowerCase().includes(bookSearchQuery.toLowerCase());
      const matchSubject = bookSubjectFilter === 'Tất cả' || b.subject === bookSubjectFilter;
      const matchLevel = bookLevelFilter === 'Tất cả' || getLevelFromGrade(b.grade) === bookLevelFilter;
      return matchSearch && matchSubject && matchLevel;
    }
  );

  const filteredUploadedPPCTs = myUploadedPPCTs.filter(
    (p) => {
      const matchSearch = (p.title || '').toLowerCase().includes(ppctSearchQuery.toLowerCase()) ||
                          (p.subject || '').toLowerCase().includes(ppctSearchQuery.toLowerCase()) ||
                          (p.grade || '').toLowerCase().includes(ppctSearchQuery.toLowerCase());
      const matchSubject = ppctSubjectFilter === 'Tất cả' || p.subject === ppctSubjectFilter;
      const matchLevel = ppctLevelFilter === 'Tất cả' || getLevelFromGrade(p.grade) === ppctLevelFilter;
      return matchSearch && matchSubject && matchLevel;
    }
  );
`;

content = content.replace(/  const filteredUploadedBooks = myUploadedBooks\.filter\([\s\S]*?  \);/m, filterLogic);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
