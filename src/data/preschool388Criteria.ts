export interface Criterion388 {
  code: string; // e.g. "NT 3.1", "TC 1.1"
  domain: 'TC' | 'TX' | 'NN' | 'NT' | 'NgT';
  domainName: string; // "Thể chất", "Tình cảm - Xã hội", "Ngôn ngữ", "Nhận thức", "Nghệ thuật"
  content: string; // Nội dung chi tiết của tiêu chí yêu cầu cần đạt theo QĐ 388
  group?: string; // Nhóm năng lực (ví dụ: TC1. Tích cực tham gia hoạt động thể chất)
  targetType?: 'knowledge' | 'skill' | 'attitude';
}

// TOÀN BỘ DANH MỤC TIÊU CHÍ YÊU CẦU CẦN ĐẠT THEO QUYẾT ĐỊNH SỐ 388/QĐ-BGDĐT (NGÀY 12/02/2026)
export const CRITERIA_388_DATABASE: Criterion388[] = [
  // ==========================================
  // 1. LĨNH VỰC THỂ CHẤT (TC)
  // ==========================================
  {
    code: 'TC 1.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC1. Tích cực tham gia vào các hoạt động thể chất',
    content: 'Chủ động, hào hứng tham gia vào hoạt động thể chất đa dạng.',
    targetType: 'attitude'
  },
  {
    code: 'TC 1.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC1. Tích cực tham gia vào các hoạt động thể chất',
    content: 'Không bỏ cuộc cho đến khi đạt mục tiêu.',
    targetType: 'attitude'
  },
  {
    code: 'TC 1.3',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC1. Tích cực tham gia vào các hoạt động thể chất',
    content: 'Sẵn sàng phối hợp với bạn, nhóm bạn trong quá trình hoạt động.',
    targetType: 'attitude'
  },
  {
    code: 'TC 1.4',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC1. Tích cực tham gia vào các hoạt động thể chất',
    content: 'Tham gia các hoạt động thể chất có tính thử thách.',
    targetType: 'attitude'
  },
  {
    code: 'TC 1.5',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC1. Tích cực tham gia vào các hoạt động thể chất',
    content: 'Tìm kiếm cách khác để thực hiện nhiệm vụ vận động.',
    targetType: 'skill'
  },
  {
    code: 'TC 2.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC2. Thích ứng được với sự thay đổi của hoạt động thể chất và chế độ sinh hoạt',
    content: 'Chủ động thực hiện và đáp ứng được yêu cầu của các hoạt động thể chất và chế độ sinh hoạt khi có sự thay đổi.',
    targetType: 'skill'
  },
  {
    code: 'TC 2.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC2. Thích ứng được với sự thay đổi của hoạt động thể chất và chế độ sinh hoạt',
    content: 'Dễ dàng tham gia vào hoạt động thể chất với nhóm bạn chơi mới, môi trường mới.',
    targetType: 'attitude'
  },
  {
    code: 'TC 3.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC3. Thực hiện các vận động thô',
    content: 'Thực hiện được các vận động di chuyển trong điều kiện, yêu cầu khác nhau, thể hiện khả năng kiểm soát vận động, giữ thăng bằng ổn định khi di chuyển trên các địa hình khác nhau, tăng tốc độ và sức bền.',
    targetType: 'skill'
  },
  {
    code: 'TC 3.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC3. Thực hiện các vận động thô',
    content: 'Thực hiện được các vận động với dụng cụ, thiết bị, vận động với người khác: đập và bắt bóng bằng 2 tay; ném và bắt bóng với GV cự ly tối thiểu 3m, ném trúng đích đứng xa 2m, cao 1,5m; đá bóng lăn; trèo lên xuống mô hình.',
    targetType: 'skill'
  },
  {
    code: 'TC 3.3',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC3. Thực hiện các vận động thô',
    content: 'Thực hiện được các vận động tại chỗ và giữ thăng bằng tĩnh: đứng trên 1 chân tối thiểu 10 giây, xoay tròn tại chỗ và giữ thăng bằng khi dừng lại.',
    targetType: 'skill'
  },
  {
    code: 'TC 3.4',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC3. Thực hiện các vận động thô',
    content: 'Thực hiện được liền mạch chuỗi 3 – 4 vận động.',
    targetType: 'skill'
  },
  {
    code: 'TC 3.5',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC3. Thực hiện các vận động thô',
    content: 'Thực hiện thành thạo vận động thô trong hoạt động sinh hoạt hằng ngày.',
    targetType: 'skill'
  },
  {
    code: 'TC 4.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC4. Thực hiện các vận động tinh',
    content: 'Thao tác với đồ vật, vật liệu đa dạng, phối hợp tay – mắt: thao tác dễ dàng với đồ vật nhỏ, xếp ghép, nặn, dán, đan tết, cắt đường bao thẳng và cong, vẽ đa dạng các hình.',
    targetType: 'skill'
  },
  {
    code: 'TC 4.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC4. Thực hiện các vận động tinh',
    content: 'Thực hiện được những hoạt động sinh hoạt, chơi, tập cần sự khéo léo của bàn tay, ngón tay với sự thành thạo, chủ động, độc lập.',
    targetType: 'skill'
  },
  {
    code: 'TC 5.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC5. Biết và thực hiện ăn uống hợp lý',
    content: 'Nhận biết các nhóm chất dinh dưỡng, phân biệt thực phẩm có lợi và có hại cho sức khoẻ, lợi ích của ăn uống hợp lý.',
    targetType: 'knowledge'
  },
  {
    code: 'TC 5.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC5. Biết và thực hiện ăn uống hợp lý',
    content: 'Thực hiện các hành vi văn minh trong ăn uống với sự thành thạo, chủ động.',
    targetType: 'skill'
  },
  {
    code: 'TC 5.3',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC5. Biết và thực hiện ăn uống hợp lý',
    content: 'Ăn được đa dạng thực phẩm, món ăn; hạn chế ăn những thực phẩm có hại cho sức khoẻ.',
    targetType: 'skill'
  },
  {
    code: 'TC 5.4',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC5. Biết và thực hiện ăn uống hợp lý',
    content: 'Tự làm được một số món ăn, đồ uống đơn giản và thu dọn sau khi hoạt động.',
    targetType: 'skill'
  },
  {
    code: 'TC 6.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC6. Biết chăm sóc sức khoẻ và thực hành vệ sinh',
    content: 'Chủ động và thực hiện thuần thục các hành vi vệ sinh cá nhân (rửa tay bằng xà phòng, đánh răng, lau mặt...).',
    targetType: 'skill'
  },
  {
    code: 'TC 6.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC6. Biết chăm sóc sức khoẻ và thực hành vệ sinh',
    content: 'Biết về mối quan hệ giữa luyện tập, giữ vệ sinh, phòng bệnh với sức khoẻ và chủ động chăm sóc sức khoẻ.',
    targetType: 'knowledge'
  },
  {
    code: 'TC 6.3',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC6. Biết chăm sóc sức khoẻ và thực hành vệ sinh',
    content: 'Nhận ra biểu hiện thường gặp khi bị bệnh và thực hiện những quy tắc phòng dịch, bệnh đã được hướng dẫn.',
    targetType: 'knowledge'
  },
  {
    code: 'TC 6.4',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC6. Biết chăm sóc sức khoẻ và thực hành vệ sinh',
    content: 'Chủ động thực hiện các hành vi giữ vệ sinh môi trường xung quanh và nhắc người khác cùng thực hiện.',
    targetType: 'skill'
  },
  {
    code: 'TC 7.1',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC7. Biết và có kỹ năng bảo đảm an toàn',
    content: 'Nhận ra tình huống nguy hiểm và biết cách xử lý phù hợp.',
    targetType: 'knowledge'
  },
  {
    code: 'TC 7.2',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC7. Biết và có kỹ năng bảo đảm an toàn',
    content: 'Chủ động thực hiện theo hướng dẫn về các quy tắc an toàn và nói được vì sao cần làm như vậy.',
    targetType: 'skill'
  },
  {
    code: 'TC 7.3',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC7. Biết và có kỹ năng bảo đảm an toàn',
    content: 'Xác định được người lớn có thể giúp đỡ trong những tình huống nguy hiểm.',
    targetType: 'skill'
  },
  {
    code: 'TC 7.4',
    domain: 'TC',
    domainName: 'Thể chất',
    group: 'TC7. Biết và có kỹ năng bảo đảm an toàn',
    content: 'Tỏ thái độ không đồng tình với những hành vi gây mất an toàn.',
    targetType: 'attitude'
  },

  // ==========================================
  // 2. LĨNH VỰC TÌNH CẢM - XÃ HỘI (TX)
  // ==========================================
  {
    code: 'TX 1.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX1. Nhận biết về bản thân',
    content: 'Tự nhận diện đặc điểm bề ngoài, sở thích, khả năng của bản thân.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 1.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX1. Nhận biết về bản thân',
    content: 'Thể hiện nhu cầu, khả năng của bản thân bằng nhiều cách khác nhau.',
    targetType: 'skill'
  },
  {
    code: 'TX 1.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX1. Nhận biết về bản thân',
    content: 'Thể hiện điều bản thân thích và không thích rõ ràng, đúng lúc.',
    targetType: 'skill'
  },
  {
    code: 'TX 2.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX2. Quản lý bản thân',
    content: 'Nhận ra và gọi tên các cảm xúc của bản thân (vui, buồn, tức giận, ngạc nhiên, lo lắng...).',
    targetType: 'knowledge'
  },
  {
    code: 'TX 2.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX2. Quản lý bản thân',
    content: 'Sử dụng lời nói để thể hiện suy nghĩ, cảm xúc, ý kiến của bản thân phù hợp.',
    targetType: 'skill'
  },
  {
    code: 'TX 2.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX2. Quản lý bản thân',
    content: 'Nhận ra được cảm xúc, hành vi của bản thân có ảnh hưởng đối với người khác.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 2.4',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX2. Quản lý bản thân',
    content: 'Điều chỉnh cảm xúc khi không được như ý muốn.',
    targetType: 'skill'
  },
  {
    code: 'TX 2.5',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX2. Quản lý bản thân',
    content: 'Biết nhận lỗi và biết sửa lỗi chân thành.',
    targetType: 'attitude'
  },
  {
    code: 'TX 2.6',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX2. Quản lý bản thân',
    content: 'Phản ánh đúng hành động của bản thân, kể lại sự việc đơn giản theo sự thật.',
    targetType: 'attitude'
  },
  {
    code: 'TX 3.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX3. Nhận biết về các mối quan hệ xã hội',
    content: 'Nhận biết và ứng xử phù hợp với vị trí của trẻ trong gia đình, trường, lớp, cộng đồng.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 3.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX3. Nhận biết về các mối quan hệ xã hội',
    content: 'Nhận biết vị trí của mỗi thành viên trong gia đình, nhóm lớp, cộng đồng.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 3.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX3. Nhận biết về các mối quan hệ xã hội',
    content: 'Nhận biết một số ngày lễ, ngày hội truyền thống của gia đình, trường và cộng đồng.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 3.4',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX3. Nhận biết về các mối quan hệ xã hội',
    content: 'Nhận biết được một số nghề quen thuộc của người thân.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 3.5',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX3. Nhận biết về các mối quan hệ xã hội',
    content: 'Nhận biết được một số nghề nghiệp phổ biến trong xã hội.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 4.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX4. Thiết lập và duy trì mối quan hệ xã hội',
    content: 'Chủ động làm quen, chơi cùng bạn bè trong nhóm và lớp.',
    targetType: 'skill'
  },
  {
    code: 'TX 4.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX4. Thiết lập và duy trì mối quan hệ xã hội',
    content: 'Thể hiện phép lịch sự, ứng xử thân thiện với bạn bè và người khác.',
    targetType: 'skill'
  },
  {
    code: 'TX 4.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX4. Thiết lập và duy trì mối quan hệ xã hội',
    content: 'Mạnh dạn, tự tin giao tiếp khi tham gia các hoạt động ở gia đình, trường, lớp và cộng đồng.',
    targetType: 'skill'
  },
  {
    code: 'TX 4.4',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX4. Thiết lập và duy trì mối quan hệ xã hội',
    content: 'Hợp tác và duy trì mối quan hệ tích cực với bạn bè và người khác; phối hợp nhóm chơi.',
    targetType: 'skill'
  },
  {
    code: 'TX 4.5',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX4. Thiết lập và duy trì mối quan hệ xã hội',
    content: 'Thương lượng, giải quyết mâu thuẫn đơn giản với bạn mà không dùng bạo lực.',
    targetType: 'skill'
  },
  {
    code: 'TX 5.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX5. Thể hiện và chia sẻ cảm xúc với người khác',
    content: 'Nhận ra và gọi tên các cảm xúc của người khác qua nét mặt, cử chỉ.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 5.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX5. Thể hiện và chia sẻ cảm xúc với người khác',
    content: 'Thể hiện tình cảm với người khác bằng nhiều cách khác nhau (lời nói, cái ôm, hành động giúp đỡ).',
    targetType: 'skill'
  },
  {
    code: 'TX 5.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX5. Thể hiện và chia sẻ cảm xúc với người khác',
    content: 'Thể hiện sự quan tâm, cảm thông với người khác khi gặp khó khăn, đau ốm.',
    targetType: 'attitude'
  },
  {
    code: 'TX 5.5',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX5. Thể hiện và chia sẻ cảm xúc với người khác',
    content: 'Thể hiện sự lắng nghe và phản hồi tích cực trong giao tiếp với người khác.',
    targetType: 'skill'
  },
  {
    code: 'TX 6.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX6. Tôn trọng và hợp tác với người khác',
    content: 'Nhận biết quyền, bổn phận của bản thân và tôn trọng quyền của người khác.',
    targetType: 'knowledge'
  },
  {
    code: 'TX 6.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX6. Tôn trọng và hợp tác với người khác',
    content: 'Chấp nhận sự khác biệt của người khác (sở thích, diện mạo, hoàn cảnh).',
    targetType: 'attitude'
  },
  {
    code: 'TX 6.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX6. Tôn trọng và hợp tác với người khác',
    content: 'Biết chia sẻ đồ chơi và sẵn sàng giúp đỡ bạn trong các hoạt động.',
    targetType: 'skill'
  },
  {
    code: 'TX 6.4',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX6. Tôn trọng và hợp tác với người khác',
    content: 'Chờ đến lượt, phối hợp nhịp nhàng với bạn trong hoạt động nhóm.',
    targetType: 'skill'
  },
  {
    code: 'TX 7.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX7. Ứng xử phù hợp với hoàn cảnh khác nhau',
    content: 'Thực hiện hành vi ứng xử phù hợp với tình huống, hoàn cảnh khác nhau.',
    targetType: 'skill'
  },
  {
    code: 'TX 7.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX7. Ứng xử phù hợp với hoàn cảnh khác nhau',
    content: 'Điều chỉnh một số hoạt động cá nhân theo thời gian biểu và điều kiện thời tiết.',
    targetType: 'skill'
  },
  {
    code: 'TX 7.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX7. Ứng xử phù hợp với hoàn cảnh khác nhau',
    content: 'Thực hiện một số kỹ năng, hành vi, hành động để thích nghi với môi trường chuẩn bị vào lớp một.',
    targetType: 'skill'
  },
  {
    code: 'TX 8.1',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX8. Ứng xử thân thiện với môi trường',
    content: 'Thực hiện nghiêm túc quy định ở trường, lớp, gia đình, nơi công cộng; cất dọn đồ dùng gọn gàng.',
    targetType: 'skill'
  },
  {
    code: 'TX 8.2',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX8. Ứng xử thân thiện với môi trường',
    content: 'Thực hiện hành động đơn giản chăm sóc vật nuôi, cây trồng gần gũi xung quanh.',
    targetType: 'skill'
  },
  {
    code: 'TX 8.3',
    domain: 'TX',
    domainName: 'Tình cảm - Xã hội',
    group: 'TX8. Ứng xử thân thiện với môi trường',
    content: 'Ý thức giữ gìn, bảo vệ và sống hài hoà với thiên nhiên, môi trường.',
    targetType: 'attitude'
  },

  // ==========================================
  // 3. LĨNH VỰC NGÔN NGỮ (NN)
  // ==========================================
  {
    code: 'NN 1.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN1. Lắng nghe và hiểu lời nói',
    content: 'Nghe và nhận ra từng tiếng trong câu nói có 5 – 7 tiếng.',
    targetType: 'skill'
  },
  {
    code: 'NN 1.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN1. Lắng nghe và hiểu lời nói',
    content: 'Trao đổi thông tin liên quan đến chủ đề hội thoại hoặc câu chuyện được nghe.',
    targetType: 'skill'
  },
  {
    code: 'NN 1.3',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN1. Lắng nghe và hiểu lời nói',
    content: 'Thực hiện được hướng dẫn bằng lời nói trong các hoạt động hằng ngày.',
    targetType: 'skill'
  },
  {
    code: 'NN 2.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN2. Diễn đạt bằng lời nói',
    content: 'Nói rõ ràng, đủ ý khi thể hiện ý kiến, nhu cầu của bản thân.',
    targetType: 'skill'
  },
  {
    code: 'NN 2.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN2. Diễn đạt bằng lời nói',
    content: 'Sử dụng được đa dạng từ loại, kiểu câu trong giao tiếp hằng ngày.',
    targetType: 'skill'
  },
  {
    code: 'NN 2.3',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN2. Diễn đạt bằng lời nói',
    content: 'Kể lại được câu chuyện hoặc sự việc theo đúng trình tự thời gian, sự việc.',
    targetType: 'skill'
  },
  {
    code: 'NN 2.4',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN2. Diễn đạt bằng lời nói',
    content: 'Kết hợp lời nói với cử chỉ, điệu bộ, ánh mắt để thể hiện ý kiến hoặc cảm xúc.',
    targetType: 'skill'
  },
  {
    code: 'NN 2.5',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN2. Diễn đạt bằng lời nói',
    content: 'Sử dụng được các từ ngữ nghi thức phù hợp với tình huống giao tiếp và văn hoá (cảm ơn, xin lỗi, chào hỏi).',
    targetType: 'skill'
  },
  {
    code: 'NN 2.6',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN2. Diễn đạt bằng lời nói',
    content: 'Điều chỉnh ngữ điệu, âm lượng và tốc độ nói phù hợp với đối tượng, tình huống giao tiếp.',
    targetType: 'skill'
  },
  {
    code: 'NN 3.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN3. Thể hiện ngôn ngữ sáng tạo',
    content: 'Kể về sự vật, hiện tượng hoặc kể lại câu chuyện bằng lời nói, kết hợp cử chỉ, điệu bộ, vẽ... theo cách riêng.',
    targetType: 'skill'
  },
  {
    code: 'NN 3.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN3. Thể hiện ngôn ngữ sáng tạo',
    content: 'Thể hiện ngôn ngữ biểu cảm khi đọc thơ, kể chuyện, đóng kịch, biểu diễn nghệ thuật.',
    targetType: 'skill'
  },
  {
    code: 'NN 4.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN4. Hứng thú với sách và ấn phẩm',
    content: 'Chủ động lựa chọn, xem sách và ấn phẩm trong môi trường chơi – học.',
    targetType: 'attitude'
  },
  {
    code: 'NN 4.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN4. Hứng thú với sách và ấn phẩm',
    content: 'Lắng nghe người lớn đọc sách với thái độ vui thích, chăm chú.',
    targetType: 'attitude'
  },
  {
    code: 'NN 4.3',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN4. Hứng thú với sách và ấn phẩm',
    content: 'Giữ gìn và bảo vệ sách, ấn phẩm; cất sách ngay ngắn sau khi xem.',
    targetType: 'attitude'
  },
  {
    code: 'NN 5.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN5. Thể hiện kỹ năng ban đầu về đọc',
    content: 'Nhận biết được một số chữ cái tiếng Việt và kí hiệu, biểu tượng quen thuộc trong cuộc sống.',
    targetType: 'knowledge'
  },
  {
    code: 'NN 5.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN5. Thể hiện kỹ năng ban đầu về đọc',
    content: 'Cầm và giở sách đúng cách, theo dõi nội dung sách theo chiều từ trên xuống dưới và từ trái sang phải, từ đầu đến cuối sách.',
    targetType: 'skill'
  },
  {
    code: 'NN 6.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN6. Hứng thú với vẽ, viết',
    content: 'Chủ động tham gia hoạt động vẽ, viết và duy trì tập trung khi thực hiện.',
    targetType: 'attitude'
  },
  {
    code: 'NN 6.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN6. Hứng thú với vẽ, viết',
    content: 'Giữ gìn dụng cụ vẽ, viết trong quá trình sử dụng.',
    targetType: 'attitude'
  },
  {
    code: 'NN 7.1',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN7. Thể hiện kỹ năng ban đầu về viết',
    content: 'Nhận biết chữ viết có thể đọc và thay thế cho lời nói.',
    targetType: 'knowledge'
  },
  {
    code: 'NN 7.2',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN7. Thể hiện kỹ năng ban đầu về viết',
    content: 'Sử dụng được bút chì, sáp màu kết hợp với giữ giấy khi vẽ, viết; cầm bút đúng tư thế bằng 3 ngón tay.',
    targetType: 'skill'
  },
  {
    code: 'NN 7.3',
    domain: 'NN',
    domainName: 'Ngôn ngữ',
    group: 'NN7. Thể hiện kỹ năng ban đầu về viết',
    content: 'Chép lại được tên của người hoặc đồ vật quen thuộc theo quy ước viết cơ bản từ trên xuống dưới, từ trái sang phải; tô trùng khít nét chấm mờ.',
    targetType: 'skill'
  },

  // ==========================================
  // 4. LĨNH VỰC NHẬN THỨC (NT)
  // ==========================================
  {
    code: 'NT 1.1',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT1. Thể hiện sự tò mò, thích tìm hiểu thế giới xung quanh',
    content: 'Hào hứng tham gia hoạt động trải nghiệm, khám phá con người, sự vật, hiện tượng xung quanh.',
    targetType: 'attitude'
  },
  {
    code: 'NT 1.2',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT1. Thể hiện sự tò mò, thích tìm hiểu thế giới xung quanh',
    content: 'Đặt câu hỏi thể hiện mong muốn tìm hiểu về con người, sự vật, hiện tượng (Tại sao? Để làm gì?).',
    targetType: 'skill'
  },
  {
    code: 'NT 1.3',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT1. Thể hiện sự tò mò, thích tìm hiểu thế giới xung quanh',
    content: 'Thể hiện sự thoải mái và sẵn sàng tham gia hoạt động trải nghiệm, khám phá thế giới xung quanh.',
    targetType: 'attitude'
  },
  {
    code: 'NT 2.1',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT2. Thể hiện sự chủ động tìm tòi, khám phá',
    content: 'Lựa chọn sự vật, hiện tượng hoặc cách thức đơn giản để khám phá.',
    targetType: 'skill'
  },
  {
    code: 'NT 2.2',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT2. Thể hiện sự chủ động tìm tòi, khám phá',
    content: 'Kiên trì thực hiện hoạt động tìm hiểu, khám phá thế giới xung quanh cho đến khi có kết quả.',
    targetType: 'attitude'
  },
  {
    code: 'NT 2.3',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT2. Thể hiện sự chủ động tìm tòi, khám phá',
    content: 'Chủ động tìm kiếm sự hỗ trợ và hợp tác cần thiết để thực hiện hoạt động khám phá.',
    targetType: 'skill'
  },
  {
    code: 'NT 3.1',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT3. Hiểu biết ban đầu về thế giới xung quanh',
    content: 'Mô tả đặc điểm, tính chất, sự thay đổi của con người, sự vật, hiện tượng quen thuộc.',
    targetType: 'knowledge'
  },
  {
    code: 'NT 3.2',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT3. Hiểu biết ban đầu về thế giới xung quanh',
    content: 'Giải thích mối quan hệ đơn giản của con người, sự vật, hiện tượng.',
    targetType: 'knowledge'
  },
  {
    code: 'NT 3.3',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT3. Hiểu biết ban đầu về thế giới xung quanh',
    content: 'Mô tả quá trình tạo ra sản phẩm quen thuộc trong đời sống.',
    targetType: 'knowledge'
  },
  {
    code: 'NT 3.4',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT3. Hiểu biết ban đầu về thế giới xung quanh',
    content: 'Xác định được số lượng, hình dạng, kích thước của các đối tượng cụ thể.',
    targetType: 'knowledge'
  },
  {
    code: 'NT 3.5',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT3. Hiểu biết ban đầu về thế giới xung quanh',
    content: 'Nhận ra và tiếp tục thực hiện một số quy tắc, mẫu lặp trong tự nhiên và đời sống.',
    targetType: 'skill'
  },
  {
    code: 'NT 4.1',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'So sánh điểm giống và khác nhau của 2 – 3 đối tượng.',
    targetType: 'skill'
  },
  {
    code: 'NT 4.2',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'Phân loại đối tượng dựa vào các dấu hiệu chung (màu sắc, kích thước, công dụng, hình dạng).',
    targetType: 'skill'
  },
  {
    code: 'NT 4.3',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'Thu thập thông tin đơn giản và thể hiện kết quả bằng lời nói hoặc sản phẩm trực quan.',
    targetType: 'skill'
  },
  {
    code: 'NT 4.4',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'Thực hiện đếm, tách – gộp, thêm – bớt, xác định số thứ tự các đối tượng trong phạm vi 10 và biểu thị kết quả.',
    targetType: 'skill'
  },
  {
    code: 'NT 4.5',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'Sử dụng các dụng cụ đo đơn giản để đo lường kích thước, dung tích của đồ vật và biểu thị kết quả.',
    targetType: 'skill'
  },
  {
    code: 'NT 4.6',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'Xác định vị trí của bản thân, sự vật khác trong không gian (trên - dưới, trước - sau, trái - phải).',
    targetType: 'skill'
  },
  {
    code: 'NT 4.7',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT4. Kỹ năng nhận thức về thế giới xung quanh',
    content: 'Sử dụng được các mốc thời gian gắn với hoạt động cụ thể (sáng, trưa, chiều, tối; hôm qua, hôm nay, ngày mai).',
    targetType: 'knowledge'
  },
  {
    code: 'NT 5.1',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT5. Giải quyết vấn đề đơn giản trong cuộc sống',
    content: 'Quan sát, thu thập thông tin để nhận ra vấn đề cần giải quyết.',
    targetType: 'skill'
  },
  {
    code: 'NT 5.2',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT5. Giải quyết vấn đề đơn giản trong cuộc sống',
    content: 'Lựa chọn cách giải quyết vấn đề đơn giản dựa trên phán đoán và thử nghiệm của bản thân.',
    targetType: 'skill'
  },
  {
    code: 'NT 5.3',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT5. Giải quyết vấn đề đơn giản trong cuộc sống',
    content: 'Sử dụng toán, khoa học và công nghệ để giải quyết các vấn đề đơn giản trong cuộc sống hằng ngày.',
    targetType: 'skill'
  },
  {
    code: 'NT 6.1',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT6. Thực hiện hành động phù hợp',
    content: 'Thể hiện các hành động đơn giản phù hợp với con người, sự vật và hiện tượng trong môi trường gần gũi.',
    targetType: 'skill'
  },
  {
    code: 'NT 6.2',
    domain: 'NT',
    domainName: 'Nhận thức',
    group: 'NT6. Thực hiện hành động phù hợp',
    content: 'Điều chỉnh hành động cho phù hợp với đặc điểm và mối quan hệ giữa con người, sự vật và môi trường.',
    targetType: 'skill'
  },

  // ==========================================
  // 5. LĨNH VỰC NGHỆ THUẬT (NgT)
  // ==========================================
  {
    code: 'NgT 1.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT1. Cảm thụ vẻ đẹp trong cuộc sống và nghệ thuật',
    content: 'Thể hiện cảm xúc bằng các cách khác (lời nói, hành động, cử chỉ, nét mặt...) khi tiếp xúc với vẻ đẹp trong thiên nhiên, cuộc sống và nghệ thuật.',
    targetType: 'attitude'
  },
  {
    code: 'NgT 1.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT1. Cảm thụ vẻ đẹp trong cuộc sống và nghệ thuật',
    content: 'Yêu thích, trân trọng sản phẩm nghệ thuật truyền thống của Việt Nam và nền văn hoá khác.',
    targetType: 'attitude'
  },
  {
    code: 'NgT 1.3',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT1. Cảm thụ vẻ đẹp trong cuộc sống và nghệ thuật',
    content: 'Nhận ra vẻ đẹp và tôn trọng sản phẩm nghệ thuật của người khác.',
    targetType: 'attitude'
  },
  {
    code: 'NgT 1.4',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT1. Cảm thụ vẻ đẹp trong cuộc sống và nghệ thuật',
    content: 'Thể hiện ý kiến phản hồi hoặc nhận xét về sản phẩm nghệ thuật bằng các hình thức phù hợp.',
    targetType: 'skill'
  },
  {
    code: 'NgT 2.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Nhớ tên bài hát, bản nhạc và nói về nội dung của bài hát.',
    targetType: 'knowledge'
  },
  {
    code: 'NgT 2.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Nhận biết được tính chất âm nhạc: êm ả, nhẹ nhàng, vui vẻ, sôi động.',
    targetType: 'knowledge'
  },
  {
    code: 'NgT 2.3',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Nhận biết được nhịp điệu, tiết tấu và giai điệu của bài hát, bản nhạc quen thuộc.',
    targetType: 'knowledge'
  },
  {
    code: 'NgT 2.4',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Phân biệt âm thanh cao – thấp; dài – ngắn; to – nhỏ; âm thanh của một số nhạc cụ âm nhạc, giọng hát – giọng nói.',
    targetType: 'skill'
  },
  {
    code: 'NgT 2.5',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Hát rõ lời, đúng giai điệu và thể hiện được sắc thái, tình cảm của bản thân khi hát.',
    targetType: 'skill'
  },
  {
    code: 'NgT 2.6',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Vận động cơ thể, nhảy múa phù hợp sắc thái, nhịp điệu bài hát, bản nhạc.',
    targetType: 'skill'
  },
  {
    code: 'NgT 2.7',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Gõ, đệm theo phách, nhịp, tiết tấu bằng các dụng cụ gõ khác nhau.',
    targetType: 'skill'
  },
  {
    code: 'NgT 2.8',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT2. Hiểu biết, kỹ năng trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Biểu diễn tiết mục âm nhạc một cách tự nhiên, hào hứng.',
    targetType: 'skill'
  },
  {
    code: 'NgT 3.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT3. Hiểu biết, kỹ năng trong hoạt động tạo hình',
    content: 'Khám phá, thử nghiệm các vật liệu và cách thức tạo hình khác nhau trong trải nghiệm nghệ thuật đa dạng.',
    targetType: 'skill'
  },
  {
    code: 'NgT 3.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT3. Hiểu biết, kỹ năng trong hoạt động tạo hình',
    content: 'Phối hợp đa dạng đường nét, màu sắc, bố cục, nguyên liệu và các kỹ năng tạo hình để tạo ra sản phẩm theo ý tưởng của bản thân.',
    targetType: 'skill'
  },
  {
    code: 'NgT 3.3',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT3. Hiểu biết, kỹ năng trong hoạt động tạo hình',
    content: 'Chia sẻ cảm nhận của bản thân về sản phẩm nghệ thuật tạo hình (màu sắc, đường nét, hình ảnh, sự sắp xếp/bố cục).',
    targetType: 'skill'
  },
  {
    code: 'NgT 4.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT4. Hiểu biết, kỹ năng trong hoạt động kịch',
    content: 'Nói về những gì thể hiện trong vở kịch (nhân vật, âm thanh, ánh sáng, trang phục, diễn xuất...) theo suy nghĩ và cảm xúc.',
    targetType: 'knowledge'
  },
  {
    code: 'NgT 4.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT4. Hiểu biết, kỹ năng trong hoạt động kịch',
    content: 'Thể hiện được vai diễn của nhân vật trong vở kịch (qua giọng điệu, nét mặt, cử chỉ, điệu bộ, lời nói, lời thoại nhân vật...).',
    targetType: 'skill'
  },
  {
    code: 'NgT 5.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT5. Sáng tạo trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Tạo ra âm thanh có tính nhạc theo những cách khác nhau.',
    targetType: 'skill'
  },
  {
    code: 'NgT 5.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT5. Sáng tạo trong hoạt động âm nhạc và vận động theo nhạc',
    content: 'Nhảy, múa, vận động ngẫu hứng theo bài hát, bản nhạc và nói được ý tưởng của bản thân.',
    targetType: 'skill'
  },
  {
    code: 'NgT 6.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT6. Sáng tạo trong hoạt động tạo hình',
    content: 'Tạo ra sản phẩm thể hiện sự mới mẻ, độc đáo về ý tưởng, cách thức thực hiện của bản thân và đặt tên cho sản phẩm.',
    targetType: 'skill'
  },
  {
    code: 'NgT 6.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT6. Sáng tạo trong hoạt động tạo hình',
    content: 'Lấy cảm hứng từ phong cách của hoạ sĩ, thợ thủ công để sáng tạo ra sản phẩm tạo hình theo cảm xúc và trí tưởng tượng (nặn gốm, tranh dân gian, vẽ nón lá...).',
    targetType: 'skill'
  },
  {
    code: 'NgT 6.3',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT6. Sáng tạo trong hoạt động tạo hình',
    content: 'Sử dụng sản phẩm nghệ thuật tạo hình để trang trí/làm đẹp môi trường xung quanh theo ý tưởng của bản thân.',
    targetType: 'skill'
  },
  {
    code: 'NgT 7.1',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT7. Sáng tạo trong hoạt động kịch',
    content: 'Tự lựa chọn trang phục, dụng cụ và phương tiện để thể hiện vai diễn theo ý tưởng riêng của trẻ.',
    targetType: 'skill'
  },
  {
    code: 'NgT 7.2',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT7. Sáng tạo trong hoạt động kịch',
    content: 'Thay đổi về lời thoại, trang phục, đạo cụ... để thể hiện vai diễn theo ý tưởng riêng của trẻ.',
    targetType: 'skill'
  },
  {
    code: 'NgT 7.3',
    domain: 'NgT',
    domainName: 'Nghệ thuật',
    group: 'NgT7. Sáng tạo trong hoạt động kịch',
    content: 'Độc lập hoặc phối hợp với bạn “sáng tác” ra “câu chuyện” để diễn xuất theo tưởng tượng của trẻ.',
    targetType: 'skill'
  }
];

