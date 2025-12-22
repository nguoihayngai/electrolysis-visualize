
import React from 'react';
import { SoluteStats as IStats, Language, ElectrolyteType } from '../types';
import { Thermometer, Droplets, Activity, FlaskConical } from 'lucide-react';

interface SoluteStatsProps {
  stats: IStats;
  language: Language;
  electrolyte: ElectrolyteType;
}

const translations = {
  [Language.EN]: {
    soluteHeader: "Solution Composition",
    concentration: "Concentration",
    molarity: "Molarity",
    phLevel: "pH Level",
    temperature: "Temperature",
    ions: "Active Ions",
    products: "Dissolved Products",
    status: "Chemical Status",
    secondaryLabel: "Secondary Product"
  },
  [Language.VI]: {
    soluteHeader: "Thành Phần Dung Dịch",
    concentration: "Nồng Độ",
    molarity: "Nồng Độ Mol",
    phLevel: "Chỉ Số pH",
    temperature: "Nhiệt Độ",
    ions: "Ion Hoạt Động",
    products: "Sản Phẩm Hòa Tan",
    status: "Trạng Thái Hóa Học",
    secondaryLabel: "Sản Phẩm Phụ"
  }
};

const SoluteStats: React.FC<SoluteStatsProps> = ({ stats, language, electrolyte }) => {
  const t = translations[language];

  const getPhColor = (ph: number) => {
    if (ph < 6) return 'text-rose-400';
    if (ph > 8) return 'text-indigo-400';
    return 'text-emerald-400';
  };

  const getPhBg = (ph: number) => {
    if (ph < 6) return 'bg-rose-500';
    if (ph > 8) return 'bg-indigo-500';
    return 'bg-emerald-500';
  };

  const getSecondaryProductLabel = () => {
    switch (electrolyte) {
      case ElectrolyteType.CUSO4: return "H₂SO₄";
      case ElectrolyteType.NACL: return stats.ph > 7.5 ? "NaOH / NaClO" : "NaOH";
      case ElectrolyteType.KI: return "KOH";
      default: return "-";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-blue-400">
        <Droplets className="w-4 h-4" />
        <h2 className="text-sm font-bold uppercase tracking-wider">{t.soluteHeader}</h2>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
        {/* pH Meter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
            <span>{t.phLevel}</span>
            <span className={getPhColor(stats.ph)}>{stats.ph.toFixed(1)}</span>
          </div>
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden flex">
            <div className="h-full bg-rose-500 w-[30%]" />
            <div className="h-full bg-emerald-500 w-[40%]" />
            <div className="h-full bg-indigo-500 w-[30%]" />
          </div>
          <div className="relative h-1">
             <div 
                className={`absolute top-[-8px] w-2 h-4 border-2 border-white rounded-full transition-all duration-500 ${getPhBg(stats.ph)}`}
                style={{ left: `${(stats.ph / 14) * 100}%`, transform: 'translateX(-50%)' }}
             />
          </div>
        </div>

        {/* Product Tracking */}
        <div className="space-y-3 pt-2 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t.secondaryLabel}</span>
                <span className="text-xs font-mono text-blue-300 font-bold">{getSecondaryProductLabel()}</span>
            </div>
            <FlaskConical className="w-4 h-4 text-emerald-500 opacity-50" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
                <span>{t.molarity}</span>
                <span>{stats.secondaryProductMolarity.toFixed(4)} M</span>
            </div>
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (stats.secondaryProductMolarity * 500))}%` }}
                />
            </div>
          </div>
        </div>

        {/* Molarity Tracking (Ions) */}
        <div className="space-y-3 pt-2 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t.ions}</span>
                <span className="text-xs font-mono text-white">{stats.cationCount + stats.anionCount} items</span>
            </div>
            <Activity className="w-4 h-4 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
            <div className="flex items-center gap-2">
                <Thermometer className="w-3 h-3 text-rose-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.temperature}</span>
            </div>
            <span className="text-sm font-mono text-white">{stats.temp.toFixed(1)}°C</span>
        </div>
      </div>
    </div>
  );
};

export default SoluteStats;
