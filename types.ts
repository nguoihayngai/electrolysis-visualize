
export enum ElectrolyteType {
  WATER = 'Water (Acidified)',
  CUSO4 = 'Copper(II) Sulfate',
  NACL = 'Sodium Chloride (Brine)',
  KI = 'Potassium Iodide'
}

export enum ElectrodeMaterial {
  PLATINUM = 'Platinum (Inert)',
  COPPER = 'Copper (Reactive)',
  GRAPHITE = 'Graphite (Inert)'
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
}

export interface SimState {
  voltage: number;
  electrolyte: ElectrolyteType;
  anodeMaterial: ElectrodeMaterial;
  cathodeMaterial: ElectrodeMaterial;
  isRunning: boolean;
  hasMembrane: boolean;
  autoReplenish: boolean;
  autoAnalyze: boolean;
  language: Language;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'cation' | 'anion' | 'bubble_h' | 'bubble_o' | 'bubble_cl' | 'bubble_i' | 'electron';
  label?: string;
  vx: number;
  vy: number;
  progress?: number; // Used for electrons in wires (0 to 1)
  pathType?: 'negative_wire' | 'positive_wire';
}
