const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sseLoopOld = `        }
        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split('\\n\\n').filter(Boolean);
        
        for (const ev of events) {
          if (ev.startsWith('data: ')) {`;

const sseLoopNew = `        }
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\\n\\n');
        buffer = events.pop() || '';
        
        for (const ev of events) {
          if (ev.startsWith('data: ')) {`;

if (code.includes('const chunk = decoder.decode(value, { stream: true });')) {
  // Let's add the let buffer = ''; right before the while loop
  code = code.replace(/const decoder = new TextDecoder\(\);/, 'const decoder = new TextDecoder();\n      let buffer = "";');
  code = code.replace(sseLoopOld, sseLoopNew);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed SSE parsing in src/App.tsx');
} else {
  console.log('Could not find the target code in src/App.tsx');
}
