import re

with open('src/components/PedagogicalTable.tsx', 'r') as f:
    content = f.read()

# Find the place to insert the logic
# The block starts right after `</div>\n      )}\n\n      {/* Activity Objectives & Core Content Box`

target_str = """      {/* Activity Objectives & Core Content Box (Strict CV 5512 Format) */}"""

if target_str not in content:
    print("Cannot find target string")
    exit(1)

# Split the content
parts = content.split(target_str)

# We want to wrap from target_str to the end of the table
end_str = """          </tbody>
        </table>
      </div>"""

if end_str not in parts[1]:
    print("Cannot find end string")
    exit(1)

sub_parts = parts[1].split(end_str)

original_table_and_box = target_str + sub_parts[0] + end_str

# We want to replace it with a conditional
new_code = """
      {tableLayout === 'math_4_column' ? (
        <div className="overflow-x-auto w-full mb-2">
          <table className="w-full text-left border-collapse bg-white text-[14pt]">
            <thead>
              <tr className="bg-blue-800 text-white font-bold border border-slate-300">
                <th className="w-[45%] p-3 border border-slate-300 text-center">
                  <div className="uppercase font-bold text-[13pt]">HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH</div>
                  <div className="font-normal text-[11pt]">(GV làm gì, HS làm gì...)</div>
                </th>
                <th className="w-[35%] p-3 border border-slate-300 text-center">
                  <div className="uppercase font-bold text-[13pt]">SẢN PHẨM DỰ KIẾN KIẾN</div>
                  <div className="font-normal text-[11pt]">(YCCĐ của hoạt động với HS)</div>
                </th>
                <th className="w-[10%] p-2 border border-slate-300 text-center leading-tight">
                  <div className="font-bold text-[12pt]">Năng<br/>lực số</div>
                </th>
                <th className="w-[10%] p-2 border border-slate-300 text-center leading-tight">
                  <div className="font-bold text-[12pt]">Giáo<br/>dục AI</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="p-3 border border-slate-300 align-top space-y-3 text-justify text-[13pt]">
                  <div><span className="font-bold">Mục tiêu:</span> <MathRenderer text={activity.objective} slotMap={slotMap} className="inline" /></div>
                  <div><span className="font-bold">Nội dung:</span> <MathRenderer text={activity.content} slotMap={slotMap} className="inline" /></div>
                  <div className="font-bold">Tổ chức thực hiện:</div>
                  <div className="space-y-3">
                    {steps.map(({ key, detail, label }) => {
                      if (!detail) return null;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="font-bold">{detail.title || label}</div>
                          {detail.teacherAction && detail.teacherAction.trim() && (
                            <div className="pl-1">
                              {(!(/^(-|\\*)?\\s*(GV|Giáo viên)\\b/i.test(detail.teacherAction.trim())) && !(/^\\*\\s*(GV|HS)/i.test(detail.title || ''))) && (
                                <span className="font-bold">- Giáo viên: </span>
                              )}
                              <MathRenderer text={detail.teacherAction} slotMap={slotMap} className="inline" />
                            </div>
                          )}
                          {detail.studentAction && detail.studentAction.trim() && (
                            <div className="pl-1">
                              {(!(/^(-|\\*)?\\s*(HS|Học sinh)\\b/i.test(detail.studentAction.trim())) && !(/^\\*\\s*(GV|HS)/i.test(detail.title || ''))) && (
                                <span className="font-bold">- Học sinh: </span>
                              )}
                              <MathRenderer text={detail.studentAction} slotMap={slotMap} className="inline" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="p-3 border border-slate-300 align-top space-y-2 text-justify text-[13pt]">
                  <div className="font-bold italic">Dự kiến sản phẩm:</div>
                  {getProductContents(steps, activity).map((content, idx) => (
                    <div key={idx} className="whitespace-pre-line">
                      <MathRenderer text={formatDashBulletText(content)} slotMap={slotMap} />
                    </div>
                  ))}
                </td>
                <td className="p-2 border border-slate-300 align-top text-center text-red-700 font-bold whitespace-pre-line text-[11pt]">
                  {activity.nlsFocus?.split(/[,;\\n]/).map(s => s.trim()).filter(Boolean).map((nls, i) => (
                    <div key={i}>{nls}</div>
                  ))}
                </td>
                <td className="p-2 border border-slate-300 align-top text-center text-blue-700 font-bold whitespace-pre-line text-[11pt]">
                  {activity.aiFocus?.split(/[,;\\n]/).map(s => s.trim()).filter(Boolean).map((ai, i) => (
                    <div key={i}>{ai}</div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <>
""" + original_table_and_box + """
        </>
      )}"""

content = parts[0] + new_code + sub_parts[1]

with open('src/components/PedagogicalTable.tsx', 'w') as f:
    f.write(content)

print("Updated PedagogicalTable.tsx")
