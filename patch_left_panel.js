const fs = require('fs');
const file = 'src/components/LeftConfigPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldGrades = `  const allGrades = useMemo(() => {
    return [
      'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
      'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12',
    ];
  }, []);`;

const newGrades = `  const allGrades = useMemo(() => {
    if (config.schoolLevel === 'Mầm non') {
      return ['Nhà trẻ (12-36 tháng)', 'Mẫu giáo bé (3-4 tuổi)', 'Mẫu giáo nhỡ (4-5 tuổi)', 'Mẫu giáo lớn (5-6 tuổi)'];
    }
    if (config.schoolLevel === 'Tiểu học') {
      return ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
    }
    if (config.schoolLevel === 'THCS') {
      return ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];
    }
    if (config.schoolLevel === 'THPT') {
      return ['Lớp 10', 'Lớp 11', 'Lớp 12'];
    }
    return [
      'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
      'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12',
    ];
  }, [config.schoolLevel]);`;

content = content.replace(oldGrades, newGrades);

fs.writeFileSync(file, content);
