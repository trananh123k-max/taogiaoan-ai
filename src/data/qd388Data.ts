/**
 * DỮ LIỆU CHUẨN CÁC MÃ CHỈ BÁO VÀ LĨNH VỰC PHÁT TRIỂN THEO QUYẾT ĐỊNH SỐ 388/QĐ-BGDĐT
 * (Chương trình Giáo dục mầm non mới - Bộ Giáo dục và Đào tạo)
 * 
 * Gồm 5 Lĩnh vực phát triển chính:
 * 1. Thể chất (Mã: TC)
 * 2. Tình cảm – Xã hội (Mã: TX)
 * 3. Ngôn ngữ (Mã: NN)
 * 4. Nhận thức (Mã: NT)
 * 5. Nghệ thuật (Mã: NgT)
 */

export interface QD388Indicator {
  code: string;       // Ví dụ: "TC 1.1", "TX 4.4"
  title: string;      // Tên ngắn gọn
  description: string;// Mô tả chi tiết chỉ báo theo QĐ 388
  group?: string;     // Nhóm tiêu chuẩn (ví dụ: "TC1. Vận động thể chất")
}

export interface QD388Domain {
  id: 'TC' | 'TX' | 'NN' | 'NT' | 'NgT';
  name: string;
  codePrefix: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  indicators: QD388Indicator[];
}

