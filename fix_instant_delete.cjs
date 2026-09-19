const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

// 1. Rewrite handleDeleteBook
code = code.replace(
  /const handleDeleteBook = async \(id: string, name: string = ''\) => \{[\s\S]*?setDeleteConfirmDialog\(\{ id, type: 'book', title: name \|\| 'bộ sách này' \}\);[\s\S]*?\};/,
  `const handleDeleteBook = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa sách...');
    const success = await deleteTextbookFromFirestore(id);
    if (success) {
      const updated = myUploadedBooks.filter((b) => b.id !== id);
      setMyUploadedBooks(updated);
      if (onBooksUpdated) onBooksUpdated(updated);
    }
    setIsUploading(false);
  };`
);

// We should also replace the previous original handleDeleteBook if it exists
code = code.replace(
  /const handleDeleteBook = async \(id: string\) => \{[\s\S]*?if \(confirm\('Thầy\/Cô có chắc chắn muốn xóa bộ sách này khỏi kho lưu trữ Firebase\?'\)\) \{[\s\S]*?const success = await deleteTextbookFromFirestore\(id\);[\s\S]*?if \(success\) \{[\s\S]*?const updated = myUploadedBooks\.filter\(\(b\) => b\.id !== id\);[\s\S]*?setMyUploadedBooks\(updated\);[\s\S]*?if \(onBooksUpdated\) onBooksUpdated\(updated\);[\s\S]*?\} else \{[\s\S]*?alert\('Có lỗi xảy ra, không thể xóa sách\.'\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/,
  `const handleDeleteBook = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa sách...');
    const success = await deleteTextbookFromFirestore(id);
    if (success) {
      const updated = myUploadedBooks.filter((b) => b.id !== id);
      setMyUploadedBooks(updated);
      if (onBooksUpdated) onBooksUpdated(updated);
    }
    setIsUploading(false);
  };`
);


// 2. Rewrite handleDeletePPCT
code = code.replace(
  /const handleDeletePPCT = async \(id: string\) => \{[\s\S]*?if \(confirm\('Bạn có chắc chắn muốn xóa PPCT này khỏi kho chung\?'\)\) \{[\s\S]*?const success = await deletePPCTFromFirestore\(id\);[\s\S]*?if \(success\) \{[\s\S]*?const updated = myUploadedPPCTs\.filter\(p => p\.id !== id\);[\s\S]*?setMyUploadedPPCTs\(updated\);[\s\S]*?\} else \{[\s\S]*?alert\('Có lỗi xảy ra, không thể xóa file\.'\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/,
  `const handleDeletePPCT = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa PPCT...');
    const success = await deletePPCTFromFirestore(id);
    if (success) {
      const updated = myUploadedPPCTs.filter(p => p.id !== id);
      setMyUploadedPPCTs(updated);
    }
    setIsUploading(false);
  };`
);

// 3. Rewrite handleDeleteUserAccount
code = code.replace(
  /const handleDeleteUserAccount = async \(id: string, name: string\) => \{[\s\S]*?if \(confirm\(\`Bạn có chắc muốn xóa tài khoản của "\$\{name\}" khỏi hệ thống Firebase\?\`\)\) \{[\s\S]*?const success = await deleteUserAccountFromFirestore\(id\);[\s\S]*?if \(success\) \{[\s\S]*?setUserAccounts\(\(prev\) => prev\.filter\(\(a\) => a\.id !== id\)\);[\s\S]*?\} else \{[\s\S]*?alert\('Có lỗi xảy ra, không thể xóa tài khoản\.'\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/,
  `const handleDeleteUserAccount = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa tài khoản...');
    const success = await deleteUserAccountFromFirestore(id);
    if (success) {
      setUserAccounts((prev) => prev.filter((a) => a.id !== id));
    }
    setIsUploading(false);
  };`
);

// Remove executeDelete
code = code.replace(/const executeDelete = async \(\) => \{[\s\S]*?setDeleteConfirmDialog\(null\);\s*\};\s*/, '');

// Remove deleteConfirmDialog state
code = code.replace(/const \[deleteConfirmDialog, setDeleteConfirmDialog\] = useState[^\;]+\;\s*/, '');

// Remove deleteConfirmDialog rendering
code = code.replace(/\{\/\* Custom Confirm Dialog \*\/\}[\s\S]*?\{\deleteConfirmDialog && \([\s\S]*?<\/div>[\s\S]*?\)\]/g, '');
code = code.replace(/\{\/\* Custom Confirm Dialog \*\/\}[\s\S]*?\{\deleteConfirmDialog && \([\s\S]*?\s*<\/div>\s*\)\s*\}/, '');

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Made delete instant and removed confirm dialog');
