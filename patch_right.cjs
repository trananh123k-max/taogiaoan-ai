const fs = require('fs');
const path = 'src/components/RightResultEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<PedagogicalTable([\s\S]*?)\/>/g,
  (match, inner) => {
    if (!inner.includes('isPreschool')) {
      return `<PedagogicalTable${inner}\n                  isPreschool={plan.schoolLevel === 'Mầm non'}\n                />`;
    }
    return match;
  }
);
fs.writeFileSync(path, content, 'utf8');
