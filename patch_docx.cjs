const fs = require('fs');
let content = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const replacement = `function formatContentString(text: string): string[] {
  if (!text) return [];
  // Fix for squashed bullet points: insert newline before "- " or "* " if it follows a sentence end.
  let expandedText = text.replace(/([.?!;])\\s+([-*•]\\s)/g, '$1\\n$2');
  return expandedText.split('\\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/^[•*]\\s*/.test(trimmed)) {
      return '- ' + trimmed.replace(/^[•*]\\s*/, '');
    }
    return line;
  });
}`;

content = content.replace(/function formatContentString\(text: string\): string\[\] \{\n  if \(\!text\) return \[\];\n  return text\.split\('\\n'\)\.map\(line => \{[\s\S]*?return line;\n  \}\);\n\}/, replacement);

fs.writeFileSync('src/utils/docxExporter.ts', content);
