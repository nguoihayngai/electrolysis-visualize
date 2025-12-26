
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, Play, Pause, RefreshCw, Beaker, Atom, Sparkles, Activity, X, Key, ExternalLink } from 'lucide-react';
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
    aiActive: "AI Core Active",
    showAnalysis: "Lab AI",
    showMonitor: "Monitor",
    keyRequired: "API Key Needed",
    keyDesc: "Please configure your Gemini API Key in environment variables or click below to select one.",
    connectBtn: "Connect API Key",
    header: "Lab AI"
  },
  [Language.VI]: {
    title: "Điện Phân",
    lab: "Lab",
    config: "Cấu Hình",
    aiActive: "AI Sẵn sàng",
    showAnalysis: "Trí Tuệ AI",
    showMonitor: "Chỉ Số",
    keyRequired: "Yêu cầu API Key",
    keyDesc: "Vui lòng cấu hình API_KEY trong biến môi trường hoặc nhấn bên dưới để chọn Key.",
    connectBtn: "Kết nối API Key",
    header: "Trí Tuệ AI"
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
  const [isKeyReady, setIsKeyReady] = useState<boolean>(true); // Mặc định cho phép vào app

  const t = useMemo(() => translations[state.language], [state.language]);

  // Kiểm tra key một cách âm thầm, không chặn UI chính
  const checkKeyStatus = useCallback(async () => {
    const envKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
    if (envKey && envKey !== "" && envKey !== "YOUR_API_KEY") {
      setIsKeyReady(true);
      return true;
    }
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeyReady(hasKey);
      return hasKey;
    }
    setIsKeyReady(false);
    return false;
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const handleConnectAI = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsKeyReady(true);
    } else {
      window.open("https://aistudio.google.com/app/apikey", "_blank");
    }
  };

  const fetchAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await getChemicalAnalysis(state);
      if (result?.error === "KEY_REQUIRED") {
        setIsKeyReady(false);
      } else {
        setAnalysis(result);
        setIsKeyReady(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [state, isAnalyzing]);

  const lastConfigRef = useRef("");
  useEffect(() => {
    const currentConfig = `${state.electrolyte}-${state.anodeMaterial}-${state.cathodeMaterial}`;
    if (isKeyReady && state.autoAnalyze && (state.isRunning || currentConfig !== lastConfigRef.current)) {
      if (currentConfig !== lastConfigRef.current) {
        setAnalysis(null);
        fetchAnalysis();
        lastConfigRef.current = currentConfig;
      }
    }
  }, [state.electrolyte, state.anodeMaterial, state.cathodeMaterial, state.autoAnalyze, state.isRunning, fetchAnalysis, isKeyReady]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-900/50 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 lg:hidden hover:bg-slate-800 rounded-lg text-slate-400">
            <Settings className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">{t.title}<span className="text-blue-400">{t.lab}</span></h1>
          </div>
          <div className="flex bg-slate-800 rounded-full p-1 ml-2">
            <button onClick={() => setState(p => ({...p, language: Language.EN}))} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${state.language === Language.EN ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>EN</button>
            <button onClick={() => setState(p => ({...p, language: Language.VI}))} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${state.language === Language.VI ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>VI</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setState(p => ({...p, isRunning: !p.isRunning}))}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg ${state.isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {state.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="uppercase tracking-widest">{state.isRunning ? 'Stop' : 'Start'}</span>
          </button>
          <button onClick={() => { setState(p => ({ ...p, isRunning: false })); setAnalysis(null); }} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-900/95 lg:bg-slate-900/30 backdrop-blur-xl lg:backdrop-blur-none transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} p-6 flex flex-col gap-8`}>
          <div className="flex items-center justify-between lg:hidden mb-2">
             <h2 className="text-sm font-bold uppercase text-blue-400 tracking-widest">{t.config}</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500"><X className="w-5 h-5"/></button>
          </div>
          <Controls state={state} setState={setState} />
        </aside>

        <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
          <ElectrolysisSim state={state} onStatsUpdate={setStats} />
          
          <div className="absolute right-6 top-6 z-20">
            {!isAnalysisExpanded && (
              <button onClick={() => setIsAnalysisExpanded(true)} className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 p-3 rounded-full shadow-2xl flex items-center gap-2 group transition-all">
                <Sparkles className={`w-5 h-5 ${isKeyReady ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">{t.showAnalysis}</span>
              </button>
            )}
          </div>

          <div className="absolute left-6 bottom-6 z-20">
            {!isMonitorExpanded && (
              <button onClick={() => setIsMonitorExpanded(true)} className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 p-3 rounded-full shadow-2xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">{t.showMonitor}</span>
              </button>
            )}
            <MonitorWindow isVisible={isMonitorExpanded} onClose={() => setIsMonitorExpanded(false)} stats={stats} current={(state.isRunning ? state.voltage * 1.5 : 0) * ((stats.cationCount + stats.anionCount) / 40)} language={state.language} electrolyte={state.electrolyte} />
          </div>
        </div>

        {/* Panel AI mới với màn hình yêu cầu Key tích hợp bên trong */}
        {isAnalysisExpanded && (
          <aside className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[450px] border-l border-slate-800 bg-slate-900/98 backdrop-blur-2xl flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">{t.header || "Lab AI"}</h2>
              </div>
              <button onClick={() => setIsAnalysisExpanded(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {!isKeyReady ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <Key className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">{t.keyRequired}</h3>
                    <p className="text-slate-400 text-sm">{t.keyDesc}</p>
                  </div>
                  <button 
                    onClick={handleConnectAI}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t.connectBtn}
                  </button>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Get Key from Google
                  </a>
                </div>
              ) : (
                <AnalysisPanel 
                  analysis={analysis} 
                  isLoading={isAnalyzing} 
                  isVisible={true} 
                  language={state.language} 
                  onClose={() => setIsAnalysisExpanded(false)} 
                  onFetchAnalysis={fetchAnalysis} 
                  state={state} 
                />
              )}
            </div>
          </aside>
        )}
      </main>
      
      <footer className="h-8 border-t border-slate-800 bg-slate-900/80 flex items-center px-6 justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
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
