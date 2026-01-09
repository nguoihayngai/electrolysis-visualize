
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SimState, ElectrolyteType, ElectrodeMaterial, Particle, Language, SoluteStats, CellMode, SaltBridgeType } from '../types';

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
  life: number;
}

const REACTIVITY_SERIES: Record<ElectrodeMaterial, number> = {
  [ElectrodeMaterial.ZINC]: 0.76,
  [ElectrodeMaterial.COPPER]: -0.34,
  [ElectrodeMaterial.GRAPHITE]: -0.5,
  [ElectrodeMaterial.PLATINUM]: -1.2
};

const translations = {
  [Language.EN]: {
    membrane: "Membrane",
    saltBridge: "Salt Bridge",
    voltmeter: "VOLTMETER",
    reduction: "Reduction",
    oxidation: "Oxidation",
    dissolving: "Dissolving"
  },
  [Language.VI]: {
    membrane: "Màng Ngăn",
    saltBridge: "Cầu Muối",
    voltmeter: "VÔN KẾ",
    reduction: "Sự khử",
    oxidation: "Sự oxi hóa",
    dissolving: "Điện cực tan"
  }
};

const getPathPoint = (progress: number, points: { x: number, y: number }[]) => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };
  const segmentCount = points.length - 1;
  const scaledProgress = Math.max(0, Math.min(1, progress)) * segmentCount;
  const index = Math.floor(scaledProgress);
  const segmentProgress = scaledProgress - index;
  if (index >= segmentCount) return points[points.length - 1];
  const p1 = points[index];
  const p2 = points[index + 1];
  return {
    x: p1.x + (p2.x - p1.x) * segmentProgress,
    y: p1.y + (p2.y - p1.y) * segmentProgress
  };
};

