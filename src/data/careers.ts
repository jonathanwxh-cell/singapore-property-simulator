export interface Career {
  id: string;
  name: string;
  startingSalary: number;
  growthRate: number;
  riskFactor: number;
  description: string;
  icon: string;
  color: string;
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
  },
];
