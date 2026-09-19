const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const filterStates = `  const [bookLevelFilter, setBookLevelFilter] = useState('Tất cả');
  const [ppctLevelFilter, setPpctLevelFilter] = useState('Tất cả');
`;
content = content.replace("  const [ppctSubjectFilter, setPpctSubjectFilter] = useState('Tất cả');", "  const [ppctSubjectFilter, setPpctSubjectFilter] = useState('Tất cả');\n" + filterStates);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
