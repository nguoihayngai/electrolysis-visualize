
import React, { useEffect, useRef, useState } from 'react';
import { SimState, ElectrolyteType, ElectrodeMaterial, Particle, Language, SoluteStats } from '../types';

interface ElectrolysisSimProps {
  state: SimState;
  onStatsUpdate: (stats: SoluteStats) => void;
}

interface ReactionEvent {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  type: 'oxidation' | 'reduction' | 'dissociation' | 'bulk';
  life: number; // 1 to 0
}

const translations = {
  [Language.EN]: {
    membrane: "Membrane",
    cathode: "CATHODE (-)",
    anode: "ANODE (+)",
    efield: "E-FIELD",
    dissociation: "Dissociation",
    reduction: "Reduction (Gain e⁻)",
    oxidation: "Oxidation (Loss e⁻)",
    dissolving: "Anode Dissolving (Cu → Cu²⁺)",
    reductionBrief: "Reduction",
    oxidationBrief: "Oxidation",
    bulk: "Bulk Reaction (Javel Water)",
    bleach: "Cl2 + 2NaOH → NaClO + NaCl + H2O",
    forms: "Forms",
    hydrogen: "H2 (Hydrogen)",
    oxygen: "O2 (Oxygen)",
    reductionWater: "Reduction (H2 Release)",
    oxidationWater: "Oxidation (O2 Release)"
  },
  [Language.VI]: {
    membrane: "Màng Bán Thấm",
    cathode: "CỰC ÂM (CATHODE)",
    anode: "CỰC DƯƠNG (ANODE)",
    efield: "ĐIỆN TRƯỜNG",
    dissociation: "Phân ly ion",
    reduction: "Sự khử (Nhận e⁻)",
    oxidation: "Sự oxi hóa (Nhường e⁻)",
    dissolving: "Anode tan (Cu → Cu²⁺)",
    reductionBrief: "Sự khử",
    oxidationBrief: "Sự oxi hóa",
    bulk: "Phản ứng tạo nước Javel",
    bleach: "Cl2 + 2NaOH → NaClO + NaCl + H2O",
    forms: "Tạo",
    hydrogen: "Khí Hidro (H2)",
    oxygen: "Khí Oxi (O2)",
    reductionWater: "Sự khử (Giải phóng H2)",
    oxidationWater: "Sự oxi hóa (Giải phóng O2)"
  }
};

const ChemicalFormula: React.FC<{ formula: string; x: number; y: number; className?: string; opacity?: number }> = ({ formula, x, y, className, opacity }) => {
  const parts = formula.split(/(\d+)/);
  return (
    <text x={x} y={y} textAnchor="middle" fill="white" fillOpacity={opacity} className={className}>
      {parts.map((part, i) => {
        if (/^\d+$/.test(part)) {
          return <tspan key={i} baselineShift="sub" fontSize="65%">{part}</tspan>;
        }
        return <tspan key={i}>{part}</tspan>;
      })}
    </text>
  );
};

