
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Play, Pause, RefreshCw, Zap, Beaker, Atom, Sparkles } from 'lucide-react';
import ElectrolysisSim from './components/ElectrolysisSim';
import Controls from './components/Controls';
import AnalysisPanel from './components/AnalysisPanel';
import SoluteStats from './components/SoluteStats';
import { SimState, ElectrolyteType, ElectrodeMaterial, Language, SoluteStats as IStats } from './types';
import { getChemicalAnalysis } from './services/geminiService';

const translations = {
  [Language.EN]: {
    title: "Electrolysis",
    lab: "Lab",
    subtitle: "Virtual Molecular Simulator",
    start: "Start Lab",
    stop: "Stop",
    config: "Experiment Config",
    monitor: "Physics Monitor",
    current: "Current (I)",
    resistance: "Resistance",
    cations: "Cations (+)",
    anions: "Anions (-)",
    electrons: "Electrons (e-)",
    aiActive: "AI Analysis Optional",
    showAnalysis: "Show Lab Intelligence"
  },
  [Language.VI]: {
    title: "Điện Phân",
    lab: "Lab",
    subtitle: "Mô Phỏng Phân Tử Ảo",
    start: "Bắt Đầu",
    stop: "Dừng",
    config: "Cấu Hình Thí Nghiệm",
    monitor: "Theo Dõi Vật Lý",
    current: "Dòng Điện (I)",
    resistance: "Điện Trở",
    cations: "Cation (+)",
    anions: "Anion (-)",
    electrons: "Electron (e-)",
    aiActive: "Phân tích AI theo yêu cầu",
    showAnalysis: "Xem Trí Tuệ Phòng Lab"
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

  const t = useMemo(() => translations[state.language], [state.language]);

  const fetchAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    const result = await getChemicalAnalysis(state);
    setAnalysis(result);
    setIsAnalyzing(false);
    setIsAnalysisExpanded(true);
  }, [state]);

  const toggleSimulation = () => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
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
    if (!state.isRunning) return "0.00";
    const totalIons = stats.cationCount + stats.anionCount;
    const current = (state.voltage * 1.25) * (totalIons / 40);
    return current.toFixed(2);
  }, [state.isRunning, state.voltage, stats.cationCount, stats.anionCount]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{t.title}<span className="text-blue-400">{t.lab}</span></h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{t.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold transition-all ${
              state.isRunning 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
            }`}
          >
            {state.isRunning ? <><Pause className="w-4 h-4" /> {t.stop}</> : <><Play className="w-4 h-4" /> {t.start}</>}
          </button>
          <button 
            onClick={resetSimulation}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            title="Reset Simulation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          <section>
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">{t.config}</h2>
            </div>
            <Controls state={state} setState={setState} />
          </section>

          <section>
            <SoluteStats stats={stats} language={state.language} electrolyte={state.electrolyte} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Zap className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">{t.monitor}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t.current}</p>
                    <p className="text-xl font-mono text-white">{calculatedCurrent}<span className="text-sm text-slate-500 ml-1">mA</span></p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t.resistance}</p>
                    <p className="text-xl font-mono text-white">4.8<span className="text-sm text-slate-500 ml-1">kΩ</span></p>
                </div>
            </div>
          </section>
        </aside>

        <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
          />
          <ElectrolysisSim state={state} onStatsUpdate={setStats} />
          
          {!isAnalysisExpanded && (state.isRunning || analysis) && (
            <button 
              onClick={() => setIsAnalysisExpanded(true)}
              className="absolute right-6 top-6 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700 p-3 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2 group z-20"
            >
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest pr-2 hidden group-hover:block transition-all">{t.showAnalysis}</span>
            </button>
          )}
        </div>

        <AnalysisPanel 
          analysis={analysis} 
          isLoading={isAnalyzing} 
          isVisible={(state.isRunning || analysis) && isAnalysisExpanded} 
          language={state.language} 
          onClose={() => setIsAnalysisExpanded(false)}
          onFetchAnalysis={fetchAnalysis}
          state={state}
        />
      </main>
      
      <footer className="h-8 border-t border-slate-800 bg-slate-900/80 flex items-center px-6 justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {t.cations}</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> {t.anions}</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> {t.electrons}</span>
        </div>
        <div className="flex items-center gap-2">
            <Atom className="w-3 h-3" />
            <span>{t.aiActive}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
