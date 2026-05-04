import { properties, isResidentialCategory } from '@/data/properties';
import type { Player } from '@/game/types';
import { normalizeBuyerProfile } from '@/game/types';
import { selectAvailableCash } from './selectors';
import { assessDealReadiness } from './decisionCoach';

export interface FirstHomeMission {
  id: string;
  label: string;
  detail: string;
  route: string;
  completed: boolean;
  tone: 'good' | 'warn' | 'neutral';
}

export function getFirstHomeMissions(player: Player): FirstHomeMission[] {
  const starter = properties.find((property) => property.id === 'hdb-bto-0') ?? properties[0];
  const readiness = assessDealReadiness({
    player,
    property: starter,
    downPaymentPercent: 25,
    useCpfOrdinary: true,
  });
  const firstHome = player.properties.find((property) => {
    const listing = properties.find((candidate) => candidate.id === property.propertyId);
    return listing ? isResidentialCategory(listing.type) : true;
  });
  const firstHomeRoute = firstHome ? `/property/${firstHome.propertyId}` : '/properties';
  const roomRentalDone = Boolean(firstHome?.tenant?.rentalMode === 'room-rental');
  const buyerProfile = normalizeBuyerProfile(player.buyerProfile);

  return [
    {
      id: 'profile-ready',
      label: 'Set buyer profile',
      detail: `${formatResidency(buyerProfile.residencyStatus)} | ${formatHousehold(buyerProfile.householdProfile)} | Age ${buyerProfile.age}`,
      route: '/dashboard',
      completed: Boolean(player.buyerProfile),
      tone: 'good',
    },
    {
      id: 'build-cash-buffer',
      label: 'Build S$20K cash buffer',
      detail: `Available cash: S$${Math.round(selectAvailableCash(player)).toLocaleString()}`,
      route: '/life',
      completed: selectAvailableCash(player) >= 20_000,
      tone: selectAvailableCash(player) >= 20_000 ? 'good' : 'warn',
    },
    {
      id: 'plan-schemes',
      label: 'Prepare grants and schemes',
      detail: 'Use Claim / Plan Schemes to build first-home support and reduce early friction.',
      route: '/life',
      completed: player.life.schemeProgress.firstTimerGrant >= 20 || player.life.selectedPrimaryActionId === 'plan-schemes',
      tone: 'neutral',
    },
    {
      id: 'review-starter-home',
      label: 'Review starter homes',
      detail: readiness.verdict === 'ready' ? `${starter.name} is purchase-ready.` : readiness.headline,
      route: '/properties',
      completed: player.firstHomePurchased || readiness.verdict === 'ready',
      tone: readiness.verdict === 'blocked' ? 'warn' : 'good',
    },
    {
      id: 'buy-first-home',
      label: 'Buy first home',
      detail: player.firstHomePurchased ? 'First home secured. Shift attention to owner operations.' : 'Compare CPF, cash, and monthly payment before committing.',
      route: firstHomeRoute,
      completed: player.firstHomePurchased,
      tone: player.firstHomePurchased ? 'good' : 'neutral',
    },
    {
      id: 'mop-safe-room-rental',
      label: 'Set MOP-safe room rental',
      detail: roomRentalDone ? 'Owner-occupied room rental is active.' : 'If still inside MOP, rent a room rather than the whole flat.',
      route: firstHomeRoute,
      completed: roomRentalDone,
      tone: roomRentalDone ? 'good' : 'neutral',
    },
    {
      id: 'protect-reserve',
      label: 'Protect S$5K reserve',
      detail: `Reserved cash: S$${Math.round(player.reserve?.allocatedCash ?? 0).toLocaleString()}`,
      route: firstHomeRoute,
      completed: (player.reserve?.allocatedCash ?? 0) >= 5_000,
      tone: (player.reserve?.allocatedCash ?? 0) >= 5_000 ? 'good' : 'warn',
    },
  ];
}

function formatResidency(status: ReturnType<typeof normalizeBuyerProfile>['residencyStatus']): string {
  if (status === 'sc') return 'Singapore Citizen';
  if (status === 'spr') return 'Singapore PR';
  return 'Foreigner';
}

function formatHousehold(profile: ReturnType<typeof normalizeBuyerProfile>['householdProfile']): string {
  if (profile === 'couple-family') return 'Couple / family nucleus';
  if (profile === 'single-35-plus') return 'Single 35+';
  if (profile === 'single-under-35') return 'Single under 35';
  return 'Foreign investor';
}
