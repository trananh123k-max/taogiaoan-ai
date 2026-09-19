const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [uploadedBooks, setUploadedBooks] = useState<CustomUploadedBook[]>([]);",
  `const [uploadedBooks, setUploadedBooks] = useState<CustomUploadedBook[]>([]);
  const [uploadedPPCTs, setUploadedPPCTs] = useState<any[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('khbd_my_firebase_ppct');
    if (saved) {
      try {
        setUploadedPPCTs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);`
);

code = code.replace(
  "uploadedBooks={uploadedBooks}",
  "uploadedBooks={uploadedBooks}\n                uploadedPPCTs={uploadedPPCTs}"
);

code = code.replace(
  "onBooksUpdated={(books) => {",
  `onPPCTUpdated={(ppcts: any) => {
          setUploadedPPCTs(ppcts);
        }}
        onBooksUpdated={(books) => {`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx!');
