
import React from 'react';
import { X, Activity, Thermometer, Zap, FlaskConical, BarChart3 } from 'lucide-react';
import { Language, SoluteStats, ElectrolyteType } from '../types';

interface MonitorWindowProps {
  isVisible: boolean;
  onClose: () => void;
  stats: SoluteStats;
  current: number;
  language: Language;
  electrolyte: ElectrolyteType;
}

const translations = {
  [Language.EN]: {
    title: "MONITOR",
    physics: "PHYSICS",
    chemistry: "CHEMISTRY",
    current: "I",
    resistance: "R",
    ph: "pH",
    temp: "Temp",
    secondary: "Product",
    molarity: "Conc.",
    ions: "Ions"
  },
  [Language.VI]: {
    title: "CHỈ SỐ",
    physics: "VẬT LÝ",
    chemistry: "HÓA HỌC",
    current: "Cường độ",
    resistance: "Điện trở",
    ph: "pH",
    temp: "Nhiệt độ",
    secondary: "Sản phẩm",
    molarity: "Nồng độ",
    ions: "Số Ion"
  }
};

const MonitorWindow: React.FC<MonitorWindowProps> = ({ isVisible, onClose, stats, current, language, electrolyte }) => {
  if (!isVisible) return null;

  const t = translations[language];

  const getPhColor = (ph: number) => {
    if (ph < 6) return 'text-rose-400';
    if (ph > 8) return 'text-indigo-400';
    return 'text-emerald-400';
  };

  const getSecondaryProductLabel = () => {
    switch (electrolyte) {
      case ElectrolyteType.CUSO4: return "H₂SO₄";
      case ElectrolyteType.NACL: return stats.ph > 7.5 ? "NaOH/NaClO" : "NaOH";
      case ElectrolyteType.KI: return "KOH";
      default: return "-";
    }
  };

  return (
    <div className="w-full max-w-[280px] sm:w-72 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-300 origin-bottom-left">
      <div className="flex items-center justify-between p-3 border-b border-slate-800/50 bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white truncate">{t.title}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded-lg text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Physics */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
            <Zap className="w-2.5 h-2.5" />
            <span>{t.physics}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
              <p className="text-[8px] text-slate-500 uppercase mb-0.5 font-bold">{t.current}</p>
              <p className="text-sm font-mono text-white truncate">{current.toFixed(1)}<span className="text-[8px] ml-0.5 text-slate-500">mA</span></p>
            </div>
            <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
              <p className="text-[8px] text-slate-500 uppercase mb-0.5 font-bold">{t.resistance}</p>
              <p className="text-sm font-mono text-white truncate">4.8<span className="text-[8px] ml-0.5 text-slate-500">kΩ</span></p>
            </div>
          </div>
        </section>

        {/* Chemistry */}
        <section className="space-y-3 pt-3 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
            <FlaskConical className="w-2.5 h-2.5" />
            <span>{t.chemistry}</span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                <span className="text-slate-400">{t.ph}</span>
                <span className={getPhColor(stats.ph)}>{stats.ph.toFixed(1)}</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
                <div className="h-full bg-rose-500 w-[30%]" />
                <div className="h-full bg-emerald-500 w-[40%]" />
                <div className="h-full bg-indigo-500 w-[30%]" />
                <div 
                  className="absolute top-0 w-1 h-full bg-white shadow-[0_0_4px_white] transition-all duration-500"
                  style={{ left: `${(stats.ph / 14) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Thermometer className="w-3 h-3" />
                        <span>{t.temp}</span>
                    </div>
                    <span className="font-mono text-white">{stats.temp.toFixed(1)}°C</span>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <BarChart3 className="w-3 h-3" />
                        <span>{t.ions}</span>
                    </div>
                    <span className="font-mono text-white">{stats.cationCount + stats.anionCount}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/30">
                    <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-slate-400 text-[8px] uppercase font-bold">{t.secondary}</span>
                        <span className="font-bold text-blue-400 text-[10px] truncate max-w-[80px]">{getSecondaryProductLabel()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-slate-500">{t.molarity}</span>
                        <span className="text-white">{stats.secondaryProductMolarity.toFixed(3)}M</span>
                    </div>
                </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MonitorWindow;
