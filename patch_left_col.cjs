const fs = require('fs');
const path = 'src/utils/docxExporter.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Step Heading\s*paragraphs\.push\(\s*new Paragraph\(\{\s*spacing: \{ before: isSubsequentStep \? 60 : 20, after: 15 \},\s*children: \[\s*new TextRun\(\{\s*text: stepTitle,[\s\S]*?\}\)\s*\);\s*if \(\!isPreschool && stepTitle\) \{/;

// Wait, let's just replace from // Step Heading to the next logical block.
const findStr = `  // Step Heading
  paragraphs.push(
    new Paragraph({
      spacing: { before: isSubsequentStep ? 60 : 20, after: 15 },
      children: [
        new TextRun({
          text: stepTitle,
          bold: true,
          size: 28,
          font: fontName,
        }),
      ],
    })
  );`;

content = content.replace(findStr, `  // Step Heading
  if (!isPreschool) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: isSubsequentStep ? 60 : 20, after: 15 },
        children: [
          new TextRun({
            text: stepTitle,
            bold: true,
            size: 28,
            font: fontName,
          }),
        ],
      })
    );
  }`);

// Also fix the failed if (stepTitle) { ... } replacement because I used the wrong text in patch_docx_preschool.cjs.
// Let's find: `if (!isPreschool && stepTitle) { ... }` that was wrongly inserted.
const wrongStr = `if (!isPreschool && stepTitle) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: isSubsequentStep ? 240 : 0, after: 120 },
        children: [
          new TextRun({
            text: step.title || stepTitle,
            bold: true,
            size: 28,
            font: fontName,
          }),
        ],
      })
    );
  }`;
content = content.replace(wrongStr, `if (!isPreschool && step.title) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: isSubsequentStep ? 240 : 0, after: 120 },
        children: [
          new TextRun({
            text: step.title,
            bold: true,
            size: 28,
            font: fontName,
          }),
        ],
      })
    );
  }`);

// Let's actually check how step.title is handled. In docxExporter.ts, step.title might not have been pushed previously.
fs.writeFileSync(path, content, 'utf8');
