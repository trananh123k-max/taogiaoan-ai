const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseStorageModal.tsx', 'utf8');

const targetStr = `{/* Bộ sách */}
              <div className="sm:col-span-2">`;

const newStr = `{/* Bộ sách */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bộ sách:</label>
                <input
                  type="text"
                  value={newBookSeries}
                  onChange={(e) => setNewBookSeries(e.target.value)}
                  placeholder="VD: Kết nối tri thức với cuộc sống"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
              {/* Tập sách */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tập sách:</label>
                <select
                  value={newVolume}
                  onChange={(e) => setNewVolume(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                >
                  {['Cả năm / Không phân tập', 'Tập 1', 'Tập 2'].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>`;

code = code.replace(`{/* Bộ sách */}
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Bộ sách:</label>
                <input
                  type="text"
                  value={newBookSeries}
                  onChange={(e) => setNewBookSeries(e.target.value)}
                  placeholder="VD: Kết nối tri thức với cuộc sống"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>`, newStr);

fs.writeFileSync('src/components/FirebaseStorageModal.tsx', code);
console.log('Added Volume dropdown');
