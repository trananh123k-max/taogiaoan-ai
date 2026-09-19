const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFooter = `{/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <div className="font-bold text-red-600 text-[15px] flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5"><User className="w-4.5 h-4.5" /> Tác giả: Hoàng Văn Đình Khoa</span>
            <span className="hidden sm:inline text-red-200">|</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4.5 h-4.5" /> Zalo: 0978.468.986</span>
            <span className="hidden sm:inline text-red-200">|</span>
            <span className="flex items-center gap-1.5"><Phone className="w-4.5 h-4.5" /> Số phone: 0989.982.818</span>
          </div>
        </div>
      </footer>`;

const newFooter = `{/* Footer */}
      <footer className="border-t border-amber-900/60 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] py-3 mt-auto shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <div className="font-medium text-amber-400 text-xs sm:text-[13px] flex items-center justify-center gap-3 sm:gap-4 flex-wrap tracking-wide">
            <span className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-default"><User className="w-4 h-4 text-emerald-400" /> Tác giả: Hoàng Văn Đình Khoa</span>
            <span className="hidden sm:inline text-amber-700/60">|</span>
            <span className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-default"><MessageCircle className="w-4 h-4 text-emerald-400" /> Zalo: 0978.468.986</span>
            <span className="hidden sm:inline text-amber-700/60">|</span>
            <span className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-default"><Phone className="w-4 h-4 text-emerald-400" /> Số phone: 0989.982.818</span>
          </div>
        </div>
      </footer>`;

code = code.replace(oldFooter, newFooter);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Footer styling!');
