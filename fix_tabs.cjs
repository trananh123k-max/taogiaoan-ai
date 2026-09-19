const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const ppctListTab = `
        {/* TAB: KHO PPCT ĐÃ TẢI LÊN */}
        {selectedTab === 'ppct_list' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
            {myUploadedPPCTs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Kho lưu trữ PPCT chung đang trống</p>
                <p className="text-xs mb-4">Chưa có File Phân phối chương trình nào được tải lên Firestore.</p>
                {userRole === 'admin' && (
                  <button
                    onClick={() => setSelectedTab('upload_ppct')}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Tải File PPCT Lên Ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myUploadedPPCTs.map((ppct) => (
                  <div key={ppct.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-amber-300 transition-colors shadow-xs group">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{ppct.title}</h4>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{ppct.subject}</span> • <span>{ppct.grade}</span> • <span>{ppct.fileSize}</span>
                          </p>
                        </div>
                      </div>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDeletePPCT(ppct.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Xóa vĩnh viễn khỏi hệ thống"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="p-3 text-xs text-slate-600 space-y-2">
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Đã tải lên Firestore: <strong className="text-slate-800">{ppct.uploadedAt}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Tệp gốc: <strong className="text-slate-800 line-clamp-1">{ppct.fileName}</strong>
                      </p>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-slate-500 italic line-clamp-2">"{ppct.summary}"</p>
                        <p className="mt-1 font-semibold text-emerald-600">Trích xuất {ppct.lessonConfigs.length} cấu trúc tiết học</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: UPLOAD PPCT (ADMIN ONLY) */}
        {selectedTab === 'upload_ppct' && (
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
            {userRole !== 'admin' ? (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto text-red-400 mb-2" />
                <p className="font-semibold text-slate-700">Không có quyền truy cập</p>
                <p className="text-xs">Chỉ Admin mới có quyền Tải file Phân phối chương trình lên Kho dùng chung.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs sm:text-sm">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Upload PPCT - Trích xuất Cấu trúc tự động bằng AI</p>
                    <p>Tải tệp Phân phối chương trình (Word, Excel, PDF) để hệ thống tự động quét số tiết và các yêu cầu tích hợp Năng lực số / AI. Thông tin này sẽ được dùng để tự động thiết lập số tiết khi soạn giáo án.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Môn học</label>
                      <select
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50"
                      >
                        {SUBJECTS_LIST.map((subj) => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Khối lớp</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50"
                      >
                        {['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Lớp 6','Lớp 7','Lớp 8','Lớp 9','Lớp 10','Lớp 11','Lớp 12'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tệp PPCT (PDF, Word, Excel)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ Excel nhiều sheet, AI sẽ tự động đọc đúng môn và khối lớp để lọc.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePPCTToFirebase}
                    disabled={isUploading || !selectedFile}
                    className={\`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all \${
                      isUploading || !selectedFile
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md active:scale-[0.99] cursor-pointer'
                    }\`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang phân tích PPCT...
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        Thành công!
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        Tải Lên Kho Chung & Quét Bằng AI
                      </>
                    )}
                  </button>

                  {uploadStatusMsg && (
                    <div className={\`p-3 rounded-lg text-xs font-medium border \${
                      uploadSuccess 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : isUploading 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                    }\`}>
                      <div className="flex items-start gap-2">
                        {isUploading ? <Sparkles className="w-4 h-4 mt-0.5 animate-pulse" /> : null}
                        <p className="leading-relaxed">{uploadStatusMsg}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
`;

code = code.replace("{/* TAB 2: TẢI SÁCH MỚI & AI QUÉT MỤC LỤC */}", ppctListTab + "\n        {/* TAB 2: TẢI SÁCH MỚI & AI QUÉT MỤC LỤC */}");
fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Fixed tabs!');
