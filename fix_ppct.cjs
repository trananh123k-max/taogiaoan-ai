const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

code = code.replace(
  "{['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12'].map(g => (",
  "{['Nhiều khối lớp (Tự động nhận diện)','Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12'].map(g => ("
);

// update handleSavePPCTToFirebase to handle array of results
code = code.replace(
  "if (data.success && data.lessonConfigs && data.lessonConfigs.length > 0) {",
  `if (data.success && data.results && data.results.length > 0) {
          setUploadStatusMsg('Đang lưu PPCT vào Firestore...');
          let newPPCTs = [];
          for (const resItem of data.results) {
            const detectedGrade = resItem.grade || newGrade;
            const newPPCT = {
              id: \`ppct_\${newSubject}_\${detectedGrade}_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`.replace(/\\s+/g, '_').toLowerCase(),
              title: \`PPCT \${newSubject} \${detectedGrade}\`,
              subject: newSubject,
              grade: detectedGrade,
              fileName: selectedFile?.name || \`ppct_\${newSubject}_\${detectedGrade}\`,
              fileSize: selectedFile ? \`\${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB\` : 'Unknown',
              uploadedAt: new Date().toLocaleDateString('vi-VN'),
              summary: \`PPCT gồm \${resItem.lessonConfigs.length} bài học có cấu trúc phân bổ tiết.\`,
              lessonConfigs: resItem.lessonConfigs,
            };
            await savePPCTToFirestore(newPPCT);
            newPPCTs.push(newPPCT);
          }
          const updatedPPCTs = [...newPPCTs, ...myUploadedPPCTs.filter((p) => !newPPCTs.find(n => n.subject === p.subject && n.grade === p.grade))];
          setMyUploadedPPCTs(updatedPPCTs);
          
          setIsUploading(false);
          setUploadSuccess(true);
          setUploadStatusMsg(\`✅ Đã lưu thành công \${newPPCTs.length} bản PPCT (tổng cộng \${data.results.reduce((acc, r) => acc + r.lessonConfigs.length, 0)} cấu trúc bài học)!\`);
          setTimeout(() => {
            setUploadSuccess(false);
            setUploadStatusMsg('');
            setSelectedTab('ppct_list');
          }, 3000);
          return;
        }
        if (data.success && data.lessonConfigs && data.lessonConfigs.length > 0) {`
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Fixed modal!');

let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  `const systemInstruction = \`Bạn là Trợ lý AI chuyên gia phân tích Phân phối chương trình (PPCT) giáo dục phổ thông.
Nhiệm vụ: Phân tích nội dung PPCT (Word, Excel) hoặc PDF (đính kèm) và trích xuất cấu trúc phân phối chương trình cho môn học và khối lớp được chỉ định.
QUY TẮC:
1. Lấy tất cả bài học trong PPCT.
2. Trích xuất chính xác "số tiết" (periods) tương ứng cho từng bài.
3. Trích xuất các yêu cầu tích hợp Năng lực số (integratedNLS) hoặc Trí tuệ nhân tạo (integratedAI) nếu có nhắc đến trong PPCT cho từng bài (nếu không có, để mảng rỗng).
4. Trả về đúng định dạng JSON:
{
  "lessonConfigs": [
    {
      "lessonTitle": "Tên bài học",
      "periods": 1,
      "integratedNLS": ["Danh sách các mã hoặc mô tả năng lực số"],
      "integratedAI": ["Danh sách các mã hoặc mô tả AI"]
    }
  ]
}\`;`,
  `const systemInstruction = \`Bạn là Trợ lý AI chuyên gia phân tích Phân phối chương trình (PPCT) giáo dục phổ thông.
Nhiệm vụ: Phân tích nội dung PPCT (Word, Excel) hoặc PDF (đính kèm). Nếu người dùng yêu cầu "Nhiều khối" hoặc file có nhiều sheet/trang chứa các khối lớp khác nhau, hãy tách riêng PPCT cho TỪNG KHỐI LỚP (Ví dụ: Lớp 6, Lớp 7, Lớp 8...).
QUY TẮC:
1. Lấy tất cả bài học trong PPCT.
2. Trích xuất chính xác "số tiết" (periods) tương ứng cho từng bài.
3. Trích xuất các yêu cầu tích hợp Năng lực số (integratedNLS) hoặc Trí tuệ nhân tạo (integratedAI) nếu có nhắc đến trong PPCT cho từng bài (nếu không có, để mảng rỗng).
4. BẮT BUỘC Trả về đúng định dạng JSON MỚI SAU ĐÂY:
{
  "results": [
    {
      "grade": "Lớp 6",
      "lessonConfigs": [
        {
          "lessonTitle": "Tên bài học",
          "periods": 1,
          "integratedNLS": [],
          "integratedAI": []
        }
      ]
    }
  ]
}
Chú ý: Nếu PPCT chỉ có 1 khối lớp, hãy vẫn trả về mảng "results" có 1 phần tử.\`;`
);

// We should also replace the JSON fallback response if the model fails
serverCode = serverCode.replace(
  `let parsed = JSON.parse(responseText);
      if (parsed.lessonConfigs) {
        res.json({ success: true, lessonConfigs: parsed.lessonConfigs });
        return;
      }`,
  `let parsed = JSON.parse(responseText);
      if (parsed.results || parsed.lessonConfigs) {
        res.json({ success: true, results: parsed.results || [{ grade: grade, lessonConfigs: parsed.lessonConfigs }], lessonConfigs: parsed.lessonConfigs });
        return;
      }`
);

fs.writeFileSync('server.ts', serverCode);
console.log('Fixed server!');

