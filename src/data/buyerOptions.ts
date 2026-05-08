import type { BuyerResidencyStatus, HouseholdProfile } from '@/game/types';

export interface HouseholdOption {
  value: HouseholdProfile;
  label: string;
  hint: string;
  defaultAge?: number;
  defaultResidency?: BuyerResidencyStatus;
}

export interface ResidencyOption {
  value: BuyerResidencyStatus;
  label: string;
  rateLabel: string;
  hint: string;
}

export const householdOptions: HouseholdOption[] = [
  {
    value: 'couple-family',
    label: 'Couple / Family',
    hint: 'Best starter path for HDB BTO/resale, grants, and the classic first-home ladder.',
    defaultAge: 30,
  },
  {
    value: 'single-parent',
    label: 'Single Parent',
    hint: 'Shelter-first family route with higher household load, childcare pressure, and HDB-family style learning.',
    defaultAge: 35,
  },
  {
    value: 'multi-gen-family',
    label: 'Multi-Gen Family',
    hint: 'Sandwich-generation route with elder/child support, bigger space needs, and stronger reserve pressure.',
    defaultAge: 40,
  },
  {
    value: 'domestic-partners',
    label: 'Domestic Partners',
    hint: 'Private-first route for couples who may not fit simplified HDB family-nucleus assumptions.',
    defaultAge: 30,
  },
  {
    value: 'single-35-plus',
    label: 'Single 35+',
    hint: 'A tighter but realistic solo-buyer path where HDB access starts after age 35.',
    defaultAge: 35,
  },
  {
    value: 'single-under-35',
    label: 'Single Under 35',
    hint: 'Harder early game: private/rental-first decisions before subsidized HDB access opens.',
    defaultAge: 27,
  },
  {
    value: 'foreigner-investor',
    label: 'Foreign Investor',
    hint: 'Private and commercial focus with heavy ABSD and no simplified HDB/EC access.',
    defaultAge: 40,
    defaultResidency: 'foreigner',
  },
];

export const residencyOptions: ResidencyOption[] = [
  {
    value: 'sc',
    label: 'Singapore Citizen',
    rateLabel: '0% first-home ABSD',
    hint: 'Default learning route: first residential purchase has no ABSD, then cooling measures bite on upgrades.',
  },
  {
    value: 'spr',
    label: 'Singapore PR',
    rateLabel: '5% first-home ABSD',
    hint: 'Private/resale-oriented run with PR ABSD and a stricter simplified HDB BTO path.',
  },
  {
    value: 'foreigner',
    label: 'Foreigner',
    rateLabel: '60% ABSD',
    hint: 'High-friction investor route that steers away from subsidized housing and ECs.',
  },
];

const AGE_OPTIONS_BY_PROFILE: Record<HouseholdProfile, number[]> = {
  'single-under-35': [27, 30, 34],
  'single-35-plus': [35, 40, 45, 55, 58, 65],
  'single-parent': [30, 35, 40, 45, 55],
  'multi-gen-family': [35, 40, 45, 55, 58, 65],
  'couple-family': [27, 30, 35, 40, 45, 55, 58, 65],
  'domestic-partners': [27, 30, 35, 40, 45, 55, 58, 65],
  'foreigner-investor': [27, 30, 35, 40, 45, 55, 58, 65],
};

export function getAgeOptions(householdProfile: HouseholdProfile): number[] {
  return AGE_OPTIONS_BY_PROFILE[householdProfile];
}
