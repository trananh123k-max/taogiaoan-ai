const http = require('http');
const data = JSON.stringify({ fileName: "test.xlsx", fileBase64: "a".repeat(55_000_000) });
const req = http.request('http://localhost:3000/api/extract-ppct', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body.substring(0, 100)));
});
req.write(data);
req.end();
