const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const oldFunc = `const handleSaveBookToFirebase = async () => {
    setIsUploading(true);
    setUploadStatusMsg('AI đang quét trang Mục lục trong tệp PDF để trích xuất đầy đủ 100% tất cả các bài học...');

    const bookTitle = \`SGK \${newSubject} \${newGrade} \${newVolume !== "Cả năm / Không phân tập" ? newVolume : ""} - \${newBookSeries}\`;
    let extractedLessons: string[] = [];

    try {
      let pdfBase64 = '';
      if (selectedFile) {
        setUploadStatusMsg('Đang đọc tệp PDF và gửi tới Gemini AI để quét toàn bộ Mục lục...');
        pdfBase64 = await readFileAsBase64(selectedFile);
      }

      const res = await fetch('/api/extract-textbook-toc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          grade: newGrade,
          bookSeries: newBookSeries,
      volume: newVolume,
          fileName: selectedFile?.name || \`\${newSubject}_\${newGrade}.pdf\`,
          fileTextSnippet: \`Sách giáo khoa môn \${newSubject} \${newGrade} bộ sách \${newBookSeries}\`,
          pdfBase64: pdfBase64 || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
          extractedLessons = data.lessons;
        }
      }
    } catch (err) {
      console.warn('Could not extract TOC via AI, using standard curriculum lessons:', err);
    }

    // Safety net: Use official verified curriculum if extraction didn't yield all lessons
    if (extractedLessons.length <= 4) {
      const verified = getVerifiedLessons(newSubject, newGrade);
      if (verified && verified.lessons.length > extractedLessons.length) {
        extractedLessons = verified.lessons;
      }
    }

    // Default fallback if unknown custom subject
    if (extractedLessons.length === 0) {
      extractedLessons = [
        \`Bài 1: Khởi động & Tổng quan \${newSubject} \${newGrade}\`,
        \`Bài 2: Kiến thức trọng tâm & Kỹ năng số\`,
        \`Bài 3: Thực hành và Ứng dụng thực tiễn\`,
        \`Bài 4: Ôn tập và Đánh giá năng lực\`,
      ];
    }

    const newBook: CustomUploadedBook = {
      id: \`sgk_\${newSubject}_\${newGrade}_\${Date.now()}\`.replace(/\\s+/g, '_').toLowerCase(),
      title: bookTitle,
      subject: newSubject,
      grade: newGrade,
      bookSeries: newBookSeries,
      volume: newVolume,
      fileName: selectedFile?.name || \`\${newSubject}_\${newGrade}.pdf\`,
      fileSize: selectedFile ? \`\${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB\` : '2.1 MB',
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      summary: \`Sách giáo khoa \${newSubject} \${newGrade} (\${newBookSeries}) gồm \${extractedLessons.length} bài học.\`,
      lessons: extractedLessons,
    };

    setUploadStatusMsg('Đang lưu vĩnh viễn vào kho Firestore dùng chung...');
    await saveTextbookToFirestore(newBook);

    const updatedBooks = [newBook, ...myUploadedBooks.filter((b) => !(b.subject === newSubject && b.grade === newGrade))];
    setMyUploadedBooks(updatedBooks);
    if (onBooksUpdated) onBooksUpdated(updatedBooks);

    setIsUploading(false);
    setUploadSuccess(true);
    setUploadStatusMsg(\`✅ Đã lưu sách thành công và trích xuất \${extractedLessons.length} bài học!\`);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadStatusMsg('');
      setSelectedTab('book_list');
    }, 3000);
  };`;

