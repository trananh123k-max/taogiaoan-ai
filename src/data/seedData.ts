import { CustomUploadedBook, CustomUploadedPPCT } from '../types';
import { VERIFIED_KNTT_CURRICULUM } from './verifiedCurriculumList';

/**
 * Verified 4 PPCT Files (Phụ lục 03) strictly according to user curriculum:
 * 1. Phu_luc_03__TIN HỌC 6 KNTT.pdf
 * 2. Phu_luc_03__TIN HỌC 7 KNTT.pdf
 * 3. Phu_luc_03__TIN HỌC 8 KNTT.pdf
 * 4. Phu_luc_03__TIN HỌC 9 KNTT.pdf
 */
export const SEED_SAMPLE_PPCT: CustomUploadedPPCT[] = [
  {
    id: 'ppct_tinhoc_6_phuluc03',
    title: 'Phân phối chương trình Tin học 6 - Kết nối tri thức',
    subject: 'Tin học',
    grade: 'Lớp 6',
    fileName: 'Phu_luc_03__TIN HỌC 6 KNTT.pdf',
    fileSize: '1.24 MB',
    uploadedAt: '01/08/2025',
    summary: 'Kế hoạch dạy học môn Tin học Lớp 6 (Bộ Kết nối tri thức với cuộc sống). Trường THCS Tân Loan - Tổ Tự Nhiên. Tổng số: 35 tiết (HKI: 18 tiết, HKII: 17 tiết).',
    lessonConfigs: [
      {
        lessonTitle: 'Bài 1: Thông tin và dữ liệu',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '1',
        week: 'Tuần 1',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.1.TC1a: HS nhận biết và phân biệt được dữ liệu, thông tin và vật mang tin trong môi trường số.',
          '1.2.TC1a: HS bước đầu biết nhận xét về độ tin cậy của thông tin thu được.'
        ],
      },
      {
        lessonTitle: 'Bài 2: Xử lý thông tin',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '2',
        week: 'Tuần 2',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.1.TC1a: HS nhận biết được dữ liệu đầu vào và thông tin đầu ra trong một quy trình xử lý thông tin của máy tính.',
          '1.3.TC1a: HS biết cách lưu trữ thông tin vào các thiết bị nhớ một cách cơ bản.',
          '5.2.TC1a: HS nhận ra máy tính là công cụ hiệu quả để giải quyết các nhu cầu xử lý thông tin phức tạp.'
        ],
      },
      {
        lessonTitle: 'Bài 3: Thông tin trong máy tính',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '3, 4',
        week: 'Tuần 3, 4',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.3.TC1a: HS biết được các đơn vị đo dung lượng lưu trữ (Byte, KB, MB, GB) và khả năng lưu trữ của các thiết bị nhớ thông dụng.',
          '5.2.TC1a: HS biết được lượng dung lượng lưu trữ cần thiết cho các nhu cầu cá nhân.',
          '5.2.TC1b: HS biết chọn thiết bị lưu trữ phù hợp với nhu cầu sử dụng.'
        ],
      },
      {
        lessonTitle: 'Bài 4: Mạng máy tính',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '5',
        week: 'Tuần 5',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '2.1.TC1b: Nhận biết được các phương tiện giao tiếp số (email, mạng xã hội) hoạt động dựa trên nền tảng mạng máy tính.',
          '5.1.TC1b: Biết cách chọn loại kết nối mạng (có dây hoặc không dây) phù hợp cho các thiết bị (điện thoại, máy tính bàn) trong tình huống cụ thể.',
          '5.2.TC1a: Nhận ra lợi ích của mạng máy tính trong việc giải quyết nhu cầu chia sẻ tài nguyên (máy in chung) và dữ liệu.'
        ],
      },
      {
        lessonTitle: 'Bài 5: Internet',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '6',
        week: 'Tuần 6',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.1.TC1b: HS xác định được Internet là kho thông tin khổng lồ và biết nhu cầu tìm kiếm thông tin phục vụ học tập/giải trí trên đó.',
          '2.1.TC1a: HS nhận biết được Internet là môi trường cho phép tương tác hai chiều, không chỉ là nơi xem thụ động.',
          '2.2.TC1a: HS hiểu được Internet cho phép chia sẻ dữ liệu nhanh chóng.'
        ],
      },
      {
        lessonTitle: 'Bài 6: Mạng thông tin toàn cầu',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '7, 10',
        week: 'Tuần 7, 10',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.1.TC1b: HS biết sử dụng trình duyệt web để truy cập, duyệt thông tin từ các website thông qua địa chỉ hoặc liên kết.',
          '1.1.TC1c: HS biết cách di chuyển giữa các trang web bằng các siêu liên kết (hyperlink) và sử dụng các nút điều hướng (Back, Forward, Home) trên trình duyệt.',
          '1.2.TC1a: HS bước đầu nhận biết được sự đa dạng của nguồn thông tin trên web (văn bản, hình ảnh, video) và ý nghĩa của địa chỉ website (ví dụ: .vn, .org, .edu).'
        ],
      },
      {
        lessonTitle: 'Bài 7: Tìm kiếm thông tin trên internet',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '11, 12',
        week: 'Tuần 11, 12',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.1.TC1a: Xác định được nhu cầu thông tin cụ thể (ví dụ: tìm thông tin du lịch Hạ Long) và từ khóa phù hợp.',
          '1.1.TC1b: Sử dụng được máy tìm kiếm để tìm và lọc thông tin (lọc theo Tin tức, Hình ảnh, Video) theo nhu cầu.',
          '1.2.TC1a: Bước đầu biết đánh giá sơ bộ kết quả tìm kiếm.'
        ],
      },
      {
        lessonTitle: 'Bài 8: Thư điện tử',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '13, 14',
        week: 'Tuần 13, 14',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '2.1.TC1a: HS thực hiện được việc soạn và gửi email cơ bản cho giáo viên hoặc bạn bè.',
          '2.2.TC1a: HS biết cách đính kèm tệp (file ảnh, văn bản) để chia sẻ dữ liệu qua email.',
          '4.1.TC1d: HS nhận diện được các dấu hiệu của thư rác (Spam) hoặc thư lừa đảo để tránh mở hoặc trả lời.'
        ],
      },
      {
        lessonTitle: 'Bài 9: An toàn thông tin trên Internet',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '15, 18',
        week: 'Tuần 15, 18',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '4.1.TC1b: HS phân biệt được các rủi ro và mối đe dọa cơ bản (virus, mã độc, lừa đảo) đối với thiết bị và dữ liệu trong môi trường số.',
          '4.2.TC1a: HS biết cách bảo vệ thông tin cá nhân (tên, địa chỉ, mật khẩu) và quyền riêng tư khi tham gia mạng xã hội hoặc sử dụng dịch vụ trực tuyến.'
        ],
      },
      {
        lessonTitle: 'Bài 10: Sơ đồ tư duy',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '19, 20',
        week: 'Tuần 19, 20',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS biết tạo nội dung số bằng sơ đồ tư duy. HS tạo sơ đồ tư duy bằng công cụ số.',
          '3.1.TC1b: HS thể hiện ý tưởng cá nhân qua sơ đồ tư duy.',
          '5.2.TC1a: HS xác định nhu cầu tổ chức thông tin một cách trực quan, logic. HS xác định nhu cầu trình bày kiến thức bằng sơ đồ.',
          '5.2.TC1b: HS chọn phần mềm sơ đồ tư duy phù hợp.',
          '5.3.TC1a: HS sử dụng công cụ số để đổi mới cách trình bày thông tin.'
        ],
      },
      {
        lessonTitle: 'Bài 11: Định dạng văn bản',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '21, 22',
        week: 'Tuần 21, 22',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS thực hiện định dạng và in văn bản rõ ràng.',
          '5.2.TC1a: HS xác định nhu cầu cá nhân trong việc trình bày văn bản đẹp và khoa học.',
          '5.2.TC1b: HS chọn công cụ soạn thảo để đáp ứng nhu cầu.'
        ],
      },
      {
        lessonTitle: 'Bài 12: Trình bày thông tin ở dạng bảng',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '23, 24',
        week: 'Tuần 23, 24',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS biết tạo nội dung số dưới dạng bảng.',
          '5.2.TC1a: HS xác định nhu cầu sắp xếp thông tin có cấu trúc.',
          '5.2.TC1b: HS lựa chọn công cụ soạn thảo văn bản để trình bày dữ liệu dạng bảng.'
        ],
      },
      {
        lessonTitle: 'Bài 13: Thực hành: Tìm kiếm và thay thế',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '27',
        week: 'Tuần 27',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS biết tạo và chỉnh sửa nội dung số phục vụ thực tiễn.',
          '3.1.TC1b: HS thể hiện bản thân qua sản phẩm số (văn bản).',
          '5.2.TC1a: HS xác định nhu cầu học tập, sinh hoạt bằng văn bản.',
          '5.2.TC1b: HS chọn phần mềm soạn thảo để giải quyết nhu cầu cụ thể của sản phẩm.'
        ],
      },
      {
        lessonTitle: 'Bài 14: Thực hành tổng hợp: Hoàn thiện sổ lưu niệm',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '28',
        week: 'Tuần 28',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS biết tạo và chỉnh sửa nội dung số phục vụ thực tiễn.',
          '3.1.TC1b: HS thể hiện bản thân qua sản phẩm số (văn bản).',
          '5.2.TC1a: HS xác định nhu cầu học tập, sinh hoạt bằng văn bản.',
          '5.2.TC1b: HS chọn phần mềm soạn thảo để giải quyết nhu cầu cụ thể của sản phẩm.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Tấm thiệp của em (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 15: Thuật toán',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '29',
        week: 'Tuần 29',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '3.4.TC1a: HS liệt kê và trình bày được các bước chỉ dẫn (thuật toán) bằng sơ đồ khối để giải quyết vấn đề đơn giản trong học tập.'
        ],
      },
      {
        lessonTitle: 'Bài 16: Các cấu trúc điều khiển',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '30, 31',
        week: 'Tuần 30, 31',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '3.4.TC1a: Hiểu được bản chất của 3 cấu trúc điều khiển cơ bản (Tuần tự, Rẽ nhánh, Lặp) là nền tảng của mọi chương trình máy tính.',
          '3.4.TC1b: Biết sử dụng sơ đồ khối để mô tả logic hoạt động của một chương trình đơn giản trước khi bắt tay vào viết mã lệnh.',
          '5.1.TC1a: Nhận diện được các tình huống thực tế (như chấm điểm, điểm danh) có thể được mô hình hóa bằng các cấu trúc điều khiển của máy tính.'
        ],
      },
      {
        lessonTitle: 'Bài 17: Chương trình máy tính',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '32, 35',
        week: 'Tuần 32, 35',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.4.TC1a: Biết sử dụng ngôn ngữ lập trình trực quan (Scratch) để hiện thực hóa các thuật toán đã mô tả (biến ý tưởng thành sản phẩm số).',
          '5.1.TC1a: Nhận diện được mối liên hệ giữa vấn đề thực tế (tính tổng, tính lãi/lỗ) và chương trình máy tính, từ đó tạo ra giải pháp tự động hóa.'
        ],
      },
    ],
  },
  {
    id: 'ppct_tinhoc_7_phuluc03',
    title: 'Phân phối chương trình Tin học 7 - Kết nối tri thức',
    subject: 'Tin học',
    grade: 'Lớp 7',
    fileName: 'Phu_luc_03__TIN HỌC 7 KNTT.pdf',
    fileSize: '1.18 MB',
    uploadedAt: '01/08/2025',
    summary: 'Kế hoạch dạy học môn Tin học Lớp 7 (Bộ Kết nối tri thức với cuộc sống). Trường THCS Tân Loan - Tổ Tự Nhiên. Tổng số: 35 tiết (HKI: 18 tiết, HKII: 17 tiết).',
    lessonConfigs: [
      {
        lessonTitle: 'Bài 1: Thiết bị vào - ra',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '1',
        week: 'Tuần 1',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '4.1.TC1a: HS nhận biết được những thao tác không đúng cách khi sử dụng thiết bị vào – ra và nêu được cách sử dụng an toàn.',
          '5.1.TC1a: HS nhận biết và lựa chọn được thiết bị vào – ra phù hợp với nhu cầu thu nhận, xử lí và truyền thông tin.',
          '5.1.TC1b: HS phân biệt được chức năng của các thiết bị vào – ra và lựa chọn thiết bị phù hợp trong tình huống cụ thể.'
        ],
      },
      {
        lessonTitle: 'Bài 2: Phần mềm máy tính',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '2',
        week: 'Tuần 2',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '5.2.TC1a: HS xác định được nhu cầu sử dụng phần mềm trong các tình huống học tập và đời sống.',
          '5.2.TC1b: HS lựa chọn và sử dụng đúng công cụ số (phần mềm ứng dụng) phù hợp với mục đích công việc.',
          '5.2.TC1c: HS nhận biết và giải thích được vai trò của hệ điều hành trong việc điều khiển hoạt động của máy tính.'
        ],
      },
      {
        lessonTitle: 'Bài 3: Quản lý dữ liệu trong máy tính',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '3, 4',
        week: 'Tuần 3, 4',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.3.TC1a: HS nhận biết tệp chương trình cũng là dữ liệu và có thể được lưu trữ trong máy tính.',
          '1.3.TC1b: HS biết tổ chức, lưu trữ và quản lí tệp dữ liệu trong máy tính phù hợp với yêu cầu.',
          '4.1.TC1a: HS nhận biết và nêu được các biện pháp bảo vệ dữ liệu như sao lưu, phòng chống xâm nhập trái phép và phòng chống virus.'
        ],
      },
      {
        lessonTitle: 'Bài 4: Mạng xã hội và một số kênh trao đổi thông tin trên Internet',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '5, 6',
        week: 'Tuần 5, 6',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '2.1.TC1a: HS lựa chọn được kênh trao đổi thông tin trên Internet phù hợp với mục đích giao lưu, chia sẻ.',
          '2.1.TC1b: HS sử dụng được một số chức năng cơ bản của mạng xã hội và kênh trao đổi thông tin để giao tiếp, chia sẻ thông tin.',
          '2.2.TC1a: HS thực hiện chia sẻ thông tin trên mạng xã hội và các kênh trao đổi thông tin phù hợp.',
          '2.2.TC1b: HS nhận biết được hậu quả của việc sử dụng hoặc chia sẻ thông tin vào mục đích sai trái.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Thiết kế và chế tạo đèn lồng (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 5: Ứng xử trên mạng',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '7',
        week: 'Tuần 7',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '2.5.TC1a: HS thực hiện giao tiếp qua mạng theo đúng quy tắc và bằng ngôn ngữ lịch sự.',
          '2.5.TC1b: HS thể hiện cách ứng xử có văn hoá khi giao tiếp và tham gia các hoạt động trên mạng.',
          '2.5.TC1c: HS biết nhờ người lớn giúp đỡ, tư vấn khi gặp vấn đề trong quá trình ứng xử trên mạng.',
          '4.3.TC1b: HS nhận biết tác hại của việc sử dụng Internet không hợp lí và có ý thức phòng tránh để bảo đảm sức khỏe, an toàn.'
        ],
      },
      {
        lessonTitle: 'Bài 6: Làm quen với phần mềm bảng tính',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '10',
        week: 'Tuần 10',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS nhập được dữ liệu vào ô tính và thực hiện được các thao tác định dạng cơ bản.',
          '3.1.TC1b: HS chỉnh sửa, định dạng dữ liệu trên bảng tính để trình bày rõ ràng, dễ đọc.'
        ],
      },
      {
        lessonTitle: 'Bài 7: Tính toán tự động trên trang tính',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '11',
        week: 'Tuần 11',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.2.TC1a: HS nhận biết được các kiểu dữ liệu trên bảng tính và sử dụng dữ liệu phù hợp khi tính toán.',
          '5.2.TC1b: HS lựa chọn và sử dụng công thức phù hợp để thực hiện tính toán tự động trên bảng tính.',
          '1.3.TC1a: HS tổ chức và cập nhật dữ liệu trên bảng tính để công thức thực hiện tính toán tự động.'
        ],
      },
      {
        lessonTitle: 'Bài 8: Công cụ hỗ trợ tính toán',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '12, 13',
        week: 'Tuần 12, 13',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.2.TC1a: HS sử dụng được các hàm đơn giản như MAX, MIN, AVERAGE, COUNT để xử lí và khai thác dữ liệu.',
          '5.2.TC1b: HS lựa chọn được hàm phù hợp với yêu cầu tính toán cụ thể.',
          '1.3.TC1a: HS tổ chức và cập nhật dữ liệu để các hàm tự động tính toán lại khi dữ liệu thay đổi.',
          '3.2.TC1a: HS thực hiện được các thao tác xử lí dữ liệu bằng công cụ bảng tính để tạo kết quả tính toán.'
        ],
      },
      {
        lessonTitle: 'Bài 9: Trình bày bảng tính',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '14, 15',
        week: 'Tuần 14, 15',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1b: HS biết định dạng dữ liệu số, tạo bảng tính trình bày đẹp.',
          '5.2.TC1b: HS biết so sánh dữ liệu để đưa ra nhận xét hoặc lựa chọn phù hợp.'
        ],
      },
      {
        lessonTitle: 'Bài 10: Hoàn thiện bảng tính',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '18, 19',
        week: 'Tuần 18, 19',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS nhập và chỉnh sửa dữ liệu trong bảng tính. Dùng công thức/hàm để hoàn thiện các cột còn thiếu (tính tổng, trung bình...). Sắp xếp và tổ chức lại dữ liệu đúng logic.',
          '3.2.TC1a: Định dạng bảng: tiêu đề, màu sắc, căn lề, kẻ viền, gộp ô. Làm bảng tính rõ ràng, dễ đọc, đúng bố cục. Lưu, xuất file hoặc chia sẻ bảng tính qua email, mạng xã hội hoặc ứng dụng học tập.',
          '5.3.TC1a: Xác định yêu cầu của bảng tính (cần tính gì, trình bày ra sao). Sử dụng công cụ bảng tính để tự động hoàn thiện bảng nhanh và chính xác. Kiểm tra lỗi, điều chỉnh nội dung để bảng hoàn chỉnh và đúng yêu cầu thực tế.'
        ],
      },
      {
        lessonTitle: 'Bài 11: Tạo bài trình chiếu',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '20',
        week: 'Tuần 20',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS nhập nội dung văn bản vào các slide (tiêu đề, nội dung chính). Chèn hình ảnh, biểu tượng, bảng đơn giản vào bài trình chiếu. Sắp xếp bố cục slide hợp lý, khoa học. Lưu bài trình chiếu với tên file phù hợp.',
          '3.1.TC1b: Chọn mẫu slide (theme/template) phù hợp chủ đề bài trình chiếu. Điều chỉnh font chữ, kích thước, màu sắc cho dễ nhìn và đẹp mắt. Tạo và nhân bản slide mới, sắp xếp thứ tự slide logic. Thêm hiệu ứng chuyển slide hoặc hiệu ứng cho văn bản/hình ảnh đơn giản.'
        ],
      },
      {
        lessonTitle: 'Bài 12: Định dạng đối tượng trên trang chiếu',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '21, 22',
        week: 'Tuần 21, 22',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.2.TC1a: HS điều chỉnh vị trí, kích thước các đối tượng (văn bản, hình ảnh, hình khối) trên slide. Căn chỉnh văn bản: căn trái, phải, giữa, căn đều; thay đổi màu chữ, kiểu chữ, kích thước. Sử dụng màu nền, đường viền, bóng đổ hoặc hiệu ứng để làm nổi bật nội dung. Sắp xếp bố cục trang chiếu hài hòa, dễ nhìn.',
          '3.3.TC1a: Thiết kế slide sáng tạo với cách trình bày riêng nhưng vẫn rõ ràng, đúng nội dung. Chèn và định dạng các đối tượng như hình ảnh, biểu tượng, sơ đồ, hộp văn bản để làm slide sinh động. Tùy chỉnh màu nền, kiểu slide để phù hợp với chủ đề bài trình chiếu. Tạo ra sản phẩm trình chiếu hoàn chỉnh mang dấu ấn cá nhân.'
        ],
      },
      {
        lessonTitle: 'Bài 13: Thực hành tổng hợp: Hoàn thiện bài trình chiếu',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '23, 24',
        week: 'Tuần 23, 24',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC1a: HS nhập nội dung đầy đủ vào các slide: tiêu đề, thông tin, hình ảnh, bảng biểu nếu cần. Sắp xếp các slide logic theo bố cục mở bài – nội dung – kết luận. Chèn hình ảnh, biểu đồ hoặc video vào slide để minh hoạ.',
          '3.2.TC1a: Định dạng văn bản, hình ảnh và các đối tượng trong slide cho đẹp mắt, khoa học. Căn chỉnh bố cục từng trang chiếu hợp lý, đồng bộ màu sắc, font chữ và bố cục. Lưu, xuất file hoặc chia sẻ bài trình chiếu cho giáo viên, bạn bè.',
          '5.3.TC1a: HS xác định yêu cầu của bài trình chiếu (chủ đề, số slide, nội dung cần thể hiện). Tìm kiếm, chọn lọc thông tin, hình ảnh phù hợp để hoàn thiện bài trình chiếu. Kiểm tra, chỉnh sửa lỗi và hoàn thiện sản phẩm đúng yêu cầu thực tế.'
        ],
      },
      {
        lessonTitle: 'Bài 14: Thuật toán tìm kiếm tuần tự',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '27, 28',
        week: 'Tuần 27, 28',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '3.4.TC1a: HS hiểu và mô tả thuật toán tìm kiếm tuần tự bằng lời, sơ đồ khối, hoặc giả mã (pseudocode). Xác định các bước: bắt đầu từ phần tử đầu → so sánh từng phần tử với giá trị cần tìm → kết luận tìm thấy hoặc không. Viết được thuật toán tìm kiếm tuần tự bằng ngôn ngữ tự nhiên hoặc sơ đồ khối.',
          '5.3.TC1b: Áp dụng thuật toán tìm kiếm tuần tự để tìm thông tin trong danh sách (ví dụ: tìm tên trong danh bạ, điểm trong danh sách lớp). Nhận biết ưu điểm và hạn chế của thuật toán tìm kiếm tuần tự so với các cách tìm khác. Thử mô phỏng thuật toán trên máy tính hoặc phần mềm lập trình đơn giản (Scratch, Python…).'
        ],
      },
      {
        lessonTitle: 'Bài 15: Thuật toán tìm kiếm nhị phân',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '29, 30',
        week: 'Tuần 29, 30',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '3.4.TC1a: HS hiểu nguyên lí của tìm kiếm nhị phân: chia đôi danh sách đã sắp xếp để tìm phần tử cần tìm. Mô tả thuật toán bằng lời, sơ đồ khối hoặc giả mã: xác định phần tử giữa → so sánh → loại bỏ một nửa danh sách → lặp lại đến khi tìm thấy hoặc kết thúc. So sánh thuật toán tìm kiếm nhị phân với tìm kiếm tuần tự về số bước và hiệu quả.',
          '5.3.TC1b: Áp dụng thuật toán tìm kiếm nhị phân để tìm dữ liệu trong danh sách đã sắp xếp (ví dụ: tra cứu điểm, tìm số trong mảng). Mô phỏng thuật toán bằng phần mềm hoặc ngôn ngữ lập trình (Scratch, Python, Pascal…). Nhận xét ưu điểm về tốc độ, hiệu quả của thuật toán này so với tìm kiếm tuần tự.'
        ],
      },
      {
        lessonTitle: 'Bài 16: Thuật toán sắp xếp',
        periods: 3,
        periodDetail: '1+2+3',
        ppctOrder: '31, 32, 35',
        week: 'Tuần 31, 32, 35',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.4.TC1a: HS hiểu ý nghĩa của sắp xếp dữ liệu (tăng dần, giảm dần). Mô tả được thuật toán sắp xếp cơ bản như sắp xếp nổi bọt (Bubble Sort), sắp xếp chọn (Selection Sort). Biểu diễn thuật toán qua lời văn, giả mã hoặc sơ đồ khối. So sánh các thuật toán về số bước thực hiện và hiệu quả.',
          '5.3.TC1b: Áp dụng thuật toán để sắp xếp danh sách điểm số, chiều cao, tên theo bảng chữ cái… Thử mô phỏng thuật toán bằng máy tính hoặc công cụ lập trình trực quan (Scratch, …). Đánh giá hiệu quả của thuật toán so với cách làm thủ công.'
        ],
      },
    ],
  },
  {
    id: 'ppct_tinhoc_8_phuluc03',
    title: 'Phân phối chương trình Tin học 8 - Kết nối tri thức',
    subject: 'Tin học',
    grade: 'Lớp 8',
    fileName: 'Phu_luc_03__TIN HỌC 8 KNTT.pdf',
    fileSize: '1.35 MB',
    uploadedAt: '01/08/2025',
    summary: 'Kế hoạch dạy học môn Tin học Lớp 8 (Bộ Kết nối tri thức với cuộc sống). Trường THCS Tân Loan - Tổ Tự Nhiên. Tổng số: 35 tiết (HKI: 18 tiết, HKII: 17 tiết).',
    lessonConfigs: [
      {
        lessonTitle: 'Bài 1: Lược sử công cụ tính toán',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '1, 2',
        week: 'Tuần 1, 2',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.2.TC2a: Tổ chức được tìm kiếm dữ liệu, thông tin và nội dung trong môi trường số. HS đối chiếu thông tin về lịch sử phát triển máy tính từ các nguồn khác nhau và lựa chọn thông tin phù hợp.',
          '6.1.TC2a: HS nhận diện được sự phát triển từ máy tính cơ học - máy tính điện tử - các hệ thống thông minh (AI) hiện nay (ví dụ: điện thoại thông minh, loa thông minh ở thế hệ thứ 5).'
        ],
      },
      {
        lessonTitle: 'Bài 2: Thông tin trong môi trường số',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '3, 4',
        week: 'Tuần 3, 4',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.2.TC2a: Học sinh nhận biết được các dạng thông tin khác nhau trong môi trường số như văn bản, hình ảnh, âm thanh, video, biểu đồ, dữ liệu,... và hiểu được rằng các thông tin này được lưu trữ, chia sẻ và xử lý bằng các thiết bị số.',
          '1.2.TC2b: Học sinh có thể tìm hiểu ai là người tạo ra thông tin, thông tin được đăng ở đâu, nhằm mục đích gì (chia sẻ kiến thức, quảng cáo, tuyên truyền, giải trí, v.v...).'
        ],
      },
      {
        lessonTitle: 'Bài 3: Thực hành: Khai thác thông tin số',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '5, 6',
        week: 'Tuần 5, 6',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.1.TC2a: Học sinh biết xác định rõ mục tiêu tìm kiếm thông tin trước khi sử dụng công cụ số. Ví dụ, khi thực hành tìm thông tin trên Internet, học sinh hiểu mình cần tìm loại dữ liệu gì (văn bản, hình ảnh, số liệu...) và phục vụ cho mục đích nào (học tập, làm bài tập, báo cáo,...).',
          '1.1.TC2b: Học sinh biết sử dụng các công cụ tìm kiếm số (như Google, Bing, Wikipedia,...) để tìm và chọn lọc thông tin phù hợp, biết cách nhập từ khóa, lọc kết quả, sử dụng công cụ tìm nâng cao.',
          '1.2.TC2a: Học sinh biết đánh giá độ tin cậy của nguồn thông tin trên Internet, phân biệt được thông tin chính thống và không chính thống, biết so sánh giữa nhiều nguồn để kiểm chứng độ chính xác.'
        ],
      },
      {
        lessonTitle: 'Bài 4: Đạo đức và văn hoá trong sử dụng công nghệ kĩ thuật số',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '7',
        week: 'Tuần 7',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '2.5.TC2a: Thảo luận về các chuẩn mực hành vi và cách sử dụng công nghệ số và tương tác trong môi trường số. Nhận biết và giải thích được một số biểu hiện vi phạm đạo đức và pháp luật, biểu hiện thiếu văn hoá khi sử dụng công nghệ số (ví dụ: phát tán nội dung nhạy cảm, vi phạm bản quyền).',
          '2.5.TC2b: Sản phẩm tạo ra thể hiện được đạo đức, tính văn hoá và không vi phạm pháp luật. Thực hiện và bảo đảm hành vi ứng xử có văn hóa trong môi trường số.',
          '3.3.TC2a: Hiểu và tôn trọng vấn đề bản quyền khi sáng tạo và sử dụng các sản phẩm số, từ đó biết cách lựa chọn hình thức bản quyền phù hợp (hoặc biết cách không vi phạm bản quyền của người khác).'
        ],
      },
      {
        lessonTitle: 'Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '10, 11',
        week: 'Tuần 10, 11',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.3.TC2a: Sao chép được dữ liệu từ các tệp văn bản, trang trình chiếu sang trang tính. Đây chính là việc thu thập và tổ chức dữ liệu (từ các nguồn khác nhau) vào công cụ quản lí (bảng tính) một cách hiệu quả.',
          '5.2.TC2b: Sử dụng được phần mềm bảng tính trợ giúp giải quyết bài toán thực tế. Đây là sự vận dụng trực tiếp các tính năng của công nghệ (phần mềm bảng tính) để tìm ra giải pháp cho các vấn đề thực tiễn (ví dụ: tính toán ngân sách, quản lí điểm số...)',
          '5.3.TC2a: Sử dụng các công thức tính toán nâng cao như địa chỉ tương đối và tuyệt đối trong bảng tính (đặc biệt khi sao chép công thức) là một hình thức sáng tạo giải pháp tối ưu, tự động hóa quá trình tính toán và phân tích dữ liệu để giải quyết bài toán thực tế một cách nhanh chóng và chính xác.'
        ],
      },
      {
        lessonTitle: 'Bài 6: Sắp xếp và lọc dữ liệu',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '12',
        week: 'Tuần 12',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.3.TC2a: Học sinh biết cách sử dụng các chức năng sắp xếp (Sort) trong phần mềm bảng tính (như Excel, Google Sheets) để tổ chức dữ liệu theo trật tự nhất định – ví dụ: sắp xếp tăng dần hoặc giảm dần theo tên, điểm số, ngày tháng.',
          '1.3.TC2b: Học sinh sử dụng chức năng lọc (Filter) để chọn lọc những thông tin cần thiết (ví dụ: chỉ hiện học sinh có điểm trên 8). Sau đó, biết phân tích, so sánh dữ liệu được lọc để rút ra nhận xét hoặc kết luận.',
          '5.2.TC2b: Học sinh vận dụng kỹ năng sắp xếp, lọc, và phân tích dữ liệu trong bảng tính để giải quyết các bài toán hoặc tình huống thực tế — chẳng hạn như quản lý danh sách chi tiêu, thống kê điểm thi, hoặc theo dõi kết quả học tập.'
        ],
      },
      {
        lessonTitle: 'Bài 7: Trình bày dữ liệu bằng biểu đồ',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '13',
        week: 'Tuần 13',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC2a: Học sinh biết sử dụng phần mềm bảng tính (như Excel, Google Sheets) để chọn dạng biểu đồ phù hợp (cột, tròn, đường,...) nhằm trình bày dữ liệu một cách trực quan, dễ hiểu.',
          '3.2.TC2a: Học sinh hiểu và lựa chọn loại biểu đồ phù hợp với loại dữ liệu (ví dụ: biểu đồ tròn cho tỉ lệ %, biểu đồ cột cho so sánh số lượng,...), đồng thời chỉnh sửa màu sắc, tiêu đề, nhãn dữ liệu để biểu đồ rõ ràng và chính xác hơn.',
          '5.2.TC2a: Học sinh vận dụng kỹ năng tạo và phân tích biểu đồ để giải quyết các tình huống thực tế (như theo dõi chi tiêu, thống kê điểm học tập, hoặc so sánh số liệu môi trường,…).'
        ],
      },
      {
        lessonTitle: 'Bài 8a: Làm việc với danh sách dạng liệt kê và hình ảnh trong văn bản',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '14, 15',
        week: 'Tuần 14, 15',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC2a: Học sinh Biết sử dụng phần mềm xử lý văn bản để tạo danh sách và chèn hình ảnh, trình bày nội dung rõ ràng, sinh động.',
          '3.2.TC2a: Các thao tác xử lý hình ảnh và đồ họa trong văn bản là kỹ năng tạo và chỉnh sửa nội dung số phức tạp hơn để đáp ứng nhu cầu thực tế, đạt tính thẩm mĩ.',
          '5.2.TC2b: Vận dụng kỹ năng tạo danh sách và chèn hình ảnh vào các sản phẩm học tập và đời sống, thể hiện sự chủ động và sáng tạo trong sử dụng công nghệ số.'
        ],
      },
      {
        lessonTitle: 'Bài 9a: Tạo đầu trang, chân trang cho văn bản',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '18, 19',
        week: 'Tuần 18, 19',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC2a: Học sinh biết sử dụng các chức năng của phần mềm xử lý văn bản (như Word) để tạo và chỉnh sửa đầu trang, chân trang phù hợp với nội dung tài liệu. Qua đó, các em phát triển năng lực số trong việc trình bày thông tin sao cho văn bản chuyên nghiệp, rõ ràng và có tính thẩm mỹ.',
          '5.2.TC2b: Tạo và chia sẻ sản phẩm số có trách nhiệm, chuyên nghiệp.'
        ],
      },
      {
        lessonTitle: 'Bài 10a: Định dạng nâng cao cho trang chiếu',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '20, 21',
        week: 'Tuần 20, 21',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC2b: Học sinh biết sử dụng phần mềm trình chiếu (như PowerPoint hoặc Google Slides) để thực hiện các định dạng nâng cao cho trang chiếu: thay đổi bố cục, màu nền, hiệu ứng chuyển tiếp, hoạt hình cho văn bản và hình ảnh, chèn âm thanh hoặc video minh họa.',
          '3.2.TC2a: Học sinh có khả năng tạo ra sản phẩm trình chiếu hoàn chỉnh, biết chỉnh sửa, lưu trữ, xuất file và chia sẻ cho người khác qua các nền tảng số (như Google Drive, Microsoft ,...).'
        ],
      },
      {
        lessonTitle: 'Bài 11a: Sử dụng bản mẫu tạo bài trình chiếu',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '22, 23',
        week: 'Tuần 22, 23',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.1.TC2a: Học sinh biết cách chọn và áp dụng bản mẫu (template) có sẵn trong phần mềm trình chiếu (như PowerPoint, Google Slides) để tạo các trang chiếu đồng bộ, chuyên nghiệp.',
          '3.2.TC2a: Học sinh có thể tùy chỉnh bố cục, màu sắc, kiểu chữ, nền và hiệu ứng trong bản mẫu để bài trình chiếu thống nhất về phong cách và dễ theo dõi.',
          '2.4.TC2a: Học sinh biết chia sẻ bài trình chiếu (qua email, nền tảng học tập hoặc liên kết trực tuyến) để hợp tác và trao đổi ý tưởng với bạn bè, giáo viên.'
        ],
      },
      {
        lessonTitle: 'Bài 12: Từ thuật toán đến chương trình',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '24',
        week: 'Tuần 24',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.4.TC2a: Học sinh vận dụng tư duy thuật toán để mô tả các bước giải quyết vấn đề theo trình tự logic và hợp lý.',
          '5.3.TC2a: Học sinh vận dụng công nghệ số để tạo ra sản phẩm số mới, cụ thể là chương trình máy tính dựa trên thuật toán đã xây dựng.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Hệ thống tưới cây tự động (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 13: Biểu diễn dữ liệu',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '27',
        week: 'Tuần 27',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.3.TC2a: Học sinh hiểu được cách thức dữ liệu được mã hóa và biểu diễn trong môi trường số.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Hệ thống tưới cây tự động (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 14: Cấu trúc điều khiển',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '28, 29',
        week: 'Tuần 28, 29',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.4.TC2a: Học sinh vận dụng tư duy logic và thuật toán để viết các chương trình có cấu trúc điều khiển như: rẽ nhánh.',
          '5.1.TC2a: Học sinh sử dụng ngôn ngữ lập trình Scratch để xây dựng chương trình có cấu trúc điều khiển, từ đó tạo ra sản phẩm số thể hiện giải pháp cho một bài toán thực tế.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Hệ thống tưới cây tự động (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 15: Gỡ lỗi',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '30, 31',
        week: 'Tuần 30, 31',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '5.1.TC2a: Học sinh biết cách phân tích bước chạy của chương trình, xác định điểm khác biệt giữa hành vi thực tế và hành vi mong đợi.',
          '5.1.TC2b: Học sinh biết cách dùng công cụ hỗ trợ (ví dụ: trình gỡ lỗi IDE).',
          '5.3.TC2a: Học sinh biết cách thiết kế và thực hiện các trường hợp kiểm thử (test cases) phù hợp, bao gồm trường hợp biên và trường hợp lỗi.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Hệ thống tưới cây tự động (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 16: Tin học với nghề nghiệp',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '32, 35',
        week: 'Tuần 32, 35',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '2.3.TC2b: Học sinh đánh giá được ảnh hưởng của công nghệ số đối với các nghề nghiệp và xã hội, nhận thức được tác động tích cực và tiêu cực của công nghệ đối với việc làm, năng suất lao động và nhu cầu nhân lực.',
          '5.4.TC2a: Học sinh nhận biết được vai trò của công nghệ thông tin và truyền thông trong các lĩnh vực nghề nghiệp khác nhau, hiểu được tầm quan trọng của kỹ năng số trong học tập và định hướng nghề nghiệp tương lai.'
        ],
      },
    ],
  },
  {
    id: 'ppct_tinhoc_9_phuluc03',
    title: 'Phân phối chương trình Tin học 9 - Kết nối tri thức',
    subject: 'Tin học',
    grade: 'Lớp 9',
    fileName: 'Phu_luc_03__TIN HỌC 9 KNTT.pdf',
    fileSize: '1.42 MB',
    uploadedAt: '01/08/2025',
    summary: 'Kế hoạch dạy học môn Tin học Lớp 9 (Bộ Kết nối tri thức với cuộc sống). Trường THCS Tân Loan - Tổ Tự Nhiên. Tổng số: 35 tiết (HKI: 18 tiết, HKII: 17 tiết).',
    lessonConfigs: [
      {
        lessonTitle: 'Bài 1: Thế giới kỹ thuật số',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '1, 2',
        week: 'Tuần 1, 2',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '5.3.TC2a: Học sinh hiểu được công nghệ số (máy tính, Internet, điện thoại thông minh, trí tuệ nhân tạo, mạng xã hội, ứng dụng học tập...) ảnh hưởng đến mọi mặt của cuộc sống hiện đại.',
          '5.3.TC2b: Học sinh biết đánh giá hai mặt tích cực và tiêu cực của công nghệ số: + Tích cực: tiết kiệm thời gian, mở rộng cơ hội học tập và kết nối; + Tiêu cực: gây sao nhãng, lệ thuộc thiết bị, ảnh hưởng sức khỏe và an toàn thông tin.',
          '5.4.TC2a: Học sinh có thể nêu ví dụ hoặc đề xuất cách sử dụng công nghệ số hợp lý để học tập hoặc làm việc hiệu quả hơn.'
        ],
      },
      {
        lessonTitle: 'Bài 2: Thông tin trong giải quyết vấn đề',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '3, 4',
        week: 'Tuần 3, 4',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '1.2.TC2a: Học sinh thể hiện năng lực số khi nhận biết được vấn đề cần giải quyết, xác định thông tin nào là cần thiết để tìm lời giải.',
          '1.2.TC2b: Học sinh sử dụng năng lực số để tìm kiếm thông tin trực tuyến, đánh giá độ tin cậy của nguồn thông tin, sau đó chọn lọc và trình bày lại dữ liệu một cách logic (qua bảng, sơ đồ, biểu đồ, bài trình chiếu, v.v.).',
          '1.1.TC2b: Học sinh thể hiện năng lực số khi biết tôn trọng bản quyền thông tin, trích dẫn nguồn, không sao chép hoặc lan truyền thông tin sai lệch. Đồng thời, biết bảo mật thông tin cá nhân, không chia sẻ dữ liệu nhạy cảm khi thu thập hoặc trình bày thông tin phục vụ giải quyết vấn đề.'
        ],
      },
      {
        lessonTitle: 'Bài 3: Thực hành: Đánh giá chất lượng thông tin',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '5',
        week: 'Tuần 5',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.1.TC2b: Học sinh thể hiện năng lực đánh giá độ tin cậy của thông tin bằng cách xem xét nguồn gốc, độ chính xác, tính cập nhật, và mục đích của thông tin tìm được trên môi trường số.',
          '1.2.TC2a: Học sinh biết phân tích nội dung thông tin số (bài viết, hình ảnh, video, trang web...) để đánh giá xem thông tin đó đầy đủ, chính xác, khách quan và có căn cứ hay không.',
          '1.2.TC2b: Học sinh có khả năng tổng hợp thông tin từ nhiều nguồn khác nhau, nhận ra điểm giống và khác, từ đó rút ra kết luận chính xác và khách quan hơn.'
        ],
      },
      {
        lessonTitle: 'Bài 4: Một số vấn đề pháp lí về sử dụng dịch vụ Internet',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '6, 7',
        week: 'Tuần 6, 7',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '2.5.TC2a: Học sinh hiểu được các quy định pháp luật cơ bản liên quan đến việc sử dụng Internet (như bản quyền, bảo mật thông tin cá nhân, trách nhiệm khi đăng tải nội dung...). Các em biết cách tuân thủ quy tắc, điều khoản sử dụng của các dịch vụ Internet, tránh vi phạm pháp luật khi tham gia hoạt động trực tuyến.',
          '2.5.TC2b: Học sinh có khả năng phân tích và nhận biết các hành vi sai phạm trên Internet (như vi phạm quyền riêng tư, xâm nhập trái phép, gian lận trực tuyến...). Từ đó, biết cách ứng xử phù hợp và báo cáo hành vi vi phạm nếu cần thiết.',
          '3.3.TC2a: Học sinh thể hiện văn hóa ứng xử và đạo đức số khi sử dụng dịch vụ Internet. Biết tôn trọng quyền riêng tư, quan điểm của người khác, không xúc phạm hay kỳ thị trên mạng.'
        ],
      },
      {
        lessonTitle: 'Bài 5: Tìm hiểu về phần mềm mô phỏng',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '8',
        week: 'Tuần 8',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '5.2.TC2b: Học sinh biết khởi động và sử dụng phần mềm mô phỏng, lựa chọn các chức năng phù hợp để thực hiện, điều chỉnh các tình huống mô phỏng theo yêu cầu. Qua đó, học sinh thể hiện khả năng ứng dụng phần mềm số để tạo ra hoặc quan sát một mô hình, quá trình, hiện tượng trong học tập hoặc đời sống.',
          '5.3.TC2a: Học sinh hiểu rằng công nghệ số giúp mô phỏng lại các hiện tượng, quá trình hoặc hệ thống phức tạp mà trong thực tế khó hoặc nguy hiểm để quan sát. Việc sử dụng mô phỏng giúp tiết kiệm thời gian, chi phí và tăng hiệu quả học tập, nghiên cứu.',
          '5.3.TC2b: Học sinh trực tiếp thao tác trên phần mềm mô phỏng, thay đổi các thông số, quan sát kết quả và rút ra nhận xét, kết luận. Qua đó, thể hiện năng lực khai thác công nghệ số để học tập và khám phá kiến thức mới.'
        ],
      },
      {
        lessonTitle: 'Bài 6: Thực hành: Khai thác phần mềm mô phỏng',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '11, 12',
        week: 'Tuần 11, 12',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '5.3.TC2a: Học sinh biết sử dụng phần mềm mô phỏng (như PhET, Crocodile Physics, Algodoo, hoặc phần mềm mô phỏng trong sách giáo khoa) để quan sát, thay đổi tham số và rút ra kết luận về một hiện tượng hay quá trình.',
          '5.3.TC2b: Học sinh phân tích và đánh giá kết quả mô phỏng để so sánh với kiến thức thực tế hoặc giả thuyết ban đầu.',
          '5.1.TC2a: Học sinh biết thu thập dữ liệu từ phần mềm mô phỏng (như thời gian, tốc độ, nhiệt độ...) và ghi lại, xử lý bằng công cụ số (bảng tính, biểu đồ hoặc báo cáo).'
        ],
      },
      {
        lessonTitle: 'Bài 7: Trình bày thông tin trong trao đổi và hợp tác',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '13',
        week: 'Tuần 13',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '2.4.TC2a: Lựa chọn công cụ số thích hợp (phần mềm trình chiếu, sơ đồ tư duy) phục vụ hợp tác nhóm.',
          '3.1.TC2a: Học sinh biết dùng phần mềm trình chiếu (như PowerPoint, Google Slides) hoặc công cụ tương tự để trình bày nội dung một cách rõ ràng, hấp dẫn và có bố cục hợp lý.',
          '3.2.TC2a: Biết cách chèn, đính kèm và tích hợp các dạng tệp dữ liệu khác nhau (ảnh, video, bảng tính) vào sơ đồ tư duy.'
        ],
      },
      {
        lessonTitle: 'Bài 8: TH: Sử dụng công cụ trực quan trình bày thông tin trong trao đổi và hợp tác',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '14, 15',
        week: 'Tuần 14, 15',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '2.4.TC2a: Học sinh biết sử dụng các công cụ số (như Canva, Google Slides, PowerPoint, hoặc phần mềm vẽ sơ đồ tư duy trực tuyến) để thiết kế và trình bày thông tin dưới dạng trực quan (biểu đồ, hình ảnh, sơ đồ, infographic, …).',
          '3.1.TC2a: Học sinh tạo ra sản phẩm số (như bài trình chiếu, infographic, poster số, sơ đồ tư duy điện tử…) thể hiện nội dung được tìm hiểu hoặc tổng hợp.',
          '3.2.TC2a: Học sinh biết chỉnh sửa, cập nhật, và cải thiện sản phẩm số dựa trên phản hồi của giáo viên hoặc bạn học.',
          '2.2.TC2a: Học sinh sử dụng các nền tảng số (như Google Drive, Zalo nhóm, Microsoft Teams, Padlet, v.v.) để chia sẻ sản phẩm, thảo luận và hợp tác với bạn học.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Thiết kế hệ thống lọc nước đơn giản (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 9a: Sử dụng công cụ xác thực dữ liệu',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '16, 19',
        week: 'Tuần 16, 19',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.3.TC2a: Học sinh biết cách sử dụng các tính năng xác thực dữ liệu (Data Validation) trong phần mềm bảng tính để kiểm soát kiểu dữ liệu nhập vào, giới hạn giá trị hợp lệ, và ngăn lỗi khi nhập dữ liệu. Qua đó, học sinh rèn luyện năng lực sử dụng công cụ số nhằm tổ chức và đảm bảo tính chính xác của dữ liệu.',
          '1.3.TC2b: Học sinh vận dụng các quy tắc xác thực dữ liệu (ví dụ: chỉ cho phép nhập số, giới hạn khoảng giá trị, chọn từ danh sách, hiển thị thông báo lỗi) để đảm bảo dữ liệu đúng và đầy đủ. Điều này thể hiện năng lực vận dụng công cụ số vào thực tế để duy trì tính toàn vẹn và tin cậy của thông tin trong quá trình làm việc.',
          '5.2.TC2b: Học sinh ứng dụng công cụ xác thực dữ liệu vào các bài toán thực tế, như quản lý danh sách học sinh, điểm số, hoặc sản phẩm, để phát hiện và ngăn ngừa lỗi nhập dữ liệu. Qua đó, thể hiện năng lực giải quyết vấn đề bằng công cụ số, giúp công việc trở nên chính xác và hiệu quả hơn.'
        ],
      },
      {
        lessonTitle: 'Bài 10a: Sử dụng hàm COUNTIF',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '20, 21',
        week: 'Tuần 20, 21',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '5.2.TC2b: Học sinh sử dụng hàm COUNTIF trong bảng tính (như Excel hoặc Google Sheets) để đếm số ô thỏa mãn điều kiện nhất định, ví dụ: đếm số học sinh đạt điểm trên 8 hoặc số sản phẩm đạt chất lượng.',
          '5.3.TC2a: Sau khi dùng COUNTIF để thống kê, học sinh phân tích kết quả (ví dụ: tỷ lệ học sinh đạt chuẩn, số lượng sản phẩm lỗi, v.v.) và rút ra nhận xét.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Thiết kế hệ thống lọc nước đơn giản (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 11a: Sử dụng hàm SUMIF',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '22',
        week: 'Tuần 22',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '5.2.TC2b: Học sinh biết vận dụng công cụ số (phần mềm bảng tính) để tự động tính tổng có điều kiện bằng hàm SUMIF, thay vì tính thủ công. Qua đó, học sinh rèn năng lực sử dụng công cụ kỹ thuật số để xử lý và phân tích dữ liệu theo tiêu chí nhất định, giúp tiết kiệm thời gian và nâng cao độ chính xác trong tính toán.',
          '1.3.TC2a: Học sinh hiểu cách tổ chức dữ liệu trong bảng tính (chia cột, hàng, đặt tiêu đề rõ ràng, xác định vùng điều kiện và vùng tính tổng). Khi dùng hàm SUMIF, học sinh xử lý thông tin có chọn lọc, biết lọc ra các giá trị phù hợp với điều kiện đặt ra để tổng hợp thông tin cần thiết.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Thiết kế hệ thống lọc nước đơn giản (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 12a: Sử dụng hàm IF',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '23, 24',
        week: 'Tuần 23, 24',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '5.2.TC2b: Học sinh vận dụng công cụ bảng tính (Excel, Google Sheets, LibreOffice Calc...) để giải quyết một bài toán thực tế, thể hiện khả năng ứng dụng công nghệ số trong học tập.',
          '5.3.TC2a: Việc sử dụng hàm IF giúp học sinh nhận thức được cách biểu diễn thuật toán bằng công cụ số, từ đó nâng cao năng lực lập luận và giải quyết vấn đề bằng logic máy tính.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Thiết kế hệ thống lọc nước đơn giản (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 13a: Hoàn thiện bảng tính quản lí tài chính gia đình',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '25',
        week: 'Tuần 25',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '1.3.TC2a: Học sinh biết cách sắp xếp, lưu trữ và truy xuất dữ liệu tài chính trong bảng tính, ví dụ như chi tiêu, thu nhập, tiết kiệm,… giúp quản lí thông tin một cách khoa học. Học sinh có thể mở, lưu, tìm kiếm hoặc cập nhật dữ liệu một cách chính xác.',
          '5.2.TC2b: Học sinh vận dụng các công cụ của phần mềm bảng tính (Excel hoặc Google Sheets) để xử lí dữ liệu: dùng hàm, định dạng ô, biểu đồ, hoặc công cụ lọc/sắp xếp nhằm làm rõ thông tin tài chính của gia đình. Qua đó, rèn luyện kỹ năng làm việc với dữ liệu số thực tế.',
          '5.3.TC2a: Học sinh hiểu quy trình từ thu thập – nhập dữ liệu – xử lí – phân tích – trình bày kết quả trong bảng tính. Qua đó, các em rèn luyện tư duy logic, khả năng tự động hóa tính toán bằng hàm, và hiểu được cách công nghệ giúp quản lí thông tin hiệu quả.',
          '1.3.TC2b: Học sinh biết ứng dụng phần mềm bảng tính như một công cụ số để tính toán, phân tích thu chi và đưa ra các quyết định tài chính hợp lý. Qua bài học, học sinh thể hiện khả năng giải quyết vấn đề thực tiễn bằng công nghệ số.'
        ],
        hasStemIntegration: true,
        stemTopic: 'Thiết kế hệ thống lọc nước đơn giản (Nghiệm thu Stem)',
      },
      {
        lessonTitle: 'Bài 14: Giải quyết vấn đề',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '28',
        week: 'Tuần 28',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '5.1.TC2a: Học sinh nhận biết, mô tả được vấn đề cần giải quyết khi sử dụng công nghệ số (ví dụ: cần xử lý dữ liệu, tự động hóa một công việc, tối ưu quy trình...).',
          '5.1.TC2b: Học sinh biết đề xuất, chọn lựa công cụ hoặc phần mềm thích hợp (bảng tính, lập trình, phần mềm mô phỏng, AI, v.v.) để giải quyết vấn đề đã xác định.',
          '5.2.TC2a: Học sinh vận dụng phần mềm hoặc công cụ kỹ thuật số (như lập trình, bảng tính, mô phỏng…) để thực hiện giải pháp đã lựa chọn.'
        ],
      },
      {
        lessonTitle: 'Bài 15: Bài toán tin học',
        periods: 1,
        periodDetail: '1',
        ppctOrder: '29',
        week: 'Tuần 29',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '3.4.TC2a: Học sinh sử dụng tư duy thuật toán để xác định các bước giải quyết bài toán tin học, biết mô tả quy trình xử lý dữ liệu, từ việc xác định đầu vào – đầu ra đến thiết kế thuật toán hợp lý.',
          '5.3.TC2a: Học sinh sử dụng ngôn ngữ lập trình (như Python) để hiện thực hóa thuật toán, tạo ra chương trình giải bài toán tin học.',
          '5.2.TC2b: Học sinh biết chạy thử, kiểm tra lỗi, đánh giá kết quả đầu ra của chương trình, sau đó chỉnh sửa, tối ưu mã lệnh để đảm bảo chương trình hoạt động đúng và hiệu quả.'
        ],
      },
      {
        lessonTitle: 'Bài 16: Thực hành: Lập chương trình máy tính',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '30, 31',
        week: 'Tuần 30, 31',
        equipment: 'Tivi, Máy tính',
        location: 'Phòng Tin học',
        integratedNLS: [
          '3.4.TC2a: Học sinh vận dụng kiến thức về lập trình để xây dựng chương trình hoàn chỉnh giải quyết một bài toán cụ thể.',
          '5.1.TC2a: Học sinh nhận biết và áp dụng các bước cơ bản của quy trình phát triển chương trình: xác định bài toán → viết thuật toán → mã hóa → chạy thử → sửa lỗi → hoàn thiện.'
        ],
      },
      {
        lessonTitle: 'Bài 17: Tin học và thế giới nghề nghiệp',
        periods: 2,
        periodDetail: '1+2',
        ppctOrder: '32, 35',
        week: 'Tuần 32, 35',
        equipment: 'Tivi, Máy tính',
        location: 'Lớp học',
        integratedNLS: [
          '5.4.TC2a: Học sinh nhận biết được vai trò của công nghệ thông tin trong các lĩnh vực nghề nghiệp khác nhau.',
          '2.3.TC2b: Học sinh biết sử dụng công cụ số (email, mạng xã hội nghề nghiệp, nền tảng trực tuyến) để giao tiếp, trao đổi thông tin nghề nghiệp một cách phù hợp và hiệu quả.',
          '2.6.TC2b: Học sinh nhận biết được các vấn đề đạo đức, pháp lý khi tìm kiếm, chia sẻ hoặc đăng tải thông tin nghề nghiệp trên mạng.'
        ],
      },
    ],
  },
  {
    id: 'ppct_hdtn_9_sinh_hoat_duoi_co',
    title: 'Phân phối chương trình HĐTN, HN 9 - Sinh hoạt dưới cờ',
    subject: 'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)',
    grade: 'Lớp 9',
    volume: 'Sinh hoạt dưới cờ (Chào cờ)',
    fileName: 'PPCT_HDTN_9_Sinh_hoat_duoi_co.pdf',
    fileSize: '1.45 MB',
    uploadedAt: '01/08/2025',
    summary: 'Kế hoạch dạy học môn Hoạt động trải nghiệm, hướng nghiệp Lớp 9 - Phân môn Sinh hoạt dưới cờ (Bộ Kết nối tri thức với cuộc sống). Tổng số 35 tiết (1 tiết/tuần từ Tiết 1 đến Tiết 35).',
    lessonConfigs: [
      { lessonTitle: 'Tiết 1: Tham gia tìm hiểu về hiện tượng bắt nạt học đường', periods: 1 },
      { lessonTitle: 'Tiết 2: Tham gia cuộc phát động “Xây dựng truyền thống nhà trường” của đoàn TNCS Hồ Chí Minh', periods: 1 },
      { lessonTitle: 'Tiết 3: Lễ khai giảng năm học mới', periods: 1 },
      { lessonTitle: 'Tiết 4: Tham gia hoạt động tập thể với chủ đề: “Giới trẻ hiện nay và các quy tắc giao tiếp, ứng xử trong xã hội”', periods: 1 },
      { lessonTitle: 'Tiết 5: Tham gia hoạt động tập thể với chủ đề: Nét đẹp trong giao tiếp ứng xử', periods: 1 },
      { lessonTitle: 'Tiết 6: Tìm hiểu biểu hiện của khả năng thích nghi với những thay đổi trong cuộc sống', periods: 1 },
      { lessonTitle: 'Tiết 7: Tranh biện và thương thuyết về một số vấn đề mà HS THCS hiện nay đang quan tâm', periods: 1 },
      { lessonTitle: 'Tiết 8: Trách nhiệm với nhiệm vụ được giao', periods: 1 },
      { lessonTitle: 'Tiết 9: Chia sẻ kết quả thực hiện có trách nhiệm các nhiệm vụ được giao', periods: 1 },
      { lessonTitle: 'Tiết 10: Tham luận về chủ đề: “Những căng thẳng và áp lực học sinh lớp 9 thường gặp phải trong cuộc sống”', periods: 1 },
      { lessonTitle: 'Tiết 11: Diễn đàn về kĩ năng ứng phó với căng thẳng và áp lực', periods: 1 },
      { lessonTitle: 'Tiết 12: Biểu diễn tiểu phẩm thể hiện kĩ năng ứng phó với căng thẳng và áp lực học sinh lớp 9 thường gặp phải trong cuộc sống', periods: 1 },
      { lessonTitle: 'Tiết 13: Diễn đàn về chủ đề “Tạo động lực cho bản thân trong các hoạt động”', periods: 1 },
      { lessonTitle: 'Tiết 14: Giao lưu với những người truyền cảm hứng, tạo động lực', periods: 1 },
      { lessonTitle: 'Tiết 15: Trao đổi về chủ đề: “Học sinh THCS với việc xây dựng ngân sách cá nhân hợp lí”', periods: 1 },
      { lessonTitle: 'Tiết 16: Giao lưu: Những con người tự chủ', periods: 1 },
      { lessonTitle: 'Tiết 17: Trao đổi về chủ đề: “Học sinh THCS với việc xây dựng ngân sách cá nhân hợp lí”', periods: 1 },
      { lessonTitle: 'Tiết 18: Giao lưu về chủ đề “Bầu không khí vui vẻ, yêu thương trong gia đình”', periods: 1 },
      { lessonTitle: 'Tiết 19: Giao lưu trao đổi về cách sắp xếp khoa học công việc gia đình', periods: 1 },
      { lessonTitle: 'Tiết 20: Chia sẻ về biện pháp phát triển kinh tế gia đình', periods: 1 },
      { lessonTitle: 'Tiết 21: Tìm hiểu về mạng lưới quan hệ cộng đồng và phát triển mạng lưới cộng đồng ở địa phương', periods: 1 },
      { lessonTitle: 'Tiết 22: Diễn đàn về chủ đề “Giao tiếp thông minh và an toàn trên mạng xã hội”', periods: 1 },
      { lessonTitle: 'Tiết 23: Tham gia hoạt động truyền thông nâng cao nhận thức của cộng đồng về vấn đề học đường', periods: 1 },
      { lessonTitle: 'Tiết 24: Tìm hiểu về cách thiết kế sản phẩm giới thiệu vẻ đẹp danh lam thắng cảnh, cảnh quan thiên nhiên của đất nước', periods: 1 },
      { lessonTitle: 'Tiết 25: Tìm hiểu về cách thực hiện đề tài khảo sát về nguyên nhân gây ô nhiễm môi trường tại địa bàn sinh sống', periods: 1 },
      { lessonTitle: 'Tiết 26: Phòng chống ô nhiễm và bảo vệ môi trường - Hướng dẫn ôn tập KTGHKII', periods: 1 },
      { lessonTitle: 'Tiết 27: Trao đổi về chủ đề “Thực trạng ô nhiễm môi trường và các biện pháp phòng chống ô nhiễm, bảo vệ môi trường”', periods: 1 },
      { lessonTitle: 'Tiết 28: Trao đổi về chủ đề “Các biện pháp phòng chống ô nhiễm, bảo vệ môi trường”', periods: 1 },
      { lessonTitle: 'Tiết 29: Giới thiệu các nghề có xu hướng phát triển trong tương lai và yêu cầu chung của các nghề đó', periods: 1 },
      { lessonTitle: 'Tiết 30: Trao đổi về chủ đề “Nên chọn nghề mình quan tâm hay chọn nghề theo trào lưu của xã hội”', periods: 1 },
      { lessonTitle: 'Tiết 31: Giao lưu với cựu học sinh thành đạt trong nghề nghiệp', periods: 1 },
      { lessonTitle: 'Tiết 32: Hệ thống các cơ sở giáo dục nghề nghiệp của trung ương và địa phương', periods: 1 },
      { lessonTitle: 'Tiết 33: Chia sẻ kết quả tham vấn thầy cô, người thân và quyết định lựa chọn con đường tiếp theo sau THCS của bản thân. HDHS ôn tập Kt cuối HK II', periods: 1 },
      { lessonTitle: 'Tiết 34: Tham gia ngày hội tư vấn hướng nghiệp dành cho học sinh cuối cấp THCS', periods: 1 },
      { lessonTitle: 'Tiết 35: Tổng kết năm Học', periods: 1 },
    ],
  },
];

