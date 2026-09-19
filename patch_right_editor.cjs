const fs = require('fs');

let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

const targetStr = `              <h4 className="font-bold text-slate-900">2. Về năng lực:</h4>

              <div className="pl-2 space-y-2.5">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">
                    a) Năng lực chung:
                  </span>
                  <ul className="space-y-1 pl-2">
                    {plan.objectives.generalCompetencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1">{renderGeneralCompetencyItem(c)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-1">
                    b) Năng lực đặc thù môn học:
                  </span>
                  <ul className="space-y-1 pl-2">
                    {plan.objectives.subjectCompetencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>`;

const newStr = `              <h4 className="font-bold text-slate-900">{isPreschool ? '2. Kỹ năng:' : '2. Về năng lực:'}</h4>

              <div className="pl-2 space-y-2.5">
                {isPreschool ? (
                  <ul className="space-y-1 pl-2">
                    {[...plan.objectives.generalCompetencies, ...plan.objectives.subjectCompetencies].map((c, i) => (
                      <li key={'preschool-skill-'+i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">
                        a) Năng lực chung:
                      </span>
                      <ul className="space-y-1 pl-2">
                        {plan.objectives.generalCompetencies.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">{renderGeneralCompetencyItem(c)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-1">
                        b) Năng lực đặc thù môn học:
                      </span>
                      <ul className="space-y-1 pl-2">
                        {plan.objectives.subjectCompetencies.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/RightResultEditor.tsx', code);
