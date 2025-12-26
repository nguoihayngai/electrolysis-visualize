
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, FlaskConical, Target, ListChecks, X, BrainCircuit, RefreshCw, Send, User, MessageSquare, AlertCircle } from 'lucide-react';
import { Language, SimState } from '../types';
import { chatWithAI } from '../services/geminiService';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface AnalysisPanelProps {
  analysis: any;
  isLoading: boolean;
  isVisible: boolean;
  language: Language;
  onClose: () => void;
  onFetchAnalysis: () => void;
  state: SimState;
}

const translations = {
  [Language.EN]: {
    header: "Lab Intelligence",
    noAnalysis: "Generate automated chemical analysis for this setup.",
    btnGenerate: "Analyze with AI",
    btnUpdate: "Update",
    anodeHeader: "Anode Reaction",
    cathodeHeader: "Cathode Reaction",
    overallHeader: "Overall Equation",
    observationsHeader: "Visual Observations",
    applicationsHeader: "Applications",
    chatTitle: "Lab Assistant",
    chatPlaceholder: "Ask something...",
    chatIntro: "Hello! How can I help with this reaction?",
    errorTitle: "AI Connection Error"
  },
  [Language.VI]: {
    header: "Trí Tuệ Phòng Lab",
    noAnalysis: "Tạo phân tích hóa học tự động cho cấu hình này.",
    btnGenerate: "Phân tích AI",
    btnUpdate: "Cập nhật",
    anodeHeader: "Phản Ứng Tại Anode",
    cathodeHeader: "Phản Ứng Tại Cathode",
    overallHeader: "Phương Trình Tổng Quát",
    observationsHeader: "Quan Sát Hiện Tượng",
    applicationsHeader: "Ứng Dụng Thực Tế",
    chatTitle: "Hỏi Chuyên Gia Lab",
    chatPlaceholder: "Hỏi về phản ứng...",
    chatIntro: "Chào bạn! Tôi có thể giúp gì về phản ứng này không?",
    errorTitle: "Lỗi Kết Nối AI"
  }
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isLoading, isVisible, language, onClose, onFetchAnalysis, state }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  useEffect(() => {
    setMessages([]);
  }, [state.electrolyte, state.anodeMaterial, state.cathodeMaterial]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const response = await chatWithAI(userText, state);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'No response.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!isVisible) return null;

  const hasError = analysis && analysis.error;

  return (
    <aside className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[450px] border-l border-slate-800 bg-slate-900/95 sm:bg-slate-900/50 backdrop-blur-2xl flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-right shrink-0">
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <h2 className="text-base md:text-lg font-bold text-white truncate">{t.header}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 md:space-y-8" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-6 animate-pulse pt-4">
              {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-slate-800/50 rounded-xl" />
              ))}
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4 p-4">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-white font-bold">{t.errorTitle}</h3>
            <p className="text-xs text-slate-400 font-mono bg-black/40 p-3 rounded-lg border border-slate-800 w-full break-words">
              {analysis.error}
            </p>
            <button 
              onClick={onFetchAnalysis}
              className="mt-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {t.btnUpdate}
            </button>
          </div>
        ) : !analysis ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
            <div className="relative">
               <BrainCircuit className="w-12 h-12 md:w-16 md:h-16 text-slate-700" />
               <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="max-w-[250px] text-xs md:text-sm font-medium text-slate-400">{t.noAnalysis}</p>
            <button 
              onClick={onFetchAnalysis}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              {t.btnGenerate}
            </button>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8 pb-10">
            <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <FlaskConical className="w-4 h-4" />
                <h3 className="text-[10px] font-bold uppercase">{t.anodeHeader}</h3>
              </div>
              <p className="text-xs md:text-sm font-mono text-white leading-relaxed">{analysis.anodeReaction}</p>
            </section>

            <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <FlaskConical className="w-4 h-4" />
                <h3 className="text-[10px] font-bold uppercase">{t.cathodeHeader}</h3>
              </div>
              <p className="text-xs md:text-sm font-mono text-white leading-relaxed">{analysis.cathodeReaction}</p>
            </section>

            <section className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Target className="w-4 h-4" />
                <h3 className="text-[10px] font-bold uppercase">{t.overallHeader}</h3>
              </div>
              <p className="text-xs md:text-sm font-mono font-bold text-blue-100">{analysis.overallEquation}</p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <ListChecks className="w-4 h-4" />
                <h3 className="text-[10px] font-bold uppercase">{t.observationsHeader}</h3>
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-700 pl-4">
                "{analysis.observations}"
              </p>
            </section>

            <section className="pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <MessageSquare className="w-4 h-4" />
                <h3 className="text-[10px] font-bold uppercase">{t.chatTitle}</h3>
              </div>
              <div className="space-y-4 mb-4">
                {messages.length === 0 && (
                   <div className="text-[10px] md:text-xs text-slate-500 italic bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                     {t.chatIntro}
                   </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" /> : <BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />}
                    </div>
                    <div className={`p-2.5 md:p-3 rounded-2xl text-xs md:text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30' : 'bg-slate-800/60 text-slate-200 border border-slate-700/50'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {analysis && !hasError && (
        <div className="p-3 md:p-4 border-t border-slate-800/50 bg-slate-900/95 sticky bottom-0">
          <form onSubmit={handleSendMessage} className="relative">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isChatLoading}
              className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 disabled:opacity-30 text-white rounded-lg active:scale-90 transition-transform"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 flex justify-center">
            <button 
              disabled={isLoading}
              onClick={onFetchAnalysis}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[9px] font-bold uppercase"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              {t.btnUpdate}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AnalysisPanel;