const ElectrolysisSim: React.FC<ElectrolysisSimProps> = ({ state, onStatsUpdate }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [events, setEvents] = useState<ReactionEvent[]>([]);
  const requestRef = useRef<number>(0);
  const phRef = useRef<number>(7.0);
  const tempRef = useRef<number>(25.0);
  const secondaryMolarityRef = useRef<number>(0);

  const t = translations[state.language];

  const CATHODE_X = 220;
  const ANODE_X = 380;
  const CENTER_X = 300;
  const WATER_TOP = 300;
  const BEAKER_BOTTOM = 575;
  const BEAKER_LEFT = 158;
  const BEAKER_RIGHT = 442;
  const ELECTRODE_TOP = 250;

  const getIonConfig = (electrolyte: ElectrolyteType) => {
    const isCopperAnode = state.anodeMaterial === ElectrodeMaterial.COPPER;

    switch (electrolyte) {
      case ElectrolyteType.CUSO4:
        return { 
          cation: 'Cu2+', anion: 'SO42-', sourceLabel: 'CuSO4',
          cathodeProduct: 'Cu', 
          anodeProduct: isCopperAnode ? 'Cu2+' : 'O2',
          secondaryProduct: isCopperAnode ? '' : 'H2SO4', 
          secondaryTrigger: isCopperAnode ? 'none' : 'anode',
          cathodeType: 'plating', 
          anodeType: isCopperAnode ? 'dissolving' : 'bubble_o'
        };
      case ElectrolyteType.NACL:
        return { 
          cation: 'Na+', anion: 'Cl-', sourceLabel: 'NaCl',
          cathodeProduct: 'H2 + OH-', 
          anodeProduct: isCopperAnode ? 'Cu2+' : 'Cl2',
          secondaryProduct: state.hasMembrane ? 'NaOH' : 'NaClO', 
          secondaryTrigger: state.hasMembrane ? 'cathode' : (isCopperAnode ? 'none' : 'bulk'),
          cathodeType: 'bubble_h', 
          anodeType: isCopperAnode ? 'dissolving' : 'bubble_cl'
        };
      case ElectrolyteType.KI:
        return { 
          cation: 'K+', anion: 'I-', sourceLabel: 'KI',
          cathodeProduct: 'H2 + OH-', 
          anodeProduct: isCopperAnode ? 'Cu2+' : 'I2',
          secondaryProduct: 'KOH', 
          secondaryTrigger: 'cathode',
          cathodeType: 'bubble_h', 
          anodeType: isCopperAnode ? 'dissolving' : 'bubble_i'
        };
      case ElectrolyteType.WATER:
      default:
        return { 
          cation: 'H+', anion: 'OH-', sourceLabel: 'H2O',
          cathodeProduct: 'H2', 
          anodeProduct: isCopperAnode ? 'Cu2+' : 'O2',
          secondaryProduct: '', 
          secondaryTrigger: 'none',
          cathodeType: 'bubble_h', 
          anodeType: isCopperAnode ? 'dissolving' : 'bubble_o'
        };
    }
  };

  const getElectrodeColor = (material: ElectrodeMaterial) => {
    if (material === ElectrodeMaterial.COPPER) return '#92400e'; 
    if (material === ElectrodeMaterial.GRAPHITE) return '#111827';
    return '#94a3b8';
  };

  const ionConfig = getIonConfig(state.electrolyte);

  useEffect(() => {
    const initialParticles: Particle[] = [];
    phRef.current = 7.0;
    tempRef.current = 25.0;
    secondaryMolarityRef.current = 0;
    const count = 35;
    for (let i = 0; i < count; i++) {
      const isCation = Math.random() > 0.5;
      initialParticles.push({
        id: Math.random(),
        x: CENTER_X + (Math.random() - 0.5) * 80,
        y: WATER_TOP + 20 + Math.random() * (BEAKER_BOTTOM - WATER_TOP - 40),
        type: isCation ? 'cation' : 'anion',
        label: isCation ? ionConfig.cation : ionConfig.anion,
        vx: (Math.random() - 0.5) * 0.75, // Increased initial jitter
        vy: (Math.random() - 0.5) * 0.75,
      });
    }
    setParticles(initialParticles);
    setEvents([]);
  }, [state.electrolyte, ionConfig.cation, ionConfig.anion, state.hasMembrane]);

  const animate = () => {
    setEvents(prev => prev.map(e => ({ ...e, life: e.life - 0.012 })).filter(e => e.life > 0));

    setParticles(prevParticles => {
      let nextParticles = [...prevParticles];
      // Increased base drift force multiplier by 50% (0.018 -> 0.027)
      const driftForce = state.isRunning ? state.voltage * 0.027 : 0;
      // Increased thermal jitter by 50% (0.12 -> 0.18)
      const thermalJitter = 0.18;

      if (state.isRunning) {
        tempRef.current = Math.min(85, tempRef.current + (state.voltage * 0.0005));
      } else {
        tempRef.current = Math.max(25, tempRef.current - 0.005);
      }

      if (state.isRunning && Math.random() < (0.1 + state.voltage * 0.12)) {
        nextParticles.push({
          id: Math.random(), x: 0, y: 0, type: 'electron', progress: 0, pathType: 'negative_wire', vx: 0, vy: 0
        });
        nextParticles.push({
          id: Math.random(), x: 0, y: 0, type: 'electron', progress: 0, pathType: 'positive_wire', vx: 0, vy: 0
        });
      }

      nextParticles = nextParticles.map(p => {
        if (p.type === 'electron') {
          p.progress = (p.progress || 0) + 0.025 * (state.voltage / 12 + 0.5);
          return p;
        }

        if (p.type === 'cation' || p.type === 'anion') {
          const oldX = p.x;
          p.vx += (Math.random() - 0.5) * thermalJitter;
          p.vy += (Math.random() - 0.5) * thermalJitter;

          if (state.isRunning) {
            // Increased attraction multiplier by 50% (0.0006 -> 0.0009)
            if (p.type === 'cation') p.vx += (CATHODE_X - p.x) * 0.0009 * driftForce;
            else p.vx += (ANODE_X - p.x) * 0.0009 * driftForce;
          }

          p.vx *= 0.98; p.vy *= 0.98; p.x += p.vx; p.y += p.vy;

          if (p.x < BEAKER_LEFT + 5) { p.x = BEAKER_LEFT + 5; p.vx *= -0.5; }
          if (p.x > BEAKER_RIGHT - 5) { p.x = BEAKER_RIGHT - 5; p.vx *= -0.5; }
          if (p.y < WATER_TOP + 5) { p.y = WATER_TOP + 5; p.vy *= -0.5; }
          if (p.y > BEAKER_BOTTOM - 10) { p.y = BEAKER_BOTTOM - 10; p.vy *= -0.5; }

          if (state.hasMembrane) {
            if ((oldX <= CENTER_X && p.x > CENTER_X) || (oldX >= CENTER_X && p.x < CENTER_X)) {
              if (Math.random() > (p.type === 'cation' ? 0.9 : 0.05)) {
                p.x = oldX; p.vx *= -0.8;
              }
            }
          }
        } else if (p.type.startsWith('bubble')) {
          p.y += p.vy;
          p.x += Math.sin(p.y * 0.08 + p.id) * 0.8;
        }
        return p;
      });

      const currentNewParticles: Particle[] = [];
      const filteredParticles = nextParticles.filter(p => {
        if (p.type === 'electron' && p.progress! >= 1) return false;
        if (p.type.startsWith('bubble') && p.y < WATER_TOP) return false;

        if (state.isRunning && (p.type === 'cation' || p.type === 'anion')) {
          const inCathodeRange = Math.abs(p.x - CATHODE_X) < 14 && p.y > ELECTRODE_TOP;
          const inAnodeRange = Math.abs(p.x - ANODE_X) < 14 && p.y > ELECTRODE_TOP;

          if (p.type === 'cation' && inCathodeRange) {
            if (Math.random() < 0.06 * (state.voltage / 10)) {
              if (state.electrolyte === ElectrolyteType.NACL || state.electrolyte === ElectrolyteType.KI) {
                phRef.current = Math.min(14, phRef.current + 0.02);
                secondaryMolarityRef.current += 0.001;
              }
              const secondary = ionConfig.secondaryTrigger === 'cathode' ? ionConfig.secondaryProduct : '';
              let subtext = secondary ? `${t.reductionBrief} (${t.forms} ${secondary})` : t.reduction;
              if (state.electrolyte === ElectrolyteType.WATER) { subtext = t.reductionWater || subtext; }

              setEvents(ev => [...ev, { id: Math.random(), x: p.x, y: p.y, text: ionConfig.cathodeProduct, subtext, type: 'reduction', life: 1.0 }]);
              if (ionConfig.cathodeType === 'bubble_h') {
                 currentNewParticles.push({ id: Math.random(), x: p.x, y: p.y, type: 'bubble_h', vx: 0, vy: -1.2 - Math.random() });
              }
              return false;
            }
          }
          if (p.type === 'anion' && inAnodeRange) {
            if (Math.random() < 0.06 * (state.voltage / 10)) {
              if (ionConfig.anodeType === 'dissolving') {
                 currentNewParticles.push({
                   id: Math.random(),
                   x: ANODE_X - 10,
                   y: p.y,
                   type: 'cation',
                   label: 'Cu2+',
                   vx: -1.2 - Math.random() * 0.75, // Increased ejection speed
                   vy: (Math.random() - 0.5) * 0.75
                 });
                 setEvents(ev => [...ev, { 
                   id: Math.random(), 
                   x: ANODE_X, y: p.y, 
                   text: 'Cu2+', 
                   subtext: t.dissolving, 
                   type: 'oxidation', 
                   life: 1.0 
                 }]);
                 return true; 
              } else {
                if (state.electrolyte === ElectrolyteType.CUSO4) {
                  phRef.current = Math.max(0, phRef.current - 0.02);
                  secondaryMolarityRef.current += 0.001;
                }
                const secondary = ionConfig.secondaryTrigger === 'anode' ? ionConfig.secondaryProduct : '';
                let subtext = secondary ? `${t.oxidationBrief} (${t.forms} ${secondary})` : t.oxidation;
                if (state.electrolyte === ElectrolyteType.WATER) { subtext = t.oxidationWater || subtext; }

                setEvents(ev => [...ev, { id: Math.random(), x: p.x, y: p.y, text: ionConfig.anodeProduct, subtext, type: 'oxidation', life: 1.0 }]);
                currentNewParticles.push({ id: Math.random(), x: p.x, y: p.y, type: ionConfig.anodeType as any, vx: 0, vy: -1.0 - Math.random() });
                return false;
              }
            }
          }
        }
        return true;
      });

      if (state.isRunning && !state.hasMembrane && state.electrolyte === ElectrolyteType.NACL && state.anodeMaterial !== ElectrodeMaterial.COPPER) {
         if (Math.random() < 0.02) {
             const bx = CENTER_X + (Math.random() - 0.5) * 100;
             const by = WATER_TOP + 50 + Math.random() * 150;
             setEvents(ev => [...ev, {
               id: Math.random(),
               x: bx, y: by,
               text: "NaClO",
               subtext: t.bulk,
               type: 'bulk',
               life: 1.5
             }]);
             secondaryMolarityRef.current += 0.0005;
         }
      }

      nextParticles = [...filteredParticles, ...currentNewParticles];

      const cCount = nextParticles.filter(p => p.type === 'cation').length;
      const aCount = nextParticles.filter(p => p.type === 'anion').length;

      if (state.autoReplenish && (cCount < 20 || aCount < 20)) {
        const sx = CENTER_X + (Math.random() - 0.5) * 40;
        const sy = WATER_TOP + 40 + Math.random() * (BEAKER_BOTTOM - WATER_TOP - 80);
        setEvents(ev => [...ev, { id: Math.random(), x: sx, y: sy, text: ionConfig.sourceLabel, subtext: t.dissociation, type: 'dissociation', life: 0.8 }]);
        nextParticles.push({ id: Math.random(), x: sx, y: sy, type: 'cation', label: ionConfig.cation, vx: -0.75, vy: (Math.random() - 0.5) * 0.3 });
        nextParticles.push({ id: Math.random(), x: sx, y: sy, type: 'anion', label: ionConfig.anion, vx: 0.75, vy: (Math.random() - 0.5) * 0.3 });
      }

      onStatsUpdate({
        cationCount: cCount,
        anionCount: aCount,
        ph: phRef.current,
        temp: tempRef.current,
        secondaryProductMolarity: secondaryMolarityRef.current
      });

      return nextParticles;
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [state.isRunning, state.voltage, state.electrolyte, state.hasMembrane, state.autoReplenish, state.anodeMaterial]);

  const getElectronPos = (progress: number, type: 'negative_wire' | 'positive_wire') => {
    if (type === 'negative_wire') {
      if (progress < 0.25) return { x: 250 - (170 * (progress/0.25)), y: 50 };
      if (progress < 0.5) return { x: 80, y: 50 + (150 * ((progress-0.25)/0.25)) };
      if (progress < 0.75) return { x: 80 + (140 * ((progress-0.5)/0.25)), y: 200 };
      return { x: 220, y: 200 + (50 * ((progress-0.75)/0.25)) };
    } else {
      if (progress < 0.25) return { x: 380, y: 250 - (50 * (progress/0.25)) };
      if (progress < 0.5) return { x: 380 + (140 * ((progress-0.25)/0.25)), y: 200 };
      if (progress < 0.75) return { x: 520, y: 200 - (150 * ((progress-0.5)/0.25)) };
      return { x: 520 - (170 * ((progress-0.75)/0.25)), y: 50 };
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 select-none">
      <svg viewBox="0 0 600 650" className="w-full h-full max-w-[850px] drop-shadow-2xl overflow-visible">
        <style>
          {` @keyframes march { to { stroke-dashoffset: -32; } } .wire-flow { stroke-dasharray: 8, 24; animation: march 0.4s linear infinite; } .wire-glow { filter: blur(4px); opacity: 0.6; } `}
        </style>
        <defs>
          <linearGradient id="beakerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow-small"><feGaussianBlur stdDeviation="1" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
          <filter id="glow-electron"><feGaussianBlur stdDeviation="2" result="blur" /><feColorMatrix type="matrix" values="0 0 0 0 1   0 0 0 0 0.9   0 0 0 0 0.1  0 0 0 1 0" /><feComposite in="SourceGraphic" operator="over" /></filter>
          <filter id="glow-bulk">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.6   0 0 0 0 1   0 0 0 0 0.3  0 0 0 1 0" />
            <feComposite in="SourceGraphic" operator="over" />
          </filter>
        </defs>

        <path d="M 150 200 L 150 550 Q 150 585 185 585 L 415 585 Q 450 585 450 550 L 450 200" fill="url(#beakerGrad)" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <rect x="158" y="300" width="284" height="277" fill="url(#waterGrad)" rx="2" />

        {state.hasMembrane && (
          <g>
            <line x1="300" y1="300" x2="300" y2="575" stroke="#38bdf8" strokeWidth="3" strokeDasharray="8,8" strokeOpacity="0.6" className="animate-pulse" />
            <text x="300" y="290" textAnchor="middle" fill="#38bdf8" className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t.membrane}</text>
          </g>
        )}

        <rect x="250" y="20" width="100" height="60" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="3" />
        <text x="300" y="55" textAnchor="middle" fill="#22c55e" className="text-[12px] font-mono font-bold tracking-tighter">DC POWER</text>

        <path d="M 250 50 L 80 50 L 80 200 L 220 200 L 220 250" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.3" />
        <path d="M 350 50 L 520 50 L 520 200 L 380 200 L 380 250" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.3" />

        {state.isRunning && (
          <>
            <path d="M 250 50 L 80 50 L 80 200 L 220 200 L 220 250" fill="none" stroke="#fbbf24" strokeWidth="1.5" className="wire-glow" />
            <path d="M 380 250 L 380 200 L 520 200 L 520 50 L 350 50" fill="none" stroke="#fbbf24" strokeWidth="1.5" className="wire-glow" />
            <path d="M 250 50 L 80 50 L 80 200 L 220 200 L 220 250" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="wire-flow" style={{ animationDuration: `${0.6 - state.voltage * 0.02}s` }} />
            <path d="M 380 250 L 380 200 L 520 200 L 520 50 L 350 50" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="wire-flow" style={{ animationDuration: `${0.6 - state.voltage * 0.02}s` }} />
          </>
        )}

        <rect x="210" y="250" width="20" height="280" fill={getElectrodeColor(state.cathodeMaterial)} fillOpacity="0.95" rx="3" stroke="#0f172a" strokeWidth="1" />
        <rect x="370" y="250" width="20" height="280" fill={getElectrodeColor(state.anodeMaterial)} fillOpacity="0.95" rx="3" stroke="#0f172a" strokeWidth="1" />
        
        <text x="220" y="240" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-bold tracking-widest">{t.cathode}</text>
        <text x="380" y="240" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-bold tracking-widest">{t.anode}</text>

        {events.map(e => (
          <g key={e.id} transform={`translate(${e.x}, ${e.y - (1 - e.life) * 80})`}>
             <circle 
                r={e.type === 'bulk' ? (40 * (1 - e.life) + 20) : (20 * (1 - e.life) + 12)} 
                fill={e.type === 'reduction' ? '#3b82f6' : e.type === 'oxidation' ? '#f43f5e' : e.type === 'bulk' ? '#bef264' : '#facc15'} 
                fillOpacity={e.life * 0.4} 
                filter={e.type === 'bulk' ? 'url(#glow-bulk)' : ''}
                className={e.type === 'bulk' ? 'animate-pulse' : ''} 
             />
             <ChemicalFormula formula={e.text} x={0} y={-22} opacity={e.life} className={`${e.type === 'bulk' ? 'text-lg' : 'text-sm'} font-mono font-bold tracking-tighter drop-shadow-lg`} />
             <text textAnchor="middle" y={4} fill="white" fillOpacity={e.life * 0.8} className="text-[8px] font-bold uppercase tracking-widest">{e.subtext}</text>
          </g>
        ))}

        {particles.map(p => {
          if (p.type === 'electron') {
            const pos = getElectronPos(p.progress || 0, p.pathType!);
            return (
              <g key={p.id}>
                <circle cx={pos.x} cy={pos.y} r="3" fill="#fbbf24" filter="url(#glow-electron)" />
                {Math.random() < 0.05 && <text x={pos.x} y={pos.y - 6} textAnchor="middle" fill="#fbbf24" className="text-[7px] font-bold pointer-events-none select-none">e⁻</text>}
              </g>
            );
          }
          if (p.type === 'cation') {
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r="7" fill="#3b82f6" fillOpacity="0.85" stroke="#60a5fa" strokeWidth="1" />
                <text x={p.x} y={p.y + 3} textAnchor="middle" fill="white" className="text-[8px] font-bold pointer-events-none select-none">{p.label}</text>
              </g>
            );
          }
          if (p.type === 'anion') {
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r="7" fill="#f43f5e" fillOpacity="0.85" stroke="#fb7185" strokeWidth="1" />
                <text x={p.x} y={p.y + 3} textAnchor="middle" fill="white" className="text-[8px] font-bold pointer-events-none select-none">{p.label}</text>
              </g>
            );
          }
          if (p.type.startsWith('bubble')) {
            let label = '', color = 'white', r = 4;
            if (p.type === 'bubble_h') { label = 'H2'; r = 5; }
            if (p.type === 'bubble_o') { label = 'O2'; r = 7; }
            if (p.type === 'bubble_cl') { label = 'Cl2'; r = 7; color = '#bef264'; }
            if (p.type === 'bubble_i') { label = 'I2'; r = 6; color = '#78350f'; }
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.8" />
                <ChemicalFormula formula={label} x={p.x} y={p.y + 2.5} opacity={0.8} className="text-[8px] font-bold font-mono" />
              </g>
            );
          }
          return null;
        })}

        <g transform="translate(480, 550)">
            <rect width="100" height="60" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="50" y="22" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-bold uppercase tracking-widest">{t.efield}</text>
            <text x="50" y="48" textAnchor="middle" fill="white" className="text-xl font-mono font-bold">{(state.isRunning ? state.voltage : 0).toFixed(1)}V</text>
        </g>
      </svg>
    </div>
  );
};

export default ElectrolysisSim;
