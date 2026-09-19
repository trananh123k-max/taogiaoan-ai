const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

// The replacement was replacing from {/* 1. Kiến thức */} up to </section> 
// So it ended with:
//               </>
//             )}
//           </section>`;
// But maybe there were missing closing tags inside.

