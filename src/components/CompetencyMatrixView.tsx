import React from 'react';
import { LessonPlanOutput } from '../types';
import {
  ShieldCheck,
  Brain,
  Award,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface CompetencyMatrixViewProps {
  matrix: LessonPlanOutput['competencyMatrix'];
}

export const CompetencyMatrixView: React.FC<CompetencyMatrixViewProps> = ({ matrix }) => {
  const { nlsItems = [], aiItems = [] } = matrix || {};
  const hasNls = nlsItems.length > 0;
  const hasAi = aiItems.length > 0;

  const cardTitle =
    hasNls && hasAi
      ? 'Bảng Phân Tích Phát Triển Năng Lực Số (NLS) và Trí Tuệ Nhân Tạo (AI) Cho Học Sinh'
      : hasNls
      ? 'Bảng Phân Tích Phát Triển Năng Lực Số (NLS) Cho Học Sinh'
      : 'Bảng Phân Tích Phát Triển Năng Lực Trí Tuệ Nhân Tạo (AI) Cho Học Sinh';

  const cardDesc =
    hasNls && hasAi
      ? 'Phân tích chi tiết minh chứng định lượng và định tính phục vụ đánh giá năng lực số và năng lực AI'
      : hasNls
      ? 'Phân tích chi tiết minh chứng định lượng và định tính phục vụ đánh giá năng lực số'
      : 'Phân tích chi tiết minh chứng định lượng và định tính phục vụ đánh giá năng lực trí tuệ nhân tạo (AI)';

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg border border-slate-300 bg-white text-slate-800">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {cardTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {cardDesc}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid - Clean White Background */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {hasNls && (
            <div className="bg-white p-3 rounded-lg border border-slate-300">
              <span className="text-[11px] font-semibold text-slate-600 uppercase block">Chỉ số NLS tích hợp</span>
              <span className="text-base font-bold text-slate-900">{nlsItems.length} tiêu chí</span>
            </div>
          )}
          {hasAi && (
            <div className="bg-white p-3 rounded-lg border border-slate-300">
              <span className="text-[11px] font-semibold text-slate-600 uppercase block">Chỉ số AI tích hợp</span>
              <span className="text-base font-bold text-slate-900">{aiItems.length} tiêu chí</span>
            </div>
          )}
          <div className="bg-white p-3 rounded-lg border border-slate-300">
            <span className="text-[11px] font-semibold text-slate-600 uppercase block">Bao phủ Sư phạm</span>
            <span className="text-base font-bold text-slate-900">100% Hoạt động</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-300">
            <span className="text-[11px] font-semibold text-slate-600 uppercase block">Chuẩn văn bản</span>
            <span className="text-base font-bold text-slate-900">GDPT 2018</span>
          </div>
        </div>
      </div>

      {/* 1. KHUNG NĂNG LỰC SỐ (NLS) TABLE */}
      {hasNls && (
        <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-white px-4 py-3 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                {hasAi ? '1. Bảng Phân tích Phát triển Năng lực số (NLS)' : 'Bảng Phân tích Phát triển Năng lực số (NLS)'}
              </h4>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-300">
              {nlsItems.length} Tiêu chí
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13pt] border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300 text-xs sm:text-sm uppercase tracking-wider">
                  <th className="p-3 w-[8%] border-r border-slate-300 text-center font-bold">TT</th>
                  <th className="p-3 w-[24%] border-r border-slate-300 text-center font-bold">Tên hoạt động</th>
                  <th className="p-3 w-[38%] border-r border-slate-300 text-center font-bold">Tổ chức dạy học</th>
                  <th className="p-3 w-[30%] text-center font-bold">Năng lực số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[13pt]">
                {nlsItems.map((item, idx) => {
                  const actName = item.activityName || item.activityRef || `Hoạt động ${idx + 1}`;
                  const teachingOrg = item.teachingOrganization || item.indicator || item.digitalToolUsed || '';
                  const nlsCode = item.indicatorCode || '';
                  const nlsDesc = item.competencyDescription || item.indicator || (item.domain ? `${item.domain}: ${item.component || ''}` : '');

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 align-top border-r border-slate-200 text-center">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 align-top border-r border-slate-200">
                        <MathRenderer text={actName} />
                      </td>
                      <td className="p-3 align-top leading-relaxed text-slate-800 border-r border-slate-200 text-justify">
                        <MathRenderer text={teachingOrg} />
                      </td>
                      <td className="p-3 align-top leading-relaxed text-slate-800 text-justify">
                        {nlsCode && !nlsDesc.startsWith(nlsCode) && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200 mr-1.5 mb-1">
                            {nlsCode}
                          </span>
                        )}
                        <MathRenderer text={nlsDesc} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. KHUNG NĂNG LỰC TRÍ TUỆ NHÂN TẠO (AI) TABLE */}
      {hasAi && (
        <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-white px-4 py-3 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                {hasNls ? '2. Bảng Phân tích Giáo dục Trí tuệ Nhân tạo (AI)' : 'Bảng Phân tích Giáo dục Trí tuệ Nhân tạo (AI)'}
              </h4>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-300">
              {aiItems.length} Tiêu chí
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13pt] border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 text-slate-900 font-bold border-b-2 border-slate-300 text-xs sm:text-sm uppercase tracking-wider">
                  <th className="p-3 w-[8%] border-r border-slate-300 text-center font-bold">TT</th>
                  <th className="p-3 w-[24%] border-r border-slate-300 text-center font-bold">Tên hoạt động</th>
                  <th className="p-3 w-[38%] border-r border-slate-300 text-center font-bold">Tổ chức dạy học</th>
                  <th className="p-3 w-[30%] text-center font-bold">Ứng dụng AI & Năng lực phát triển</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[13pt]">
                {aiItems.map((item, idx) => {
                  const actName = item.activityName || item.activityRef || `Hoạt động ${idx + 1}`;
                  const teachingOrg = item.teachingOrganization || item.indicator || item.digitalToolUsed || '';
                  const aiCode = item.indicatorCode || '';
                  const aiDesc = item.competencyDescription || item.indicator || (item.domain ? `${item.domain}: ${item.component || ''}` : '');

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 align-top border-r border-slate-200 text-center">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 align-top border-r border-slate-200">
                        <MathRenderer text={actName} />
                      </td>
                      <td className="p-3 align-top leading-relaxed text-slate-800 border-r border-slate-200 text-justify">
                        <MathRenderer text={teachingOrg} />
                      </td>
                      <td className="p-3 align-top leading-relaxed text-slate-800 text-justify">
                        {aiCode && !aiDesc.startsWith(aiCode) && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 font-bold text-xs border border-purple-200 mr-1.5 mb-1">
                            {aiCode}
                          </span>
                        )}
                        <MathRenderer text={aiDesc} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
