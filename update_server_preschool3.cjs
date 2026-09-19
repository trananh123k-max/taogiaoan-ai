const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const preschoolPromptDefinition = "const preschoolPrompt = `\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:";
const updatedPreschoolPromptDefinition = `const preschoolPrompt = \`\\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:
\${PRESCHOOL_CURRICULUM_MATRIX}
`;

content = content.split(preschoolPromptDefinition).join(updatedPreschoolPromptDefinition);

fs.writeFileSync('server.ts', content);
console.log('Updated all occurrences in server.ts');
