import re

with open('src/utils/docxExporter.ts', 'r') as f:
    content = f.read()

# Replace the block from `// Goal, Content, Product info` to `elements.push(activityTable);`
target_regex = re.compile(r"    // Goal, Content, Product info.*?(?:elements\.push\(activityTable\);)", re.DOTALL)

replacement = """    if (tableLayout === 'math_4_column') {
      const activityTable = createMath4ColumnPedagogicalTable(act, slotMap, fontName);
      elements.push(activityTable);
    } else {
      // Goal, Content, Product info
      if (!isPreschool) {
        elements.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({ text: 'a) Mục tiêu: ', bold: true, font: fontName }),
              new TextRun({ text: act.objective, font: fontName }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({ text: 'b) Nội dung: ', bold: true, font: fontName }),
              new TextRun({ text: act.content, font: fontName }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({ text: 'c) Sản phẩm: ', bold: true, font: fontName }),
              new TextRun({ text: act.productSummary, font: fontName }),
            ],
          }),
          new Paragraph({
            spacing: { before: 20, after: 30 },
            keepNext: true,
            children: [
              new TextRun({ text: 'd) Tổ chức thực hiện:', bold: true, font: fontName }),
            ],
          })
        );
      }
      
      const activityTable = createTwoColumnPedagogicalTable(act, slotMap, fontName, isPreschool);
      elements.push(activityTable);
    }"""

content = target_regex.sub(replacement, content)

with open('src/utils/docxExporter.ts', 'w') as f:
    f.write(content)
print("Updated buildActivitiesSection.")
