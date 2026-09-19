const fs = require('fs');
let code = fs.readFileSync('src/components/LeftConfigPanel.tsx', 'utf8');

const newAvailableLessons = `  // Match PPCT
  const matchingPPCT = useMemo(() => {
    return uploadedPPCTs.find((p) => p.subject === config.subject && p.grade === config.grade);
  }, [uploadedPPCTs, config.subject, config.grade]);

  // Permanent scanned lesson list from the book or verified official curriculum
  const availableLessons = useMemo(() => {
    if (usePPCT && matchingPPCT && matchingPPCT.lessonConfigs && matchingPPCT.lessonConfigs.length > 0) {
      return matchingPPCT.lessonConfigs.map((l: any) => l.lessonTitle);
    }
    if (currentMatchedBook && currentMatchedBook.lessons && currentMatchedBook.lessons.length > 4) {
      return currentMatchedBook.lessons;
    }
    const verified = getVerifiedLessons(config.subject, config.grade);
    if (verified && verified.lessons.length > 0) {
      return verified.lessons;
    }
    if (currentMatchedBook && currentMatchedBook.lessons && currentMatchedBook.lessons.length > 0) {
      return currentMatchedBook.lessons;
    }
    return [];
  }, [usePPCT, matchingPPCT, currentMatchedBook, config.subject, config.grade]);`;

code = code.replace(/  \/\/ Permanent scanned lesson list from the book or verified official curriculum[\s\S]*?\}, \[currentMatchedBook, config\.subject, config\.grade\]\);/, newAvailableLessons);

// We need to auto-fill periods when lesson changes if using PPCT
const autoSetLogic = `  // Auto-set lessonTitle if empty or not in availableLessons
  useEffect(() => {
    if (availableLessons.length > 0 && (!config.lessonTitle || !availableLessons.includes(config.lessonTitle))) {
      if (!isCustomLessonInput) {
        onChangeConfig({ lessonTitle: availableLessons[0] });
      }
    }
  }, [availableLessons, config.lessonTitle, isCustomLessonInput]);

  // Auto-update periods if PPCT is used
  useEffect(() => {
    if (usePPCT && matchingPPCT && config.lessonTitle) {
      const matchedLesson = matchingPPCT.lessonConfigs.find((l: any) => l.lessonTitle === config.lessonTitle);
      if (matchedLesson && matchedLesson.periods !== config.periods) {
        onChangeConfig({ periods: matchedLesson.periods });
      }
    }
  }, [usePPCT, matchingPPCT, config.lessonTitle]);
`;

code = code.replace(/  \/\/ Auto-set lessonTitle if empty or not in availableLessons[\s\S]*?\}, \[availableLessons, config\.lessonTitle, isCustomLessonInput\]\);/, autoSetLogic);

fs.writeFileSync('src/components/LeftConfigPanel.tsx', code);
console.log('Fixed LeftConfigPanel.tsx logic!');
