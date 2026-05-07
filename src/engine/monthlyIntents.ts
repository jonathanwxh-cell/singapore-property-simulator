import type { LifeActionId, MonthlyIntentTrack, Player } from '@/game/types';
import { properties } from '@/data/properties';
import { getNextHomePlan, type NextHomeFocusId } from './nextHomePlan';

export type MonthlyIntentId =
  | 'landlord-ops'
  | 'recover'
  | 'build-cash'
  | 'hunt-deal'
  | 'career-push'
  | 'mop-home-project'
  | 'mop-income-runway'
  | 'mop-market-intel';

export interface MonthlyIntentOption {
  id: MonthlyIntentId;
  label: string;
  detail: string;
  upside: string;
  risk: string;
  track: MonthlyIntentTrack;
  primaryActionId: LifeActionId;
  secondaryActionId: LifeActionId | null;
  autoActionId: 'start-room-rental' | 'start-flooring-refresh' | 'top-up-reserve-5k' | null;
  route: string;
  recommended: boolean;
  tone: 'good' | 'warn' | 'neutral';
}

export function getMonthlyIntentOptions(player: Player): MonthlyIntentOption[] {
  const nextHomePlan = getNextHomePlan(player);
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
      track: 'recovery',
      primaryActionId: 'recover',
      secondaryActionId: null,
      autoActionId: null,
      route: '/life',
      recommended: true,
      tone: 'warn',
    });
  }

  if (nextHomePlan.phase === 'active-mop') {
    const mopOptions: MonthlyIntentOption[] = [];

    if (ownedHdbNeedingRoomPlan) {
      mopOptions.push({
        id: 'landlord-ops',
        label: 'Activate Room Rental',
        detail: 'Use the MOP-safe landlord loop so the flat starts teaching tenant tradeoffs instead of sitting idle.',
        upside: 'Rental income and tenant XP',
        risk: 'Satisfaction can drift',
        track: 'tenant',
        primaryActionId: 'property-hustle',
        secondaryActionId: needsRecovery ? null : 'recover',
        autoActionId: 'start-room-rental',
        route: `/property/${ownedHdbNeedingRoomPlan.propertyId}`,
        recommended: nextHomePlan.recommendedFocusId === 'tenant' && !needsRecovery,
        tone: 'good',
      });
    }

    mopOptions.push(
      createMopIntent({
        id: 'mop-home-project',
        focusId: 'home-project',
        label: 'Improve Current Home',
        detail: 'Use the month for renovation, condition, or sale-readiness work that improves rent/value before MOP exit.',
        upside: 'Higher exit value',
        risk: 'Cash tied up',
        track: 'home-project',
        primaryActionId: 'property-hustle',
        secondaryActionId: needsRecovery ? null : 'plan-schemes',
        autoActionId: 'start-flooring-refresh',
        route: nextHomePlan.propertyName ? `/property/${ownedHdbNeedingRoomPlan?.propertyId ?? player.properties[0]?.propertyId}` : '/portfolio',
        recommendedFocusId: nextHomePlan.recommendedFocusId,
        needsRecovery,
        tone: 'good',
      }),
      createMopIntent({
        id: 'mop-income-runway',
        focusId: 'income',
        label: 'Grow Next-Home Cash',
        detail: 'Push side income and scheme planning so the down-payment runway improves while MOP counts down.',
        upside: 'Faster Property #2 readiness',
        risk: 'Energy pressure',
        track: 'income',
        primaryActionId: 'take-side-gig',
        secondaryActionId: needsRecovery ? null : 'focus-at-work',
        autoActionId: null,
        route: '/life',
        recommendedFocusId: nextHomePlan.recommendedFocusId,
        needsRecovery,
        tone: 'neutral',
      }),
      createMopIntent({
        id: 'mop-market-intel',
        focusId: 'market',
        label: 'Study Exit Market',
        detail: 'Compare districts and timing signals so the MOP exit feels planned instead of sudden.',
        upside: 'Better timing confidence',
        risk: 'Less cash this month',
        track: 'market',
        primaryActionId: 'property-hustle',
        secondaryActionId: needsRecovery ? null : 'upskill',
        autoActionId: null,
        route: '/market',
        recommendedFocusId: nextHomePlan.recommendedFocusId,
        needsRecovery,
        tone: 'good',
      }),
    );

    const rankedMopOptions = [
      ...mopOptions.filter((option) => option.recommended),
      ...mopOptions.filter((option) => !option.recommended),
    ];
    const activeMopOptions = [
      ...options,
      ...rankedMopOptions,
    ].slice(0, 3);

    if (!activeMopOptions.some((option) => option.recommended)) {
      activeMopOptions[0] = { ...activeMopOptions[0], recommended: true };
    }

    return activeMopOptions;
  }

  if (ownedHdbNeedingRoomPlan) {
    options.push({
      id: 'landlord-ops',
      label: 'Operate Your First Home',
      detail: 'Set a MOP-safe room-rental plan or reserve before the next month rolls.',
      upside: 'Unlock rental learning',
      risk: 'Tenant satisfaction matters',
      track: 'tenant',
      primaryActionId: 'property-hustle',
      secondaryActionId: needsRecovery ? null : 'recover',
      autoActionId: 'start-room-rental',
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
    track: 'income',
    primaryActionId: 'take-side-gig',
    secondaryActionId: needsRecovery ? null : 'plan-schemes',
    autoActionId: null,
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
    track: 'market',
    primaryActionId: 'property-hustle',
    secondaryActionId: needsRecovery ? null : 'focus-at-work',
    autoActionId: null,
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
    track: 'career',
    primaryActionId: 'focus-at-work',
    secondaryActionId: needsRecovery ? null : 'upskill',
    autoActionId: null,
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

function createMopIntent({
  id,
  focusId,
  label,
  detail,
  upside,
  risk,
  track,
  primaryActionId,
  secondaryActionId,
  autoActionId,
  route,
  recommendedFocusId,
  needsRecovery,
  tone,
}: {
  id: Extract<MonthlyIntentId, 'mop-home-project' | 'mop-income-runway' | 'mop-market-intel'>;
  focusId: NextHomeFocusId;
  label: string;
  detail: string;
  upside: string;
  risk: string;
  track: MonthlyIntentTrack;
  primaryActionId: LifeActionId;
  secondaryActionId: LifeActionId | null;
  autoActionId: MonthlyIntentOption['autoActionId'];
  route: string;
  recommendedFocusId: NextHomeFocusId;
  needsRecovery: boolean;
  tone: MonthlyIntentOption['tone'];
}): MonthlyIntentOption {
  return {
    id,
    label,
    detail,
    upside,
    risk,
    track,
    primaryActionId,
    secondaryActionId,
    autoActionId,
    route,
    recommended: recommendedFocusId === focusId && !needsRecovery,
    tone,
  };
}
