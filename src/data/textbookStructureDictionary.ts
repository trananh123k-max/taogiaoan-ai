/**
 * TEXTBOOK STRUCTURE & CURRICULUM MAPPING DICTIONARY
 * Provides exact Roman numeral headers (I., II., III...) and numbered subsections (1., 2., 3...)
 * for textbook lessons (KNTT, CTST, CD) across grades and subjects.
 */

export interface TextbookSection {
  romanNumeral: string; // e.g. "I. THÔNG TIN VÀ DỮ LIỆU:"
  subHeading: string;    // e.g. "1. Thấy gì? Biết gì ?"
  coreKnowledge: string[]; // Key notebook takeaways
  explorationTasks: string[]; // Detailed discovery tasks/questions in SGK
}

export interface TextbookLessonStructure {
  subject: string;
  grade: string;
  bookSeries: string;
  lessonTitle: string;
  sections: TextbookSection[];
  practiceExercises?: {
    gameOrExerciseName?: string;
    questions: string[];
    answers: string[];
  };
  applicationQuestions?: string[];
  nextLessonPreparation?: string;
}

export const TEXTBOOK_STRUCTURE_DICTIONARY: Record<string, TextbookLessonStructure> = {
  // === TIN HỌC 6 - BÀI 1: THÔNG TIN VÀ DỮ LIỆU ===
  'Tin học_Lớp 6_Bài 1: Thông tin và dữ liệu': {
    subject: 'Tin học',
    grade: 'Lớp 6',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    lessonTitle: 'Bài 1: Thông tin và dữ liệu',
    sections: [
      {
        romanNumeral: 'I. THÔNG TIN VÀ DỮ LIỆU:',
        subHeading: '1. Thấy gì? Biết gì ?',
        coreKnowledge: [
          'Thông tin là những gì đem lại hiểu biết cho con người về thế giới xung quanh và về chính bản thân mình.',
          'Thông tin được ghi lên vật mang thông tin trở thành dữ liệu. Dữ liệu được thể hiện dưới dạng những con số, văn bản, hình ảnh và âm thanh.',
          'Vật mang thông tin là phương tiện được dùng để lưu trữ và truyền tải thông tin (Ví dụ: giấy viết, đĩa CD, thẻ nhớ, USB, sách báo, biển báo...).'
        ],
        explorationTasks: [
          'Nhiệm vụ 1: Đọc đoạn văn và quan sát hình ảnh trang 5 SGK: Bạn Minh thấy đèn giao thông đổi màu (dữ liệu), biết được sang đường an toàn (thông tin), đèn giao thông là vật mang thông tin. Bạn An xem dự báo thời tiết thấy chữ/số (dữ liệu), biết trời nắng (thông tin). Biển chỉ dẫn Đảo Cò có chữ và số (dữ liệu), biết địa điểm du lịch (thông tin), tấm bảng là vật mang thông tin.',
          'Nhiệm vụ 2: Thảo luận nhóm tìm hiểu mối quan hệ giữa thông tin và dữ liệu, định nghĩa thông tin, dữ liệu, vật mang thông tin. Liên hệ môi trường số: chụp ảnh giấy gửi qua Zalo thì hình ảnh trong điện thoại là dữ liệu và điện thoại là vật mang tin.',
          'Nhiệm vụ 3: Hoàn thành bài tập ghép nối cột A - Cột B (1-Thông tin ghép với b-Hiểu biết của con người; 2-Dữ liệu ghép với a-Các số, văn bản, hình ảnh; 3-Vật mang tin ghép với c-Vật chứa dữ liệu) và phân loại dòng 16:00 (dữ liệu), 0123456789 (dữ liệu), "Hãy gọi cho tôi lúc 16 giờ..." (thông tin).'
        ]
      },
      {
        romanNumeral: 'II. TẦM QUAN TRỌNG CỦA THÔNG TIN:',
        subHeading: '2. Hỏi để có thông tin:',
        coreKnowledge: [
          'Thông tin đem lại sự hiểu biết cho con người. Mọi hoạt động của con người đều cần đến thông tin.',
          'Thông tin đúng giúp con người có những lựa chọn tốt, giúp cho hoạt động của con người đạt hiệu quả.',
          'Thông tin có khả năng làm thay đổi hành động của con người.'
        ],
        explorationTasks: [
          'Nhiệm vụ 1: Xem video/đọc tài liệu về "Chiến dịch Điện Biên Phủ", thảo luận các thông tin thu nhận được (địa điểm, thời gian, diễn biến) và ý nghĩa to lớn (hiểu biết truyền thống đấu tranh dựng nước và giữ nước).',
          'Nhiệm vụ 2: Thảo luận tình huống thực tế: Bạn An chuẩn bị sang nhà Minh học nhóm, nghe mẹ dặn "trời sắp mưa" -> An quay vào nhà lấy chiếc ô -> Nhận xét: Thông tin làm thay đổi hành động của con người.',
          'Nhiệm vụ 3: Thảo luận lập kế hoạch tìm kiếm thông tin cho chuyến dã ngoại của lớp: thông tin thời tiết để chọn trang phục, địa điểm chụp ảnh, các trò chơi dã ngoại, di tích lịch sử tham quan.'
        ]
      }
    ],
    practiceExercises: {
      gameOrExerciseName: 'Trò chơi "AI NHANH HƠN" (Trắc nghiệm SGK)',
      questions: [
        'Câu 1: Phương án nào sau đây là thông tin? (A. Con số điều tra; B. Kiến thức về phân bố dân cư; C. Phiếu điều tra; D. Tệp lưu trữ)',
        'Câu 2: Phát biểu nào sau đây là đúng? (C. Dữ liệu được thể hiện dưới dạng con số, văn bản, hình ảnh, âm thanh)',
        'Câu 3: Phát biểu nào sau đây là đúng? (A. Thông tin là kết quả của việc xử lí dữ liệu để nó trở nên có ý nghĩa)',
        'Câu 4: Xem bản tin dự báo thời tiết "24°-27° Có mưa", Khoa kết luận "Hôm nay trời mưa". (A. Bản tin là dữ liệu, kết luận của Khoa là thông tin)',
        'Câu 5: Công cụ nào sau đây không phải là vật mang tin? (D. Xô, chậu)',
        'Câu 6: Phát biểu nào sau đây đúng về lợi ích của thông tin? (D. Đem lại hiểu biết và giúp con người có những lựa chọn tốt)',
        'Câu 7: Phát biểu nào sau đây là sai? (B. Thông tin là những gì có giá trị, dữ liệu là những thứ vô giá trị)'
      ],
      answers: ['1. B (hoặc C theo đáp án SGK)', '2. C', '3. A', '4. A', '5. D', '6. D', '7. B']
    },
    applicationQuestions: [
      'Câu 1: Nêu ví dụ cho thấy thông tin giúp em: a) Lựa chọn trang phục phù hợp với thời tiết; b) Đảm bảo an toàn khi tham gia giao thông.',
      'Câu 2: Nêu ví dụ về vật mang thông tin số giúp ích cho việc học tập của em (SGK điện tử, USB, thẻ nhớ, máy tính, điện thoại thông minh).'
    ],
    nextLessonPreparation: 'Học sinh làm các bài tập trong SBT và đọc trước Bài 2: Xử lí thông tin.'
  },

  // === TIN HỌC 6 - BÀI 2: XỬ LÍ THÔNG TIN ===
  'Tin học_Lớp 6_Bài 2: Xử lí thông tin': {
    subject: 'Tin học',
    grade: 'Lớp 6',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    lessonTitle: 'Bài 2: Xử lí thông tin',
    sections: [
      {
        romanNumeral: 'I. XỬ LÍ THÔNG TIN:',
        subHeading: '1. Xử lí thông tin là gì ?',
        coreKnowledge: [
          'Xử lí thông tin là quá trình thu nhận thông tin, biến đổi thông tin và đưa ra kết quả.',
          'Các bước cơ bản trong quá trình xử lí thông tin: Thu nhận thông tin -> Xử lí thông tin -> Lưu trữ thông tin -> Truyền (xuất) thông tin.'
        ],
        explorationTasks: [
          'Nhiệm vụ 1: Đọc tình huống trong SGK và chỉ ra đâu là thông tin vào, quá trình xử lí và thông tin ra.',
          'Nhiệm vụ 2: Phân tích quy trình 4 bước xử lí thông tin trong các hoạt động hàng ngày của con người.'
        ]
      },
      {
        romanNumeral: 'II. MÁY TÍNH VÀ XỬ LÍ THÔNG TIN:',
        subHeading: '2. Máy tính là công cụ hiệu quả để xử lí thông tin:',
        coreKnowledge: [
          'Máy tính là thiết bị điện tử có khả năng xử lí thông tin một cách tự động theo các chương trình được cài đặt.',
          'Các khối chức năng của máy tính tương ứng với các bước xử lí thông tin: Thiết bị vào (Thu nhận) -> Bộ xử lí trung tâm CPU (Xử lí) -> Bộ nhớ (Lưu trữ) -> Thiết bị ra (Truyền/xuất).'
        ],
        explorationTasks: [
          'Nhiệm vụ 1: Nhận biết các thành phần phần cứng máy tính và vai trò tương ứng trong quá trình xử lí thông tin.',
          'Nhiệm vụ 2: So sánh khả năng xử lí thông tin của con người và máy tính.'
        ]
      }
    ],
    nextLessonPreparation: 'Học sinh làm bài tập SBT và chuẩn bị Bài 3: Thông tin trong máy tính.'
  }
};

/**
 * Retrieves the exact textbook structure for a given lesson if available.
 */
export function getTextbookLessonStructure(subject: string, grade: string, lessonTitle: string): TextbookLessonStructure | null {
  if (!lessonTitle) return null;
  const cleanSubject = (subject || '').trim();
  const cleanGrade = (grade || '').trim();
  const cleanTitle = (lessonTitle || '').trim();

  // Try direct lookup
  const key1 = `${cleanSubject}_${cleanGrade}_${cleanTitle}`;
  if (TEXTBOOK_STRUCTURE_DICTIONARY[key1]) {
    return TEXTBOOK_STRUCTURE_DICTIONARY[key1];
  }

  // Try normalized lookup
  for (const [key, value] of Object.entries(TEXTBOOK_STRUCTURE_DICTIONARY)) {
    if (
      value.lessonTitle.toLowerCase().includes(cleanTitle.toLowerCase()) ||
      cleanTitle.toLowerCase().includes(value.lessonTitle.toLowerCase())
    ) {
      if (cleanGrade && value.grade.toLowerCase() === cleanGrade.toLowerCase()) {
        return value;
      }
      return value;
    }
  }

  return null;
}
