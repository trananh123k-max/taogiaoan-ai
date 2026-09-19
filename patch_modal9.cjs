const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

content = content.replace(/\{\{\['Nhiều/g, "{['Nhiều");

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
