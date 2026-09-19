const fs = require('fs');
let code = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const old1 = `  elements.push(createSubHeading('3. Phẩm chất', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createBulletListItem(q, fontName)));`;

const new1 = `  elements.push(createSubHeading('3. Phẩm chất', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createBulletListItem(q, fontName).replace('•', '•')));`; // Wait, bullet is bullet, the user wanted dots. Wait, the user said "• Yêu thương: …", "• Tôn trọng: …", "• Tự lực: …", "• Thích ứng: …"

// Wait! User prompt says:
// 3. Phẩm chất:
// • Yêu thương: …………………..soạn ra
// • Tôn trọng: ………………..
// 4. Năng lực:
// • Tự lực: ……………..
// • Thích ứng: ……………

// Oh, I made it a dash on UI. Let's fix UI and Docx to make it bullets.
