const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const parseRobustCode = `function parseJSONRobust(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    let fixedText = text.trim();
    if (fixedText.startsWith('\`\`\`json')) {
      fixedText = fixedText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    const closures = ['', '}', ']}', '}]', '}}', ']}}', '}]}', '}}]', '}}]}', ']}}]}', '"]}', '"}'];
    for (const closure of closures) {
      try { return JSON.parse(fixedText + closure); } catch (err) {}
    }
    const lastBrace = fixedText.lastIndexOf('}');
    if (lastBrace !== -1) {
      try { return JSON.parse(fixedText.substring(0, lastBrace + 1)); } catch (err) {}
    }
    console.error('Failed to parse JSON robustly, returning empty object.');
    return {};
  }
}
`;

code = code.replace("// Health check", parseRobustCode + "\n// Health check");
code = code.replace(/JSON\.parse\(res\.text \|\| '\{\}'\)/g, "parseJSONRobust(res.text)");

const wrapRegex = /const wrap = async \(taskFn: any, step: number\) => \{[\s\S]*?return res;\s*\};/m;
const wrapReplacement = `const wrap = async (taskFn: any, step: number) => {
    onProgress?.(step, 'start');
    try {
      const res = await taskFn();
      onProgress?.(step, 'done');
      return res;
    } catch (err) {
      console.error(\`Task \${step} failed:\`, err);
      onProgress?.(step, 'error');
      return {};
    }
  };`;
code = code.replace(wrapRegex, wrapReplacement);
fs.writeFileSync('server.ts', code);
console.log('server.ts updated');
