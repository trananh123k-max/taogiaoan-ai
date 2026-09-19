const fs = require('fs');

const path = 'src/utils/docxExporter.ts';
let code = fs.readFileSync(path, 'utf-8');

// I'm going to just revert to the original code by pulling from git or if not possible, I'll fix the syntax errors manually.
// The issue is:
/*
        children: isPreschool 
          ? buildPreschoolDocxElements(plan, slotMap, fontName, primaryColor)
          : buildStandardDocxElements(plan, slotMap, fontName, primaryColor, isHDTN)
        ],
      },
    ],
  });
*/
// Let's fix the syntax error directly in the string.
code = code.replace(
  `        children: isPreschool \n          ? buildPreschoolDocxElements(plan, slotMap, fontName, primaryColor)\n          : buildStandardDocxElements(plan, slotMap, fontName, primaryColor, isHDTN)\n        ],\n      },\n    ],\n  });`,
  `        children: isPreschool \n          ? buildPreschoolDocxElements(plan, slotMap, fontName, primaryColor)\n          : buildStandardDocxElements(plan, slotMap, fontName, primaryColor, isHDTN)\n      },\n    ],\n  });`
);
fs.writeFileSync(path, code);