const newFunc = `const handleSaveBookToFirebase = async () => {
    setIsUploading(true);
    const filesToProcess = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);
    let newBooks = [];
    
    for (const file of filesToProcess) {
      setUploadStatusMsg(\`Đang xử lý tệp: \${file.name}...\`);
      let extractedLessons: string[] = [];
      let detectedGrade = newGrade;
      let detectedSubject = newSubject;
      let detectedVolume = newVolume;

      try {
        setUploadStatusMsg(\`Đang đọc tệp PDF \${file.name} và gửi tới Gemini AI để nhận diện khối lớp, môn học, tập sách và quét Mục lục...\`);
        const pdfBase64 = await readFileAsBase64(file);

        const res = await fetch('/api/extract-textbook-toc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: newSubject,
            grade: newGrade,
            bookSeries: newBookSeries,
            volume: newVolume,
            fileName: file.name,
            fileTextSnippet: \`Sách giáo khoa môn \${newSubject} \${newGrade} bộ sách \${newBookSeries}\`,
            pdfBase64: pdfBase64 || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
            extractedLessons = data.lessons;
          }
          if (data.detectedGrade && data.detectedGrade !== "Nhiều khối lớp (Tự động nhận diện)") detectedGrade = data.detectedGrade;
          if (data.detectedSubject) detectedSubject = data.detectedSubject;
          if (data.detectedVolume) detectedVolume = data.detectedVolume;
        }
      } catch (err) {
        console.warn('Could not extract TOC via AI for', file.name, err);
      }

      if (extractedLessons.length <= 4) {
        const verified = getVerifiedLessons(detectedSubject, detectedGrade);
        if (verified && verified.lessons.length > extractedLessons.length) {
          extractedLessons = verified.lessons;
        }
      }

      if (extractedLessons.length === 0) {
        extractedLessons = [
          \`Bài 1: Khởi động & Tổng quan \${detectedSubject} \${detectedGrade}\`,
          \`Bài 2: Kiến thức trọng tâm & Kỹ năng số\`,
          \`Bài 3: Thực hành và Ứng dụng thực tiễn\`,
          \`Bài 4: Ôn tập và Đánh giá năng lực\`,
        ];
      }

      const bookTitle = \`SGK \${detectedSubject} \${detectedGrade} \${detectedVolume !== "Cả năm / Không phân tập" ? detectedVolume : ""} - \${newBookSeries}\`;

      const newBook: CustomUploadedBook = {
        id: \`sgk_\${detectedSubject}_\${detectedGrade}_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`.replace(/\\s+/g, '_').toLowerCase(),
        title: bookTitle,
        subject: detectedSubject,
        grade: detectedGrade,
        bookSeries: newBookSeries,
        volume: detectedVolume,
        fileName: file.name,
        fileSize: \`\${(file.size / (1024 * 1024)).toFixed(2)} MB\`,
        uploadedAt: new Date().toLocaleDateString('vi-VN'),
        summary: \`Sách giáo khoa \${detectedSubject} \${detectedGrade} (\${newBookSeries}) gồm \${extractedLessons.length} bài học.\`,
        lessons: extractedLessons,
      };

      setUploadStatusMsg(\`Đang lưu \${file.name} vào kho Firestore...\`);
      await saveTextbookToFirestore(newBook);
      newBooks.push(newBook);
    }

    if (newBooks.length > 0) {
      let updatedBooks = [...newBooks, ...myUploadedBooks];
      // Keep only unique
      const uniqueIds = new Set();
      updatedBooks = updatedBooks.filter(b => {
         const dup = uniqueIds.has(b.id);
         uniqueIds.add(b.id);
         return !dup;
      });
      setMyUploadedBooks(updatedBooks);
      if (onBooksUpdated) onBooksUpdated(updatedBooks);
    }

    setIsUploading(false);
    setUploadSuccess(true);
    setUploadStatusMsg(\`✅ Đã lưu thành công \${newBooks.length} cuốn sách!\`);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadStatusMsg('');
      setSelectedTab('book_list');
    }, 3000);
  };`;

// replace with regex to ignore slight variations
let startIndex = code.indexOf('const handleSaveBookToFirebase = async () => {');
let endIndex = code.indexOf('};', code.indexOf('setTimeout(() => {', startIndex)) + 2;
if (startIndex > -1 && endIndex > -1) {
    code = code.substring(0, startIndex) + newFunc + code.substring(endIndex);
    fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
    console.log('Fixed modal multi part 2');
} else {
    console.log('Could not find replace bounds');
}
