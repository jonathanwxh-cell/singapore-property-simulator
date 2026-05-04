export interface RuleGlossaryEntry {
  id: string;
  label: string;
  summary: string;
  detail: string;
}

export const ruleGlossaryEntries: RuleGlossaryEntry[] = [
  {
    id: 'absd',
    label: 'ABSD',
    summary: 'Additional Buyer\'s Stamp Duty',
    detail: 'A cooling-measure tax layered on top of BSD. Citizens pay 0% on a first home, PRs pay 5%, and foreigners face a much heavier 60% simplified rate in this simulator.',
  },
  {
    id: 'bsd',
    label: 'BSD',
    summary: 'Buyer\'s Stamp Duty',
    detail: 'A marginal stamp duty paid on every property purchase. It scales with price, so bigger private and landed deals need far more upfront cash.',
  },
  {
    id: 'cpf-oa',
    label: 'CPF OA',
    summary: 'Ordinary Account support',
    detail: 'CPF Ordinary Account balances can offset eligible residential upfront costs. The game applies it before checking how much cash you still need.',
  },
  {
    id: 'mop',
    label: 'MOP',
    summary: 'Minimum Occupation Period',
    detail: 'HDB flats must stay owner-occupied during the MOP. The game allows room rental during MOP, but blocks the simple whole-flat rental shortcut.',
  },
  {
    id: 'hdb-room-rental',
    label: 'Room Rental',
    summary: 'MOP-safe income lever',
    detail: 'A way to earn some rental income while still treating the HDB as owner-occupied. It is intentionally lower-friction than waiting five years with no choices.',
  },
  {
    id: 'msr',
    label: 'MSR',
    summary: 'Mortgage Servicing Ratio',
    detail: 'For HDB and EC purchases, the monthly mortgage payment must stay within 30% of monthly income in the simplified model.',
  },
  {
    id: 'tdsr',
    label: 'TDSR',
    summary: 'Total Debt Servicing Ratio',
    detail: 'All monthly debt payments must stay within 55% of monthly income. This is why bigger deals can fail even when the down payment looks affordable.',
  },
  {
    id: 'ec-ceiling',
    label: 'EC Ceiling',
    summary: 'Executive condo income cap',
    detail: 'Executive condos are treated as a first-home/upgrader bridge with a household income ceiling, so high-income players may need to move straight into private property.',
  },
  {
    id: 'reserve-cash',
    label: 'Reserve Cash',
    summary: 'Earmarked emergency funds',
    detail: 'Reserve cash stays in your cash balance but is no longer counted as available spending money. Use it to survive repairs, vacancies, and career shocks.',
  },
];

const glossaryById = new Map(ruleGlossaryEntries.map((entry) => [entry.id, entry]));

export function getRuleGlossaryEntries(termIds?: string[]): RuleGlossaryEntry[] {
  if (!termIds || termIds.length === 0) return ruleGlossaryEntries;

  return termIds
    .map((id) => glossaryById.get(id))
    .filter((entry): entry is RuleGlossaryEntry => Boolean(entry));
}
