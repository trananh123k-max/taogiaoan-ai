const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const importStatement = `import { PRESCHOOL_CURRICULUM_MATRIX } from './src/data/preschoolCurriculum.js';\n`;

let newContent = content;
if (!newContent.includes('PRESCHOOL_CURRICULUM_MATRIX')) {
    newContent = importStatement + newContent;
}

const preschoolPromptDefinition = "const preschoolPrompt = `\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:";
const updatedPreschoolPromptDefinition = `const preschoolPrompt = \`\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:
\${PRESCHOOL_CURRICULUM_MATRIX}
`;

newContent = newContent.replace(preschoolPromptDefinition, updatedPreschoolPromptDefinition);

fs.writeFileSync('server.ts', newContent);
console.log('Updated server.ts');
