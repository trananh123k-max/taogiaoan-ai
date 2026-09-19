import re

with open('src/utils/docxExporter.ts', 'r') as f:
    content = f.read()

# Update buildStandardDocxElements signature
content = content.replace(
    'function buildStandardDocxElements(\n  plan: LessonPlanOutput,\n  slotMap: Map<string, ImageSlot>,\n  fontName: string,\n  primaryColor: string,\n  isHDTN: boolean,\n  isPreschool: boolean\n): (Paragraph | Table)[] {',
    'function buildStandardDocxElements(\n  plan: LessonPlanOutput,\n  slotMap: Map<string, ImageSlot>,\n  fontName: string,\n  primaryColor: string,\n  isHDTN: boolean,\n  isPreschool: boolean,\n  tableLayout: string\n): (Paragraph | Table)[] {'
)

# Update buildStandardDocxElements call in exportLessonPlanToDocx
content = content.replace(
    'buildStandardDocxElements(plan, slotMap, fontName, primaryColor, isHDTN, isPreschool)',
    'buildStandardDocxElements(plan, slotMap, fontName, primaryColor, isHDTN, isPreschool, tableLayout)'
)

with open('src/utils/docxExporter.ts', 'w') as f:
    f.write(content)

print("Patched buildStandardDocxElements.")
