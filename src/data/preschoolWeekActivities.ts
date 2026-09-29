import { LessonPlanOutput, ActivityDetail, StepDetail } from '../types';

export interface ActivitySectionDef {
  code: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'H' | 'K'
  title: string; // e.g. "A. ĐÓN TRẺ, TRÒ CHUYỆN SÁNG"
  defaultTitle: string; // e.g. "Đón trẻ, trò chuyện sáng"
  shortName: string;
  isFixedStandard?: boolean; // Các mục có thể áp dụng mẫu cố định chuẩn
}

export const PRESCHOOL_ACTIVITY_SECTIONS: ActivitySectionDef[] = [
  {
    code: 'A',
    title: 'A. ĐÓN TRẺ, TRÒ CHUYỆN SÁNG',
    defaultTitle: 'Đón trẻ, trò chuyện sáng',
    shortName: 'Đón trẻ, trò chuyện',
    isFixedStandard: true,
  },
  {
    code: 'B',
    title: 'B. THỂ DỤC SÁNG',
    defaultTitle: 'Thể dục sáng',
    shortName: 'Thể dục sáng',
    isFixedStandard: true,
  },
  {
    code: 'C',
    title: 'C. HOẠT ĐỘNG HỌC',
    defaultTitle: 'Hoạt động học',
    shortName: 'Hoạt động học (Chính)',
    isFixedStandard: false,
  },
  {
    code: 'D',
    title: 'D. HOẠT ĐỘNG NGOÀI TRỜI',
    defaultTitle: 'Hoạt động ngoài trời',
    shortName: 'Ngoài trời',
    isFixedStandard: false,
  },
  {
    code: 'E',
    title: 'E. HOẠT ĐỘNG VUI CHƠI TRONG LỚP',
    defaultTitle: 'Hoạt động vui chơi trong lớp',
    shortName: 'Vui chơi trong lớp',
    isFixedStandard: false,
  },
  {
    code: 'F',
    title: 'F. VỆ SINH, ĂN, NGỦ TRƯA',
    defaultTitle: 'Vệ sinh, ăn, ngủ trưa',
    shortName: 'Ăn ngủ trưa',
    isFixedStandard: true,
  },
  {
    code: 'H',
    title: 'H. NÊU GƯƠNG CẮM CỜ , VỆ SINH TRẢ TRẺ',
    defaultTitle: 'Nêu gương cắm cờ, vệ sinh trả trẻ',
    shortName: 'Nêu gương, trả trẻ',
    isFixedStandard: true,
  },
  {
    code: 'K',
    title: 'K. NHẬN XÉT CUỐI NGÀY',
    defaultTitle: 'Nhận xét cuối ngày',
    shortName: 'Nhận xét cuối ngày',
    isFixedStandard: true,
  },
];

// Các mục hoạt động người dùng chọn ghép (Chỉ C, D, E - Các mục A, B, F, H, K là dập khuôn tự động)
export const USER_PRESCHOOL_ACTIVITY_SECTIONS: ActivitySectionDef[] = [
  {
    code: 'C',
    title: 'C. HOẠT ĐỘNG HỌC',
    defaultTitle: 'Hoạt động học',
    shortName: 'Hoạt động học (C)',
    isFixedStandard: false,
  },
  {
    code: 'D',
    title: 'D. HOẠT ĐỘNG NGOÀI TRỜI',
    defaultTitle: 'Hoạt động ngoài trời',
    shortName: 'Hoạt động ngoài trời (D)',
    isFixedStandard: false,
  },
  {
    code: 'E',
    title: 'E. HOẠT ĐỘNG VUI CHƠI TRONG LỚP',
    defaultTitle: 'Hoạt động vui chơi trong lớp',
    shortName: 'Vui chơi trong lớp (E)',
    isFixedStandard: false,
  },
];

export const WEEK_DAYS_LIST = [
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
] as const;

export type WeekDayName = typeof WEEK_DAYS_LIST[number];

function makeStep(title: string, teacherAction: string, studentAction: string): StepDetail {
  return {
    title,
    teacherAction,
    studentAction,
    productExpected: '',
  };
}

function makeActivity(
  index: number,
  name: string,
  duration: string,
  teacherAction: string,
  studentAction: string
): ActivityDetail {
  const step = makeStep(name, teacherAction, studentAction);
  return {
    id: `act-${index}-${Math.random().toString(36).substr(2, 6)}`,
    index,
    name,
    duration,
    objective: name,
    content: teacherAction,
    productSummary: '',
    step1: step,
    step2: makeStep('', '', ''),
    step3: makeStep('', '', ''),
    step4: makeStep('', '', ''),
    steps: [step],
  };
}

