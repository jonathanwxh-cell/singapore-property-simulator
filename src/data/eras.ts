export interface Era {
  id: string;
  name: string;
  yearStart: number;
  yearEnd: number;
  description: string;
  marketCondition: 'boom' | 'stable' | 'recession' | 'recovery';
  priceMultiplier: number;
  interestRate: number;
  rentalYieldModifier: number;
  volatility: number;
  image: string;
}

export const eras: Era[] = [
  {
    id: 'asian-tiger',
    name: 'Asian Tiger (1990-1997)',
    yearStart: 1990,
    yearEnd: 1997,
    description: 'Singapore\'s rapid growth period. Property prices surged as the economy boomed.',
    marketCondition: 'boom',
    priceMultiplier: 0.4,
    interestRate: 3.5,
    rentalYieldModifier: 1.3,
    volatility: 0.15,
    image: '/market-trend-bg.jpg',
  },
  {
    id: 'asian-crisis',
    name: 'Asian Financial Crisis (1997-2003)',
    yearStart: 1997,
    yearEnd: 2003,
    description: 'The crash that wiped out fortunes. Property values halved, opportunities emerged.',
    marketCondition: 'recession',
    priceMultiplier: 0.6,
    interestRate: 6.5,
    rentalYieldModifier: 1.5,
    volatility: 0.3,
    image: '/scenario-market-crash.jpg',
  },
  {
    id: 'recovery',
    name: 'Recovery Era (2003-2008)',
    yearStart: 2003,
    yearEnd: 2008,
    description: 'The market bounced back strongly. Smart investors who bought low reaped rewards.',
    marketCondition: 'recovery',
    priceMultiplier: 0.75,
    interestRate: 4.5,
    rentalYieldModifier: 1.2,
    volatility: 0.2,
    image: '/market-trend-bg.jpg',
  },
  {
    id: 'global-crisis',
    name: 'Global Financial Crisis (2008-2013)',
    yearStart: 2008,
    yearEnd: 2013,
    description: 'Lehman Brothers collapsed. Property cooled, then surged with QE money.',
    marketCondition: 'stable',
    priceMultiplier: 0.88,
    interestRate: 2.5,
    rentalYieldModifier: 1.1,
    volatility: 0.25,
    image: '/scenario-market-crash.jpg',
  },
  {
    id: 'cooling-measures',
    name: 'Cooling Measures Era (2013-2020)',
    yearStart: 2013,
    yearEnd: 2020,
    description: 'ABSD, TDSR, SSD — the government tightened. Prices flatlined but held.',
    marketCondition: 'stable',
    priceMultiplier: 1.0,
    interestRate: 2.0,
    rentalYieldModifier: 1.0,
    volatility: 0.1,
    image: '/market-trend-bg.jpg',
  },
  {
    id: 'covid-boom',
    name: 'Post-COVID Boom (2020-2024)',
    yearStart: 2020,
    yearEnd: 2024,
    description: 'Record-low interest rates fueled a massive property boom. Prices hit new highs.',
    marketCondition: 'boom',
    priceMultiplier: 1.15,
    interestRate: 1.5,
    rentalYieldModifier: 0.85,
    volatility: 0.2,
    image: '/scenario-boom.jpg',
  },
];
