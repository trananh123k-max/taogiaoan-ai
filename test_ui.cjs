const fs = require('fs');
let code = fs.readFileSync('src/components/LeftConfigPanel.tsx', 'utf8');

const ppctCheckbox = `
        {matchingPPCT && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-emerald-100/50 transition-colors shadow-xs" onClick={() => setUsePPCT(!usePPCT)}>
            <div className="pt-0.5">
              {usePPCT ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-emerald-600/50" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800">
                Sử dụng PPCT: {matchingPPCT.title}
              </p>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                Đã trích xuất {matchingPPCT.lessonConfigs?.length} tiết học. Tự động điền tên bài & số tiết chuẩn.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: CHỌN TÊN BÀI HỌC (Danh sách có sẵn do AI quét 10 trang đầu vĩnh viễn) */}`;

code = code.replace("{/* STEP 3: CHỌN TÊN BÀI HỌC (Danh sách có sẵn do AI quét 10 trang đầu vĩnh viễn) */}", ppctCheckbox);

// Also need to adjust the text below the lesson title select if using PPCT
const oldText = `<p className="text-[10px] text-emerald-700 font-medium">
                ✓ Danh sách trích xuất từ phụ lục SGK (AI đã quét và lưu vĩnh viễn)
              </p>`;
const newText = `{usePPCT && matchingPPCT ? (
                <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Danh sách bài học từ PPCT đang chọn
                </p>
              ) : (
                <p className="text-[10px] text-emerald-700 font-medium">
                  ✓ Danh sách trích xuất từ SGK (AI đã quét và lưu vĩnh viễn)
                </p>
              )}`;

code = code.replace(oldText, newText);

fs.writeFileSync('src/components/LeftConfigPanel.tsx', code);
console.log('Fixed UI in LeftConfigPanel!');
