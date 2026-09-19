const fs = require('fs');
let code = fs.readFileSync('src/components/PedagogicalTable.tsx', 'utf8');

const oldHeader = `      {/* Activity Objectives & Core Content Box (Strict CV 5512 Format) */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-2 text-[13pt] text-slate-800 leading-relaxed text-justify">
        <div>
          <span className="font-bold text-slate-900">a) Mục tiêu: </span>
          <MathRenderer text={activity.objective} slotMap={slotMap} className="inline" />
        </div>
        <div>
          <span className="font-bold text-slate-900">b) Nội dung: </span>
          <MathRenderer text={activity.content} slotMap={slotMap} className="inline" />
        </div>
        <div>
          <span className="font-bold text-slate-900">c) Sản phẩm: </span>
          <MathRenderer text={activity.productSummary} slotMap={slotMap} className="inline" />
        </div>
        <div className="pt-1 text-slate-800 font-bold text-[13pt]">
          d) Tổ chức thực hiện:
        </div>
      </div>`;

const newHeader = `      {/* Activity Objectives & Core Content Box (Strict CV 5512 Format) */}
      {!isPreschool && (
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-2 text-[13pt] text-slate-800 leading-relaxed text-justify">
          <div>
            <span className="font-bold text-slate-900">a) Mục tiêu: </span>
            <MathRenderer text={activity.objective} slotMap={slotMap} className="inline" />
          </div>
          <div>
            <span className="font-bold text-slate-900">b) Nội dung: </span>
            <MathRenderer text={activity.content} slotMap={slotMap} className="inline" />
          </div>
          <div>
            <span className="font-bold text-slate-900">c) Sản phẩm: </span>
            <MathRenderer text={activity.productSummary} slotMap={slotMap} className="inline" />
          </div>
          <div className="pt-1 text-slate-800 font-bold text-[13pt]">
            d) Tổ chức thực hiện:
          </div>
        </div>
      )}`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/PedagogicalTable.tsx', code);
