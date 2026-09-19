const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

code = code.replace(
  "onBooksUpdated?: (books: CustomUploadedBook[]) => void;",
  "onBooksUpdated?: (books: CustomUploadedBook[]) => void;\n  onPPCTUpdated?: (ppcts: any[]) => void;"
);

code = code.replace(
  "onBooksUpdated,\n  userRole = 'admin',",
  "onBooksUpdated,\n  onPPCTUpdated,\n  userRole = 'admin',"
);

code = code.replace(
  "setMyUploadedPPCTs(updatedPPCTs);",
  "setMyUploadedPPCTs(updatedPPCTs);\n          if (onPPCTUpdated) onPPCTUpdated(updatedPPCTs);"
);

code = code.replace(
  "setMyUploadedPPCTs(updated);\n      localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(updated));",
  "setMyUploadedPPCTs(updated);\n      localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(updated));\n      if (onPPCTUpdated) onPPCTUpdated(updated);"
);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Fixed FirebaseStorageModal.tsx!');
