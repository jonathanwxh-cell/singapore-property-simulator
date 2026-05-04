// Pure formatters for Dashboard.tsx. No React, no JSX. Component exports
// live in DashboardComponents.tsx — the split exists to satisfy
// react-refresh/only-export-components.
import type { BuyerProfile } from '@/game/types';
import type { FirstHomeMission } from '@/engine/firstHomeMissions';
import type { CoachUrgency } from '@/engine/decisionCoach';

export function formatSignedPercent(value: number): string {
  if (Math.abs(value) < 0.05) return '0.0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatCareerOutcome(outcome: 'promotion' | 'bonus' | 'steady' | 'setback' | null): string {
  if (outcome === 'promotion') return 'Promotion Year';
  if (outcome === 'bonus') return 'Strong Bonus Year';
  if (outcome === 'steady') return 'Steady Progress Year';
  if (outcome === 'setback') return 'Career Setback';
  return 'Career Review';
}

export function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? '+' : '-'}S$${Math.abs(value).toLocaleString()}`;
}

export function formatBuyerProfile(profile?: BuyerProfile): string {
  if (!profile) return 'Singapore Citizen | Couple / family | Age 30';

  const residency = profile.residencyStatus === 'sc'
    ? 'Singapore Citizen'
    : profile.residencyStatus === 'spr'
      ? 'Singapore PR'
      : 'Foreigner';
  const household = profile.householdProfile === 'couple-family'
    ? 'Couple / family'
    : profile.householdProfile === 'single-35-plus'
      ? 'Single 35+'
      : profile.householdProfile === 'single-under-35'
        ? 'Single under 35'
        : 'Foreign investor';

  return `${residency} | ${household} | Age ${profile.age}`;
}

export function missionToneClasses(mission: FirstHomeMission) {
  if (mission.completed) {
    return {
      card: 'border-success/35 bg-success/10 hover:border-success/60',
      label: 'text-success',
    };
  }

  const classes = {
    good: {
      card: 'border-success/35 bg-success/10 hover:border-success/60',
      label: 'text-success',
    },
    warn: {
      card: 'border-warning/40 bg-warning/10 hover:border-warning/70',
      label: 'text-warning',
    },
    neutral: {
      card: 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/50',
      label: 'text-cyan-glow',
    },
  } satisfies Record<FirstHomeMission['tone'], { card: string; label: string }>;

  return classes[mission.tone];
}

export function coachToneClasses(urgency: CoachUrgency) {
  const classes = {
    critical: {
      card: 'border-danger/40 bg-danger/10 hover:border-danger/70',
      label: 'text-danger',
    },
    warn: {
      card: 'border-warning/40 bg-warning/10 hover:border-warning/70',
      label: 'text-warning',
    },
    good: {
      card: 'border-success/40 bg-success/10 hover:border-success/70',
      label: 'text-success',
    },
    neutral: {
      card: 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/50',
      label: 'text-cyan-glow',
    },
  } satisfies Record<CoachUrgency, { card: string; label: string }>;

  return classes[urgency];
}
