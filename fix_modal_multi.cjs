const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

// Replace handleFileUpload
code = code.replace(
  `const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };`,
  `const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFile(files[0]);
      setSelectedFiles(files);
    }
  };`
);

// Add multiple attribute to inputs
code = code.replace(
  `<input
                    type="file"
                    accept=".pdf,.doc,.docx"`,
  `<input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"`
);

// Update selected file UI
code = code.replace(
  `{selectedFile ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <p className="font-semibold text-green-800">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  )`,
  `{selectedFiles.length > 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <p className="font-semibold text-green-800">Đã chọn {selectedFiles.length} tệp</p>
                      {selectedFiles.map((f, i) => (
                        <p key={i} className="text-xs text-green-700 mt-1">{f.name} - {(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                      ))}
                    </div>
                  )`
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Fixed modal multi part 1');