/**
 * Trả về nội dung mẫu cố định theo đúng chuẩn mẫu GIÁO ÁN TUẦN 4.pdf
 * A: A. ĐÓN TRẺ, TRÒ CHUYỆN SÁNG
 * B: B. THỂ DỤC SÁNG
 * F: F. VỆ SINH, ĂN, NGỦ TRƯA
 * H: H. NÊU GƯƠNG CẮM CỜ , VỆ SINH TRẢ TRẺ
 * K: K. NHẬN XÉT CUỐI NGÀY (Mẫu cố định)
 */
export function getStandardFixedSectionContent(code: string, dayOfWeek: string = 'Thứ hai'): LessonPlanOutput {
  const isFirstDay = dayOfWeek === 'Thứ hai';

  if (code === 'A') {
    return {
      schoolName: '',
      teacherName: '',
      lessonTitle: 'ĐÓN TRẺ, TRÒ CHUYỆN SÁNG',
      subject: 'Mầm non',
      grade: 'Lớp Lá (5-6 tuổi)',
      schoolLevel: 'Mầm non',
      bookSeries: 'Mầm non chuẩn',
      periods: 1,
      duration: '45 phút',
      objectives: {
        knowledge: [
          'Cô đến trước 15 phút thông thoáng phòng học, chuẩn bị đồ dùng cho trẻ.',
          'Cô đón trẻ với thái độ niềm nở, ân cần. Nhắc trẻ chào bố mẹ, cô giáo, cất đồ dùng vào nơi quy định.',
          isFirstDay
            ? 'Trò chuyện sáng: Trò chuyện với trẻ về tên bé, dạy trẻ phân biệt các bạn qua một số đặc điểm cá nhân: họ tên, tuổi, ngày sinh, giới tính của bản thân.'
            : 'Trò chuyện sáng: Tiếp tục đàm thoại cùng trẻ về chủ đề bản thân, hướng dẫn trẻ tự tin chia sẻ sở thích cá nhân.',
          'Điểm danh, báo ăn: Cô điểm danh gọi tên theo sổ theo dõi lớp tạo điều kiện cho trẻ quan tâm đến nhau hơn. Báo ăn đúng sĩ số.',
        ],
        generalCompetencies: ['Tự giác cất đồ dùng cá nhân vào đúng ngăn tủ của mình.'],
        subjectCompetencies: [
          'Rèn thói quen lễ phép, chào hỏi cô giáo và phụ huynh khi đến lớp.',
          'Phát triển ngôn ngữ mạch lạc trong giao tiếp sáng.',
        ],
        digitalCompetencies: [],
        aiCompetencies: [],
        qualities: ['Biết quan tâm tới các bạn trong lớp và gắn bó với trường lớp mầm non.'],
      },
      equipment: {
        teacher: ['Phòng học sạch sẽ, thông thoáng, sổ theo dõi lớp, bảng báo ăn.'],
        student: ['Đồ dùng cá nhân gọn gàng, giày dép cất đúng ngăn.'],
        digitalAssets: [],
      },
      activities: [
        makeActivity(
          1,
          '1. Đón trẻ',
          '15 phút',
          'Cô đến trước 15 phút thông thoáng phòng học, chuẩn bị đồ dùng đón trẻ. Cô đón trẻ với thái độ niềm nở, ân cần. Cô nhắc trẻ chào bố mẹ, cô giáo cất đồ dùng vào nơi quy định.',
          'Trẻ vui vẻ chào cô giáo và người thân. Tự giác cất ba lô, giày dép vào đúng ngăn tủ.'
        ),
        makeActivity(
          2,
          '2. Trò chuyện sáng',
          '20 phút',
          'Trò chuyện với trẻ về tên bé, dạy trẻ phân biệt các bạn qua một số đặc điểm cá nhân: họ tên, tuổi, ngày sinh, giới tính của bản thân. Cho trẻ biết sự khác nhau về hình dạng bên ngoài, khả năng, hành động và sở thích riêng. Giáo dục trẻ quan tâm tới các bạn và bản thân.',
          'Hào hứng trò chuyện, tự tin giới thiệu bản thân. Lắng nghe bạn và cô giáo.'
        ),
        makeActivity(
          3,
          '3. Điểm danh, báo ăn',
          '10 phút',
          'Cô điểm danh gọi tên theo sổ theo dõi lớp tạo điều kiện cho trẻ quan tâm đến nhau hơn. Cô báo ăn theo đúng sĩ số học sinh có mặt đi học trong ngày.',
          'Trẻ chú ý lắng nghe cô gọi tên và dạ to. Nhận biết bạn nào vắng mặt trong tổ.'
        ),
      ],
      competencyMatrix: { nlsItems: [], aiItems: [] },
      appendix: {},
      imageSlotsUsed: [],
      generatedAt: new Date().toISOString(),
    };
  }

  if (code === 'B') {
    return {
      schoolName: '',
      teacherName: '',
      lessonTitle: 'THỂ DỤC SÁNG',
      subject: 'Phát triển thể chất',
      grade: 'Lớp Lá (5-6 tuổi)',
      schoolLevel: 'Mầm non',
      bookSeries: 'Mầm non chuẩn',
      periods: 1,
      duration: '15 phút',
      objectives: {
        knowledge: [
          'Trẻ thực hiện các bài vận động phát triển chung, biết quay phải, quay trái, biết vận động theo nhạc.',
          'Cung cấp thêm vốn từ cho trẻ. Trẻ biết đếm đúng nhịp từng động tác phát triển ngôn ngữ.',
        ],
        generalCompetencies: ['Rèn phản xạ nhanh nhẹn theo hiệu lệnh còi và hiệu lệnh nhạc.'],
        subjectCompetencies: [
          'Rèn trẻ kĩ năng phối hợp tay chân nhịp nhàng thực hiện đúng động tác.',
          'Trẻ vận động theo nhạc thành thạo, rèn về đội hình đội ngũ.',
        ],
        digitalCompetencies: [],
        aiCompetencies: [],
        qualities: ['Trẻ có ý thức trong tập luyện, chăm chỉ tập luyện rèn luyện thân thể.'],
      },
      equipment: {
        teacher: ['Sân trường rộng rãi, an toàn, loa đài, đĩa/nhạc thể dục (bài hát "Nắng sớm").'],
        student: ['Trang phục thể thao thoải mái, dép quai hậu chắc chắn.'],
        digitalAssets: [],
      },
      activities: [
        makeActivity(
          1,
          'Khởi động',
          '3 phút',
          'Cho trẻ đi vòng tròn kết hợp các kiểu đi: đi thường, đi bằng mũi chân, đi bằng gót chân, chạy chậm, chạy nhanh. Xoay khớp cổ tay, cổ chân, xoay cổ, cánh tay, xoay hông.',
          'Trẻ thực hiện theo hiệu lệnh của cô. Khởi động kỹ các khớp theo nhịp.'
        ),
        makeActivity(
          2,
          'Trọng động: Bài tập phát triển chung',
          '10 phút',
          'Tập các động tác theo nhịp điệu bài hát "Nắng sớm":\n- Động tác hô hấp: Gà gáy (hít thật sâu, thở ra từ từ).\n- Động tác tay: 2 tay đưa trước, đưa cao, chân rộng bằng vai (2 lần x 8 nhịp).\n- Động tác chân: Chân rộng bằng vai, 2 tay đưa ngang, đưa trước, khuỵu gối (2 lần x 8 nhịp).\n- Động tác lườn: Chân rộng bằng vai, 2 tay đưa cao nghiêng phải nghiêng trái (2 lần x 8 nhịp).\n- Động tác bật: Bật chụm tách chân tại chỗ nhịp nhàng.\nGiáo dục trẻ thường xuyên tập thể dục cho cơ thể khỏe mạnh.',
          'Trẻ tập đều và chuẩn động tác cùng cô. Đếm nhịp to, rõ ràng theo tiếng nhạc.'
        ),
        makeActivity(
          3,
          'Hồi tĩnh',
          '2 phút',
          'Cho trẻ đi nhẹ nhàng 1-2 vòng quanh sân, làm động tác chim bay, hít thở sâu.',
          'Trẻ đi nhẹ nhàng, hít thở sâu, thả lỏng cơ bắp.'
        ),
      ],
      competencyMatrix: { nlsItems: [], aiItems: [] },
      appendix: {},
      imageSlotsUsed: [],
      generatedAt: new Date().toISOString(),
    };
  }

  if (code === 'F') {
    return {
      schoolName: '',
      teacherName: '',
      lessonTitle: 'VỆ SINH, ĂN, NGỦ TRƯA',
      subject: 'Mầm non',
      grade: 'Lớp Lá (5-6 tuổi)',
      schoolLevel: 'Mầm non',
      bookSeries: 'Mầm non chuẩn',
      periods: 1,
      duration: '120 phút',
      objectives: {
        knowledge: [
          'Trẻ biết rửa tay bằng xà phòng đúng quy trình 6 bước, rửa mặt sạch sẽ trước khi ăn và sau khi đi vệ sinh.',
          'Hiểu được giá trị dinh dưỡng của các món ăn, giữ nề nếp văn minh khi ăn.',
          'Biết tự giác chuẩn bị đồ dùng ngủ trưa và giữ trật tự trong giờ ngủ.',
        ],
        generalCompetencies: ['Hình thành thói quen vệ sinh khoa học và tự lập.'],
        subjectCompetencies: ['Rèn kỹ năng tự phục vụ bản thân: xúc cơm gọn gàng, tự gấp chăn gối.'],
        digitalCompetencies: [],
        aiCompetencies: [],
        qualities: ['Tôn trọng bạn cùng phòng ngủ, biết ơn cô cấp dưỡng và người nấu ăn.'],
      },
      equipment: {
        teacher: ['Phòng ăn sạch sẽ, xà phòng rửa tay, khăn lau riêng, phòng ngủ thoáng mát, chăn gối đủ cho trẻ.'],
        student: ['Khăn mặt riêng, bát thìa cá nhân.'],
        digitalAssets: [],
      },
      activities: [
        makeActivity(
          1,
          '1. Vệ sinh trước khi ăn',
          '15 phút',
          'Cô cho trẻ rửa tay, đi vệ sinh, sử dụng và cất đồ dùng đúng nơi qui định. Khuyến khích trẻ giữ vệ sinh cá nhân, hỗ trợ bạn khi cần và thực hiện các qui định chung.',
          'Trẻ xếp hàng lần lượt rửa tay đúng 6 bước, lau khô tay.'
        ),
        makeActivity(
          2,
          '2. Tổ chức giờ ăn trưa',
          '45 phút',
          'Cho trẻ ngồi vào bàn ăn, giới thiệu thực đơn dinh dưỡng hôm nay. Nhắc trẻ mời cô và bạn trước khi ăn, cảm ơn khi được giúp đỡ. Giữ trật tự và thực hiện nề nếp trong bữa ăn, nhặt cơm rơi vào đĩa.',
          'Trẻ mời cô, mời bạn, xúc ăn gọn gàng, ăn hết suất.'
        ),
        makeActivity(
          3,
          '3. Tổ chức giờ ngủ trưa',
          '60 phút',
          'Phòng ngủ sạch sẽ, thoáng mát, yên tĩnh. Hướng dẫn trẻ tự chuẩn bị và cất chăn, gối; giữ yên lặng, tôn trọng bạn, thực hiện đúng qui định khi ngủ và biết hỗ trợ bạn khi cần.',
          'Trẻ tự lấy gối, nằm đúng vị trí, ngủ ngoan say giấc.'
        ),
      ],
      competencyMatrix: { nlsItems: [], aiItems: [] },
      appendix: {},
      imageSlotsUsed: [],
      generatedAt: new Date().toISOString(),
    };
  }

  if (code === 'H') {
    return {
      schoolName: '',
      teacherName: '',
      lessonTitle: 'NÊU GƯƠNG CẮM CỜ , VỆ SINH TRẢ TRẺ',
      subject: 'Mầm non',
      grade: 'Lớp Lá (5-6 tuổi)',
      schoolLevel: 'Mầm non',
      bookSeries: 'Mầm non chuẩn',
      periods: 1,
      duration: '45 phút',
      objectives: {
        knowledge: [
          'Trẻ biết các tiêu chuẩn bé ngoan trong ngày để bình cờ.',
          'Trẻ vệ sinh sạch sẽ, sửa sang quần áo đầu tóc trước khi ra về.',
          'Biết chào cô giáo, bố mẹ khi được đón về.',
        ],
        generalCompetencies: ['Phát triển ý thức kỷ luật và tính tự giác.'],
        subjectCompetencies: ['Rèn kỹ năng tự nhận xét bản thân và bạn bè một cách trung thực.'],
        digitalCompetencies: [],
        aiCompetencies: [],
        qualities: ['Vui vẻ, phấn khởi khi được nhận cờ bé ngoan, có ý thức phấn đấu.'],
      },
      equipment: {
        teacher: ['Bảng bé ngoan, cờ bé ngoan, phiếu bé ngoan (cuối tuần), lược chải đầu, dây buộc tóc.'],
        student: ['Đồ dùng cá nhân đầy đủ.'],
        digitalAssets: [],
      },
      activities: [
        makeActivity(
          1,
          '1. Nêu gương - Cắm cờ',
          '15 phút',
          'Trẻ đọc tiêu chuẩn bé ngoan, cho trẻ bình cờ theo tổ. Cô nhận xét từng tổ, tuyên dương trẻ ngoan, động viên trẻ cố gắng và tặng cờ cho trẻ.',
          'Trẻ tự giác nhận xét bản thân và biểu dương bạn ngoan trong ngày. Trẻ được cờ lên cắm cờ tự hào.'
        ),
        makeActivity(
          2,
          '2. Vệ sinh cá nhân',
          '15 phút',
          'Trẻ vệ sinh cá nhân sạch sẽ, quần áo đầu tóc gọn gàng. Cô chải đầu, buộc tóc cho các bé gái, hỗ trợ trẻ sửa sang trang phục.',
          'Trẻ soi gương, chỉnh sửa quần áo, rửa mặt sạch sẽ.'
        ),
        makeActivity(
          3,
          '3. Trả trẻ',
          '15 phút',
          'Cô trả trẻ với thái độ niềm nở, nhắc trẻ chào cô, chào bố mẹ. Trao đổi với phụ huynh những điều cần thiết về trẻ và tình hình ăn, ngủ, học tập trong ngày.',
          'Trẻ lấy đúng đồ dùng cá nhân, khoanh tay chào cô và bố mẹ trước khi ra về.'
        ),
      ],
      competencyMatrix: { nlsItems: [], aiItems: [] },
      appendix: {},
      imageSlotsUsed: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // K. NHẬN XÉT CUỐI NGÀY (Mẫu cố định chuẩn)
  return {
    schoolName: '',
    teacherName: '',
    lessonTitle: 'NHẬN XÉT CUỐI NGÀY',
    subject: 'Mầm non',
    grade: 'Lớp Lá (5-6 tuổi)',
    schoolLevel: 'Mầm non',
    bookSeries: 'Mầm non chuẩn',
    periods: 1,
    duration: '10 phút',
    objectives: {
      knowledge: [
        '* Tình trạng sức khỏe trẻ: Trẻ có sức khoẻ tốt, ăn hết suất, ngủ sâu giấc.',
        '* Trạng thái cảm xúc, thái độ và hành vi của trẻ: Trẻ hứng thú tham gia tích cực vào các hoạt động.',
        '* Kiến thức, kỹ năng của trẻ: Trẻ nắm vững nội dung bài học, phát âm to rõ, biết giữ gìn đồ dùng đồ chơi của lớp.',
      ],
      generalCompetencies: ['Theo dõi và điều chỉnh kế hoạch giáo dục cho các ngày tiếp theo.'],
      subjectCompetencies: ['Đánh giá sự tiến bộ của từng cá nhân trẻ trong ngày.'],
      digitalCompetencies: [],
      aiCompetencies: [],
      qualities: ['Đảm bảo sự an toàn và phát triển toàn diện của trẻ.'],
    },
    equipment: {
      teacher: ['Sổ nhật ký lớp, sổ theo dõi sức khỏe và phát triển của trẻ.'],
      student: [],
      digitalAssets: [],
    },
    activities: [
      makeActivity(
        1,
        'Đánh giá cuối ngày',
        '10 phút',
        '* Tình trạng sức khỏe trẻ: Trẻ có sức khoẻ tốt, kiểm tra thân nhiệt bình thường.\n* Trạng thái cảm xúc, thái độ và hành vi của trẻ: Trẻ hứng thú tham gia vào các hoạt động học tập và vui chơi.\n* Kiến thức, kỹ năng của trẻ: Trẻ biết, gọi tên một số đồ dùng đồ chơi của lớp, biết giữ gìn đồ dùng đồ chơi.',
        'Trẻ duy trì tinh thần vui tươi, tích cực.'
      ),
    ],
    competencyMatrix: { nlsItems: [], aiItems: [] },
    appendix: {},
    imageSlotsUsed: [],
    generatedAt: new Date().toISOString(),
  };
}
