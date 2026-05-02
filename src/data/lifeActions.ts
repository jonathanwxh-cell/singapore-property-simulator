import type { LifeActionId } from '@/game/types';

export interface LifeActionDefinition {
  id: LifeActionId;
  label: string;
  description: string;
  accent: string;
  category: 'career' | 'income' | 'household' | 'recovery';
}

export const lifeActions: LifeActionDefinition[] = [
  {
    id: 'focus-at-work',
    label: 'Focus at Work',
    description: 'Protect salary stability and build career momentum through solid month-to-month work.',
    accent: '#00F0FF',
    category: 'career',
  },
  {
    id: 'take-side-gig',
    label: 'Take Side Gig',
    description: 'Earn extra cash through tuition, freelancing, shift work, or contract support.',
    accent: '#FFD740',
    category: 'income',
  },
  {
    id: 'property-hustle',
    label: 'Property Hustle',
    description: 'Chase referrals, viewing support, tenant leads, and market-adjacent commissions.',
    accent: '#FF9100',
    category: 'income',
  },
  {
    id: 'upskill',
    label: 'Upskill',
    description: 'Invest in certifications and training that improve future career outcomes.',
    accent: '#7C4DFF',
    category: 'career',
  },
  {
    id: 'support-household',
    label: 'Support Household',
    description: 'Spend time or money on parents allowance, caregiving, and family obligations.',
    accent: '#00E676',
    category: 'household',
  },
  {
    id: 'plan-schemes',
    label: 'Claim / Plan Schemes',
    description: 'Work through CDC, training support, and housing-scheme paperwork for future upside.',
    accent: '#2979FF',
    category: 'household',
  },
  {
    id: 'recover',
    label: 'Recover',
    description: 'Rest, regain energy, and reduce stress before pushing again next month.',
    accent: '#FF1744',
    category: 'recovery',
  },
];

export const lifeActionsById = Object.fromEntries(
  lifeActions.map((action) => [action.id, action]),
) as Record<LifeActionId, LifeActionDefinition>;