export const QD388_DOMAINS: QD388Domain[] = [
  {
    id: 'TC',
    name: 'Phát triển Thể chất',
    codePrefix: 'TC',
    color: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
    indicators: [
      { code: 'TC 1.1', title: 'Hào hứng vận động', description: 'Chủ động, hào hứng tham gia vào các hoạt động thể chất đa dạng', group: 'TC1. Hoạt động thể chất' },
      { code: 'TC 1.2', title: 'Kiên trì đạt mục tiêu', description: 'Kiên trì, không bỏ cuộc cho đến khi đạt được mục tiêu hoạt động thể lực', group: 'TC1. Hoạt động thể chất' },
      { code: 'TC 1.3', title: 'Phối hợp cùng bạn', description: 'Sẵn sàng phối hợp với bạn, nhóm bạn trong quá trình hoạt động thể chất', group: 'TC1. Hoạt động thể chất' },
      { code: 'TC 1.4', title: 'Vận động thử thách', description: 'Tích cực tham gia các hoạt động thể chất có tính thử thách', group: 'TC1. Hoạt động thể chất' },
      { code: 'TC 2.1', title: 'Đáp ứng hoạt động', description: 'Chủ động thực hiện và đáp ứng yêu cầu hoạt động thể chất, chế độ sinh hoạt', group: 'TC2. Thích ứng thể chất' },
      { code: 'TC 2.2', title: 'Hòa nhập bạn chơi mới', description: 'Dễ dàng tham gia vào hoạt động thể chất với bạn chơi mới', group: 'TC2. Thích ứng thể chất' },
      { code: 'TC 3.1', title: 'Vận động di chuyển', description: 'Thực hiện các vận động di chuyển cơ bản: đi, chạy, nhảy, bò, trèo...', group: 'TC3. Vận động thô' },
      { code: 'TC 3.2', title: 'Vận động dụng cụ', description: 'Vận động với dụng cụ: ném xa, ném trúng đích, bắt bóng, đá bóng', group: 'TC3. Vận động thô' },
      { code: 'TC 3.3', title: 'Giữ thăng bằng', description: 'Vận động tại chỗ, giữ thăng bằng cơ thể khi dừng, quay người, nhún nhảy', group: 'TC3. Vận động thô' },
      { code: 'TC 3.4', title: 'Chuỗi vận động liên hoàn', description: 'Thực hiện liên hoàn chuỗi 3 - 4 vận động liên tục theo hướng dẫn', group: 'TC3. Vận động thô' },
      { code: 'TC 3.5', title: 'Vận động sinh hoạt', description: 'Thực hiện vận động thô linh hoạt trong sinh hoạt hằng ngày', group: 'TC3. Vận động thô' },
      { code: 'TC 4.1', title: 'Khéo léo ngón tay', description: 'Thao tác đồ vật, dụng cụ khéo léo, phối hợp tay - mắt nhịp nhàng', group: 'TC4. Vận động tinh' },
      { code: 'TC 4.2', title: 'Vận động tinh tạo hình', description: 'Vận động tinh khéo léo: cầm bút, gấp giấy, xé dán, cài cúc, buộc dây', group: 'TC4. Vận động tinh' },
      { code: 'TC 5.1', title: 'Dinh dưỡng hợp lý', description: 'Nhận biết thực phẩm có lợi, có hại và các nhóm chất dinh dưỡng', group: 'TC5. Ăn uống lành mạnh' },
      { code: 'TC 5.2', title: 'Văn minh ăn uống', description: 'Thực hiện hành vi văn minh, lịch sự và tự giác trong ăn uống', group: 'TC5. Ăn uống lành mạnh' },
      { code: 'TC 6.1', title: 'Vệ sinh cá nhân', description: 'Chủ động, thuần thục thực hiện các thao tác vệ sinh cá nhân hằng ngày', group: 'TC6. Chăm sóc vệ sinh' },
      { code: 'TC 6.2', title: 'Vận động & sức khỏe', description: 'Hiểu mối liên hệ giữa rèn luyện thân thể, vệ sinh với sức khỏe cơ thể', group: 'TC6. Chăm sóc vệ sinh' },
      { code: 'TC 6.3', title: 'Phòng tránh bệnh', description: 'Nhận biết dấu hiệu khi bị ốm, mệt và cách phòng tránh bệnh thông thường', group: 'TC6. Chăm sóc vệ sinh' },
      { code: 'TC 6.4', title: 'Vệ sinh môi trường', description: 'Giữ gìn vệ sinh môi trường lớp học, sân trường và nhà ở', group: 'TC6. Chăm sóc vệ sinh' },
      { code: 'TC 7.1', title: 'Nhận diện nguy hiểm', description: 'Nhận biết tình huống, vật dụng nguy hiểm và biết cách phòng tránh', group: 'TC7. Kỹ năng an toàn' },
      { code: 'TC 7.2', title: 'Quy tắc an toàn', description: 'Chấp hành nghiêm túc quy tắc an toàn khi vui chơi, sinh hoạt và tham gia giao thông', group: 'TC7. Kỹ năng an toàn' }
    ]
  },
  {
    id: 'TX',
    name: 'Phát triển Tình cảm – Xã hội',
    codePrefix: 'TX',
    color: 'rose',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-800',
    indicators: [
      { code: 'TX 1.1', title: 'Nhận biết bản thân', description: 'Nhận biết đặc điểm ngoại hình, sở thích, giới tính và khả năng của bản thân', group: 'TX1. Bản thân' },
      { code: 'TX 1.2', title: 'Bày tỏ nhu cầu', description: 'Thể hiện nhu cầu, khả năng và nguyện vọng của bản thân bằng nhiều cách', group: 'TX1. Bản thân' },
      { code: 'TX 1.3', title: 'Tự tin bày tỏ ý kiến', description: 'Bày tỏ điều bản thân thích và không thích một cách rõ ràng, tự tin', group: 'TX1. Bản thân' },
      { code: 'TX 2.1', title: 'Nhận diện cảm xúc', description: 'Nhận ra và gọi tên chính xác các cảm xúc của bản thân (vui, buồn, sợ, giận)', group: 'TX2. Quản lý cảm xúc' },
      { code: 'TX 2.2', title: 'Bày tỏ cảm xúc phù hợp', description: 'Sử dụng lời nói bày tỏ suy nghĩ, cảm xúc, quan điểm phù hợp chuẩn mực', group: 'TX2. Quản lý cảm xúc' },
      { code: 'TX 2.3', title: 'Ý thức hành vi', description: 'Nhận ra hành vi của bản thân có ảnh hưởng đến người xung quanh', group: 'TX2. Quản lý cảm xúc' },
      { code: 'TX 2.4', title: 'Điều chỉnh cảm xúc', description: 'Biết tự điều chỉnh cảm xúc, kiềm chế cơn nóng giận khi không vừa ý', group: 'TX2. Quản lý cảm xúc' },
      { code: 'TX 2.5', title: 'Nhận và sửa lỗi', description: 'Dũng cảm nhận lỗi và có hành động khắc phục, sửa chữa lỗi lầm', group: 'TX2. Quản lý cảm xúc' },
      { code: 'TX 3.1', title: 'Vị trí trong tập thể', description: 'Nhận biết vị trí của bản thân trong gia đình, trường, lớp và cộng đồng', group: 'TX3. Quan hệ xã hội' },
      { code: 'TX 3.2', title: 'Quan hệ gia đình - lớp', description: 'Nhận biết mối quan hệ và tình cảm giữa các thành viên trong gia đình và lớp học', group: 'TX3. Quan hệ xã hội' },
      { code: 'TX 4.1', title: 'Chủ động làm quen', description: 'Chủ động làm quen, bắt chuyện, rủ bạn cùng chơi và kết bạn mới', group: 'TX4. Kỹ năng giao tiếp' },
      { code: 'TX 4.2', title: 'Lễ phép thân thiện', description: 'Thể hiện phép lịch sự, lễ phép với người lớn, thân thiện với bạn bè', group: 'TX4. Kỹ năng giao tiếp' },
      { code: 'TX 4.3', title: 'Mạnh dạn tự tin', description: 'Mạnh dạn, tự tin phát biểu và giao tiếp khi tham gia vào hoạt động tập thể', group: 'TX4. Kỹ năng giao tiếp' },
      { code: 'TX 4.4', title: 'Hợp tác đoàn kết', description: 'Hợp tác, đoàn kết, chia sẻ đồ chơi và duy trì mối quan hệ tích cực với bạn bè', group: 'TX4. Kỹ năng giao tiếp' },
      { code: 'TX 4.5', title: 'Hòa giải mâu thuẫn', description: 'Biết thương lượng, nhường nhịn và giải quyết bất đồng, mâu thuẫn đơn giản khi chơi', group: 'TX4. Kỹ năng giao tiếp' },
      { code: 'TX 5.1', title: 'Đồng cảm thấu hiểu', description: 'Nhận ra cảm xúc của người khác qua nét mặt, cử chỉ và biết quan tâm, sẻ chia', group: 'TX5. Thể hiện tình cảm' },
      { code: 'TX 5.2', title: 'Bày tỏ yêu thương', description: 'Thể hiện tình cảm yêu thương, quan tâm, chăm sóc đối với người thân và bạn bè', group: 'TX5. Thể hiện tình cảm' },
      { code: 'TX 6.1', title: 'Tôn trọng người khác', description: 'Nhận biết và tôn trọng quyền lợi, sở thích, ý kiến của người khác', group: 'TX6. Tôn trọng khác biệt' },
      { code: 'TX 6.2', title: 'Chấp nhận khác biệt', description: 'Chấp nhận sự khác biệt về ngoại hình, hoàn cảnh của bạn bè và mọi người', group: 'TX6. Tôn trọng khác biệt' },
      { code: 'TX 6.3', title: 'Giúp đỡ bạn bè', description: 'Sẵn sàng giúp đỡ bạn bè và người xung quanh khi gặp khó khăn', group: 'TX6. Tôn trọng khác biệt' },
      { code: 'TX 6.4', title: 'Chờ đến lượt', description: 'Biết xếp hàng, kiên nhẫn chờ đến lượt khi tham gia các hoạt động tập thể', group: 'TX6. Tôn trọng khác biệt' },
      { code: 'TX 7.1', title: 'Ứng xử hoàn cảnh', description: 'Ứng xử phù hợp với các tình huống, ngữ cảnh giao tiếp và nơi công cộng', group: 'TX7. Thích ứng xã hội' },
      { code: 'TX 7.2', title: 'Thích ứng thời gian', description: 'Thích ứng với thời gian biểu của lớp, sự thay đổi thời tiết và môi trường sống', group: 'TX7. Thích ứng xã hội' },
      { code: 'TX 7.3', title: 'Chuẩn bị vào lớp 1', description: 'Hình thành tâm thế hào hứng, tự tin và các kỹ năng cần thiết sẵn sàng bước vào lớp 1', group: 'TX7. Thích ứng xã hội' },
      { code: 'TX 8.1', title: 'Chấp hành nề nếp', description: 'Chấp hành nghiêm túc quy định, nề nếp của trường, lớp, gia đình và nơi công cộng', group: 'TX8. Trách nhiệm cộng đồng' },
      { code: 'TX 8.2', title: 'Chăm sóc thiên nhiên', description: 'Yêu quý, chăm sóc cây xanh, hoa lá và các con vật nuôi gần gũi', group: 'TX8. Trách nhiệm cộng đồng' },
      { code: 'TX 8.3', title: 'Bảo vệ môi trường', description: 'Có ý thức giữ gìn vệ sinh, bảo vệ môi trường, tiết kiệm điện nước, bỏ rác đúng nơi', group: 'TX8. Trách nhiệm cộng đồng' }
    ]
  },
  {
    id: 'NN',
    name: 'Phát triển Ngôn ngữ',
    codePrefix: 'NN',
    color: 'blue',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-800',
    indicators: [
      { code: 'NN 1.1', title: 'Nghe hiểu câu', description: 'Lắng nghe và hiểu trọn vẹn các câu nói có độ dài từ 5 đến 7 tiếng', group: 'NN1. Lắng nghe' },
      { code: 'NN 1.2', title: 'Trao đổi chủ đề', description: 'Lắng nghe và trao đổi thông tin, đối thoại phù hợp với chủ đề hội thoại', group: 'NN1. Lắng nghe' },
      { code: 'NN 1.3', title: 'Thực hiện chỉ dẫn', description: 'Lắng nghe, ghi nhớ và thực hiện đúng theo 2 - 3 chỉ dẫn liên tiếp của cô', group: 'NN1. Lắng nghe' },
      { code: 'NN 2.1', title: 'Phát âm rõ ràng', description: 'Phát âm chuẩn xác, diễn đạt mạch lạc, nói tròn câu và đủ ý', group: 'NN2. Diễn đạt lời nói' },
      { code: 'NN 2.2', title: 'Vốn từ phong phú', description: 'Sử dụng từ ngữ phong phú, đa dạng kiểu câu khi giao tiếp với cô và bạn', group: 'NN2. Diễn đạt lời nói' },
      { code: 'NN 2.3', title: 'Kể lại sự việc', description: 'Kể lại câu chuyện hoặc sự việc theo đúng trình tự thời gian và diễn biến logic', group: 'NN2. Diễn đạt lời nói' },
      { code: 'NN 2.4', title: 'Biểu cảm khi nói', description: 'Kết hợp lời nói với cử chỉ, điệu bộ, ánh mắt để biểu đạt cảm xúc sinh động', group: 'NN2. Diễn đạt lời nói' },
      { code: 'NN 2.5', title: 'Giao tiếp lễ phép', description: 'Sử dụng các từ ngữ nghi thức, xưng hô lễ phép, đúng mực trong giao tiếp', group: 'NN2. Diễn đạt lời nói' },
      { code: 'NN 2.6', title: 'Điều chỉnh giọng nói', description: 'Điều chỉnh âm lượng, ngữ điệu và tốc độ giọng nói phù hợp hoàn cảnh', group: 'NN2. Diễn đạt lời nói' },
      { code: 'NN 3.1', title: 'Sáng tạo ngôn ngữ', description: 'Sử dụng từ ngữ sáng tạo, đặt câu, sáng tác câu chuyện hoặc lời thoại theo cách riêng', group: 'NN3. Ngôn ngữ sáng tạo' },
      { code: 'NN 3.2', title: 'Đọc thơ kể chuyện', description: 'Đọc thơ, kể chuyện, đóng kịch diễn cảm, nhập vai tự nhiên', group: 'NN3. Ngôn ngữ sáng tạo' },
      { code: 'NN 4.1', title: 'Hứng thú với sách', description: 'Chủ động lựa chọn, xem sách tranh và các ấn phẩm phù hợp lứa tuổi', group: 'NN4. Làm quen với sách' },
      { code: 'NN 4.2', title: 'Chăm chú nghe đọc', description: 'Chăm chú lắng nghe người lớn đọc sách, hào hứng đặt câu hỏi tìm hiểu nội dung', group: 'NN4. Làm quen với sách' },
      { code: 'NN 4.3', title: 'Giữ gìn sách', description: 'Biết nâng niu, giữ gìn sách cẩn thận, không làm rách hoặc vẽ bậy lên sách', group: 'NN4. Làm quen với sách' },
      { code: 'NN 5.1', title: 'Nhận biết chữ cái', description: 'Nhận biết và phát âm đúng các chữ cái trong bảng chữ cái tiếng Việt', group: 'NN5. Làm quen chữ viết' },
      { code: 'NN 5.2', title: 'Kỹ năng xem sách', description: 'Cầm sách đúng chiều, giở từng trang từ trái sang phải, theo dõi từ trên xuống dưới', group: 'NN5. Làm quen chữ viết' },
      { code: 'NN 6.1', title: 'Hứng thú vẽ viết', description: 'Hứng thú tham gia các hoạt động vẽ, viết, tạo hình các biểu tượng chữ', group: 'NN6. Hứng thú viết' },
      { code: 'NN 6.2', title: 'Bảo quản đồ dùng', description: 'Giữ gìn cẩn thận bút vẽ, sáp màu, vở bài tập trong quá trình sử dụng', group: 'NN6. Hứng thú viết' },
      { code: 'NN 7.1', title: 'Ý nghĩa chữ viết', description: 'Hiểu rằng chữ viết ghi lại lời nói và truyền tải thông điệp ý nghĩa', group: 'NN7. Kỹ năng tiền viết' },
      { code: 'NN 7.2', title: 'Tư thế cầm bút', description: 'Cầm bút đúng cách bằng 3 ngón tay, ngồi đúng tư thế, mắt cách vở hợp lý', group: 'NN7. Kỹ năng tiền viết' },
      { code: 'NN 7.3', title: 'Tô đồ nét chữ', description: 'Tô, đồ trùng khít các nét cơ bản, sao chép chữ cái và tên của mình theo hướng từ trái sang phải', group: 'NN7. Kỹ năng tiền viết' }
    ]
  },
  {
    id: 'NT',
    name: 'Phát triển Nhận thức',
    codePrefix: 'NT',
    color: 'amber',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
    indicators: [
      { code: 'NT 1.1', title: 'Tò mò khám phá', description: 'Tò mò, hào hứng tham gia hoạt động trải nghiệm, khám phá thế giới xung quanh', group: 'NT1. Tìm hiểu thế giới' },
      { code: 'NT 1.2', title: 'Đặt câu hỏi tìm hiểu', description: 'Thường xuyên đặt câu hỏi: "Tại sao?", "Như thế nào?", "Để làm gì?" về sự vật hiện tượng', group: 'NT1. Tìm hiểu thế giới' },
      { code: 'NT 1.3', title: 'Tích cực trải nghiệm', description: 'Tích cực, chủ động tìm tòi và thao tác trải nghiệm với các đồ vật mới lạ', group: 'NT1. Tìm hiểu thế giới' },
      { code: 'NT 2.1', title: 'Tự chọn cách khám phá', description: 'Tự chọn phương thức, đồ vật để thực hiện việc khám phá khoa học, xã hội', group: 'NT2. Khám phá chủ động' },
      { code: 'NT 2.2', title: 'Kiên trì quan sát', description: 'Kiên trì theo dõi, quan sát sự thay đổi và quá trình vận động của sự vật', group: 'NT2. Khám phá chủ động' },
      { code: 'NT 2.3', title: 'Tìm kiếm hỗ trợ', description: 'Biết tìm kiếm sự hỗ trợ, trao đổi với cô và bạn khi gặp vấn đề chưa hiểu', group: 'NT2. Khám phá chủ động' },
      { code: 'NT 3.1', title: 'Đặc điểm đồ vật', description: 'Mô tả đặc điểm, tên gọi, công dụng, chất liệu của các đồ vật, sự vật quen thuộc', group: 'NT3. Hiểu biết sự vật' },
      { code: 'NT 3.2', title: 'Quan hệ nguyên nhân', description: 'Hiểu mối liên hệ đơn giản giữa nguyên nhân - kết quả trong đời sống sinh hoạt', group: 'NT3. Hiểu biết sự vật' },
      { code: 'NT 3.3', title: 'Quá trình phát triển', description: 'Nhận biết quá trình sinh trưởng và phát triển của cây cối, con vật gần gũi', group: 'NT3. Hiểu biết sự vật' },
      { code: 'NT 3.4', title: 'Biểu tượng toán học', description: 'Nhận biết số lượng, hình dạng, kích thước của các đối tượng cụ thể', group: 'NT3. Hiểu biết sự vật' },
      { code: 'NT 3.5', title: 'Quy tắc sắp xếp', description: 'Phát hiện và tiếp tục thực hiện quy tắc sắp xếp lặp lại đơn giản theo mẫu', group: 'NT3. Hiểu biết sự vật' },
      { code: 'NT 4.1', title: 'So sánh đối tượng', description: 'So sánh, chỉ ra điểm giống nhau và khác nhau rõ nét giữa 2 - 3 đối tượng', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 4.2', title: 'Phân loại đối tượng', description: 'Phân loại đối tượng dựa vào 1 - 2 dấu hiệu đặc trưng (màu sắc, hình dạng, công dụng)', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 4.3', title: 'Thu thập thông tin', description: 'Thu thập thông tin đơn giản qua đếm, quan sát và ghi nhận kết quả', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 4.4', title: 'Đếm và thêm bớt', description: 'Đếm, thêm - bớt, tách - gộp nhóm đối tượng trong phạm vi 10 và biểu thị kết quả', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 4.5', title: 'Kỹ năng đo lường', description: 'Sử dụng thước đo hoặc dụng cụ đo đơn giản để so sánh chiều dài, dung tích', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 4.6', title: 'Định hướng không gian', description: 'Xác định chính xác vị trí trong không gian: trên/dưới, trước/sau, phải/trái', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 4.7', title: 'Định hướng thời gian', description: 'Nhận biết các mốc thời gian: sáng, trưa, chiều, tối, hôm qua, hôm nay, ngày mai', group: 'NT4. Thao tác tư duy' },
      { code: 'NT 5.1', title: 'Nhận diện vấn đề', description: 'Quan sát, nhận ra vấn đề đơn giản nảy sinh trong học tập và vui chơi', group: 'NT5. Giải quyết vấn đề' },
      { code: 'NT 5.2', title: 'Đề xuất giải pháp', description: 'Đề xuất cách giải quyết và thử nghiệm giải quyết vấn đề dựa trên phán đoán', group: 'NT5. Giải quyết vấn đề' },
      { code: 'NT 5.3', title: 'Ứng dụng thực tế', description: 'Ứng dụng kiến thức toán học, khoa học vào giải quyết tình huống hằng ngày', group: 'NT5. Giải quyết vấn đề' },
      { code: 'NT 6.1', title: 'Hành động phù hợp', description: 'Thực hiện hành động đơn giản phù hợp với sự vật, hiện tượng và môi trường xung quanh', group: 'NT6. Ứng xử với môi trường' },
      { code: 'NT 6.2', title: 'Điều chỉnh hành vi', description: 'Điều chỉnh hành động phù hợp với quy luật tự nhiên và bảo vệ môi trường', group: 'NT6. Ứng xử với môi trường' }
    ]
  },
  {
    id: 'NgT',
    name: 'Phát triển Nghệ thuật',
    codePrefix: 'NgT',
    color: 'purple',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-800',
    indicators: [
      { code: 'NgT 1.1', title: 'Cảm thụ vẻ đẹp', description: 'Bày tỏ cảm xúc vui sướng, ngạc nhiên trước vẻ đẹp thiên nhiên, con người và nghệ thuật', group: 'NgT1. Cảm thụ cái đẹp' },
      { code: 'NgT 1.2', title: 'Nghệ thuật dân gian', description: 'Yêu thích, trân trọng nét đẹp văn hóa, nghệ thuật truyền thống của dân tộc', group: 'NgT1. Cảm thụ cái đẹp' },
      { code: 'NgT 1.3', title: 'Tôn trọng sản phẩm bạn', description: 'Nhận ra nét đẹp và tôn trọng sản phẩm sáng tạo nghệ thuật của bạn', group: 'NgT1. Cảm thụ cái đẹp' },
      { code: 'NgT 1.4', title: 'Chia sẻ cảm nhận', description: 'Tự tin chia sẻ cảm nhận, nêu ý kiến và lời khen ngợi tác phẩm đẹp', group: 'NgT1. Cảm thụ cái đẹp' },
      { code: 'NgT 2.1', title: 'Nhớ bài hát', description: 'Nhớ tên bài hát, bản nhạc và hiểu nội dung chủ đề âm nhạc', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.2', title: 'Cảm thụ tính chất nhạc', description: 'Cảm nhận sắc thái âm nhạc: vui vẻ, êm dịu, sôi động, rộn ràng', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.3', title: 'Vỗ tay theo nhịp', description: 'Nhận biết và vận động, vỗ tay đúng nhịp, phách, tiết tấu bài hát', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.4', title: 'Phân biệt âm thanh', description: 'Phân biệt âm thanh cao - thấp, dài - ngắn, to - nhỏ của các loại nhạc cụ', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.5', title: 'Hát đúng giai điệu', description: 'Hát rõ lời, đúng giai điệu và biết thể hiện sắc thái tình cảm theo bài hát', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.6', title: 'Vận động theo nhạc', description: 'Vận động múa, nhún nhảy nhịp nhàng, biểu cảm theo giai điệu bài hát', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.7', title: 'Gõ đệm tiết tấu', description: 'Sử dụng các nhạc cụ gõ đệm theo bài hát đúng nhịp phách, tiết tấu', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 2.8', title: 'Tự tin biểu diễn', description: 'Tự tin biểu diễn văn nghệ trước đám đông hoặc nhóm bạn một cách hào hứng', group: 'NgT2. Âm nhạc' },
      { code: 'NgT 3.1', title: 'Khám phá vật liệu', description: 'Khám phá, thử nghiệm với nhiều nguyên vật liệu và dụng cụ tạo hình khác nhau', group: 'NgT3. Tạo hình' },
      { code: 'NgT 3.2', title: 'Phối màu bố cục', description: 'Phối hợp đa dạng đường nét, màu sắc, bố cục để tạo ra sản phẩm theo ý tưởng', group: 'NgT3. Tạo hình' },
      { code: 'NgT 3.3', title: 'Thuyết minh sản phẩm', description: 'Tự tin giới thiệu, đặt tên và thuyết minh về sản phẩm tạo hình của bản thân', group: 'NgT3. Tạo hình' },
      { code: 'NgT 4.1', title: 'Nhận diện kịch', description: 'Nhận biết các nhân vật, bối cảnh, đạo cụ và cốt truyện trong vở kịch', group: 'NgT4. Hoạt động kịch' },
      { code: 'NgT 4.2', title: 'Diễn xuất nhân vật', description: 'Bắt chước lời nói, điệu bộ, cử chỉ của nhân vật trong kịch phân vai', group: 'NgT4. Hoạt động kịch' },
      { code: 'NgT 5.1', title: 'Sáng tạo âm thanh', description: 'Tự do sáng tạo ra các âm thanh vui nhộn từ cơ thể hoặc đồ vật xung quanh', group: 'NgT5. Sáng tạo âm nhạc' },
      { code: 'NgT 5.2', title: 'Múa hát ngẫu hứng', description: 'Ngẫu hứng vận động múa, đặt lời ca mới theo giai điệu quen thuộc', group: 'NgT5. Sáng tạo âm nhạc' },
      { code: 'NgT 6.1', title: 'Ý tưởng tạo hình độc đáo', description: 'Sáng tạo ra các chi tiết mới mẻ, độc đáo trong sản phẩm tạo hình', group: 'NgT6. Sáng tạo tạo hình' },
      { code: 'NgT 6.2', title: 'Tận dụng đồ tái chế', description: 'Tận dụng nguyên vật liệu thiên nhiên, phế liệu tái chế làm đồ dùng đồ chơi', group: 'NgT6. Sáng tạo tạo hình' },
      { code: 'NgT 6.3', title: 'Trang trí không gian', description: 'Sử dụng sản phẩm nghệ thuật tạo hình trang trí góc chơi, lớp học đẹp mắt', group: 'NgT6. Sáng tạo tạo hình' },
      { code: 'NgT 7.1', title: 'Tự chọn vai kịch', description: 'Tự lựa chọn trang phục, hóa trang phù hợp nhân vật kịch yêu thích', group: 'NgT7. Sáng tạo kịch' },
      { code: 'NgT 7.2', title: 'Sáng tạo lời thoại', description: 'Tự do thay đổi về lời thoại, cử chỉ để thể hiện vai diễn độc đáo của bản thân', group: 'NgT7. Sáng tạo kịch' },
      { code: 'NgT 7.3', title: 'Kịch bản phân vai', description: 'Độc lập hoặc phối hợp với bạn sáng tác ra câu chuyện để cùng diễn xuất', group: 'NgT7. Sáng tạo kịch' }
    ]
  }
];

/**
 * Danh mục bộ mã khuyến nghị chuẩn theo Quyết định số 388/QĐ-BGDĐT
 * cho 8 (và 9) Hoạt động mầm non mới tích hợp
 */
export const QD388_DEFAULT_CODES_BY_ACTIVITY: Record<string, {
  summary: string;
  codes: string[];
  bySection: {
    knowledge: string;
    skills: string;
    qualities: string;
    competencies: string;
  };
  note: string;
}> = {
  'HOẠT ĐỘNG VUI CHƠI TRONG LỚP': {
    summary: 'NT 3.1, TX 3.2, TX 4.3, TX 4.4, NN 2.2, TX 8.1',
    codes: ['NT 3.1', 'TX 3.2', 'TX 4.3', 'TX 4.4', 'NN 2.2', 'TX 8.1'],
    bySection: {
      knowledge: 'NT 3.1, TX 3.2, TX 4.3',
      skills: 'TX 4.4, NN 2.2',
      qualities: 'TX 4.4, TX 8.1',
      competencies: 'Tự lực lựa chọn góc chơi, Hợp tác nhóm'
    },
    note: 'Chuẩn Hoạt động góc / Vui chơi trong lớp: Lắp ghép, thỏa thuận vai chơi, giao tiếp thân thiện, thu dọn ngăn nắp.'
  },
  'HOẠT ĐỘNG NGOÀI TRỜI': {
    summary: 'NT 1.1, NT 1.2, NT 3.1, TC 1.1, TC 1.2, TC 3.1, TC 3.3, NN 2.2, TX 4.4',
    codes: ['NT 1.1', 'NT 1.2', 'NT 3.1', 'TC 1.1', 'TC 1.2', 'TC 3.1', 'TC 3.3', 'NN 2.2', 'TX 4.4'],
    bySection: {
      knowledge: 'NT 1.1, NT 1.2, NT 3.1, TC 1.1, TC 3.3',
      skills: 'NN 2.2, NT 1.2, TC 1.2, TC 3.1',
      qualities: 'TX 4.4, TX 8.3 (Yêu thiên nhiên, đoàn kết)',
      competencies: 'Thích ứng môi trường tự nhiên, Tự lực bảo vệ an toàn'
    },
    note: 'Quan sát đối tượng tự nhiên, chơi trò chơi vận động/dân gian, giao lưu tiếp xúc không gian thoáng ngoài trời.'
  },
  'TRÒ CHƠI VẬN ĐỘNG': {
    summary: 'TC 1.1, TC 1.2, TC 1.3, TC 3.1, TC 3.3, TX 4.4',
    codes: ['TC 1.1', 'TC 1.2', 'TC 1.3', 'TC 3.1', 'TC 3.3', 'TX 4.4'],
    bySection: {
      knowledge: 'TC 1.1, TC 3.3',
      skills: 'TC 1.2, TC 1.3, TC 3.1',
      qualities: 'TX 4.4, TX 2.4 (Tinh thần đồng đội, trung thực)',
      competencies: 'Vận động khéo léo, Thích ứng hiệu lệnh'
    },
    note: 'Phát triển thể lực, phản xạ nhanh nhẹn, kỹ năng chạy nhảy, vượt chướng ngại vật và phối hợp nhóm.'
  },
  'TRÒ CHƠI HỌC TẬP': {
    summary: 'NT 1.1, NT 1.2, NT 3.1, NT 4.1, NN 2.2, TX 4.4',
    codes: ['NT 1.1', 'NT 1.2', 'NT 3.1', 'NT 4.1', 'NN 2.2', 'TX 4.4'],
    bySection: {
      knowledge: 'NT 1.1, NT 3.1, NT 4.1',
      skills: 'NT 1.2, NN 2.2, TC 1.2',
      qualities: 'TX 4.4, TX 2.4 (Hào hứng, chia sẻ, trung thực)',
      competencies: 'Tư duy nhận thức, Giải quyết vấn đề, Hợp tác nhóm'
    },
    note: 'Củng cố kiến thức toán, khoa học, ngôn ngữ qua luật chơi và nhiệm vụ nhận thức hấp dẫn.'
  },
  'HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG': {
    summary: 'TC 6.1, TC 6.2, TC 6.3, TX 7.3, TX 8.1, NN 2.2, NT 1.1',
    codes: ['TC 6.1', 'TC 6.2', 'TC 6.3', 'TX 7.3', 'TX 8.1', 'NN 2.2', 'NT 1.1'],
    bySection: {
      knowledge: 'TC 6.1, NN 2.2, NT 1.1, TX 7.3, TC 6.2',
      skills: 'TC 6.1, TC 1.2, TX 8.1, TC 6.3',
      qualities: 'TX 8.1 (Tự lập, cẩn thận, trách nhiệm)',
      competencies: 'Năng lực tự phục vụ (tự lực), Thích ứng tình huống thực tế'
    },
    note: 'Rèn luyện kỹ năng sống, vệ sinh tự phục vụ, thoát hiểm an toàn, ứng xử văn minh theo quy trình chuẩn.'
  },
  'TRÒ CHƠI DÂN GIAN': {
    summary: 'NN 2.1, NN 2.2, TC 1.1, TC 1.2, TX 4.4',
    codes: ['NN 2.1', 'NN 2.2', 'TC 1.1', 'TC 1.2', 'TX 4.4'],
    bySection: {
      knowledge: 'NN 2.1, TC 1.1, TX 4.4',
      skills: 'NN 2.2, TC 1.2',
      qualities: 'TX 4.4 (Yêu mến nét đẹp văn hóa truyền thống)',
      competencies: 'Cảm thụ ngôn ngữ nhịp điệu đồng dao, Giao tiếp hợp tác'
    },
    note: 'Đồng dao, bài hát dân gian kết hợp trò chơi vận động tập thể (Rồng rắn lên mây, Kéo cưa lừa xẻ...).'
  },
  'HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT': {
    summary: 'NN 1.2, NN 2.1, NN 2.2, NN 2.3, NN 3.1, TX 3.2',
    codes: ['NN 1.2', 'NN 2.1', 'NN 2.2', 'NN 2.3', 'NN 3.1', 'TX 3.2'],
    bySection: {
      knowledge: 'NN 1.2, NN 2.1, TX 3.2',
      skills: 'NN 2.2, NN 2.3, NN 3.1',
      qualities: 'TX 4.3 (Tự tin, mạnh dạn trong giao tiếp)',
      competencies: 'Giao tiếp ngôn ngữ, Lắng nghe và diễn đạt ý nghĩ mạch lạc'
    },
    note: 'Dành cho trẻ vùng dân tộc thiểu số hoặc tăng cường vốn từ, luyện phát âm chuẩn tiếng Việt.'
  },
  'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI': {
    summary: 'NN 5.1, NN 7.1, NN 7.2, NN 7.3, TC 4.1, TX 8.1',
    codes: ['NN 5.1', 'NN 7.1', 'NN 7.2', 'NN 7.3', 'TC 4.1', 'TX 8.1'],
    bySection: {
      knowledge: 'NN 5.1, NN 7.1, NN 7.2',
      skills: 'NN 7.2, NN 7.3, TC 4.1',
      qualities: 'TX 8.1 (Kiên trì, cẩn thận, giữ vở sạch)',
      competencies: 'Tự lực trong học tập, Khéo léo cơ ngón tay'
    },
    note: 'Tư thế ngồi, cách cầm bút 3 ngón, xác định dòng kẻ, điểm đặt bút - rê bút - dừng bút trùng khít nét chấm mờ.'
  },
  'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI': {
    summary: 'NN 5.1, NN 5.2, NT 1.1, NN 2.2, TC 1.2, TX 4.4',
    codes: ['NN 5.1', 'NN 5.2', 'NT 1.1', 'NN 2.2', 'TC 1.2', 'TX 4.4'],
    bySection: {
      knowledge: 'NN 5.1, NN 5.2, NT 1.1',
      skills: 'NN 2.2, TC 1.2, TX 4.4',
      qualities: 'TX 4.4 (Hào hứng thi đua, trung thực, đoàn kết)',
      competencies: 'Nhận diện chữ cái, Hợp tác nhóm, Phản xạ nhanh'
    },
    note: 'Củng cố nhận diện mặt chữ cái, phát âm chuẩn thông qua các trò chơi vận động và trí tuệ sinh động.'
  }
};

/**
 * Lấy bộ mã chuẩn theo QĐ 388 dựa theo tên hoạt động
 */
export function getDefaultQD388ForSubject(subject: string = ''): typeof QD388_DEFAULT_CODES_BY_ACTIVITY[string] | null {
  const s = (subject || '').trim().toUpperCase();
  for (const [key, val] of Object.entries(QD388_DEFAULT_CODES_BY_ACTIVITY)) {
    if (s.includes(key.toUpperCase()) || key.toUpperCase().includes(s)) {
      return val;
    }
  }

  // Keywords fallback
  const sLower = s.toLowerCase();
  if (sLower.includes('vui chơi trong lớp') || sLower.includes('góc')) return QD388_DEFAULT_CODES_BY_ACTIVITY['HOẠT ĐỘNG VUI CHƠI TRONG LỚP'];
  if (sLower.includes('ngoài trời')) return QD388_DEFAULT_CODES_BY_ACTIVITY['HOẠT ĐỘNG NGOÀI TRỜI'];
  if (sLower.includes('vận động')) return QD388_DEFAULT_CODES_BY_ACTIVITY['TRÒ CHƠI VẬN ĐỘNG'];
  if (sLower.includes('học tập')) return QD388_DEFAULT_CODES_BY_ACTIVITY['TRÒ CHƠI HỌC TẬP'];
  if (sLower.includes('kỹ năng')) return QD388_DEFAULT_CODES_BY_ACTIVITY['HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG'];
  if (sLower.includes('dân gian')) return QD388_DEFAULT_CODES_BY_ACTIVITY['TRÒ CHƠI DÂN GIAN'];
  if (sLower.includes('tăng cường tiếng việt') || sLower.includes('tctv')) return QD388_DEFAULT_CODES_BY_ACTIVITY['HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT'];
  if (sLower.includes('tập tô')) return QD388_DEFAULT_CODES_BY_ACTIVITY['HOẠT ĐỘNG TẬP TÔ CHỮ CÁI'];
  if (sLower.includes('trò chơi chữ cái')) return QD388_DEFAULT_CODES_BY_ACTIVITY['HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI'];

  return null;
}
