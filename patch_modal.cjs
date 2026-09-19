const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

// Add state for delete confirmation
if (!code.includes('deleteConfirmDialog')) {
  code = code.replace(
    /const \[isUploading, setIsUploading\] = useState\(false\);/,
    `const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ id: string, type: 'book' | 'ppct' | 'user', title: string } | null>(null);`
  );
}

// Update handleDeleteBook
code = code.replace(
  /const handleDeleteBook = async \(id: string\) => \{[\s\S]*?if \(confirm\('Thầy\/Cô có chắc chắn muốn xóa bộ sách này khỏi kho lưu trữ Firebase\?'\)\) \{[\s\S]*?const success = await deleteTextbookFromFirestore\(id\);[\s\S]*?if \(success\) \{[\s\S]*?const updated = myUploadedBooks\.filter\(\(b\) => b\.id !== id\);[\s\S]*?setMyUploadedBooks\(updated\);[\s\S]*?if \(onBooksUpdated\) onBooksUpdated\(updated\);[\s\S]*?\} else \{[\s\S]*?alert\('Có lỗi xảy ra, không thể xóa sách\.'\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/,
  `const handleDeleteBook = async (id: string, name: string = '') => {
    setDeleteConfirmDialog({ id, type: 'book', title: name || 'bộ sách này' });
  };`
);

code = code.replace(
  /onClick=\{\(\) => handleDeleteBook\(b\.id\)\}/g,
  `onClick={() => handleDeleteBook(b.id, b.title)}`
);

// Update handleDeletePPCT
code = code.replace(
  /const handleDeletePPCT = async \(id: string\) => \{[\s\S]*?if \(confirm\('Bạn có chắc chắn muốn xóa PPCT này khỏi kho chung\?'\)\) \{[\s\S]*?const success = await deletePPCTFromFirestore\(id\);[\s\S]*?if \(success\) \{[\s\S]*?setMyUploadedPPCTs\(\(prev\) => prev\.filter\(\(p\) => p\.id !== id\)\);[\s\S]*?\} else \{[\s\S]*?alert\('Có lỗi xảy ra, không thể xóa file\.'\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/,
  `const handleDeletePPCT = async (id: string, name: string = '') => {
    setDeleteConfirmDialog({ id, type: 'ppct', title: name || 'PPCT này' });
  };`
);
code = code.replace(
  /onClick=\{\(\) => handleDeletePPCT\(p\.id\)\}/g,
  `onClick={() => handleDeletePPCT(p.id, p.title)}`
);

// Update handleDeleteUser
code = code.replace(
  /const handleDeleteUser = async \(id: string, name: string\) => \{[\s\S]*?if \(confirm\(\`Bạn có chắc muốn xóa tài khoản của "\$\{name\}" khỏi hệ thống Firebase\?\`\)\) \{[\s\S]*?const success = await deleteUserAccountFromFirestore\(id\);[\s\S]*?if \(success\) \{[\s\S]*?setUserAccounts\(\(prev\) => prev\.filter\(\(u\) => u\.id !== id\)\);[\s\S]*?\} else \{[\s\S]*?alert\('Có lỗi xảy ra, không thể xóa tài khoản\.'\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\};/,
  `const handleDeleteUser = async (id: string, name: string) => {
    setDeleteConfirmDialog({ id, type: 'user', title: \`tài khoản của "\${name}"\` });
  };`
);

// We need to add the actual delete execution function
code = code.replace(
  /const handleOpenCreateUserModal = \(\) => \{/,
  `const executeDelete = async () => {
    if (!deleteConfirmDialog) return;
    const { id, type } = deleteConfirmDialog;
    
    if (type === 'book') {
      const success = await deleteTextbookFromFirestore(id);
      if (success) {
        const updated = myUploadedBooks.filter((b) => b.id !== id);
        setMyUploadedBooks(updated);
        if (onBooksUpdated) onBooksUpdated(updated);
      }
    } else if (type === 'ppct') {
      const success = await deletePPCTFromFirestore(id);
      if (success) {
        setMyUploadedPPCTs((prev) => prev.filter((p) => p.id !== id));
      }
    } else if (type === 'user') {
      const success = await deleteUserAccountFromFirestore(id);
      if (success) {
        setUserAccounts((prev) => prev.filter((u) => u.id !== id));
      }
    }
    setDeleteConfirmDialog(null);
  };

  const handleOpenCreateUserModal = () => {`
);

// Render the confirm dialog at the very end of the modal
code = code.replace(
  /        \{isUploading && \([\s\S]*?\{uploadStatusMsg\}[\s\S]*?<\/div>[\s\S]*?\)\]/g,
  `        {isUploading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[60] flex flex-col items-center justify-center rounded-2xl">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-800 animate-pulse">
              {uploadStatusMsg}
            </p>
          </div>
        )}

        {/* Custom Confirm Dialog */}
        {deleteConfirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
              <div className="p-5">
                <div className="flex items-center gap-3 text-rose-600 mb-3">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-slate-900">Xác nhận xóa</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Thầy/Cô có chắc chắn muốn xóa <span className="font-semibold text-slate-800">{deleteConfirmDialog.title}</span> khỏi hệ thống Firebase không? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmDialog(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-2xs flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        )}`
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Patched modal successfully');
