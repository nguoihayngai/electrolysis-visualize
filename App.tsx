
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, Play, Pause, RefreshCw, Zap, Beaker, Atom, Sparkles, Activity, Menu, X } from 'lucide-react';
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
    subtitle: "Virtual Molecular Simulator",
    start: "Start",
    stop: "Stop",
    config: "Experiment Config",
    aiActive: "AI Analysis Optional",
    showAnalysis: "Lab Intelligence",
    showMonitor: "Monitor"
  },
  [Language.VI]: {
    title: "Điện Phân",
    lab: "Lab",
    subtitle: "Mô Phỏng Phân Tử Ảo",
    start: "Bắt Đầu",
    stop: "Dừng",
    config: "Cấu Hình Thí Nghiệm",
    aiActive: "AI Phân tích",
    showAnalysis: "Trí Tuệ Lab",
    showMonitor: "Chỉ Số"
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

  const t = useMemo(() => translations[state.language], [state.language]);

  const fetchAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    const result = await getChemicalAnalysis(state);
    setAnalysis(result);
    setIsAnalyzing(false);
  }, [state, isAnalyzing]);

  // Logic tự động phân tích khi thay đổi cấu hình hoặc bắt đầu
  const lastConfigRef = useRef("");
  useEffect(() => {
    const currentConfig = `${state.electrolyte}-${state.anodeMaterial}-${state.cathodeMaterial}`;
    if (state.autoAnalyze && (state.isRunning || currentConfig !== lastConfigRef.current)) {
      if (currentConfig !== lastConfigRef.current) {
        setAnalysis(null); // Reset cũ để hiện loading nếu cần
        fetchAnalysis();
        lastConfigRef.current = currentConfig;
      }
    }
  }, [state.electrolyte, state.anodeMaterial, state.cathodeMaterial, state.autoAnalyze, state.isRunning, fetchAnalysis]);

  const toggleSimulation = () => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleLanguageChange = (lang: Language) => {
    setState(prev => ({ ...prev, language: lang }));
  };

  const resetSimulation = () => {
    setState({
      voltage: 6,
      electrolyte: ElectrolyteType.WATER,
      anodeMaterial: ElectrodeMaterial.PLATINUM,
      cathodeMaterial: ElectrodeMaterial.PLATINUM,
      isRunning: false,
      hasMembrane: false,
      autoReplenish: false,
      autoAnalyze: state.autoAnalyze,
      language: state.language,
    });
    setAnalysis(null);
    setIsAnalysisExpanded(false);
    setStats({
      cationCount: 0,
      anionCount: 0,
      ph: 7.0,
      temp: 25.0,
      secondaryProductMolarity: 0
    });
  };

  const calculatedCurrent = useMemo(() => {
    if (!state.isRunning) return 0;
    const totalIons = stats.cationCount + stats.anionCount;
    return (state.voltage * 1.25) * (totalIons / 40);
  }, [state.isRunning, state.voltage, stats.cationCount, stats.anionCount]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-900/50 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 lg:hidden hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Beaker className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-sm md:text-xl font-bold tracking-tight text-white">{t.title}<span className="text-blue-400">{t.lab}</span></h1>
            </div>
          </div>
          
          <div className="flex bg-slate-800/80 rounded-full p-0.5 border border-slate-700/50">
            <button 
              onClick={() => handleLanguageChange(Language.EN)}
              className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase rounded-full transition-all ${state.language === Language.EN ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              EN
            </button>
            <button 
              onClick={() => handleLanguageChange(Language.VI)}
              className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase rounded-full transition-all ${state.language === Language.VI ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              VI
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleSimulation}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
              state.isRunning 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {state.isRunning ? <><Pause className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">{t.stop}</span></> : <><Play className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">{t.start}</span></>}
            <span className="sm:hidden">{state.isRunning ? 'Stop' : 'Run'}</span>
          </button>
          <button 
            onClick={resetSimulation}
            className="p-1.5 md:p-2 hover:bg-slate-800 rounded-full text-slate-400"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 md:w-80 border-r border-slate-800 bg-slate-900/95 lg:bg-slate-900/30 backdrop-blur-xl lg:backdrop-blur-none
          transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar
        `}>
          <div className="flex lg:hidden items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase text-blue-400">{t.config}</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <section>
            <div className="hidden lg:flex items-center gap-2 mb-4 text-blue-400">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">{t.config}</h2>
            </div>
            <Controls state={state} setState={setState} />
          </section>
        </aside>

        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
          />
          
          <div className="flex-1 w-full h-full">
            <ElectrolysisSim state={state} onStatsUpdate={setStats} />
          </div>
          
          <div className="absolute right-4 md:right-6 top-4 md:top-6 flex flex-col gap-3 items-end z-20">
            {!isAnalysisExpanded && (
              <button 
                onClick={() => setIsAnalysisExpanded(true)}
                className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700 p-3 rounded-full shadow-2xl transition-all flex items-center gap-2 group"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest pr-1 hidden sm:block">{t.showAnalysis}</span>
              </button>
            )}
          </div>

          <div className="absolute left-4 md:left-6 bottom-4 md:bottom-6 z-20 flex flex-col items-start gap-4 max-w-[calc(100%-2rem)]">
            {!isMonitorExpanded && (
              <button 
                onClick={() => setIsMonitorExpanded(true)}
                className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700 p-3 rounded-full shadow-2xl transition-all flex items-center gap-2"
              >
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest pr-1 hidden sm:block">{t.showMonitor}</span>
              </button>
            )}
            
            <MonitorWindow 
              isVisible={isMonitorExpanded}
              onClose={() => setIsMonitorExpanded(false)}
              stats={stats}
              current={calculatedCurrent}
              language={state.language}
              electrolyte={state.electrolyte}
            />
          </div>
        </div>

        <AnalysisPanel 
          analysis={analysis} 
          isLoading={isAnalyzing} 
          isVisible={isAnalysisExpanded} 
          language={state.language} 
          onClose={() => setIsAnalysisExpanded(false)}
          onFetchAnalysis={fetchAnalysis}
          state={state}
        />
      </main>
      
      <footer className="h-8 border-t border-slate-800 bg-slate-900/80 flex items-center px-4 md:px-6 justify-between text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold shrink-0">
        <div className="flex gap-2 md:gap-4 overflow-hidden">
          <span className="flex items-center gap-1 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Cat(+)</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Ani(-)</span>
          <span className="hidden xs:flex items-center gap-1 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> e⁻</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
            <Atom className="w-3 h-3" />
            <span className="truncate max-w-[100px] md:max-w-none">{t.aiActive}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
