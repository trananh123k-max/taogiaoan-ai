import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Brain,
  Layers,
  MessageSquare,
  Bot,
  User,
  Copy,
  Check,
  Lightbulb,
  Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getApiHeaders } from '../utils/apiKeyManager';

interface AiSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  subject: string;
  grade: string;
}

export const AiSuggestionModal: React.FC<AiSuggestionModalProps> = ({
  isOpen,
  onClose,
  lessonTitle,
  subject,
  grade,
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [requestType, setRequestType] = useState('Ý tưởng khởi động số & Kịch bản tương tác');
  const [suggestionsText, setSuggestionsText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Chat tab state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: `Xin chào Thầy/Cô! Tôi là Trợ lý Sư phạm Giáo dục số. Tôi có thể hỗ trợ Thầy/Cô thiết kế hoạt động dạy học, gợi ý câu lệnh Prompt cho học sinh, hoặc giải đáp các thắc mắc về phương pháp dạy học và khung Năng lực số.`,
      time: 'Vừa xong',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate suggestions
  const handleGenerateSuggestions = async (customType?: string) => {
    const typeToUse = customType || requestType;
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/suggest-ideas', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          lessonTitle: lessonTitle || 'Bài học chuyên đề',
          subject: subject || 'Toán học',
          grade: grade || 'Lớp 10',
          requestType: typeToUse,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuggestionsText(data.suggestions);
      } else {
        setSuggestionsText('Không thể tải gợi ý: ' + (data.error || 'Lỗi kết nối'));
      }
    } catch (err: any) {
      setSuggestionsText('Lỗi kết nối máy chủ AI: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Send Chat message
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const newMessages = [
      ...chatMessages,
      { sender: 'user' as const, text: userText, time: 'Vừa xong' },
    ];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/ai-assistant-chat', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          message: userText,
          chatHistory: newMessages,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages([
          ...newMessages,
          { sender: 'ai' as const, text: data.reply, time: 'Vừa xong' },
        ]);
      } else {
        setChatMessages([
          ...newMessages,
          {
            sender: 'ai' as const,
            text: 'Rất tiếc, đã xảy ra lỗi: ' + (data.error || 'Không nhận được phản hồi'),
            time: 'Vừa xong',
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages([
        ...newMessages,
        {
          sender: 'ai' as const,
          text: 'Lỗi mạng khi kết nối Gemini API: ' + err.message,
          time: 'Vừa xong',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopySuggestions = () => {
    if (suggestionsText) {
      navigator.clipboard.writeText(suggestionsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Trợ Lý Sư Phạm & Gợi Ý Bài Giảng AI
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ý tưởng đổi mới phương pháp, công cụ số & kịch bản Prompting cho HS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-[#f8fafc] px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'suggestions'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gợi ý Sư phạm Chuyên sâu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Hỏi đáp Trợ lý Sư phạm AI</span>
          </button>
        </div>

        {/* Tab 1: Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Quick preset buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Chọn chủ đề Thầy/Cô cần gợi ý:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'Ý tưởng Khởi động số (Gamification)',
                  'Kịch bản AI Prompting cho HS',
                  'Bài toán Tối ưu hóa Thực tiễn',
                  'Tiêu chí Đánh giá NLS',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setRequestType(preset);
                      handleGenerateSuggestions(preset);
                    }}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      requestType === preset
                        ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs font-bold'
                        : 'bg-[#f8fafc] border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="line-clamp-2">{preset}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Trigger button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Bài dạy: <strong className="text-slate-800">{lessonTitle || 'Bài học'}</strong> (
                {subject} - {grade})
              </span>
              <button
                type="button"
                onClick={() => handleGenerateSuggestions()}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang tạo ý tưởng...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Lấy ý tưởng sư phạm mới</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Box */}
            {suggestionsText ? (
              <div className="mt-4 p-5 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm text-slate-800 space-y-3 leading-relaxed relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <span className="font-bold text-purple-700 text-xs flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Gợi ý từ Gemini AI:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySuggestions}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép gợi ý</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="prose prose-xs max-w-none text-slate-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {suggestionsText}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  Nhấn nút &quot;Lấy ý tưởng sư phạm mới&quot; để Gemini AI gợi ý kịch bản bài giảng sáng tạo.
                </div>
              )
            )}
          </div>
        )}

        {/* Tab 2: Interactive AI Pedagogical Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 overflow-hidden p-4 space-y-3">
            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 pr-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs sm:text-sm ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                        : 'bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <span className={`text-[10px] block mt-1 text-right ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3 text-xs justify-start items-center text-slate-500 pl-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span>Trợ lý AI đang soạn câu trả lời...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Hỏi về cách viết mục tiêu, tích hợp GeoGebra, chỉ số NLS..."
                className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-600 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
