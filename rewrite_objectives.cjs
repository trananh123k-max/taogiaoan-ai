const fs = require('fs');

let code = fs.readFileSync('src/components/RightResultEditor.tsx', 'utf8');

const targetStrStart = '{/* 1. Kiến thức */}';
const targetStrEnd = '          </section>';

const startIndex = code.indexOf(targetStrStart);
const endIndex = code.indexOf(targetStrEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{isPreschool ? (
              <>
                {/* 1. Kiến thức */}
                <div className="space-y-1.5 text-[13pt]">
                  <h4 className="font-bold text-slate-900">1. Kiến thức:</h4>
                  <ul className="space-y-1.5 pl-2 leading-relaxed">
                    {plan.objectives.knowledge.map((k, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(k)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* 2. Kỹ năng */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">2. Kỹ năng:</h4>
                  <ul className="space-y-1.5 pl-2 leading-relaxed">
                    {plan.objectives.subjectCompetencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Phẩm chất */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">3. Phẩm chất:</h4>
                  <ul className="space-y-1.5 pl-2 leading-relaxed">
                    {plan.objectives.qualities.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">•</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Năng lực */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">4. Năng lực:</h4>
                  <ul className="space-y-1.5 pl-2 leading-relaxed">
                    {plan.objectives.generalCompetencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">•</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Tích hợp */}
                {plan.objectives.digitalCompetencies && plan.objectives.digitalCompetencies.length > 0 && (
                  <div className="space-y-1.5 text-[13pt] pt-2">
                    <h4 className="font-bold text-slate-900">5. Tích hợp:</h4>
                    <ul className="space-y-1.5 pl-2 leading-relaxed">
                      {plan.objectives.digitalCompetencies.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* 1. Kiến thức */}
                <div className="space-y-1.5 text-[13pt]">
                  <h4 className="font-bold text-slate-900">1. Về kiến thức:</h4>
                  <ul className="space-y-1.5 pl-2 leading-relaxed">
                    {plan.objectives.knowledge.map((k, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(k)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Năng lực */}
                <div className="space-y-2.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">2. Về năng lực:</h4>
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
                    </div>

                    {plan.objectives.digitalCompetencies && plan.objectives.digitalCompetencies.length > 0 && (
                      <div>
                        <span className="font-bold text-[#0066CC] block mb-1">
                          c) Các Năng lực số (NLS) được phát triển:
                        </span>
                        <ul className="space-y-1 pl-2">
                          {plan.objectives.digitalCompetencies.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[#0066CC] font-medium text-justify">
                              <span className="font-bold text-[#0066CC] shrink-0">-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.objectives.aiCompetencies && plan.objectives.aiCompetencies.length > 0 && (
                      <div>
                        <span className="font-bold text-[#0066CC] block mb-1">
                          {(plan.objectives.digitalCompetencies?.length || 0) > 0
                            ? 'd) Năng lực trí tuệ nhân tạo (AI):'
                            : 'c) Năng lực trí tuệ nhân tạo (AI):'}
                        </span>
                        <ul className="space-y-1 pl-2">
                          {plan.objectives.aiCompetencies.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[#0066CC] font-medium text-justify">
                              <span className="font-bold text-[#0066CC] shrink-0">-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.objectives.stemCompetencies && plan.objectives.stemCompetencies.length > 0 && (
                      <div>
                        <span className="font-bold text-[#0066CC] block mb-1">
                          {(plan.objectives.digitalCompetencies?.length || 0) > 0 && (plan.objectives.aiCompetencies?.length || 0) > 0
                            ? 'e) Năng lực giáo dục STEM:'
                            : (plan.objectives.digitalCompetencies?.length || 0) > 0 || (plan.objectives.aiCompetencies?.length || 0) > 0
                            ? 'd) Năng lực giáo dục STEM:'
                            : 'c) Năng lực giáo dục STEM:'}
                        </span>
                        <ul className="space-y-1 pl-2">
                          {plan.objectives.stemCompetencies.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[#0066CC] font-medium text-justify">
                              <span className="font-bold text-[#0066CC] shrink-0">-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Phẩm chất */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">3. Về phẩm chất:</h4>
                  <ul className="space-y-1.5 pl-2 leading-relaxed">
                    {plan.objectives.qualities.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>`;

  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/RightResultEditor.tsx', code);
} else {
  console.log("Could not find block to replace");
}
