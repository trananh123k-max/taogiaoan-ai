/**
 * Shared PPCT Matching Utility
 * Ensures 100% accurate matching between user-entered/selected lesson titles and PPCT records.
 */

export const extractLessonNumber = (title: string): string | null => {
  if (!title) return null;
  const m = title.match(/(?:bài|tiết|bài\s*học)\s*(\d+[a-z]?)/i);
  return m ? m[1].toLowerCase() : null;
};

export const normalizePPCTStr = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/bài\s*\d+[a-z]?[:.]?\s*/gi, '')
    .replace(/tiết\s*\d+[:.]?\s*/gi, '')
    .replace(/chủ đề\s*\d+[:.]?\s*/gi, '')
    .replace(/thực hành[:.]?\s*/gi, '')
    .replace(/th[:.]?\s*/gi, '')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi, '')
    .trim();
};

export const findBestLessonMatch = (lessonConfigs: any[], userTitle: string) => {
  if (!lessonConfigs || !userTitle) return null;
  const userNum = extractLessonNumber(userTitle);
  const normUser = normalizePPCTStr(userTitle);

  // 1. If lesson number is present (e.g. '14', '9a'), try matching exact lesson number first
  if (userNum) {
    const numMatch = lessonConfigs.find(l => {
      const lNum = extractLessonNumber(l.lessonTitle);
      return lNum && lNum === userNum;
    });
    if (numMatch) return numMatch;
  }

  // 2. Exact normalized title match
  const exactNormMatch = lessonConfigs.find(l => normalizePPCTStr(l.lessonTitle) === normUser);
  if (exactNormMatch) return exactNormMatch;

  // 3. Best score substring / overlap match
  let bestItem = null;
  let bestScore = 0;
  for (const l of lessonConfigs) {
    const normL = normalizePPCTStr(l.lessonTitle);
    if (!normL) continue;
    let score = 0;
    if (normUser === normL) score = 100;
    else if (normUser.startsWith(normL) || normL.startsWith(normUser)) score = 80;
    else if (normUser.includes(normL)) score = 60 + normL.length;
    else if (normL.includes(normUser)) score = 50 + normUser.length;

    if (score > bestScore) {
      bestScore = score;
      bestItem = l;
    }
  }
  return bestItem;
};

export const findMatchInPPCTList = (ppctList: any[], subject: string, grade: string, lessonTitle: string) => {
  if (!ppctList || !Array.isArray(ppctList) || !subject || !grade || !lessonTitle) return null;
  const matchingPPCT = ppctList.find(
    (p: any) =>
      p.subject?.toLowerCase().trim() === subject?.toLowerCase().trim() &&
      p.grade?.toLowerCase().trim() === grade?.toLowerCase().trim()
  );
  if (!matchingPPCT || !matchingPPCT.lessonConfigs) return null;

  return findBestLessonMatch(matchingPPCT.lessonConfigs, lessonTitle);
};
