const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const ppctState = `
  const [myUploadedPPCTs, setMyUploadedPPCTs] = useState<CustomUploadedPPCT[]>(() => {
    try {
      const saved = localStorage.getItem('khbd_my_firebase_ppct');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
`;
code = code.replace('// User Accounts Managed in Firestore', ppctState + '\n  // User Accounts Managed in Firestore');

const ppctLoad = `
      loadPPCTFromFirestore().then((ppcts) => {
        if (ppcts && ppcts.length > 0) {
          setMyUploadedPPCTs(ppcts);
        }
      });
`;
code = code.replace('loadTextbooksFromFirestore().then((books) => {', ppctLoad + '\n      loadTextbooksFromFirestore().then((books) => {');

const ppctUploadFunction = `
  const handleSavePPCTToFirebase = async () => {
    setIsUploading(true);
    setUploadStatusMsg('AI đang phân tích tệp Phân phối chương trình (PPCT)...');

    try {
      let fileBase64 = '';
      if (selectedFile) {
        fileBase64 = await readFileAsBase64(selectedFile);
      }

      const res = await fetch('/api/extract-ppct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          grade: newGrade,
          fileName: selectedFile?.name || '',
          fileBase64: fileBase64,
          mimeType: selectedFile?.type || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.lessonConfigs && data.lessonConfigs.length > 0) {
          const newPPCT: CustomUploadedPPCT = {
            id: \`ppct_\${newSubject}_\${newGrade}_\${Date.now()}\`.replace(/\\s+/g, '_').toLowerCase(),
            title: \`PPCT \${newSubject} \${newGrade}\`,
            subject: newSubject,
            grade: newGrade,
            fileName: selectedFile?.name || \`ppct_\${newSubject}_\${newGrade}\`,
            fileSize: selectedFile ? \`\${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB\` : 'Unknown',
            uploadedAt: new Date().toLocaleDateString('vi-VN'),
            summary: \`PPCT gồm \${data.lessonConfigs.length} bài học có cấu trúc phân bổ tiết.\`,
            lessonConfigs: data.lessonConfigs,
          };

          setUploadStatusMsg('Đang lưu PPCT vào Firestore...');
          await savePPCTToFirestore(newPPCT);

          const updatedPPCTs = [newPPCT, ...myUploadedPPCTs.filter((p) => !(p.subject === newSubject && p.grade === newGrade))];
          setMyUploadedPPCTs(updatedPPCTs);
          
          setIsUploading(false);
          setUploadSuccess(true);
          setUploadStatusMsg(\`✅ Đã lưu PPCT thành công và trích xuất \${data.lessonConfigs.length} cấu trúc bài học!\`);

          setTimeout(() => {
            setUploadSuccess(false);
            setUploadStatusMsg('');
            setSelectedTab('ppct_list');
          }, 3000);
          return;
        }
      }
      throw new Error('Could not extract PPCT data from file');
    } catch (err: any) {
      console.error(err);
      setUploadStatusMsg('❌ Lỗi khi phân tích PPCT: ' + err.message);
      setIsUploading(false);
    }
  };

  const handleDeletePPCT = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa PPCT này khỏi kho chung?')) {
      await deletePPCTFromFirestore(id);
      const updated = myUploadedPPCTs.filter(p => p.id !== id);
      setMyUploadedPPCTs(updated);
    }
  };
`;
code = code.replace('const handleSaveBookToFirebase = async () => {', ppctUploadFunction + '\n  const handleSaveBookToFirebase = async () => {');

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
