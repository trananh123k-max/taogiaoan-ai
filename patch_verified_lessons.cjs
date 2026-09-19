const fs = require('fs');
let content = fs.readFileSync('src/data/verifiedCurriculumList.ts', 'utf8');

const preschoolLogic = `
  // Special handling for Mầm non: Return ALL 10 lessons for the grade
  if (['Nhà trẻ (12-36 tháng)', 'Mẫu giáo bé (3-4 tuổi)', 'Mẫu giáo nhỡ (4-5 tuổi)', 'Mẫu giáo lớn (5-6 tuổi)'].includes(cleanGrade)) {
    const allPreschoolSubjects = [
      'Lĩnh vực Phát triển thể chất',
      'Lĩnh vực Phát triển tình cảm - xã hội',
      'Lĩnh vực Phát triển ngôn ngữ',
      'Lĩnh vực Phát triển nhận thức',
      'Lĩnh vực Phát triển nghệ thuật'
    ];
    let allLessons: string[] = [];
    allPreschoolSubjects.forEach(subj => {
      const key = \`\${subj}_\${cleanGrade}\`;
      if (VERIFIED_KNTT_CURRICULUM[key]) {
        allLessons.push(...VERIFIED_KNTT_CURRICULUM[key].lessons.map(l => \`[\${subj.replace('Lĩnh vực Phát triển ', '')}] \${l}\`));
      }
    });
    return {
      themes: ['Chương trình Mầm non'],
      lessons: allLessons
    };
  }
`;

content = content.replace(
  "  const mappedSubj = standardSubjectMap[cleanSubject] || cleanSubject;",
  "  const mappedSubj = standardSubjectMap[cleanSubject] || cleanSubject;\n" + preschoolLogic
);

fs.writeFileSync('src/data/verifiedCurriculumList.ts', content);