const ElectrolysisSim: React.FC<ElectrolysisSimProps> = ({ state, onStatsUpdate }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [events, setEvents] = useState<ReactionEvent[]>([]);
  const requestRef = useRef<number>(0);
  const statsRef = useRef({ ph: 7.0, temp: 25.0, anodeMass: 10.0, cathodeMass: 10.0 });
  
  const t = translations[state.language];

  const ANODE_X = 180;
  const CATHODE_X = 420;
  const WATER_TOP = 320;
  const BEAKER_BOTTOM = 575;
  const ELECTRODE_TOP = 250;
  const BASE_WIDTH = 24;
  const BASE_HEIGHT = 280;
  const PARTICLE_RADIUS = 8;

  const isCircuitClosed = useMemo(() => {
    if (state.mode === CellMode.ELECTROLYSIS) return true;
    if (state.isDualVessel) return state.hasSaltBridge;
    return true; 
  }, [state.mode, state.hasSaltBridge, state.isDualVessel]);

  const galvanicRoles = useMemo(() => {
    if (state.mode !== CellMode.GALVANIC) return null;
    const pL = REACTIVITY_SERIES[state.anodeMaterial];
    const pR = REACTIVITY_SERIES[state.cathodeMaterial];
    const eCell = Math.abs(pL - pR);
    const isLeftAnode = pL > pR; 
    return { eCell, isLeftAnode, anodeX: isLeftAnode ? ANODE_X : CATHODE_X, cathodeX: isLeftAnode ? CATHODE_X : ANODE_X };
  }, [state.mode, state.anodeMaterial, state.cathodeMaterial]);

  const currentVoltage = isCircuitClosed ? (state.mode === CellMode.GALVANIC ? (galvanicRoles?.eCell || 0) : state.voltage) : 0;

  const leftWirePoints = [{ x: ANODE_X, y: 250 }, { x: ANODE_X, y: 200 }, { x: 100, y: 200 }, { x: 100, y: 70 }, { x: 240, y: 70 }];
  const rightWirePoints = [{ x: CATHODE_X, y: 250 }, { x: CATHODE_X, y: 200 }, { x: 500, y: 200 }, { x: 500, y: 70 }, { x: 360, y: 70 }];

  const getIonLabels = () => {
    const isCuElectrolyte = state.electrolyte === ElectrolyteType.CUSO4;
    return {
      cation: isCuElectrolyte ? 'Cu²⁺' : (state.electrolyte === ElectrolyteType.KI ? 'K⁺' : 'Na⁺'),
      anion: isCuElectrolyte ? 'SO₄²⁻' : (state.electrolyte === ElectrolyteType.KI ? 'I⁻' : 'Cl⁻'),
    };
  };

  useEffect(() => {
    const initialParticles: Particle[] = [];
    statsRef.current = { ph: 7.0, temp: 25.0, anodeMass: 10.0, cathodeMass: 10.0 };
    const count = 40;
    const labels = getIonLabels();
    for (let i = 0; i < count; i++) {
      const isLeft = i < count / 2;
      initialParticles.push({
        id: Math.random(),
        x: (isLeft ? ANODE_X : CATHODE_X) + (Math.random() - 0.5) * 80,
        y: WATER_TOP + 50 + Math.random() * 150,
        type: Math.random() > 0.5 ? 'cation' : 'anion',
        label: Math.random() > 0.5 ? labels.cation : labels.anion,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      });
    }
    setParticles(initialParticles);
  }, [state.mode, state.electrolyte, state.hasMembrane, state.hasSaltBridge, state.isDualVessel]);

  const animate = () => {
    setEvents(prev => prev.map(e => ({ ...e, life: e.life - 0.015 })).filter(e => e.life > 0));

    let finalCationCount = 0;
    let finalAnionCount = 0;

    setParticles(prevParticles => {
      let nextParticles = [...prevParticles];
      const isRunning = state.isRunning && currentVoltage > 0;

      if (isRunning && Math.random() < 0.12) {
        const fromLeft = state.mode === CellMode.GALVANIC ? galvanicRoles?.isLeftAnode : true;
        nextParticles.push({
          id: Math.random(), x: 0, y: 0, progress: 0, type: 'electron',
          vx: 0, vy: 0,
          pathType: fromLeft ? 'negative_wire' : 'positive_wire'
        });
      }

      if (isRunning && Math.random() < 0.06) {
        const isLeftAnode = state.mode === CellMode.GALVANIC ? galvanicRoles?.isLeftAnode : true;
        const anodeMat = isLeftAnode ? state.anodeMaterial : state.cathodeMaterial;
        const aX = isLeftAnode ? ANODE_X : CATHODE_X;
        
        if (anodeMat === ElectrodeMaterial.COPPER || anodeMat === ElectrodeMaterial.ZINC) {
          statsRef.current.anodeMass -= 0.005;
          const ionLabel = anodeMat === ElectrodeMaterial.ZINC ? 'Zn²⁺' : 'Cu²⁺';
          
          if (nextParticles.filter(p => p.type === 'cation').length < 65) {
            nextParticles.push({
              id: Math.random(),
              x: aX + (Math.random() > 0.5 ? 12 : -12),
              y: WATER_TOP + 60 + Math.random() * 130,
              type: 'cation',
              label: ionLabel,
              vx: (Math.random() - 0.5) * 0.2,
              vy: (Math.random() - 0.5) * 0.2
            });
            setEvents(ev => [...ev, { 
              id: Math.random(), x: aX, y: WATER_TOP + 40, 
              text: `${ionLabel}`, subtext: t.dissolving, type: 'oxidation', life: 1 
            }]);
          }
        }
      }

      nextParticles = nextParticles.map(p => {
        if (p.type === 'electron') {
          p.progress = (p.progress || 0) + 0.006 + (currentVoltage / 250);
          return p;
        }

        p.vx += (Math.random() - 0.5) * 0.03;
        p.vy += (Math.random() - 0.5) * 0.03;

        if (isRunning) {
          const isCation = p.type === 'cation' || p.type === 'salt_k';
          let targetX = CATHODE_X;
          if (state.mode === CellMode.GALVANIC) {
            targetX = isCation ? galvanicRoles!.cathodeX : galvanicRoles!.anodeX;
          } else {
            targetX = isCation ? CATHODE_X : ANODE_X;
          }

          const isParticleInLeft = p.x < 300;
          const isTargetInLeft = targetX < 300;
          
          if (!state.isDualVessel || (isParticleInLeft === isTargetInLeft)) {
             p.vx += (targetX - p.x) * 0.00018 * currentVoltage;
          }
        }

        p.vx *= 0.95; p.vy *= 0.95; p.x += p.vx; p.y += p.vy;

        const isLeft = p.x < 300;
        let limit = { l: 0, r: 600 };
        if (state.isDualVessel) limit = isLeft ? { l: 100, r: 275 } : { l: 325, r: 500 };
        else if (state.hasMembrane) limit = isLeft ? { l: 140, r: 298 } : { l: 302, r: 460 };
        else limit = { l: 140, r: 460 };

        // Xử lý va chạm thành bình chân thực (không xuyên qua)
        if (p.x < limit.l + PARTICLE_RADIUS) { 
          p.x = limit.l + PARTICLE_RADIUS; 
          p.vx *= -0.4; 
        }
        if (p.x > limit.r - PARTICLE_RADIUS) { 
          p.x = limit.r - PARTICLE_RADIUS; 
          p.vx *= -0.4; 
        }
        
        // Va chạm mặt nước và đáy bình
        if (p.y < WATER_TOP + PARTICLE_RADIUS + 2) {
          p.y = WATER_TOP + PARTICLE_RADIUS + 2;
          p.vy *= -0.4;
        }
        if (p.y > BEAKER_BOTTOM - PARTICLE_RADIUS - 10) { 
          p.y = BEAKER_BOTTOM - PARTICLE_RADIUS - 10; 
          p.vy *= -0.4; 
        }

        return p;
      });

      const filtered = nextParticles.filter(p => {
        if (p.type === 'electron' && p.progress! >= 1) return false;
        
        if (isRunning && p.y > ELECTRODE_TOP) {
          const isLeftAnode = state.mode === CellMode.GALVANIC ? galvanicRoles?.isLeftAnode : true;
          const onLeft = Math.abs(p.x - ANODE_X) < 22;
          const onRight = Math.abs(p.x - CATHODE_X) < 22;
          
          if (onLeft || onRight) {
             const isAnode = (onLeft && isLeftAnode) || (onRight && !isLeftAnode);
             
             if (!isAnode && (p.type === 'cation' || p.type === 'salt_k') && Math.random() < 0.1) {
               if (p.label === 'Cu²⁺' || p.label === 'Zn²⁺') {
                  statsRef.current.cathodeMass += 0.006;
               }
               setEvents(ev => [...ev, { 
                 id: Math.random(), x: p.x, y: p.y, text: p.label?.replace(/[²⁺⁺]/g, '') || 'M', 
                 subtext: t.reduction, type: 'reduction', life: 1 
               }]);
               return false;
             }
             
             if (isAnode && (p.type === 'anion' || p.type === 'salt_cl') && Math.random() < 0.05) {
               const anodeMat = onLeft ? state.anodeMaterial : state.cathodeMaterial;
               if (anodeMat === ElectrodeMaterial.GRAPHITE || anodeMat === ElectrodeMaterial.PLATINUM) {
                 setEvents(ev => [...ev, { 
                   id: Math.random(), x: p.x, y: p.y, text: 'e⁻', 
                   subtext: t.oxidation, type: 'oxidation', life: 1 
                 }]);
                 return false;
               }
             }
          }
        }
        return true;
      });

      finalCationCount = filtered.filter(p => p.type === 'cation').length;
      finalAnionCount = filtered.filter(p => p.type === 'anion').length;
      
      return filtered;
    });

    onStatsUpdate({ 
      ...statsRef.current, 
      cationCount: finalCationCount, 
      anionCount: finalAnionCount, 
      secondaryProductMolarity: 0.1, 
      voltage: currentVoltage 
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [state.isRunning, state.mode, state.voltage, galvanicRoles, isCircuitClosed, state.hasMembrane, state.hasSaltBridge, state.isDualVessel]);

  const anodeVisualWidth = Math.max(4, BASE_WIDTH * (statsRef.current.anodeMass / 10));
  const anodeVisualHeight = Math.max(100, BASE_HEIGHT * (statsRef.current.anodeMass / 10));
  const cathodeVisualWidth = Math.max(BASE_WIDTH, BASE_WIDTH * (statsRef.current.cathodeMass / 10));

  const getElectrodeColor = (mat: ElectrodeMaterial) => {
    switch (mat) {
      case ElectrodeMaterial.COPPER: return '#92400e';
      case ElectrodeMaterial.ZINC: return '#94a3b8';
      case ElectrodeMaterial.GRAPHITE: return '#1e293b';
      case ElectrodeMaterial.PLATINUM: return '#cbd5e1';
      default: return '#334155';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <svg viewBox="0 0 600 650" className="w-full h-full max-w-4xl overflow-visible drop-shadow-[0_0_20px_rgba(30,58,138,0.2)]">
        <defs>
          <filter id="glow-electron"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" /><stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.05" /></linearGradient>
          <pattern id="porous" x="0" y="0" width="8" height="16" patternUnits="userSpaceOnUse">
             <circle cx="4" cy="4" r="1.5" fill="#475569" opacity="0.5"/>
          </pattern>
        </defs>

        <g stroke="#475569" strokeWidth="4" fill="url(#waterGrad)">
          { state.isDualVessel ? (
            <>
              <path d="M 100 250 L 100 550 Q 100 585 135 585 L 240 585 Q 275 585 275 550 L 275 250" />
              <path d="M 325 250 L 325 550 Q 325 585 360 585 L 465 585 Q 500 585 500 550 L 500 250" />
            </>
          ) : (
            <>
              <path d="M 140 250 L 140 550 Q 140 585 175 585 L 425 585 Q 460 585 460 550 L 460 250" />
            </>
          )}
        </g>

        <rect 
          x={ANODE_X - (anodeVisualWidth / 2)} 
          y={ELECTRODE_TOP} 
          width={anodeVisualWidth} 
          height={anodeVisualHeight} 
          fill={getElectrodeColor(state.anodeMaterial)} 
          rx="4" 
          className="transition-all duration-300" 
        />
        
        <rect 
          x={CATHODE_X - (cathodeVisualWidth / 2)} 
          y={ELECTRODE_TOP} 
          width={cathodeVisualWidth} 
          height={BASE_HEIGHT} 
          fill={getElectrodeColor(state.cathodeMaterial)} 
          rx="4" 
          className="transition-all duration-300"
        />

        {statsRef.current.cathodeMass > 10.01 && (
            <rect 
              x={CATHODE_X - (cathodeVisualWidth / 2) - 2} 
              y={ELECTRODE_TOP + 10} 
              width={cathodeVisualWidth + 4} 
              height={BASE_HEIGHT - 20} 
              fill={state.electrolyte === ElectrolyteType.CUSO4 ? '#b45309' : '#94a3b8'} 
              fillOpacity="0.4"
              rx="6" 
              className="pointer-events-none"
            />
        )}

        <g transform="translate(240, 30)">
          <rect width="120" height="80" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <text x="60" y="25" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-bold uppercase tracking-widest">{state.mode === CellMode.GALVANIC ? t.voltmeter : 'DC SOURCE'}</text>
          <rect x="15" y="35" width="90" height="30" rx="4" fill="#020617" />
          <text x="60" y="56" textAnchor="middle" fill={isCircuitClosed ? "#fbbf24" : "#475569"} className="text-xl font-mono font-bold transition-colors">{(state.isRunning ? currentVoltage : 0).toFixed(2)}V</text>
        </g>

        <path d={`M ${ANODE_X} 250 L ${ANODE_X} 200 L 100 200 L 100 70 L 240 70`} fill="none" stroke="#ef4444" strokeWidth="3" strokeOpacity="0.6" />
        <path d={`M ${CATHODE_X} 250 L ${CATHODE_X} 200 L 500 200 L 500 70 L 360 70`} fill="none" stroke="#3b82f6" strokeWidth="3" strokeOpacity="0.6" />

        {particles.map(p => {
          if (p.type === 'electron') {
            const isLeftAnode = state.mode === CellMode.GALVANIC ? galvanicRoles?.isLeftAnode : true;
            let points;
            if (p.progress! < 0.5) {
              points = isLeftAnode ? [...leftWirePoints].reverse() : [...rightWirePoints].reverse();
              const pos = getPathPoint(p.progress! * 2, points);
              return <circle key={p.id} cx={pos.x} cy={pos.y} r="3" fill="#fbbf24" filter="url(#glow-electron)" />;
            } else {
              points = isLeftAnode ? rightWirePoints : leftWirePoints;
              const pos = getPathPoint((p.progress! - 0.5) * 2, points);
              return <circle key={p.id} cx={pos.x} cy={pos.y} r="3" fill="#fbbf24" filter="url(#glow-electron)" />;
            }
          }
          const color = p.type === 'cation' || p.type === 'salt_k' ? '#3b82f6' : '#f43f5e';
          return (
            <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
              <circle r={PARTICLE_RADIUS} fill={color} fillOpacity="0.7" />
              <text y="3" textAnchor="middle" fill="white" className="text-[7px] font-bold pointer-events-none select-none">{p.label}</text>
            </g>
          );
        })}

        {events.map(e => (
          <g key={e.id} transform={`translate(${e.x}, ${e.y - (1 - e.life) * 50})`}>
             <circle r={15 * (1-e.life) + 10} fill={e.type === 'reduction' ? '#3b82f6' : '#f43f5e'} fillOpacity={e.life * 0.4} />
             <text textAnchor="middle" fill="white" fillOpacity={e.life} className="text-[9px] font-bold pointer-events-none">{e.text}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default ElectrolysisSim;
