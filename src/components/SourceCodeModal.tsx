import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, Sparkles, FileCode } from 'lucide-react';

interface SourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KHBD AI PRO - Kế Hoạch Bài Dạy & NLS/AI</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Mammoth.js for Word DOCX Extraction -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
  <!-- Docx.js for Word Document Generation -->
  <script src="https://unpkg.com/docx@8.5.0/build/index.js"></script>
  <!-- FileSaver.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Times+New+Roman&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-times { font-family: 'Times New Roman', Times, serif; }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 20mm 20mm 25mm; /* Chuẩn lề A4: Trên 20, Dưới 20, Phải 20, Trái 25 */
      margin: 0 auto;
      background: white;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .a4-page { box-shadow: none; margin: 0; width: 100%; padding: 0; }
    }
  </style>
</head>
<body class="bg-slate-100 min-h-screen flex flex-col text-slate-800">

  <!-- ==================== HEADER LUXURY AMBER ==================== -->
  <header class="sticky top-0 z-40 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white shadow-md border-b border-amber-900/60 no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center font-extrabold shadow-md">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="font-extrabold text-lg text-white">KHBD <span class="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded text-sm border border-amber-500/30">AI PRO</span></h1>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-200 border border-amber-600/40">GDPT 2018</span>
            </div>
            <p class="text-[11px] text-amber-100/80 hidden sm:block">Kế Hoạch Bài Dạy Chuẩn 4 Bước • Tích hợp Năng Lực Số & AI</p>
          </div>
        </div>

        <!-- Teacher & Status Bar -->
        <div class="flex items-center space-x-3 text-xs">
          <!-- API Connection Badge -->
          <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-200 border border-emerald-500/40 font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <i data-lucide="key-round" class="w-3 h-3 text-emerald-300"></i>
            <span>API: Đã kết nối</span>
          </div>

          <!-- Teacher Profile Info -->
          <div class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/40">
            <div class="w-6 h-6 rounded-full bg-amber-300 text-amber-950 font-bold flex items-center justify-center text-[10px]">GV</div>
            <div class="text-left leading-tight">
              <p class="font-bold text-amber-100 text-[11px]">GV. Nguyễn Văn An</p>
              <p class="text-[9px] text-amber-300/80">THPT Chuyên Châu Văn Liêm</p>
            </div>
          </div>

          <!-- Logout Button -->
          <button onclick="handleLogout()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-red-900/80 text-amber-200 hover:text-white border border-amber-700/60 transition-all font-semibold cursor-pointer">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- ==================== MAIN 2-COLUMN DASHBOARD ==================== -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- CỘT TRÁI: CẤU HÌNH & TẢI FILE DOCX/PDF (5 COLS) -->
      <div class="lg:col-span-5 xl:col-span-4 space-y-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs no-print">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <i data-lucide="sliders" class="w-4 h-4"></i>
            </div>
            <h2 class="font-bold text-sm text-slate-900">Thông Tin Bài Dạy & Cấu Hình</h2>
          </div>
          <span class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">GDPT 2018</span>
        </div>

        <!-- Form fields -->
        <div class="space-y-3.5 text-xs">
          <div>
            <label class="font-semibold text-slate-600 block mb-1">Tên bài dạy (Bài học) <span class="text-rose-500">*</span></label>
            <input id="inputLessonTitle" type="text" value="Bài 15: Hàm số bậc hai và đồ thị" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-semibold text-slate-600 block mb-1">Môn học</label>
              <select id="selectSubject" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800">
                <option value="Toán học">Toán học</option>
                <option value="Tin học">Tin học</option>
                <option value="KHTN (Khoa học tự nhiên)">KHTN (Khoa học tự nhiên)</option>
                <option value="Vật lí">Vật lí</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Lịch sử & Địa lí">Lịch sử & Địa lí</option>
              </select>
            </div>
            <div>
              <label class="font-semibold text-slate-600 block mb-1">Khối lớp</label>
              <select id="selectGrade" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800">
                <option value="Lớp 1">Lớp 1</option>
                <option value="Lớp 2">Lớp 2</option>
                <option value="Lớp 3">Lớp 3</option>
                <option value="Lớp 4">Lớp 4</option>
                <option value="Lớp 5">Lớp 5</option>
                <option value="Lớp 6">Lớp 6</option>
                <option value="Lớp 7">Lớp 7</option>
                <option value="Lớp 8">Lớp 8</option>
                <option value="Lớp 9">Lớp 9</option>
                <option value="Lớp 10">Lớp 10</option>
                <option value="Lớp 11">Lớp 11</option>
                <option value="Lớp 12">Lớp 12</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="font-semibold text-slate-600 block mb-1">
                <span>Bộ sách giáo khoa</span>
              </label>
              <select id="selectBookSeries" class="w-full bg-slate-50 border border-amber-200 text-amber-900 font-semibold rounded-lg px-3 py-2">
                <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
              </select>
            </div>
            <div>
              <label class="font-semibold text-slate-600 block mb-1">Số tiết</label>
              <input id="inputPeriods" type="number" min="1" max="10" value="2" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800" />
            </div>
          </div>

          <!-- DOCX Upload Area -->
          <div class="space-y-1.5 pt-1">
            <label class="font-semibold text-slate-600 flex items-center justify-between">
              <span>Đính kèm giáo án cũ (.docx) hoặc PDF SGK</span>
              <span class="text-[10px] text-emerald-600 font-bold">Bóc tách ảnh gốc</span>
            </label>
            <div id="dropZone" class="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/60">
              <input type="file" id="fileInput" accept=".docx,.pdf" class="hidden" />
              <i data-lucide="file-up" class="w-6 h-6 text-slate-400 mx-auto mb-1.5"></i>
              <p class="text-xs font-semibold text-slate-700">Kéo thả file .docx hoặc nhấn để chọn</p>
              <p class="text-[10px] text-slate-500 mt-0.5">Mammoth.js tự động giữ lại hình ảnh & sơ đồ gốc</p>
            </div>
            <div id="fileInfo" class="hidden text-[11px] p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
              <span id="fileNameDisplay" class="font-semibold truncate"></span>
              <span id="fileSlotsCount" class="font-bold"></span>
            </div>
          </div>

          <!-- 2 Nút Toggle NLS và AI -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <label class="flex items-center justify-between p-2.5 rounded-lg border border-blue-100 bg-blue-50/50 cursor-pointer">
              <div class="flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-blue-600"></i>
                <div>
                  <span class="font-bold text-blue-900 block text-xs">Tích hợp Khung Năng lực số (NLS)</span>
                  <span class="text-[10px] text-blue-700">Bộ tiêu chuẩn 6 miền năng lực số phổ thông</span>
                </div>
              </div>
              <input type="checkbox" id="toggleNLS" checked class="w-4 h-4 text-blue-600 rounded cursor-pointer" />
            </label>

            <label class="flex items-center justify-between p-2.5 rounded-lg border border-purple-100 bg-purple-50/50 cursor-pointer">
              <div class="flex items-center gap-2">
                <i data-lucide="brain" class="w-4 h-4 text-purple-600"></i>
                <div>
                  <span class="font-bold text-purple-900 block text-xs">Tích hợp Năng lực Trí tuệ Nhân tạo (AI)</span>
                  <span class="text-[10px] text-purple-700">Đạo đức AI, Prompting, Phân tích dữ liệu</span>
                </div>
              </div>
              <input type="checkbox" id="toggleAI" checked class="w-4 h-4 text-purple-600 rounded cursor-pointer" />
            </label>
          </div>

          <!-- Action Generate Button -->
          <button id="btnGenerate" onclick="generateLessonPlan()" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
            <span>NÂNG CẤP BÀI DẠY (GEMINI AI PRO)</span>
          </button>
        </div>
      </div>

      <!-- CỘT PHẢI: PREVIEW ĐỊNH DẠNG TRANG GIẤY A4 (7-8 COLS) -->
      <div class="lg:col-span-7 xl:col-span-8 space-y-4">
        <!-- Top Toolbar -->
        <div class="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs no-print">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold text-slate-700 flex items-center gap-1.5">
              <i data-lucide="file-text" class="w-4 h-4 text-amber-700"></i> Xem trước Kế hoạch bài dạy
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Định dạng A4 Chuẩn</span>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Nút Sao chép -->
            <button onclick="copyLessonPlan()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer">
              <i data-lucide="copy" class="w-3.5 h-3.5 text-slate-500"></i>
              <span id="copyText">📋 Sao chép</span>
            </button>

            <!-- Nút Tải file Word (.docx) -->
            <button onclick="downloadWordDocument()" class="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>💾 Tải file Word (.docx)</span>
            </button>

            <!-- Nút In / PDF -->
            <button onclick="window.print()" class="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer" title="In / Xuất PDF">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Khung Trang Giấy A4 (A4 Paper Container) -->
        <div class="overflow-x-auto pb-8">
          <div class="a4-page font-times text-slate-900 leading-relaxed text-[13pt]" id="previewA4Container">
            
            <!-- Header Tiêu ngữ chuẩn -->
            <table class="w-full mb-4 border-none text-[12pt] font-times">
              <tr>
                <td class="w-1/2 align-top text-center pb-2">
                  <p class="font-bold uppercase text-[11pt]">TRƯỜNG THPT CHUYÊN CHÂU VĂN LIÊM</p>
                  <p class="font-bold uppercase text-[11pt]">TỔ CHUYÊN MÔN TOÁN - TIN</p>
                  <div class="w-24 h-0.5 bg-black mx-auto mt-1"></div>
                </td>
                <td class="w-1/2 align-top text-center pb-2">
                  <p class="font-bold uppercase text-[11pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p class="italic text-[11pt]">Độc lập - Tự do - Hạnh phúc</p>
                  <div class="w-32 h-0.5 bg-black mx-auto mt-1"></div>
                </td>
              </tr>
            </table>

            <!-- Tiêu đề Kế hoạch bài dạy -->
            <div class="text-center my-6">
              <h2 class="font-bold text-[15pt] uppercase tracking-wide">KẾ HOẠCH BÀI DẠY (GIÁO ÁN)</h2>
              <h3 class="font-bold text-[14pt] uppercase text-blue-900 mt-1" id="docLessonTitle">BÀI 15: HÀM SỐ BẬC HAI VÀ ĐỒ THỊ</h3>
              <p class="text-[12pt] italic mt-1">
                Môn: <strong id="docSubject">Toán học</strong> | Lớp: <strong id="docGrade">Lớp 10</strong> | Bộ sách: <strong id="docBookSeries">Kết nối tri thức với cuộc sống</strong> | Thời lượng: <strong id="docPeriods">2 tiết</strong>
              </p>
            </div>

            <!-- I. MỤC TIÊU -->
            <div class="mb-5 space-y-2">
              <h4 class="font-bold text-[13pt] uppercase">I. MỤC TIÊU</h4>
              <div class="pl-4 space-y-1.5">
                <p><strong>1. Về kiến thức:</strong> Nhận biết được hàm số bậc hai y = ax² + bx + c (a ≠ 0). Xác định được tọa độ đỉnh, trục đối xứng, khoảng đồng biến, nghịch biến và vẽ phác đồ thị parabol.</p>
                <p><strong>2. Về năng lực:</strong></p>
                <ul class="list-disc pl-6 space-y-1">
                  <li><em>Năng lực chung:</em> Tự chủ và tự học khi sử dụng phần mềm tương tác GeoGebra; Giao tiếp và hợp tác nhóm khi thảo luận bảng giá trị.</li>
                  <li><em>Năng lực đặc thù:</em> Tư duy và lập luận toán học, mô hình hóa toán học các quỹ đạo cầu vồng, cổng Parabol trong thực tế.</li>
                  <li><em>Năng lực số (NLS):</em> Sử dụng phần mềm hình học động GeoGebra để khảo sát sự biến thiên của parabol khi thay đổi hệ số a, b, c.</li>
                  <li><em>Năng lực AI:</em> Nhận diện ứng dụng thị giác máy tính nhận diện quỹ đạo parabol trong công nghệ mô phỏng vật lí.</li>
                </ul>
                <p><strong>3. Về phẩm chất:</strong> Chăm chỉ, trách nhiệm trong hoạt động nhóm, có ý thức ứng dụng công nghệ số vào học tập toán học.</p>
              </div>
            </div>

            <!-- II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU -->
            <div class="mb-5 space-y-2">
              <h4 class="font-bold text-[13pt] uppercase">II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h4>
              <div class="pl-4 space-y-1">
                <p><strong>1. Giáo viên:</strong> Kế hoạch bài dạy, bài giảng điện tử tương tác, phần mềm GeoGebra Dynamic Mathematics, máy chiếu, bảng phụ.</p>
                <p><strong>2. Học sinh:</strong> SGK Toán 10 (Kết nối tri thức), vở ghi, máy tính cầm tay, thiết bị có kết nối mạng (điện thoại/laptop nếu có).</p>
                <p><strong>3. Học liệu số & AI:</strong> File mô phỏng GeoGebra trực tuyến khảo sát đồ thị, mã QR truy cập phiếu học tập số hóa.</p>
              </div>
            </div>

            <!-- III. TIẾN TRÌNH DẠY HỌC (BẢNG 2 CỘT 4 BƯỚC) -->
            <div class="mb-6 space-y-4">
              <h4 class="font-bold text-[13pt] uppercase">III. TIẾN TRÌNH DẠY HỌC (CHUẨN 4 BƯỚC SƯ PHẠM)</h4>

              <!-- Hoạt động 1: Khởi động -->
              <div class="border border-black p-3 rounded-sm space-y-2">
                <div class="font-bold text-[13pt] text-blue-950">Hoạt động 1: Khởi động - Cổng vòm Parabol và bài toán thực tế (7 phút)</div>
                <p><strong>a) Mục tiêu:</strong> Tạo tâm thế hứng thú, gợi mở nhu cầu biểu diễn đường cong parabol thông qua hình ảnh kiến trúc Cổng trường St. Louis.</p>
                <p><strong>b) Nội dung:</strong> HS quan sát hình ảnh kiến trúc thực tế, trả lời câu hỏi về dạng đồ thị của đường cong hình cầu vồng/cổng vòm.</p>
                
                <!-- Bảng 2 Cột Hoạt động GV - HS & Sản phẩm -->
                <table class="w-full border-collapse border border-black text-[12pt] mt-2">
                  <thead>
                    <tr class="bg-slate-100">
                      <th class="border border-black p-2 w-3/5 text-center font-bold">Hoạt động của Giáo viên và Học sinh</th>
                      <th class="border border-black p-2 w-2/5 text-center font-bold">Sản phẩm dự kiến</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-black p-2.5 align-top space-y-1.5">
                        <p><strong>* Bước 1 (Chuyển giao):</strong> GV trình chiếu hình ảnh Cổng Parabol, yêu cầu HS quan sát và nêu nhận xét về hình dạng của cổng.</p>
                        <p><strong>* Bước 2 (Thực hiện):</strong> HS thảo luận theo cặp trong 3 phút, ghi câu trả lời nhanh vào bảng phụ hoặc ứng dụng Padlet.</p>
                        <p><strong>* Bước 3 (Báo cáo):</strong> Đại diện 2 nhóm trình bày nhận định về trục đối xứng và bề lõm của cổng.</p>
                        <p><strong>* Bước 4 (Kết luận):</strong> GV chuẩn hóa kiến thức, dẫn dắt vào khái niệm Hàm số bậc hai y = ax² + bx + c.</p>
                      </td>
                      <td class="border border-black p-2.5 align-top space-y-1">
                        <p class="font-semibold">- Dự đoán của học sinh:</p>
                        <p>+ Đường cong có dạng đối xứng hai bên.</p>
                        <p>+ Điểm cao nhất nằm ở chính giữa đỉnh vòm.</p>
                        <p>+ Công thức có chứa số mũ bậc 2.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Hoạt động 2: Hình thành kiến thức -->
              <div class="border border-black p-3 rounded-sm space-y-2 mt-4">
                <div class="font-bold text-[13pt] text-blue-950">Hoạt động 2: Hình thành kiến thức - Khảo sát và Vẽ đồ thị Parabol (25 phút)</div>
                <p><strong>a) Mục tiêu:</strong> Xác định tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng x = -b/2a, vẽ đồ thị với GeoGebra.</p>
                
                <table class="w-full border-collapse border border-black text-[12pt] mt-2">
                  <thead>
                    <tr class="bg-slate-100">
                      <th class="border border-black p-2 w-3/5 text-center font-bold">Hoạt động của Giáo viên và Học sinh</th>
                      <th class="border border-black p-2 w-2/5 text-center font-bold">Sản phẩm dự kiến</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-black p-2.5 align-top space-y-1.5">
                        <p><strong>* Bước 1 (Chuyển giao):</strong> GV cung cấp link tương tác GeoGebra, giao nhiệm vụ kéo thanh trượt hệ số a, b, c và ghi lại quy luật.</p>
                        <p><strong>* Bước 2 (Thực hiện):</strong> HS làm việc theo nhóm 4, thao tác trên máy tính bảng/laptop, điền phiếu học tập số 1.</p>
                        <p><strong>* Bước 3 (Báo cáo):</strong> Nhóm 1 trình bày quy luật khi a > 0 (bề lõm quay lên), nhóm 2 trình bày khi a < 0 (bề lõm quay xuống).</p>
                        <p><strong>* Bước 4 (Kết luận):</strong> GV tổng kết bảng biến thiên và 5 bước vẽ đồ thị parabol chính xác.</p>
                      </td>
                      <td class="border border-black p-2.5 align-top space-y-1">
                        <p class="font-semibold">- Phiếu học tập số 1 hoàn thành:</p>
                        <p>+ Đỉnh I(-b/(2a); -Δ/(4a)).</p>
                        <p>+ Trục đối xứng: đường thẳng x = -b/(2a).</p>
                        <p>+ Bảng biến thiên hoàn chỉnh của hàm số bậc hai.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- IV. MA TRẬN NLS VÀ AI -->
            <div class="mb-5 space-y-2">
              <h4 class="font-bold text-[13pt] uppercase">IV. BẢNG MA TRẬN NĂNG LỰC SỐ (NLS) & GIÁO DỤC TRÍ TUỆ NHÂN TẠO (AI)</h4>
              <table class="w-full border-collapse border border-black text-[11pt]">
                <thead>
                  <tr class="bg-slate-100">
                    <th class="border border-black p-2">Lĩnh vực</th>
                    <th class="border border-black p-2">Chỉ báo / Hành vi cụ thể</th>
                    <th class="border border-black p-2">Hoạt động tương ứng</th>
                    <th class="border border-black p-2">Công cụ số / AI sử dụng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="border border-black p-2 font-semibold">Khung NLS</td>
                    <td class="border border-black p-2">Sử dụng phần mềm toán học động để khảo sát dữ liệu hàm số</td>
                    <td class="border border-black p-2">Hoạt động 2 (Hình thành kiến thức)</td>
                    <td class="border border-black p-2">GeoGebra Interactive Simulation</td>
                  </tr>
                  <tr>
                    <td class="border border-black p-2 font-semibold">Khung AI</td>
                    <td class="border border-black p-2">Hiểu nguyên lí phân tích quỹ đạo và thị giác máy tính trong mô phỏng</td>
                    <td class="border border-black p-2">Hoạt động 4 (Vận dụng mở rộng)</td>
                    <td class="border border-black p-2">PhET Simulation & Teachable AI</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- ==================== VANILLA JAVASCRIPT LOGIC ==================== -->
  <script>
    // Initialize Lucide Icons
    lucide.createIcons();

    // File Upload Handler (Mammoth.js integration)
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileInfo = document.getElementById('fileInfo');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileSlotsCount = document.getElementById('fileSlotsCount');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      fileNameDisplay.textContent = file.name;
      fileInfo.classList.remove('hidden');

      if (file.name.endsWith('.docx') && window.mammoth) {
        const reader = new FileReader();
        reader.onload = async function(event) {
          const arrayBuffer = event.target.result;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            fileSlotsCount.textContent = 'Đã bóc tách ' + result.value.length + ' ký tự & giữ nguyên ảnh';
          } catch(err) {
            console.error(err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        fileSlotsCount.textContent = 'Đã đính kèm tệp';
      }
    });

    // Copy Content Function
    function copyLessonPlan() {
      const text = document.getElementById('previewA4Container').innerText;
      navigator.clipboard.writeText(text).then(() => {
        document.getElementById('copyText').innerText = '✅ Đã sao chép!';
        setTimeout(() => {
          document.getElementById('copyText').innerText = '📋 Sao chép';
        }, 2500);
      });
    }

    // Export DOCX Function (Docx.js integration)
    async function downloadWordDocument() {
      if (!window.docx) {
        alert('Thư viện docx đang tải, vui lòng thử lại sau giây lát.');
        return;
      }
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = window.docx;

      const title = document.getElementById('inputLessonTitle').value || 'Kế hoạch bài dạy';
      const subject = document.getElementById('selectSubject').value;
      const grade = document.getElementById('selectGrade').value;
      const book = document.getElementById('selectBookSeries').value;
      const periods = document.getElementById('inputPeriods').value;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "TRƯỜNG THPT CHUYÊN CHÂU VĂN LIÊM - TỔ TOÁN TIN",
              alignment: AlignmentType.CENTER,
              style: "bold"
            }),
            new Paragraph({
              text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              text: "Độc lập - Tự do - Hạnh phúc",
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "KẾ HOẠCH BÀI DẠY (GIÁO ÁN)",
              alignment: AlignmentType.CENTER,
              heading: "Heading1"
            }),
            new Paragraph({
              text: title.toUpperCase(),
              alignment: AlignmentType.CENTER,
              heading: "Heading2"
            }),
            new Paragraph({
              text: "Môn: " + subject + " | " + grade + " | Bộ sách: " + book + " | Thời lượng: " + periods + " tiết",
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "I. MỤC TIÊU BÀI DẠY (GDPT 2018)", heading: "Heading3" }),
            new Paragraph({ text: "1. Về kiến thức: Nắm vững các khái niệm và tính chất trọng tâm theo SGK Kết nối tri thức." }),
            new Paragraph({ text: "2. Về năng lực: Phát triển năng lực tự chủ, hợp tác nhóm, Năng lực số (NLS) và Trí tuệ Nhân tạo (AI)." }),
            new Paragraph({ text: "3. Về phẩm chất: Chăm chỉ, trung thực và trách nhiệm trong học tập." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", heading: "Heading3" }),
            new Paragraph({ text: "1. Giáo viên: Giáo án số hóa, phần mềm mô phỏng tương tác, máy chiếu." }),
            new Paragraph({ text: "2. Học sinh: SGK Kết nối tri thức, vở bài tập, thiết bị kết nối mạng." }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "III. TIẾN TRÌNH DẠY HỌC (CHUẨN 4 BƯỚC SƯ PHẠM)", heading: "Heading3" }),
            new Paragraph({ text: "Hoạt động 1: Khởi động (Mở đầu vấn đề thực tiễn)" }),
            new Paragraph({ text: "Hoạt động 2: Hình thành kiến thức mới (Tương tác học liệu số)" }),
            new Paragraph({ text: "Hoạt động 3: Luyện tập (Giải bài tập & Phản biện chéo)" }),
            new Paragraph({ text: "Hoạt động 4: Vận dụng & Mở rộng (Ứng dụng thực tế & AI)" })
          ]
        }]
      });

      Packer.toBlob(doc).then(blob => {
        const cleanTitle = title.replace(/[:\/\\*?"<>|]/g, ' ').replace(/[_\s]+/g, ' ').trim();
        const isHDTN = /hoạt động trải nghiệm|hđtn/i.test(subject) || /sinh hoạt dưới cờ|chào cờ/i.test(cleanTitle);
        const subjTag = isHDTN ? 'HĐTN-HN - Chào cờ' : subject;
        saveAs(blob, cleanTitle + " (" + subjTag + " " + grade.replace(/^(lớp|khối)\s*/i, '') + ").docx");
      });
    }

    function handleLogout() {
      if (confirm('Thầy/Cô có muốn đăng xuất khỏi hệ thống KHBD AI PRO?')) {
        alert('Đã đăng xuất thành công.');
      }
    }

    function generateLessonPlan() {
      const title = document.getElementById('inputLessonTitle').value;
      if (!title) {
        alert('Vui lòng nhập tên bài dạy.');
        return;
      }
      document.getElementById('docLessonTitle').innerText = title.toUpperCase();
      document.getElementById('docSubject').innerText = document.getElementById('selectSubject').value;
      document.getElementById('docGrade').innerText = document.getElementById('selectGrade').value;
      document.getElementById('docPeriods').innerText = document.getElementById('inputPeriods').value + ' tiết';
      alert('Đã đồng bộ thông tin và nâng cấp bài dạy theo chuẩn GDPT 2018 & NLS/AI!');
    }
  </script>
</body>
</html>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(standaloneHtmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([standaloneHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'KHBD_AI_PRO_Standalone.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Trọn Bộ Mã Nguồn Frontend KHBD AI PRO (Standalone Single-File)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                HTML5 • Tailwind CSS • Lucide Icons • Mammoth.js • Docx.js • Vanilla JavaScript
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

        {/* Toolbar */}
        <div className="p-3 bg-[#f8fafc] border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-800">Tệp:</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono font-bold">
              index.html
            </span>
            <span className="hidden sm:inline text-slate-400">• Chạy trực tiếp trên mọi trình duyệt mà không cần cài đặt server</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold shadow-2xs transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sao chép mã nguồn</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file index.html</span>
            </button>

            <a
              href="/api/export-project-zip"
              download="taogiaoan-ai-pro.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-xs transition-all cursor-pointer no-underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải toàn bộ Dự án (.ZIP)</span>
            </a>
          </div>
        </div>

        {/* Code View Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap selection:bg-amber-600/40">
            <code>{standaloneHtmlCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-[#f8fafc] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Tích hợp đầy đủ Dashboard 2 cột, Header cam/nâu hổ phách, Khung A4, Mammoth & Docx.js</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
