const fs = require('fs');
let content = fs.readFileSync('src/components/PedagogicalTable.tsx', 'utf8');

const replacement = `function formatDashBulletText(text: string): string {
  if (!text) return '';
  // Fix for squashed bullet points: insert newline before "- " if it follows a sentence end.
  let expandedText = text.replace(/([.?!;])\\s+(- )/g, '$1\\n$2');
  return expandedText
    .split('\\n')
    .map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return '';
      // Clean standalone unmapped image slot tags
      trimmed = trimmed.replace(/\\{\\{IMAGE_SLOT_\\d+\\}\\}/gi, '').replace(/\\{\\{IMAGESLOT\\d*\\}\\}/gi, '').replace(/\\[\\s*Vị trí ảnh[^\\]]*\\]/gi, '').trim();
      if (!trimmed || trimmed === '-' || trimmed === '•' || trimmed === '*') return '';
      // If starts with • or * or ., convert to -
      if (/^[•*]\\s*/.test(trimmed)) {
        return '- ' + trimmed.replace(/^[•*]\\s*/, '');
      }
      return trimmed;
    })`;

content = content.replace(/function formatDashBulletText\(text: string\): string \{\n  if \(\!text\) return '';\n  return text\n    \.split\('\\n'\)\n    \.map\(\(line\) => \{[\s\S]*?return trimmed;\n    \}\)/, replacement);

fs.writeFileSync('src/components/PedagogicalTable.tsx', content);
