
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, Play, Pause, RefreshCw, Zap, Beaker, Atom, Sparkles, Activity, Menu, X, ShieldCheck, ExternalLink, Key } from 'lucide-react';
import ElectrolysisSim from './components/ElectrolysisSim';
import Controls from './components/Controls';
import AnalysisPanel from './components/AnalysisPanel';
import MonitorWindow from './components/MonitorWindow';
import { SimState, ElectrolyteType, ElectrodeMaterial, Language, SoluteStats as IStats } from './types';
import { getChemicalAnalysis } from './services/geminiService';

const translations = {
  [Language.EN]: {
    title: "Electrolysis",
    lab: "Lab",
    config: "Experiment Config",
    aiActive: "AI Core Active (Free Tier)",
    showAnalysis: "Lab Intelligence",
    showMonitor: "Monitor",
    activateAI: "API Key Required",
    activateDesc: "To enable AI features, please provide a Gemini API key. You can get a free key from Google AI Studio and add it to your environment variables.",
    getFreeKey: "Get Free API Key",
    setupGuide: "Cloudflare Setup Guide"
  },
  [Language.VI]: {
    title: "Điện Phân",
    lab: "Lab",
    config: "Cấu Hình Thí Nghiệm",
    aiActive: "AI Hoạt động (Miễn Phí)",
    showAnalysis: "Trí Tuệ Lab",
    showMonitor: "Chỉ Số",
    activateAI: "Yêu cầu API Key",
    activateDesc: "Để sử dụng AI, bạn cần cấu hình API Key. Bạn có thể nhận Key miễn phí từ Google AI Studio và thêm vào biến môi trường (Environment Variables).",
    getFreeKey: "Nhận API Key Miễn Phí",
    setupGuide: "Hướng dẫn cài Cloudflare"
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<SimState>({
    voltage: 6,
    electrolyte: ElectrolyteType.WATER,
    anodeMaterial: ElectrodeMaterial.PLATINUM,
    cathodeMaterial: ElectrodeMaterial.PLATINUM,
    isRunning: false,
    hasMembrane: false,
    autoReplenish: false,
    autoAnalyze: true,
    language: Language.VI,
  });

  const [stats, setStats] = useState<IStats>({
    cationCount: 0,
    anionCount: 0,
    ph: 7.0,
    temp: 25.0,
    secondaryProductMolarity: 0
  });

  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isMonitorExpanded, setIsMonitorExpanded] = useState(window.innerWidth > 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isKeyReady, setIsKeyReady] = useState<boolean | null>(null);

  const t = useMemo(() => translations[state.language], [state.language]);

  useEffect(() => {
    const checkKeyStatus = async () => {
      // 1. Kiểm tra biến môi trường (Cho Cloudflare)
      const envKey = (globalThis as any).process?.env?.API_KEY;
      if (envKey && envKey !== "" && envKey !== "YOUR_API_KEY") {
        setIsKeyReady(true);
        return;
      }

      // 2. Kiểm tra môi trường AI Studio
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeyReady(hasKey);
      } else {
        setIsKeyReady(false);
      }
    };
    checkKeyStatus();
  }, []);

  const handleConnectAI = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setIsKeyReady(true);
    } else {
      window.open("https://aistudio.google.com/app/apikey", "_blank");
    }
  };

  const fetchAnalysis = useCallback(async () => {
    if (isAnalyzing || !isKeyReady) return;
    setIsAnalyzing(true);
    try {
      const result = await getChemicalAnalysis(state);
      if (result?.error === "KEY_REQUIRED") {
        setIsKeyReady(false);
      } else {
        setAnalysis(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [state, isAnalyzing, isKeyReady]);

  const lastConfigRef = useRef("");
  useEffect(() => {
    if (isKeyReady !== true) return;
    const currentConfig = `${state.electrolyte}-${state.anodeMaterial}-${state.cathodeMaterial}`;
    if (state.autoAnalyze && (state.isRunning || currentConfig !== lastConfigRef.current)) {
      if (currentConfig !== lastConfigRef.current) {
        setAnalysis(null);
        fetchAnalysis();
        lastConfigRef.current = currentConfig;
      }
    }
  }, [state.electrolyte, state.anodeMaterial, state.cathodeMaterial, state.autoAnalyze, state.isRunning, fetchAnalysis, isKeyReady]);

  if (isKeyReady === null) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Waking up AI Engine...</p>
      </div>
    );
  }

  if (isKeyReady === false) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-3xl border border-slate-800 p-10 rounded-[3rem] shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center border border-amber-500/20">
            <Key className="w-10 h-10 text-amber-500" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{t.activateAI}</h1>
            <p className="text-slate-400 text-sm leading-relaxed px-4">{t.activateDesc}</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleConnectAI}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              {t.getFreeKey}
            </button>
            
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-left">
               <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Cloudflare Tip:</p>
               <p className="text-[11px] text-slate-300">Set <b>API_KEY</b> in your Environment Variables to use this app permanently for free.</p>
            </div>
          </div>
          
          <div className="pt-2">
            <a 
              href="https://developers.cloudflare.com/pages/configuration/environment-variables/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] text-slate-500 hover:text-blue-400 transition-colors font-bold uppercase tracking-[0.2em]"
            >
              <ExternalLink className="w-3 h-3" />
              {t.setupGuide}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-900/50 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-2 md:gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 lg:hidden hover:bg-slate-800 rounded-lg text-slate-400">
            <Settings className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Beaker className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-sm md:text-xl font-bold tracking-tight text-white">{t.title}<span className="text-blue-400">{t.lab}</span></h1>
          </div>
          <div className="flex bg-slate-800/80 rounded-full p-0.5 border border-slate-700/50 ml-2">
            <button onClick={() => setState(p => ({...p, language: Language.EN}))} className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase rounded-full transition-all ${state.language === Language.EN ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>EN</button>
            <button onClick={() => setState(p => ({...p, language: Language.VI}))} className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase rounded-full transition-all ${state.language === Language.VI ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>VI</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setState(p => ({...p, isRunning: !p.isRunning}))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-lg ${state.isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {state.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline uppercase tracking-widest">{state.isRunning ? 'Stop' : 'Start'}</span>
          </button>
          <button onClick={() => { setState(p => ({ ...p, isRunning: false })); setAnalysis(null); }} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 border-r border-slate-800 bg-slate-900/95 lg:bg-slate-900/30 backdrop-blur-xl lg:backdrop-blur-none transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto p-6 flex flex-col gap-8`}>
          <div className="flex items-center justify-between lg:hidden mb-2">
             <h2 className="text-sm font-bold uppercase text-blue-400 tracking-widest">{t.config}</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          <section>
            <div className="hidden lg:flex items-center gap-2 mb-4 text-blue-400">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">{t.config}</h2>
            </div>
            <Controls state={state} setState={setState} />
          </section>
        </aside>

        <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
          <div className="flex-1 w-full h-full">
            <ElectrolysisSim state={state} onStatsUpdate={setStats} />
          </div>
          
          <div className="absolute right-6 top-6 z-20">
            {!isAnalysisExpanded && (
              <button onClick={() => setIsAnalysisExpanded(true)} className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700 p-3 rounded-full shadow-2xl flex items-center gap-2 group transition-all">
                <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest pr-1 hidden sm:block">{t.showAnalysis}</span>
              </button>
            )}
          </div>

          <div className="absolute left-6 bottom-6 z-20">
            {!isMonitorExpanded && (
              <button onClick={() => setIsMonitorExpanded(true)} className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700 p-3 rounded-full shadow-2xl flex items-center gap-2 transition-all">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest pr-1 hidden sm:block">{t.showMonitor}</span>
              </button>
            )}
            <MonitorWindow isVisible={isMonitorExpanded} onClose={() => setIsMonitorExpanded(false)} stats={stats} current={(state.isRunning ? state.voltage * 1.5 : 0) * ((stats.cationCount + stats.anionCount) / 40)} language={state.language} electrolyte={state.electrolyte} />
          </div>
        </div>

        <AnalysisPanel analysis={analysis} isLoading={isAnalyzing} isVisible={isAnalysisExpanded} language={state.language} onClose={() => setIsAnalysisExpanded(false)} onFetchAnalysis={fetchAnalysis} state={state} />
      </main>
      
      <footer className="h-8 border-t border-slate-800 bg-slate-900/80 flex items-center px-6 justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Cation (+)</span>
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Anion (-)</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-500/80">
            <Atom className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{t.aiActive}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
