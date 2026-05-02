export interface Career {
  id: string;
  name: string;
  startingSalary: number;
  growthRate: number;
  riskFactor: number;
  description: string;
  icon: string;
  color: string;
  actionModifiers: {
    focusAtWork: number;
    sideGig: number;
    propertyHustle: number;
    upskill: number;
    supportHousehold: number;
    schemePlanning: number;
    stressSensitivity: number;
    promotionQuality: number;
  };
}

export const careers: Career[] = [
  {
    id: 'graduate',
    name: 'Fresh Graduate',
    startingSalary: 3500,
    growthRate: 0.04,
    riskFactor: 0.1,
    description: 'Just starting out in the working world. Stable but modest income with room for growth.',
    icon: 'GraduationCap',
    color: '#00E676',
    actionModifiers: {
      focusAtWork: 1.0,
      sideGig: 0.95,
      propertyHustle: 0.85,
      upskill: 1.25,
      supportHousehold: 1.0,
      schemePlanning: 1.05,
      stressSensitivity: 1.0,
      promotionQuality: 0.95,
    },
  },
  {
    id: 'banking',
    name: 'Banking & Finance',
    startingSalary: 6000,
    growthRate: 0.06,
    riskFactor: 0.25,
    description: 'High-flying finance career with excellent bonuses but subject to market cycles.',
    icon: 'TrendingUp',
    color: '#FFD740',
    actionModifiers: {
      focusAtWork: 1.15,
      sideGig: 0.85,
      propertyHustle: 0.95,
      upskill: 1.05,
      supportHousehold: 0.95,
      schemePlanning: 0.9,
      stressSensitivity: 1.2,
      promotionQuality: 1.2,
    },
  },
  {
    id: 'tech',
    name: 'Tech Professional',
    startingSalary: 5500,
    growthRate: 0.07,
    riskFactor: 0.15,
    description: 'Fast-growing sector with strong salary growth and relatively good job security.',
    icon: 'Cpu',
    color: '#00F0FF',
    actionModifiers: {
      focusAtWork: 1.1,
      sideGig: 1.15,
      propertyHustle: 0.9,
      upskill: 1.15,
      supportHousehold: 1.0,
      schemePlanning: 0.95,
      stressSensitivity: 1.05,
      promotionQuality: 1.1,
    },
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    startingSalary: 2000,
    growthRate: 0.12,
    riskFactor: 0.5,
    description: 'High risk, high reward. Your income can explode or collapse based on business success.',
    icon: 'Rocket',
    color: '#FF4081',
    actionModifiers: {
      focusAtWork: 0.85,
      sideGig: 1.35,
      propertyHustle: 1.0,
      upskill: 1.0,
      supportHousehold: 0.9,
      schemePlanning: 0.8,
      stressSensitivity: 1.25,
      promotionQuality: 1.15,
    },
  },
  {
    id: 'civil',
    name: 'Civil Service',
    startingSalary: 4000,
    growthRate: 0.035,
    riskFactor: 0.02,
    description: 'Stable government career with predictable increments and ironclad job security.',
    icon: 'Shield',
    color: '#2979FF',
    actionModifiers: {
      focusAtWork: 1.05,
      sideGig: 0.8,
      propertyHustle: 0.8,
      upskill: 1.1,
      supportHousehold: 1.05,
      schemePlanning: 1.2,
      stressSensitivity: 0.85,
      promotionQuality: 1.0,
    },
  },
  {
    id: 'medical',
    name: 'Medical Professional',
    startingSalary: 6500,
    growthRate: 0.05,
    riskFactor: 0.08,
    description: 'Respected career with strong, stable income. Recession-proof but demanding.',
    icon: 'Heart',
    color: '#FF1744',
    actionModifiers: {
      focusAtWork: 1.1,
      sideGig: 1.2,
      propertyHustle: 0.8,
      upskill: 1.0,
      supportHousehold: 1.0,
      schemePlanning: 0.95,
      stressSensitivity: 1.15,
      promotionQuality: 1.05,
    },
  },
  {
    id: 'agent',
    name: 'Property Agent',
    startingSalary: 2500,
    growthRate: 0.1,
    riskFactor: 0.4,
    description: 'Commission-based income tied directly to the property market. Feast or famine.',
    icon: 'Home',
    color: '#FF9100',
    actionModifiers: {
      focusAtWork: 0.9,
      sideGig: 0.95,
      propertyHustle: 1.35,
      upskill: 0.9,
      supportHousehold: 0.95,
      schemePlanning: 0.9,
      stressSensitivity: 1.15,
      promotionQuality: 1.1,
    },
  },
];
