
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, FlaskConical, Target, ListChecks, X, BrainCircuit, RefreshCw, Send, User, MessageSquare } from 'lucide-react';
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
    btnUpdate: "Update Analysis",
    anodeHeader: "Anode Reaction",
    cathodeHeader: "Cathode Reaction",
    overallHeader: "Overall Equation",
    observationsHeader: "Visual Observations",
    applicationsHeader: "Applications",
    chatTitle: "Ask Lab Assistant",
    chatPlaceholder: "Ask about this reaction...",
    chatIntro: "Hello! I'm your lab assistant. Ask me anything about this electrolysis setup."
  },
  [Language.VI]: {
    header: "Trí Tuệ Phòng Lab",
    noAnalysis: "Tạo phân tích hóa học tự động cho cấu hình này.",
    btnGenerate: "Phân tích bằng AI",
    btnUpdate: "Cập nhật phân tích",
    anodeHeader: "Phản Ứng Tại Anode",
    cathodeHeader: "Phản Ứng Tại Cathode",
    overallHeader: "Phương Trình Tổng Quát",
    observationsHeader: "Quan Sát Hiện Tượng",
    applicationsHeader: "Ứng Dụng Thực Tế",
    chatTitle: "Hỏi Chuyên Gia Lab",
    chatPlaceholder: "Hỏi về phản ứng này...",
    chatIntro: "Chào bạn! Tôi là chuyên gia phòng lab. Bạn có thắc mắc gì về phản ứng này không?"
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

  // Reset chat if experiment settings change
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

    const response = await chatWithAI(userText, state);
    setMessages(prev => [...prev, { role: 'ai', text: response || 'No response from assistant.' }]);
    setIsChatLoading(false);
  };

  if (!isVisible) return null;

  return (
    <aside className="w-[450px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-500 animate-in slide-in-from-right relative">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">{t.header}</h2>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
              <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8" ref={scrollRef}>
        {!analysis && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-[40vh] text-center gap-6">
            <div className="relative">
               <BrainCircuit className="w-16 h-16 text-slate-700" />
               <Sparkles className="w-6 h-6 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="max-w-[250px] text-sm font-medium text-slate-400">{t.noAnalysis}</p>
            <button 
              onClick={onFetchAnalysis}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-blue-900/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              {t.btnGenerate}
            </button>
          </div>
        ) : analysis ? (
          <div className="space-y-8">
            <section className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3 text-rose-400">
                <FlaskConical className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase">{t.anodeHeader}</h3>
              </div>
              <p className="text-sm font-mono text-white leading-relaxed">{analysis.anodeReaction}</p>
            </section>

            <section className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <FlaskConical className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase">{t.cathodeHeader}</h3>
              </div>
              <p className="text-sm font-mono text-white leading-relaxed">{analysis.cathodeReaction}</p>
            </section>

            <section className="bg-blue-900/20 p-4 rounded-2xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3 text-blue-400">
                <Target className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase">{t.overallHeader}</h3>
              </div>
              <p className="text-sm font-mono font-bold text-blue-100">{analysis.overallEquation}</p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3 text-slate-400">
                <ListChecks className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase">{t.observationsHeader}</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-700 pl-4">
                "{analysis.observations}"
              </p>
            </section>

            {/* Chat Area */}
            <section className="pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <MessageSquare className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase">{t.chatTitle}</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {messages.length === 0 && (
                   <div className="text-xs text-slate-500 italic bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                     {t.chatIntro}
                   </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <BrainCircuit className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30' : 'bg-slate-800/60 text-slate-200 border border-slate-700/50'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-4 h-4 text-blue-400 animate-pulse" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
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
        ) : (
          <div className="space-y-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-slate-800/50 rounded-2xl" />
              ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      {analysis && (
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/80">
          <form onSubmit={handleSendMessage} className="relative">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-slate-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isChatLoading}
              className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-3 flex justify-center">
            <button 
              disabled={isLoading}
              onClick={onFetchAnalysis}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase transition-all"
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
