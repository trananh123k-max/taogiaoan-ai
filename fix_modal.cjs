const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

// Update extract-ppct fetch to handle non-json responses
code = code.replace(
  /const res = await fetch\('\/api\/extract-ppct', \{[\s\S]*?if \(res\.ok\) \{[\s\S]*?const data = await res\.json\(\);/g,
  `const res = await fetch('/api/extract-ppct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          grade: newGrade,
          bookSeries: newBookSeries,
          volume: newVolume,
          fileName: selectedFile?.name || '',
          fileBase64: fileBase64,
          mimeType: selectedFile?.type || '',
        }),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
           const errText = await res.text();
           throw new Error("Server returned HTML or non-JSON response (possibly due to proxy timeout or login redirect). " + errText.substring(0, 50));
        }
        const data = await res.json();`
);

// We need to define newBookSeries and newVolume in state
if (!code.includes('const [newVolume, setNewVolume] = useState(')) {
    code = code.replace(
      "const [newBookSeries, setNewBookSeries] = useState('Kết nối tri thức với cuộc sống');",
      "const [newBookSeries, setNewBookSeries] = useState('Kết nối tri thức với cuộc sống');\n  const [newVolume, setNewVolume] = useState('Cả năm / Không phân tập');"
    );
}

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Fixed modal');
