const fs = require('fs');
let content = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const levelSelectBook = `
                <select
                  value={bookLevelFilter}
                  onChange={(e) => setBookLevelFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả cấp học</option>
                  {['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Khác'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
`;

content = content.replace(/                <select\s+value=\{bookSubjectFilter\}/, levelSelectBook + "\n                <select\n                  value={bookSubjectFilter}");

const levelSelectPpct = `
                <select
                  value={ppctLevelFilter}
                  onChange={(e) => setPpctLevelFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả cấp học</option>
                  {['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Khác'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
`;

content = content.replace(/                <select\s+value=\{ppctSubjectFilter\}/, levelSelectPpct + "\n                <select\n                  value={ppctSubjectFilter}");

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', content);
