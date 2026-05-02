import type { LifeActionId } from '@/game/types';

export interface LifeActionDefinition {
  id: LifeActionId;
  label: string;
  description: string;
  accent: string;
  category: 'career' | 'income' | 'household' | 'recovery';
  image: string;
  imageAlt: string;
  visualLabel: string;
  heroHint: string;
}

export const lifeActions: LifeActionDefinition[] = [
  {
    id: 'focus-at-work',
    label: 'Focus at Work',
    description: 'Protect salary stability and build career momentum through solid month-to-month work.',
    accent: '#00F0FF',
    category: 'career',
    image: '/life-scenes/focus-at-work.svg',
    imageAlt: 'Night office scene overlooking the Singapore skyline',
    visualLabel: 'Career Track',
    heroHint: 'Steady progress, stronger momentum, and a cleaner line toward your next promotion.',
  },
  {
    id: 'take-side-gig',
    label: 'Take Side Gig',
    description: 'Earn extra cash through tuition, freelancing, shift work, or contract support.',
    accent: '#FFD740',
    category: 'income',
    image: '/life-scenes/take-side-gig.svg',
    imageAlt: 'After-hours freelance work scene with laptop and late-night city lights',
    visualLabel: 'Cash Push',
    heroHint: 'Trade spare energy for faster cash accumulation and a shorter runway to your first purchase.',
  },
  {
    id: 'property-hustle',
    label: 'Property Hustle',
    description: 'Chase referrals, viewing support, tenant leads, and market-adjacent commissions.',
    accent: '#FF9100',
    category: 'income',
    image: '/life-scenes/property-hustle.svg',
    imageAlt: 'Property networking scene with keys, route markers, and district skyline silhouettes',
    visualLabel: 'Market Route',
    heroHint: 'Lean into deal flow, referrals, and tenant leads to turn local market knowledge into income.',
  },
  {
    id: 'upskill',
    label: 'Upskill',
    description: 'Invest in certifications and training that improve future career outcomes.',
    accent: '#7C4DFF',
    category: 'career',
    image: '/life-scenes/upskill.svg',
    imageAlt: 'Study desk scene with course notes, laptop, and certification materials',
    visualLabel: 'Skills Build',
    heroHint: 'Spend now on training that compounds into better career opportunities later.',
  },
  {
    id: 'support-household',
    label: 'Support Household',
    description: 'Spend time or money on parents allowance, caregiving, and family obligations.',
    accent: '#00E676',
    category: 'household',
    image: '/life-scenes/support-household.svg',
    imageAlt: 'Warm household support scene in a Singapore home setting',
    visualLabel: 'Family Duty',
    heroHint: 'Stabilize life at home so the rest of your financial plan can keep moving.',
  },
  {
    id: 'plan-schemes',
    label: 'Claim / Plan Schemes',
    description: 'Work through CDC, training support, and housing-scheme paperwork for future upside.',
    accent: '#2979FF',
    category: 'household',
    image: '/life-scenes/plan-schemes.svg',
    imageAlt: 'Planning scene with forms, civic support paperwork, and digital admin tools',
    visualLabel: 'Scheme Prep',
    heroHint: 'Use Singapore-style support systems to reduce friction on training and first-home plans.',
  },
  {
    id: 'recover',
    label: 'Recover',
    description: 'Rest, regain energy, and reduce stress before pushing again next month.',
    accent: '#FF1744',
    category: 'recovery',
    image: '/life-scenes/recover.svg',
    imageAlt: 'Quiet recovery scene with greenery, rain, and a calm interior',
    visualLabel: 'Reset Month',
    heroHint: 'Protect your long game by backing off before stress starts to erode your progress.',
  },
];

export const lifeActionsById = Object.fromEntries(
  lifeActions.map((action) => [action.id, action]),
) as Record<LifeActionId, LifeActionDefinition>;
