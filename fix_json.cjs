const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "    const parsed = JSON.parse(response.text || '{\"lessonConfigs\": []}');\n    res.json({\n      success: true,\n      lessonConfigs: parsed.lessonConfigs || [],\n    });",
  "    const parsed = JSON.parse(response.text || '{\"results\": []}');\n    res.json({\n      success: true,\n      results: parsed.results || (parsed.lessonConfigs ? [{ grade, lessonConfigs: parsed.lessonConfigs }] : []),\n    });"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed json parsing!');