/**
 * The verified textbooks uploaded in the user's repository:
 * - 4 Tin học textbooks (Lớp 6, 7, 8, 9)
 * - 8 Toán học textbooks (Lớp 6, 7, 8, 9 - Tập 1 & Tập 2)
 * - 7 Hoạt động trải nghiệm textbooks & phân môn
 */
const TARGET_UPLOADED_BOOK_KEYS = [
  'Tin học_Lớp 6',
  'Tin học_Lớp 7',
  'Tin học_Lớp 8',
  'Tin học_Lớp 9',
  'Toán học_Lớp 6_Tập 1',
  'Toán học_Lớp 6_Tập 2',
  'Toán học_Lớp 7_Tập 1',
  'Toán học_Lớp 7_Tập 2',
  'Toán học_Lớp 8_Tập 1',
  'Toán học_Lớp 8_Tập 2',
  'Toán học_Lớp 9_Tập 1',
  'Toán học_Lớp 9_Tập 2',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 6',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 7',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 8',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 9',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 9_Sinh hoạt dưới cờ (Chào cờ)',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 9_Sinh hoạt lớp (Sinh hoạt)',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)_Lớp 9_Hoạt động giáo dục theo chủ đề',
];

function buildInitialSeedBooks(): CustomUploadedBook[] {
  const books: CustomUploadedBook[] = [];

  for (const key of TARGET_UPLOADED_BOOK_KEYS) {
    const curItem = VERIFIED_KNTT_CURRICULUM[key];
    if (!curItem) continue;

    const parts = key.split('_');
    const subject = parts[0] || 'Tin học';
    const grade = parts[1] || 'Lớp 6';
    const volume = parts[2] || 'Cả năm / Không phân tập';

    const cleanTitle = `SGK ${subject} ${grade} ${volume !== 'Cả năm / Không phân tập' ? '(' + volume + ')' : ''} - Kết nối tri thức`;
    const bookId = `sgk_${subject}_${grade}_${volume}`.replace(/\s+/g, '_').toLowerCase();

    const book: CustomUploadedBook = {
      id: bookId,
      title: cleanTitle,
      subject,
      grade,
      bookSeries: 'Kết nối tri thức với cuộc sống',
      volume,
      fileName: `SGK_${subject}_${grade}${volume !== 'Cả năm / Không phân tập' ? '_' + volume : ''}_KNTT.pdf`.replace(/\s+/g, '_'),
      fileSize: '4.50 MB',
      uploadedAt: '01/08/2025',
      summary: `Bộ sách giáo khoa chuẩn ${subject} ${grade} (${volume}) gồm ${curItem.lessons.length} bài học, ${curItem.themes?.length || 0} chủ đề/chương.`,
      lessons: curItem.lessons,
    };
    books.push(book);
  }

  return books;
}

export const SEED_SAMPLE_BOOKS: CustomUploadedBook[] = buildInitialSeedBooks();
