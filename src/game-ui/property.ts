import { districts } from '@/data/districts';
import type { PropertyType } from '@/data/properties';
import type { DealReadiness } from '@/engine/decisionCoach';
import type { VerdictKind } from '@/ui/Verdict';

export interface TypeMeta { emoji: string; short: string; cls: string }

const TYPE_META: Record<PropertyType, TypeMeta> = {
  'HDB BTO': { emoji: '🏢', short: 'HDB BTO', cls: 'bg-teal/15 text-teal' },
  'HDB Resale': { emoji: '🏢', short: 'HDB Resale', cls: 'bg-teal/15 text-teal' },
  'Executive Condo': { emoji: '🏙️', short: 'Exec Condo', cls: 'bg-sky/15 text-sky' },
  'Private Condo': { emoji: '🌆', short: 'Condo', cls: 'bg-grape/15 text-grape' },
  'Landed Terrace': { emoji: '🏡', short: 'Terrace', cls: 'bg-gold/20 text-[#B9791E]' },
  'Landed Semi-D': { emoji: '🏡', short: 'Semi-D', cls: 'bg-gold/20 text-[#B9791E]' },
  'Landed Bungalow': { emoji: '🏰', short: 'Bungalow', cls: 'bg-gold/20 text-[#B9791E]' },
  'Commercial Shop': { emoji: '🏬', short: 'Shophouse', cls: 'bg-slate/15 text-slate' },
  'Commercial Office': { emoji: '🏢', short: 'Office', cls: 'bg-slate/15 text-slate' },
};

export function typeMeta(type: PropertyType): TypeMeta {
  return TYPE_META[type] ?? { emoji: '🏠', short: type, cls: 'bg-ink/10 text-ink-soft' };
}

export function districtName(districtId: number): string {
  const d = districts.find((x) => x.id === districtId);
  return d ? `${d.name}` : `District ${districtId}`;
}

export function districtRegion(districtId: number): string {
  return districts.find((x) => x.id === districtId)?.region ?? '';
}

/** Map the engine's deal verdict into a punchy gut-check chip. */
export function verdictFor(readiness: DealReadiness, rentalYield: number): { kind: VerdictKind; label?: string } {
  if (readiness.verdict === 'blocked') {
    const code = readiness.primaryBlocker?.code;
    // Plain-English at the moment of friction — no bare acronyms on the chip.
    const short =
      code === 'tdsr_exceeded' ? 'Bank says no — too much debt'
      : code === 'msr_exceeded' ? 'Bank says no — loan too big'
      : code === 'insufficient_cash' ? 'Not enough cash'
      : code === 'ltv_exceeded' ? 'Bigger deposit needed'
      : code === 'mop_restricted' ? 'Locked — 5-year rule'
      : code === 'credit_too_low' ? 'Credit too low'
      : code === 'already_owned' ? 'You own this'
      : 'Not eligible yet';
    return { kind: 'blocked', label: short };
  }
  if (readiness.verdict === 'ready' && rentalYield >= 4.4) return { kind: 'steal' };
  if (readiness.verdict === 'ready') return { kind: 'comfortable' };
  return { kind: 'stretch' };
}
