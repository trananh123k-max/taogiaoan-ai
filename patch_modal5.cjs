const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.trim() === "const filteredUploadedPPCTs = myUploadedPPCTs.filter(");
const lastIdx = lines.findLastIndex(l => l.trim() === "const filteredUploadedPPCTs = myUploadedPPCTs.filter(");

if (startIdx !== lastIdx && lastIdx !== -1) {
  // delete from lastIdx to the next '  );'
  const endIdx = lines.indexOf('  );', lastIdx);
  if (endIdx !== -1) {
    lines.splice(lastIdx, endIdx - lastIdx + 1);
  }
}

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', lines.join('\n'));
