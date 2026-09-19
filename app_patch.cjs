const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const generateFunc = `
  // Generate Lesson Plan via Gemini Server Endpoint
  const handleGeneratePlan = async () => {
    if (!config.lessonTitle.trim()) {
      showToast('Vui lòng nhập tên bài học trước khi tạo!', 'error');
      return;
    }

    let finalConfig = { ...config };

    // Auto-detect PPCT settings
    try {
      const savedPPCT = localStorage.getItem('khbd_my_firebase_ppct');
      if (savedPPCT) {
        const ppctList = JSON.parse(savedPPCT);
        const matchingPPCT = ppctList.find((p: any) => p.subject === config.subject && p.grade === config.grade);
        
        if (matchingPPCT && matchingPPCT.lessonConfigs) {
          // Find matching lesson
          // We can use a simple substring match
          const lessonNameLower = config.lessonTitle.toLowerCase();
          const match = matchingPPCT.lessonConfigs.find((l: any) => lessonNameLower.includes(l.lessonTitle.toLowerCase()) || l.lessonTitle.toLowerCase().includes(lessonNameLower));
          if (match) {
            showToast(\`Đã tìm thấy PPCT cho bài học này: \${match.periods} tiết. Áp dụng NLS & AI chuẩn.\`, 'info');
            finalConfig.periods = match.periods || config.periods;
            finalConfig.integratedNLSFromPPCT = match.integratedNLS;
            finalConfig.integratedAIFromPPCT = match.integratedAI;
            setConfig(prev => ({ ...prev, periods: finalConfig.periods })); // update UI as well
          }
        }
      }
    } catch (e) {
      console.error("Error reading PPCT", e);
    }

    setProgressSteps({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
    setIsGenerating(true);
    setCurrentPlan(null); // Clear previous plan to show empty/generating state

    try {
      const response = await fetch('/api/gemini/generate-lesson-plan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig),
`;

code = code.replace(`
  // Generate Lesson Plan via Gemini Server Endpoint
  const handleGeneratePlan = async () => {
    if (!config.lessonTitle.trim()) {
      showToast('Vui lòng nhập tên bài học trước khi tạo!', 'error');
      return;
    }

    setProgressSteps({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
    setIsGenerating(true);
    setCurrentPlan(null); // Clear previous plan to show empty/generating state

    try {
      const response = await fetch('/api/gemini/generate-lesson-plan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),`.trim(), generateFunc.trim());

fs.writeFileSync('src/App.tsx', code);
