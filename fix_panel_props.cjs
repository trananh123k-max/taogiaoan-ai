const fs = require('fs');
let code = fs.readFileSync('src/components/LeftConfigPanel.tsx', 'utf8');

code = code.replace(
  "uploadedBooks?: CustomUploadedBook[];",
  "uploadedBooks?: CustomUploadedBook[];\n  uploadedPPCTs?: any[];"
);

code = code.replace(
  "uploadedBooks = [],\n  userRole = 'admin',",
  "uploadedBooks = [],\n  uploadedPPCTs = [],\n  userRole = 'admin',"
);

code = code.replace(
  "const [isCustomLessonInput, setIsCustomLessonInput] = useState(false);",
  "const [isCustomLessonInput, setIsCustomLessonInput] = useState(false);\n  const [usePPCT, setUsePPCT] = useState(true);"
);

fs.writeFileSync('src/components/LeftConfigPanel.tsx', code);
console.log('Fixed LeftConfigPanelProps!');
