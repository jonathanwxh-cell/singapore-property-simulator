import type { LifeActionId, Player } from '@/game/types';
import { properties } from '@/data/properties';

export type MonthlyIntentId =
  | 'landlord-ops'
  | 'recover'
  | 'build-cash'
  | 'hunt-deal'
  | 'career-push';

export interface MonthlyIntentOption {
  id: MonthlyIntentId;
  label: string;
  detail: string;
  upside: string;
  risk: string;
  primaryActionId: LifeActionId;
  secondaryActionId: LifeActionId | null;
  route: string;
  recommended: boolean;
  tone: 'good' | 'warn' | 'neutral';
}

export function getMonthlyIntentOptions(player: Player): MonthlyIntentOption[] {
  const ownedHdbNeedingRoomPlan = player.properties.find((ownedProperty) => {
    const listing = properties.find((property) => property.id === ownedProperty.propertyId);
    return Boolean(listing?.isHdb && !ownedProperty.tenant && (ownedProperty.mopRemainingMonths ?? 0) > 0);
  });
  const needsRecovery = player.life.stress >= 75 || player.life.energy <= 35;

  const options: MonthlyIntentOption[] = [];

  if (needsRecovery) {
    options.push({
      id: 'recover',
      label: 'Recover First',
      detail: 'Protect energy and stress before chasing more income or leverage.',
      upside: 'Lower burnout risk',
      risk: 'Slower cash growth',
      primaryActionId: 'recover',
      secondaryActionId: null,
      route: '/life',
      recommended: true,
      tone: 'warn',
    });
  }

  if (ownedHdbNeedingRoomPlan) {
    options.push({
      id: 'landlord-ops',
      label: 'Operate Your First Home',
      detail: 'Set a MOP-safe room-rental plan or reserve before the next month rolls.',
      upside: 'Unlock rental learning',
      risk: 'Tenant satisfaction matters',
      primaryActionId: 'property-hustle',
      secondaryActionId: needsRecovery ? null : 'recover',
      route: `/property/${ownedHdbNeedingRoomPlan.propertyId}`,
      recommended: !needsRecovery,
      tone: 'good',
    });
  }

  options.push({
    id: 'build-cash',
    label: 'Build Cash Buffer',
    detail: 'Use a side gig and scheme planning to grow spendable cash for the next decision.',
    upside: 'Faster down payment runway',
    risk: 'Energy cost',
    primaryActionId: 'take-side-gig',
    secondaryActionId: needsRecovery ? null : 'plan-schemes',
    route: '/life',
    recommended: options.length === 0,
    tone: 'neutral',
  });

  options.push({
    id: 'hunt-deal',
    label: 'Hunt For A Deal',
    detail: 'Spend the month learning the market and comparing starter or yield opportunities.',
    upside: 'Better timing and listing confidence',
    risk: 'Less immediate cash',
    primaryActionId: 'property-hustle',
    secondaryActionId: needsRecovery ? null : 'focus-at-work',
    route: '/properties',
    recommended: false,
    tone: 'good',
  });

  options.push({
    id: 'career-push',
    label: 'Push Career',
    detail: 'Prioritize work momentum so annual reviews and loan limits improve over time.',
    upside: 'Higher future income',
    risk: 'Less market scouting',
    primaryActionId: 'focus-at-work',
    secondaryActionId: needsRecovery ? null : 'upskill',
    route: '/life',
    recommended: false,
    tone: 'neutral',
  });

  const deduped = options.filter((option, index, list) => {
    return list.findIndex((candidate) => candidate.id === option.id) === index;
  });
  if (!deduped.some((option) => option.recommended)) {
    deduped[0] = { ...deduped[0], recommended: true };
  }

  return [
    ...deduped.filter((option) => option.recommended),
    ...deduped.filter((option) => !option.recommended),
  ].slice(0, 3);
}
