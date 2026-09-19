const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const regex1 = /                    \['Nhiều/g;

content = content.replace(regex1, "                    {['Nhiều");

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
