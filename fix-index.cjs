const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const fixScript = `
    <script>
      // Prevent formdata-polyfill or node-fetch from crashing the browser by overriding window.fetch
      const originalFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        get: function() { return originalFetch; },
        set: function() { /* silently keep native fetch */ },
        configurable: true
      });
    </script>
`;

code = code.replace('<div id="root"></div>', fixScript + '    <div id="root"></div>');
fs.writeFileSync('index.html', code);
console.log('index.html patched');
