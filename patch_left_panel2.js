const fs = require('fs');
const file = 'src/components/LeftConfigPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSubjectLabel = `<div className="space-y-3 pt-1">
        {/* 1. MÔN HỌC */}
        <div className="form-group flex flex-col gap-1.5">`;

const newSchoolLevel = `<div className="space-y-3 pt-1">
        {/* 0. CẤP HỌC */}
        <div className="form-group flex flex-col gap-1.5">
          <label className="text-xs font-bold text-red-600 flex items-center gap-1">
            <span>1. Cấp học <span className="text-rose-500">*</span></span>
          </label>
          <div className="relative">
            <select
              value={config.schoolLevel}
              onChange={(e) => {
                const newLevel = e.target.value;
                let newGrade = config.grade;
                if (newLevel === 'Mầm non') newGrade = 'Mẫu giáo lớn (5-6 tuổi)';
                if (newLevel === 'Tiểu học') newGrade = 'Lớp 5';
                if (newLevel === 'THCS') newGrade = 'Lớp 6';
                if (newLevel === 'THPT') newGrade = 'Lớp 10';
                onChangeConfig({ schoolLevel: newLevel, grade: newGrade });
              }}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer pr-8 shadow-xs"
            >
              {['Mầm non', 'Tiểu học', 'THCS', 'THPT'].map((lvl) => (
                <option key={lvl} value={lvl} className="bg-white text-slate-800">
                  {lvl}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 1. MÔN HỌC */}
        <div className="form-group flex flex-col gap-1.5">`;

content = content.replace(oldSubjectLabel, newSchoolLevel);

// Also need to re-number the labels
content = content.replace(/1\. Môn học/, '2. Môn học/Lĩnh vực');
content = content.replace(/2\. Khối lớp/, '3. Độ tuổi/Khối lớp');
content = content.replace(/3\. Tên bài học/, '4. Tên bài học/Chủ đề');
content = content.replace(/4\. THÔNG TIN GIÁO VIÊN/, '5. THÔNG TIN GIÁO VIÊN');
content = content.replace(/5\. TÍCH HỢP MÔN HỌC & YÊU CẦU/, '6. TÍCH HỢP MÔN HỌC & YÊU CẦU');

fs.writeFileSync(file, content);
