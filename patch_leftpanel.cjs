const fs = require('fs');
let code = fs.readFileSync('src/components/LeftConfigPanel.tsx', 'utf-8');

code = code.replace(
  "import {",
  "import {\n  TIEU_HOC_SUBJECTS_LIST,\n  THCS_SUBJECTS_LIST,\n  THPT_SUBJECTS_LIST,"
);

code = code.replace(
  "{(config.schoolLevel === 'Mầm non' ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST).map((subj) => (",
  "{(config.schoolLevel === 'Mầm non' ? MAM_NON_SUBJECTS_LIST : config.schoolLevel === 'Tiểu học' ? TIEU_HOC_SUBJECTS_LIST : config.schoolLevel === 'THCS' ? THCS_SUBJECTS_LIST : THPT_SUBJECTS_LIST).map((subj) => ("
);

code = code.replace(
  "if (!SUBJECTS_LIST.includes(newSubject || '')) {",
  "const activeList = newLevel === 'Tiểu học' ? TIEU_HOC_SUBJECTS_LIST : newLevel === 'THCS' ? THCS_SUBJECTS_LIST : THPT_SUBJECTS_LIST;\n                  if (!activeList.includes(newSubject || '')) {\n                    newSubject = activeList[0];\n                  }\n                  if (false) {"
);

fs.writeFileSync('src/components/LeftConfigPanel.tsx', code);
