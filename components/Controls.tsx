
import React from 'react';
import { SimState, ElectrolyteType, ElectrodeMaterial, Language, CellMode, SaltBridgeType } from '../types';
import { Zap, Battery, ShieldAlert, Waves, Layout, Box, Gauge } from 'lucide-react';

interface ControlsProps {
  state: SimState;
  setState: React.Dispatch<React.SetStateAction<SimState>>;
}

const translations = {
  [Language.EN]: {
    mode: "Operation Mode",
    electrolyte: "Electrolyte",
    anode: "Left Electrode",
    cathode: "Right Electrode",
    membrane: "Porous Membrane",
    saltBridge: "Salt Bridge (U-Tube)",
    saltBridgeSolution: "Bridge Salt",
    autoReplenish: "Auto-replenish",
    voltage: "Input Voltage",
    vesselSetup: "Vessel Setup",
    singleVessel: "Single Vessel",
    dualVessel: "Dual Beakers",
    membraneDesc: "Single container, separated by a barrier.",
    bridgeDesc: "Two separate containers, connected by ions.",
    theoretical: "Theoretical Potential"
  },
  [Language.VI]: {
    mode: "Chế độ vận hành",
    electrolyte: "Chất điện phân",
    anode: "Điện cực Trái",
    cathode: "Điện cực Phải",
    membrane: "Màng bán thấm",
    saltBridge: "Cầu muối (Ống chữ U)",
    saltBridgeSolution: "Loại muối dẫn",
    autoReplenish: "Tự động bổ sung",
    voltage: "Điện áp nguồn",
    vesselSetup: "Cấu hình bình",
    singleVessel: "Bình đơn (1)",
    dualVessel: "Cốc đôi (2)",
    membraneDesc: "Bình đơn chia đôi vách.",
    bridgeDesc: "Hai cốc riêng biệt.",
    theoretical: "Thế điện cực chuẩn"
  }
};

const Controls: React.FC<ControlsProps> = ({ state, setState }) => {
  const handleChange = (field: keyof SimState, value: any) => {
    setState(prev => {
      const newState = { ...prev, [field]: value };
      
      // Logic loại trừ và đồng bộ
      if (field === 'isDualVessel' && value === false) {
        newState.hasSaltBridge = false; // 1 bình không dùng cầu muối
      }
      if (field === 'isDualVessel' && value === true) {
        newState.hasMembrane = false; // 2 bình thường không dùng màng chia đôi
        newState.hasSaltBridge = true; // Mặc định bật cầu muối cho 2 bình
      }
      
      if (field === 'hasMembrane' && value === true) {
        newState.hasSaltBridge = false;
        newState.isDualVessel = false; // Màng chỉ dùng trong 1 bình
      }
      if (field === 'hasSaltBridge' && value === true) {
        newState.hasMembrane = false;
        newState.isDualVessel = true; // Cầu muối yêu cầu 2 cốc
      }
      
      return newState;
    });
  };

  const t = translations[state.language];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.mode}</label>
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => handleChange('mode', CellMode.ELECTROLYSIS)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${state.mode === CellMode.ELECTROLYSIS ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            <Zap className="w-3.5 h-3.5" />
            EP
          </button>
          <button 
            onClick={() => handleChange('mode', CellMode.GALVANIC)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${state.mode === CellMode.GALVANIC ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
          >
            <Battery className="w-3.5 h-3.5" />
            Pin
          </button>
        </div>
      </div>

      {/* Voltage Control Section */}
      <div className="space-y-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className={`w-4 h-4 ${state.mode === CellMode.ELECTROLYSIS ? 'text-blue-400' : 'text-emerald-400'}`} />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {state.mode === CellMode.ELECTROLYSIS ? t.voltage : t.theoretical}
            </label>
          </div>
          <span className="text-sm font-mono font-bold text-white">
            {state.mode === CellMode.ELECTROLYSIS ? `${state.voltage}V` : 'Auto'}
          </span>
        </div>
        
        {state.mode === CellMode.ELECTROLYSIS ? (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-bold">0V</span>
            <input 
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={state.voltage}
              onChange={(e) => handleChange('voltage', parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-slate-500 font-bold">12V</span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic px-1">
            {state.language === Language.VI ? "* Điện áp phụ thuộc vào cặp điện cực." : "* Voltage depends on electrode materials."}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.vesselSetup}</label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleChange('isDualVessel', false)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-bold border transition-all ${!state.isDualVessel ? 'bg-slate-700 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            <Box className="w-3 h-3" />
            {t.singleVessel}
          </button>
          <button 
            onClick={() => handleChange('isDualVessel', true)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-bold border transition-all ${state.isDualVessel ? 'bg-slate-700 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            <Layout className="w-3 h-3" />
            {t.dualVessel}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">{t.electrolyte}</label>
        <select 
          value={state.electrolyte}
          onChange={(e) => handleChange('electrolyte', e.target.value as ElectrolyteType)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/50 text-white"
        >
          {Object.values(ElectrolyteType).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">{t.anode}</label>
          <select 
            value={state.anodeMaterial}
            onChange={(e) => handleChange('anodeMaterial', e.target.value as ElectrodeMaterial)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
          >
            {Object.values(ElectrodeMaterial).map((m) => (
              <option key={m} value={m}>{m.split(' ')[0]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">{t.cathode}</label>
          <select 
            value={state.cathodeMaterial}
            onChange={(e) => handleChange('cathodeMaterial', e.target.value as ElectrodeMaterial)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
          >
            {Object.values(ElectrodeMaterial).map((m) => (
              <option key={m} value={m}>{m.split(' ')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
          <div className={`flex items-center justify-between transition-opacity ${state.isDualVessel ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <label className="text-xs font-bold text-slate-200">{t.membrane}</label>
              </div>
              <span className="text-[9px] text-slate-500 mt-0.5">{t.membraneDesc}</span>
            </div>
            <button 
              onClick={() => handleChange('hasMembrane', !state.hasMembrane)}
              className={`w-10 h-5 rounded-full transition-colors relative ${state.hasMembrane ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.hasMembrane ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="border-t border-slate-800 my-1" />

          <div className={`flex items-center justify-between transition-opacity ${!state.isDualVessel ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-xs font-bold text-slate-200">{t.saltBridge}</label>
              </div>
              <span className="text-[9px] text-slate-500 mt-0.5">{t.bridgeDesc}</span>
            </div>
            <button 
              onClick={() => handleChange('hasSaltBridge', !state.hasSaltBridge)}
              className={`w-10 h-5 rounded-full transition-colors relative ${state.hasSaltBridge ? 'bg-amber-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.hasSaltBridge ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {state.hasSaltBridge && state.isDualVessel && (
            <div className="animate-in slide-in-from-top-1 duration-300 pt-1">
              <select 
                value={state.saltBridgeType}
                onChange={(e) => handleChange('saltBridgeType', e.target.value as SaltBridgeType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[11px] text-white font-medium"
              >
                {Object.values(SaltBridgeType).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <label className="text-xs font-semibold text-slate-400">{t.autoReplenish}</label>
        <button 
          onClick={() => handleChange('autoReplenish', !state.autoReplenish)}
          className={`w-10 h-5 rounded-full transition-colors relative ${state.autoReplenish ? 'bg-emerald-600' : 'bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.autoReplenish ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
