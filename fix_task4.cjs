const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldAppendix = `   - worksheetContent: BẮT BUỘC TÁCH RÕ THÀNH 2 PHẦN RIÊNG BIỆT DẠNG BẢNG:
     + PHẦN 1: PHIẾU HỌC TẬP DÀNH CHO HỌC SINH
       Tiêu đề: PHIẾU HỌC TẬP: [TÊN BÀI HỌC]
       Họ và tên: ................................................ Lớp: ................. Nhóm: .........
       Bảng bài tập của học sinh:
       | STT | Nhiệm vụ / Câu hỏi học tập | Kết quả / Câu trả lời của học sinh |
       | 1 | [Nội dung câu hỏi / bài tập 1] | ........................................................................ |
       | 2 | [Nội dung câu hỏi / bài tập 2] | ........................................................................ |
       (BẮT BUỘC: Cột Kết quả của học sinh để dòng chấm ........... để học sinh tự điền, KHÔNG điền đáp án sẵn ở bảng này).
     + PHẦN 2: BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)
       Tiêu đề: ### BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)
       | STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |
       | 1 | [Nội dung câu hỏi 1] | [Gợi ý đáp án chi tiết, các bước giải, kết quả] | Đạt / 5.0 điểm |
       | 2 | [Nội dung câu hỏi 2] | [Gợi ý đáp án chi tiết, các bước giải, kết quả] | Đạt / 5.0 điểm |
   - assignmentPrompt: Hướng dẫn tự học & nhiệm vụ về nhà (BẮT BUỘC ghi rõ tên bài học tiếp theo của SGK Kết nối tri thức).`;

const newAppendix = `   - worksheetContent: \${isPreschool ? 'Không bắt buộc với Mầm non, nếu có thì là bảng/phiếu trò chơi bằng hình ảnh. Nếu không có để chuỗi rỗng' : \`BẮT BUỘC TÁCH RÕ THÀNH 2 PHẦN RIÊNG BIỆT DẠNG BẢNG:
     + PHẦN 1: PHIẾU HỌC TẬP DÀNH CHO HỌC SINH
       Tiêu đề: PHIẾU HỌC TẬP: [TÊN BÀI HỌC]
       Họ và tên: ................................................ Lớp: ................. Nhóm: .........
       Bảng bài tập của học sinh:
       | STT | Nhiệm vụ / Câu hỏi học tập | Kết quả / Câu trả lời của học sinh |
       | 1 | [Nội dung câu hỏi / bài tập 1] | ........................................................................ |
       | 2 | [Nội dung câu hỏi / bài tập 2] | ........................................................................ |
       (BẮT BUỘC: Cột Kết quả của học sinh để dòng chấm ........... để học sinh tự điền, KHÔNG điền đáp án sẵn ở bảng này).
     + PHẦN 2: BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)
       Tiêu đề: ### BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)
       | STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |
       | 1 | [Nội dung câu hỏi 1] | [Gợi ý đáp án chi tiết, các bước giải, kết quả] | Đạt / 5.0 điểm |
       | 2 | [Nội dung câu hỏi 2] | [Gợi ý đáp án chi tiết, các bước giải, kết quả] | Đạt / 5.0 điểm |\`}
   - assignmentPrompt: \${isPreschool ? 'Không bắt buộc với mầm non. Nếu có thì nhắc nhở trẻ chia sẻ với bố mẹ.' : 'Hướng dẫn tự học & nhiệm vụ về nhà (BẮT BUỘC ghi rõ tên bài học tiếp theo của SGK Kết nối tri thức).'}`;

code = code.replace(oldAppendix, newAppendix);
fs.writeFileSync('server.ts', code);
