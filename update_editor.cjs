const fs = require('fs');
let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

code = code.replace(
  '              <h4 className="font-bold text-slate-900">1. Về kiến thức:</h4>',
  '              <h4 className="font-bold text-slate-900">{isPreschool ? \'1. Kiến thức:\' : \'1. Về kiến thức:\'}</h4>'
);

code = code.replace(
  '              <h4 className="font-bold text-slate-900">2. Về năng lực:</h4>\\n              <div className="pl-2 space-y-2.5">\\n                <div>\\n                  <span className="font-bold text-slate-800 block mb-1">\\n                    a) Năng lực chung:\\n                  </span>\\n                  <ul className="space-y-1 pl-2">\\n                    {plan.objectives.generalCompetencies.map((c, i) => (\\n                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">\\n                        <span className="font-bold text-slate-900 shrink-0">-</span>\\n                        <span className="flex-1">{renderGeneralCompetencyItem(c)}</span>\\n                      </li>\\n                    ))}\\n                  </ul>\\n                </div>\\n\\n                <div>\\n                  <span className="font-bold text-slate-900 block mb-1">\\n                    b) Năng lực đặc thù môn học:\\n                  </span>\\n                  <ul className="space-y-1 pl-2">\\n                    {plan.objectives.subjectCompetencies.map((c, i) => (\\n                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">\\n                        <span className="font-bold text-slate-900 shrink-0">-</span>\\n                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>\\n                      </li>\\n                    ))}\\n                  </ul>\\n                </div>',
  `              <h4 className="font-bold text-slate-900">{isPreschool ? '2. Kỹ năng:' : '2. Về năng lực:'}</h4>
              <div className="pl-2 space-y-2.5">
                {!isPreschool && (
                  <span className="font-bold text-slate-800 block mb-1">
                    a) Năng lực chung:
                  </span>
                )}
                <ul className="space-y-1 pl-2">
                  {plan.objectives.generalCompetencies.map((c, i) => (
                    <li key={'gc'+i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                      <span className="font-bold text-slate-900 shrink-0">-</span>
                      <span className="flex-1">{renderGeneralCompetencyItem(c)}</span>
                    </li>
                  ))}
                </ul>

                {!isPreschool && (
                  <span className="font-bold text-slate-900 block mb-1 mt-2">
                    b) Năng lực đặc thù môn học:
                  </span>
                )}
                <ul className="space-y-1 pl-2">
                  {plan.objectives.subjectCompetencies.map((c, i) => (
                    <li key={'sc'+i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                      <span className="font-bold text-slate-900 shrink-0">-</span>
                      <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                    </li>
                  ))}
                </ul>`
);

code = code.replace(
  '              <h4 className="font-bold text-slate-900">3. Về phẩm chất:</h4>',
  '              <h4 className="font-bold text-slate-900">{isPreschool ? \'3. Phẩm chất:\' : \'3. Về phẩm chất:\'}</h4>'
);

code = code.replace(
  '                I. Mục tiêu bài dạy',
  '                {isPreschool ? \'I. Mục đích - yêu cầu\' : \'I. Mục tiêu bài dạy\'}'
);

fs.writeFileSync('src/components/RightResultEditor.tsx', code);