// ÁNH XẠ TIÊU CHÍ GỢI Ý MẶC ĐỊNH CHO TỪNG HOẠT ĐỘNG TRONG 8/9 LĨNH VỰC MỚI THEO QĐ 388
export const DEFAULT_CRITERIA_BY_ACTIVITY: Record<string, string[]> = {
  'HOẠT ĐỘNG VUI CHƠI TRONG LỚP': [
    'NT 3.1', // Mô tả đặc điểm, tính chất đồ chơi, khối ghép
    'TX 4.4', // Hợp tác và duy trì mối quan hệ tích cực với bạn bè
    'TX 3.2', // Nhận biết vai trò của bạn bè trong góc chơi
    'TX 4.3', // Mạnh dạn, tự tin giao tiếp giữa các góc chơi
    'TX 8.1', // Thu dọn, sắp xếp đồ chơi gọn gàng sau khi chơi
    'NN 2.2'  // Sử dụng từ loại, diễn đạt khi đóng vai
  ],
  'HOẠT ĐỘNG NGOÀI TRỜI': [
    'NT 1.1', // Hào hứng tham gia khám phá tự nhiên ngoài trời
    'NT 1.2', // Đặt câu hỏi tìm hiểu về cây cỏ, thời tiết, sự vật
    'NT 3.1', // Nhận biết tên gọi, đặc điểm đối tượng quan sát
    'TC 1.1', // Hào hứng tham gia hoạt động thể chất ngoài trời
    'TC 3.1', // Vận động di chuyển thăng bằng trên địa hình sân trường
    'TC 3.3', // Vận động tại chỗ, giữ thăng bằng
    'TX 4.4', // Chơi đoàn kết, tuân thủ an toàn ngoài trời
    'NN 2.2'  // Rèn kỹ năng diễn đạt trọn câu
  ],
  'TRÒ CHƠI VẬN ĐỘNG': [
    'TC 1.1', // Hào hứng tham gia trò chơi vận động
    'TC 1.2', // Kiên trì, không bỏ cuộc cho đến khi đạt mục tiêu
    'TC 1.3', // Phối hợp cùng đồng đội
    'TC 3.1', // Chạy nhảy, đổi hướng, giữ thăng bằng
    'TC 3.3', // Vận động dừng lại đúng hiệu lệnh
    'TX 4.4'  // Đoàn kết, trung thực tuân thủ luật chơi
  ],
  'TRÒ CHƠI HỌC TẬP': [
    'NT 1.1', // Tò mò, hứng thú với nhiệm vụ học tập
    'NT 3.4', // Xác định số lượng, hình dạng, kích thước
    'NT 4.1', // So sánh điểm giống và khác nhau
    'NT 4.2', // Phân loại đối tượng theo dấu hiệu
    'NN 2.1', // Phát âm to, rõ ràng câu trả lời
    'TX 4.4'  // Tinh thần hợp tác, thi đua lành mạnh
  ],
  'HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG': [
    'TC 6.1', // Thực hiện thuần thục kỹ năng vệ sinh / tự phục vụ
    'TC 6.2', // Hiểu lợi ích của kỹ năng với sức khỏe
    'TC 6.3', // Thực hiện quy tắc phòng tránh bệnh tật
    'TX 7.3', // Kỹ năng thích ứng nền nếp, tự lập
    'TX 8.1', // Giữ gìn đồ dùng, vệ sinh môi trường
    'NN 2.2'  // Giao tiếp lễ phép, trả lời cô
  ],
  'TRÒ CHƠI DÂN GIAN': [
    'NN 2.1', // Thuộc và đọc đồng dao rõ ràng, đúng nhịp
    'NN 2.2', // Cảm thụ nhịp điệu ca dao, đồng dao
    'TC 1.1', // Tham gia trò chơi dân gian hào hứng
    'TC 1.2', // Phối hợp vận động nhanh nhẹn theo nhịp
    'TX 4.4'  // Thân thiện, hòa nhã với bạn khi chơi
  ],
  'HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT': [
    'NN 1.2', // Nghe hiểu nội dung từ ngữ, câu chuyện tiếng Việt
    'NN 2.1', // Phát âm chuẩn xác phụ âm, vần, thanh điệu
    'NN 2.2', // Sử dụng vốn từ tiếng Việt, nói trọn câu
    'NN 2.3', // Kể lại sự việc theo trình tự
    'NN 3.1', // Sáng tạo diễn đạt bằng tiếng Việt
    'TX 3.2'  // Tự tin giao tiếp tiếng Việt với cô và bạn
  ],
  'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI': [
    'NN 5.1', // Nhận biết chữ cái tiếng Việt cần tô
    'NN 7.1', // Nhận biết chữ viết trên dòng kẻ ô ly
    'NN 7.2', // Cầm bút đúng cách bằng 3 ngón tay, tư thế ngồi ngay ngắn
    'NN 7.3', // Tô trùng khít nét chấm mờ, không chờm ra ngoài
    'TC 4.1', // Rèn luyện khéo léo cơ ngón tay và phối hợp tay - mắt
    'TX 8.1'  // Giữ gìn vở sạch chữ đẹp, cẩn thận
  ],
  'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI': [
    'NN 5.1', // Khắc sâu nhận diện mặt chữ cái đã học
    'NN 5.2', // Nhận biết chữ cái qua hình ảnh, biểu tượng
    'NT 1.1', // Hào hứng tìm kiếm, phân loại chữ cái
    'NN 2.2', // Phát âm nhanh, chuẩn xác khi nhận diện chữ
    'TC 1.2', // Tiếp sức nhanh nhẹn gắn thẻ chữ
    'TX 4.4'  // Hợp tác nhóm tìm đúng chữ cái theo hiệu lệnh
  ]
};

export function getCriteria388ByCode(code: string): Criterion388 | undefined {
  const cleanCode = code.trim().toUpperCase();
  return CRITERIA_388_DATABASE.find(c => c.code.toUpperCase() === cleanCode);
}

export function getDefaultCriteriaForActivity(activityName: string): string[] {
  if (!activityName) return [];
  const upper = activityName.toUpperCase().trim();
  for (const [act, codes] of Object.entries(DEFAULT_CRITERIA_BY_ACTIVITY)) {
    if (upper.includes(act) || act.includes(upper)) {
      return codes;
    }
  }
  return DEFAULT_CRITERIA_BY_ACTIVITY['HOẠT ĐỘNG VUI CHƠI TRONG LỚP'] || [];
}
