
import React from 'react';
import { SimState, ElectrolyteType, ElectrodeMaterial, Language } from '../types';
import { Globe } from 'lucide-react';

interface ControlsProps {
  state: SimState;
  setState: React.Dispatch<React.SetStateAction<SimState>>;
}

const translations = {
  [Language.EN]: {
    electrolyte: "Electrolyte",
    anode: "Anode (+) Material",
    cathode: "Cathode (-) Material",
    membrane: "Semipermeable Membrane",
    autoReplenish: "Auto-replenish Solute",
    voltage: "DC Voltage",
    language: "Language / Ngôn ngữ",
    electrolytes: {
      [ElectrolyteType.WATER]: 'Water (Acidified)',
      [ElectrolyteType.CUSO4]: 'Copper(II) Sulfate',
      [ElectrolyteType.NACL]: 'Sodium Chloride (Brine)',
      [ElectrolyteType.KI]: 'Potassium Iodide'
    },
    materials: {
      [ElectrodeMaterial.PLATINUM]: 'Platinum (Inert)',
      [ElectrodeMaterial.COPPER]: 'Copper (Reactive)',
      [ElectrodeMaterial.GRAPHITE]: 'Graphite (Inert)'
    }
  },
  [Language.VI]: {
    electrolyte: "Chất điện phân",
    anode: "Vật liệu Anode (+)",
    cathode: "Vật liệu Cathode (-)",
    membrane: "Màng bán thấm",
    autoReplenish: "Tự động bổ sung chất tan",
    voltage: "Điện áp DC",
    language: "Ngôn ngữ / Language",
    electrolytes: {
      [ElectrolyteType.WATER]: 'Nước (Axit hóa)',
      [ElectrolyteType.CUSO4]: 'Đồng(II) Sunfat',
      [ElectrolyteType.NACL]: 'Natri Clorua (Nước muối)',
      [ElectrolyteType.KI]: 'Kali Iođua'
    },
    materials: {
      [ElectrodeMaterial.PLATINUM]: 'Bạch kim (Trơ)',
      [ElectrodeMaterial.COPPER]: 'Đồng (Phản ứng)',
      [ElectrodeMaterial.GRAPHITE]: 'Than chì (Trơ)'
    }
  }
};

const Controls: React.FC<ControlsProps> = ({ state, setState }) => {
  const handleChange = (field: keyof SimState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const t = translations[state.language];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Globe className="w-3 h-3" />
          <label className="text-xs font-semibold">{t.language}</label>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => handleChange('language', Language.EN)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${state.language === Language.EN ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            English
          </button>
          <button 
            onClick={() => handleChange('language', Language.VI)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${state.language === Language.VI ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tiếng Việt
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">{t.electrolyte}</label>
        <select 
          value={state.electrolyte}
          onChange={(e) => handleChange('electrolyte', e.target.value as ElectrolyteType)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
        >
          {Object.values(ElectrolyteType).map((type) => (
            <option key={type} value={type}>{(t.electrolytes as any)[type]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">{t.anode}</label>
        <select 
          value={state.anodeMaterial}
          onChange={(e) => handleChange('anodeMaterial', e.target.value as ElectrodeMaterial)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-white"
        >
          {Object.values(ElectrodeMaterial).map((material) => (
            <option key={material} value={material}>{(t.materials as any)[material]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">{t.cathode}</label>
        <select 
          value={state.cathodeMaterial}
          onChange={(e) => handleChange('cathodeMaterial', e.target.value as ElectrodeMaterial)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
        >
          {Object.values(ElectrodeMaterial).map((material) => (
            <option key={material} value={material}>{(t.materials as any)[material]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <label className="text-xs font-semibold text-slate-400">{t.membrane}</label>
          <button 
            onClick={() => handleChange('hasMembrane', !state.hasMembrane)}
            className={`w-10 h-5 rounded-full transition-colors relative ${state.hasMembrane ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.hasMembrane ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <label className="text-xs font-semibold text-slate-400">{t.autoReplenish}</label>
          <button 
            onClick={() => handleChange('autoReplenish', !state.autoReplenish)}
            className={`w-10 h-5 rounded-full transition-colors relative ${state.autoReplenish ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.autoReplenish ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-400">{t.voltage}</label>
            <span className="text-xs font-mono text-blue-400 font-bold">{state.voltage}V</span>
        </div>
        <input 
          type="range"
          min="1"
          max="24"
          step="0.5"
          value={state.voltage}
          onChange={(e) => handleChange('voltage', parseFloat(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
            <span>1V</span>
            <span>12V</span>
            <span>24V</span>
        </div>
      </div>
    </div>
  );
};

export default Controls;
