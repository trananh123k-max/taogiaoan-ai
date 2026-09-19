import React from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Brain,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Hướng Dẫn Chuẩn Sư Phạm 4 Bước & Đổi Mới Dạy Học
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quy chuẩn cấu trúc bài dạy, tích hợp Khung Năng lực số (NLS) và Giáo dục Trí tuệ Nhân tạo (AI)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed">
          {/* Section 1: 4 Bước Sư Phạm */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                1. Quy Trình Sư Phạm 4 Bước Của Từng Hoạt Động
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="font-bold text-blue-700 block mb-1">
                  Bước 1: Chuyển giao nhiệm vụ học tập
                </span>
                <p className="text-slate-600 text-xs">
                  GV giao nhiệm vụ rõ ràng, nêu câu hỏi/lệnh, cung cấp học liệu số, mã QR, link Padlet/GeoGebra. HS tiếp nhận, xác định rõ yêu cầu.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="font-bold text-emerald-700 block mb-1">
                  Bước 2: Thực hiện nhiệm vụ học tập
                </span>
                <p className="text-slate-600 text-xs">
                  HS làm việc cá nhân/nhóm, tương tác phần mềm mô phỏng, tra cứu số liệu. GV theo dõi, phát hiện khó khăn và hỗ trợ kịp thời.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="font-bold text-amber-700 block mb-1">
                  Bước 3: Báo cáo kết quả và thảo luận
                </span>
                <p className="text-slate-600 text-xs">
                  HS/nhóm trình bày sản phẩm, phản biện chéo, nhận xét tương tác trên nền tảng số. GV điều phối và gợi mở vấn đề.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="font-bold text-purple-700 block mb-1">
                  Bước 4: Kết luận, nhận định
                </span>
                <p className="text-slate-600 text-xs">
                  GV chính xác hóa kiến thức, đánh giá sản phẩm và thái độ học tập, chốt nội dung trọng tâm và giao nhiệm vụ tiếp theo.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Khung Năng lực số (NLS) */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                2. Khung Năng Lực Số (NLS) - Thông tư 02/2025/TT-BGDĐT & Công văn 3456/BGDĐT-GDPT
              </h4>
            </div>
            <div className="text-slate-700 space-y-2 text-xs">
              <p className="font-semibold text-slate-800">
                Hệ thống gồm 6 miền năng lực và 24 năng lực thành phần:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  <strong>Miền 1. Khai thác dữ liệu và thông tin:</strong> 1.1 Duyệt, tìm kiếm và lọc dữ liệu; 1.2 Đánh giá dữ liệu; 1.3 Quản lý dữ liệu.
                </li>
                <li>
                  <strong>Miền 2. Giao tiếp và hợp tác:</strong> 2.1 Tương tác số; 2.2 Chia sẻ thông tin; 2.3 Trách nhiệm công dân; 2.4 Hợp tác số; 2.5 Quy tắc ứng xử mạng; 2.6 Quản lý danh tính số.
                </li>
                <li>
                  <strong>Miền 3. Sáng tạo nội dung số:</strong> 3.1 Phát triển nội dung số; 3.2 Tích hợp & tái tạo nội dung số; 3.3 Thực thi bản quyền; 3.4 Lập trình.
                </li>
                <li>
                  <strong>Miền 4. An toàn:</strong> 4.1 Bảo vệ thiết bị; 4.2 Bảo vệ dữ liệu cá nhân; 4.3 Bảo vệ sức khỏe & an sinh; 4.4 Bảo vệ môi trường.
                </li>
                <li>
                  <strong>Miền 5. Giải quyết vấn đề:</strong> 5.1 Giải quyết sự cố kỹ thuật; 5.2 Xác định nhu cầu & giải pháp công nghệ; 5.3 Sử dụng sáng tạo; 5.4 Xác định khoảng cách NLS.
                </li>
                <li>
                  <strong>Miền 6. Ứng dụng trí tuệ nhân tạo (AI):</strong> 6.1 Hiểu biết về AI; 6.2 Sử dụng AI có đạo đức và trách nhiệm; 6.3 Đánh giá các công cụ AI.
                </li>
              </ul>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 mt-2">
                <span className="font-bold text-amber-900 block mb-0.5">
                  Quy ước Mức độ thành thạo và Ký hiệu mã chỉ báo:
                </span>
                <p className="text-amber-800 text-[11px]">
                  • Lớp 1-3: Cơ bản 1 (<strong>CB1</strong>) | • Lớp 4-5: Cơ bản 2 (<strong>CB2</strong>) | • Lớp 6-7: Trung cấp 1 (<strong>TC1</strong>) | • Lớp 8-9: Trung cấp 2 (<strong>TC2</strong>) | • Lớp 10-12: Nâng cao 1 (<strong>NC1</strong>).<br />
                  • Cấu trúc mã: <em>&lt;Mã thành phần&gt;.&lt;Mức độ&gt;&lt;Ký hiệu chỉ báo&gt;</em> (VD: <code className="font-bold">1.1.NC1b</code>, <code className="font-bold">3.1.NC1a</code>, <code className="font-bold">5.2.NC1b</code>, <code className="font-bold">6.2.NC1a</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Khung Giáo dục Trí tuệ Nhân tạo (AI) - QĐ 2422/QĐ-BGDĐT */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                3. Khung Giáo Dục Trí Tuệ Nhân Tạo (AI) - Quyết định 2422/QĐ-BGDĐT (18/8/2026)
              </h4>
            </div>
            <div className="text-slate-700 space-y-2 text-xs">
              <p className="font-semibold text-slate-800">
                Gồm 4 mạch nội dung chính tương ứng với 4 thành phần năng lực đặc thù:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  <strong>Mạch A (NLa). Tư duy lấy con người làm trung tâm:</strong> Chủ đề A1. Tính chủ động của con người; Chủ đề A2. AI vì sự tiến bộ của con người; Chủ đề A3. Công dân trong kỉ nguyên AI (Quyền kiểm soát, vai trò con người).
                </li>
                <li>
                  <strong>Mạch B (NLb). Đạo đức AI:</strong> Chủ đề B1. Các khía cạnh đạo đức của AI; Chủ đề B2. Sử dụng AI an toàn và có trách nhiệm; Chủ đề B3. Nguyên tắc đạo đức & trách nhiệm giải trình.
                </li>
                <li>
                  <strong>Mạch C (NLc). Các kĩ thuật và ứng dụng AI:</strong> Chủ đề C1. Đặc điểm chính của AI; Chủ đề C2. Ứng dụng AI trong học tập và cuộc sống; Chủ đề C3. Công nghệ AI (Prompting, GenAI, LLM); Chủ đề C4. Dữ liệu trong AI; Chủ đề C5. Kĩ thuật và thuật toán AI.
                </li>
                <li>
                  <strong>Mạch D (NLd). Thiết kế hệ thống AI:</strong> Chủ đề D1. Nhận diện và hình thành giải pháp; Chủ đề D2. Cấu trúc, tương tác, cải tiến hệ thống & Tác nhân AI (AI Agent).
                </li>
              </ul>
              <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 mt-2">
                <span className="font-bold text-purple-900 block mb-0.5">
                  Quy ước mã hoá Yêu cầu cần đạt chuẩn theo QĐ 2422/QĐ-BGDĐT:
                </span>
                <p className="text-purple-800 text-[11px]">
                  • Cấu trúc: <code>[Lớp].[Mã chủ đề].[Số thứ tự]</code> (hoặc thêm <code>MR</code> trước số thứ tự cho nội dung mở rộng).<br />
                  • Ví dụ: <code className="font-bold">10.C3.1</code> (Lớp 10, Chủ đề C3, YCCĐ 1 - Kỹ thuật đặt prompt); <code className="font-bold">10.C3.2</code> (Thực hành đặt prompt); <code className="font-bold">10.A1.2</code> (Con người cần kiểm soát AI); <code className="font-bold">10.B2.1</code> (Tuân thủ đạo đức khi dùng AI); <code className="font-bold">11.C3.1</code> (Prompt nâng cao & RAG); <code className="font-bold">12.D2.MR2</code> (Tác nhân AI agent).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-[#f8fafc] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Đã hiểu quy chuẩn
          </button>
        </div>
      </div>
    </div>
  );
};
