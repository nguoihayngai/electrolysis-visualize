
export enum ElectrolyteType {
  WATER = 'Water (Acidified)',
  CUSO4 = 'Copper(II) Sulfate',
  NACL = 'Sodium Chloride (Brine)',
  KI = 'Potassium Iodide'
}

export enum ElectrodeMaterial {
  PLATINUM = 'Platinum (Inert)',
  COPPER = 'Copper (Reactive)',
  GRAPHITE = 'Graphite (Inert)',
  ZINC = 'Zinc (Reactive)'
}

export enum SaltBridgeType {
  KCL = 'Potassium Chloride (KCl)',
  KNO3 = 'Potassium Nitrate (KNO3)',
  NH4NO3 = 'Ammonium Nitrate (NH4NO3)',
  NA2SO4 = 'Sodium Sulfate (Na2SO4)'
}

export enum CellMode {
  ELECTROLYSIS = 'Electrolysis',
  GALVANIC = 'Galvanic Cell'
}

export enum Language {
  EN = 'English',
  VI = 'Tiếng Việt'
}

export interface SoluteStats {
  cationCount: number;
  anionCount: number;
  secondaryProductMolarity: number;
  ph: number;
  temp: number;
  anodeMass: number;
  cathodeMass: number;
  voltage: number; 
}

export interface SimState {
  mode: CellMode;
  voltage: number;
  electrolyte: ElectrolyteType;
  anodeMaterial: ElectrodeMaterial;
  cathodeMaterial: ElectrodeMaterial;
  saltBridgeType: SaltBridgeType;
  isRunning: boolean;
  hasMembrane: boolean;
  hasSaltBridge: boolean;
  isDualVessel: boolean;
  autoReplenish: boolean;
  autoAnalyze: boolean;
  language: Language;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'cation' | 'anion' | 'bubble_h' | 'bubble_o' | 'bubble_cl' | 'bubble_i' | 'electron' | 'salt_k' | 'salt_cl';
  label?: string;
  vx: number;
  vy: number;
  progress?: number;
  pathType?: 'negative_wire' | 'positive_wire' | 'salt_bridge';
}
