const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

code = code.replace(
  `subject: newSubject,
          grade: newGrade,
          bookSeries: newBookSeries,
          fileName: selectedFile?.name || \`\${newSubject}_\${newGrade}.pdf\`,`,
  `subject: newSubject,
          grade: newGrade,
          bookSeries: newBookSeries,
          volume: newVolume,
          fileName: selectedFile?.name || \`\${newSubject}_\${newGrade}.pdf\`,`
);

code = code.replace(
  `bookSeries: book.bookSeries,
          fileName: book.fileName,
          fileTextSnippet: \`Sách giáo khoa môn \${book.subject} \${book.grade} bộ sách \${book.bookSeries}\`,`,
  `bookSeries: book.bookSeries,
          volume: (book as any).volume || 'Cả năm / Không phân tập',
          fileName: book.fileName,
          fileTextSnippet: \`Sách giáo khoa môn \${book.subject} \${book.grade} bộ sách \${book.bookSeries}\`,`
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Fixed modal fetch for extract-textbook-toc');
