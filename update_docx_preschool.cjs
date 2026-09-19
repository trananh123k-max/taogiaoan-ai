const fs = require('fs');

let code = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const oldStr = `  // I. Mục đích - yêu cầu
  elements.push(createSectionHeading('I. Mục đích - yêu cầu', fontName, primaryColor));
  
  elements.push(createSubHeading('1. Kiến thức:', fontName));
  plan.objectives.knowledge.forEach(k => elements.push(createDashListItem(k, fontName)));

  elements.push(createSubHeading('2. Kỹ năng:', fontName));
  plan.objectives.generalCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));
  plan.objectives.subjectCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));

  elements.push(createSubHeading('3. Phẩm chất:', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createDashListItem(q, fontName)));

  // If there are NLS, AI or STEM competencies, map them as "4. Năng lực:" or "5. Tích hợp:"
  let hasNangLuc = false;
  if (plan.objectives.digitalCompetencies?.length || plan.objectives.aiCompetencies?.length || plan.objectives.stemCompetencies?.length) {
    elements.push(createSubHeading('4. Năng lực:', fontName));
    hasNangLuc = true;
    (plan.objectives.digitalCompetencies || []).forEach(c => elements.push(createDashListItem(c, fontName)));
    (plan.objectives.aiCompetencies || []).forEach(c => elements.push(createDashListItem(c, fontName)));
    (plan.objectives.stemCompetencies || []).forEach(c => elements.push(createDashListItem(c, fontName)));
  }

  // II. Chuẩn bị
  elements.push(createSectionHeading('II. Chuẩn bị', fontName, primaryColor));
  elements.push(createSubHeading('1. Chuẩn bị của cô', fontName));
  plan.equipment.teacher.forEach(e => elements.push(createDashListItem(e, fontName)));
  
  elements.push(createSubHeading('2. Chuẩn bị của trẻ', fontName));
  plan.equipment.student.forEach(e => elements.push(createDashListItem(e, fontName)));`;

const newStr = `  // I. Mục đích - yêu cầu
  elements.push(createSectionHeading('I. Mục đích - yêu cầu', fontName, primaryColor));
  
  elements.push(createSubHeading('1. Kiến thức:', fontName));
  plan.objectives.knowledge.forEach(k => elements.push(createDashListItem(k, fontName)));

  elements.push(createSubHeading('2. Kỹ năng:', fontName));
  plan.objectives.subjectCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));

  elements.push(createSubHeading('3. Phẩm chất:', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createDashListItem(q, fontName)));

  elements.push(createSubHeading('4. Năng lực:', fontName));
  plan.objectives.generalCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));

  // Tích hợp
  if (plan.objectives.digitalCompetencies?.length || plan.objectives.aiCompetencies?.length || plan.objectives.stemCompetencies?.length) {
    elements.push(createSubHeading('5. Tích hợp:', fontName));
    (plan.objectives.digitalCompetencies || []).forEach(c => elements.push(createDashListItem(c, fontName)));
    (plan.objectives.aiCompetencies || []).forEach(c => elements.push(createDashListItem(c, fontName)));
    (plan.objectives.stemCompetencies || []).forEach(c => elements.push(createDashListItem(c, fontName)));
  }

  // II. Chuẩn bị
  elements.push(createSectionHeading('II. Chuẩn bị', fontName, primaryColor));
  elements.push(createSubHeading('1. Chuẩn bị của cô', fontName));
  plan.equipment.teacher.forEach(e => elements.push(createDashListItem(e, fontName)));
  
  elements.push(createSubHeading('2. Chuẩn bị của trẻ', fontName));
  plan.equipment.student.forEach(e => elements.push(createDashListItem(e, fontName)));`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/utils/docxExporter.ts', code);
