import re

with open('src/utils/docxExporter.ts', 'r') as f:
    content = f.read()

# 1. Update exportLessonPlanToDocx signature
content = content.replace(
    'export async function exportLessonPlanToDocx(\n  plan: LessonPlanOutput,\n  imageSlots: ImageSlot[] = []\n): Promise<boolean> {',
    'export async function exportLessonPlanToDocx(\n  plan: LessonPlanOutput,\n  imageSlots: ImageSlot[] = [],\n  tableLayout: string = \'two_column\'\n): Promise<boolean> {'
)

# 2. Update buildActivitiesSection call in exportLessonPlanToDocx
content = content.replace(
    '...buildActivitiesSection(plan.activities, slotMap, fontName, plan.periods, isPreschool),',
    '...buildActivitiesSection(plan.activities, slotMap, fontName, plan.periods, isPreschool, tableLayout),'
)

# 3. Update buildActivitiesSection signature
content = content.replace(
    'function buildActivitiesSection(\n  activities: LessonPlanOutput[\'activities\'],\n  slotMap: Map<string, ImageSlot>,\n  fontName: string,\n  periods?: number,\n  isPreschool: boolean = false\n): (Paragraph | Table)[] {',
    'function buildActivitiesSection(\n  activities: LessonPlanOutput[\'activities\'],\n  slotMap: Map<string, ImageSlot>,\n  fontName: string,\n  periods?: number,\n  isPreschool: boolean = false,\n  tableLayout: string = \'two_column\'\n): (Paragraph | Table)[] {'
)

with open('src/utils/docxExporter.ts', 'w') as f:
    f.write(content)

print("Updated docx signatures.")
