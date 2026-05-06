export interface RuleGlossaryEntry {
  id: string;
  label: string;
  summary: string;
  detail: string;
  whyItMatters: string;
  example: string;
}

export const ruleGlossaryEntries: RuleGlossaryEntry[] = [
  {
    id: 'absd',
    label: 'ABSD',
    summary: 'Additional Buyer\'s Stamp Duty',
    detail: 'A cooling-measure tax layered on top of BSD. Simplified rates used here: SC 0% first home / 20% second home, PR 5% first home / 30% second home, foreigner 60% residential.',
    whyItMatters: 'ABSD is paid with upfront cash, so it can block a purchase even when your salary and loan size look comfortable. PR and foreigner runs should compare private, commercial, and residency paths.',
    example: 'A PR buying a second residential property needs to plan around the jump from 5% to 30% ABSD.',
  },
  {
    id: 'bsd',
    label: 'BSD',
    summary: 'Buyer\'s Stamp Duty',
    detail: 'A marginal stamp duty paid on every property purchase. It scales with price, so bigger private and landed deals need far more upfront cash.',
    whyItMatters: 'BSD is part of the cash needed on day one. It is separate from the down payment and cannot be ignored.',
    example: 'A cheaper HDB resale flat may pass because BSD is manageable, while a pricier condo may fail on upfront cash.',
  },
  {
    id: 'cpf-oa',
    label: 'CPF OA',
    summary: 'Ordinary Account support',
    detail: 'CPF Ordinary Account balances can offset eligible residential upfront costs. The game applies it before checking how much cash you still need.',
    whyItMatters: 'CPF OA can make a first home reachable sooner, but it does not replace the need for cash buffers.',
    example: 'Using CPF OA can reduce the cash needed for an eligible HDB or condo purchase.',
  },
  {
    id: 'mop',
    label: 'MOP',
    summary: 'Minimum Occupation Period',
    detail: 'HDB flats must stay owner-occupied during the MOP. The game allows room rental during MOP, but blocks the simple whole-flat rental shortcut.',
    whyItMatters: 'MOP changes what you can do after buying. It can block second residential buys and whole-unit rental plans.',
    example: 'During MOP, you may run an owner-occupied room rental, but you cannot treat the flat like a pure investment unit.',
  },
  {
    id: 'hdb-room-rental',
    label: 'Room Rental',
    summary: 'MOP-safe income lever',
    detail: 'A way to earn some rental income while still treating the HDB as owner-occupied. It is intentionally lower-friction than waiting five years with no choices.',
    whyItMatters: 'Room rental gives early cashflow without breaking the owner-occupation fantasy of the HDB path.',
    example: 'A careful room-rental lease can help cover maintenance while you wait out MOP.',
  },
  {
    id: 'msr',
    label: 'MSR',
    summary: 'Mortgage Servicing Ratio',
    detail: 'For HDB and EC purchases, the monthly mortgage payment must stay within 30% of monthly income in the simplified model.',
    whyItMatters: 'MSR can reject public-housing purchases even when your down payment looks okay.',
    example: 'A larger EC may fail MSR because the monthly payment takes too much of your salary.',
  },
  {
    id: 'tdsr',
    label: 'TDSR',
    summary: 'Total Debt Servicing Ratio',
    detail: 'All monthly debt payments must stay within 55% of monthly income. This is why bigger deals can fail even when the down payment looks affordable.',
    whyItMatters: 'TDSR protects the run from over-leverage. It checks monthly pressure, not just purchase price.',
    example: 'Taking a personal loan first can make a later condo mortgage fail TDSR.',
  },
  {
    id: 'ec-ceiling',
    label: 'EC Ceiling',
    summary: 'Executive condo income cap',
    detail: 'Executive condos are treated as a first-home/upgrader bridge with a household income ceiling, so high-income players may need to move straight into private property.',
    whyItMatters: 'The EC route is attractive, but eligibility can disappear once your simulated household earns too much.',
    example: 'A fast-growing banking career may outgrow EC access before you have enough cash ready.',
  },
  {
    id: 'reserve-cash',
    label: 'Reserve Cash',
    summary: 'Earmarked emergency funds',
    detail: 'Reserve cash stays in your cash balance but is no longer counted as available spending money. Use it to survive repairs, vacancies, and career shocks.',
    whyItMatters: 'Reserved cash makes you less likely to spiral when maintenance, vacancies, or rate shocks hit.',
    example: 'Keeping S$15K reserved can be the difference between a bad month and insolvency.',
  },
  {
    id: 'hfe',
    label: 'HFE Letter',
    summary: 'HDB Flat Eligibility check',
    detail: 'A real HDB buying journey starts with eligibility and financing clarity before shopping seriously. The simulator keeps this simplified, but treats first-home readiness as more than just clicking buy.',
    whyItMatters: 'HFE-style readiness helps players understand why grants, loan size, CPF, and household profile matter before a BTO or resale move.',
    example: 'A couple-family route should check first-home readiness before assuming a BTO or resale flat is available.',
  },
  {
    id: 'hdb-loan',
    label: 'HDB Loan',
    summary: 'Concessionary financing',
    detail: 'A simplified HDB concessionary path in the game: 25% starter down payment after the 75% LTV cap, 2.6% fixed-rate interest, and a 25-year servicing period for eligible HDB listings.',
    whyItMatters: 'The shorter 25-year period raises the monthly payment versus a generic 30-year mortgage, so MSR/TDSR checks feel closer to a real HDB affordability screen.',
    example: 'A starter BTO may work with CPF OA covering much of the 25% down payment, but still fail if cash, MSR, or HFE-style readiness is weak.',
  },
  {
    id: 'hps-fire-insurance',
    label: 'HPS / Fire Insurance',
    summary: 'Protection checkpoint',
    detail: 'HDB buyers using CPF for loan repayments should understand Home Protection Scheme-style mortgage protection and basic fire insurance. The game keeps premiums simplified, but surfaces the checkpoint before players treat affordability as only down payment plus loan.',
    whyItMatters: 'Insurance does not make a bad deal good, but it prevents the simulator from teaching that household protection is optional background noise.',
    example: 'A family buying an HDB flat should budget beyond the deposit: mortgage protection, fire insurance, renovation, moving costs, and repair reserves all compete for cash.',
  },
  {
    id: 'hdb-resale-levy',
    label: 'Resale Levy',
    summary: 'Second subsidised HDB cost',
    detail: 'A simplified estimate of the levy that can apply when moving from one subsidised HDB path into another subsidised flat.',
    whyItMatters: 'It stops repeat subsidised purchases from feeling like free resets and teaches players to budget for policy friction.',
    example: 'After selling a first subsidised BTO, a later BTO may show an estimated resale levy in upfront costs.',
  },
  {
    id: 'cov',
    label: 'COV',
    summary: 'Cash Over Valuation',
    detail: 'For resale flats, a bid above valuation may require extra cash that CPF and loans cannot cover in full. The game can surface this as a deal-specific cash surprise.',
    whyItMatters: 'COV is one reason a resale flat can look affordable on price but still fail the upfront cash check.',
    example: 'A popular mature-estate resale flat may need extra cash even when your loan and CPF look strong.',
  },
  {
    id: 'sora',
    label: 'SORA',
    summary: 'Rate benchmark pressure',
    detail: 'Singapore mortgage packages often reprice around bank and benchmark-rate conditions rather than a simple central-bank slider. The game simplifies this into monthly rate pressure.',
    whyItMatters: 'Rate movement affects monthly payments, TDSR headroom, refinance timing, and whether a stretched deal remains comfortable.',
    example: 'A rate spike can turn a safe-looking condo upgrade into a cashflow warning.',
  },
  {
    id: 'commercial-bsd',
    label: 'Commercial BSD',
    summary: 'Non-residential stamp duty',
    detail: 'Commercial property still has buyer stamp duty, but it is not ABSD and does not use the residential ABSD path in this simulator.',
    whyItMatters: 'This avoids teaching players that foreigners pay residential ABSD on commercial offices or shops.',
    example: 'A foreign investor buying an office unit pays the commercial purchase friction, not the 60% residential ABSD model.',
  },
  {
    id: 'self-employed-income',
    label: 'Self-Employed Income',
    summary: 'Volatile income plus bank haircut',
    detail: 'Entrepreneur and property-agent routes now receive variable monthly income, while lenders assess only about 70% of base income for simplified TDSR/MSR checks.',
    whyItMatters: 'This makes commercial and aggressive paths feel closer to real self-employed borrowing: big upside months help cash, but banks still underwrite conservatively.',
    example: 'A delivery entrepreneur may earn more in a strong month but still fail TDSR because the bank uses a haircut on assessable income.',
  },
  {
    id: 'cpf-refund',
    label: 'CPF Refund',
    summary: 'CPF returned on sale',
    detail: 'Real residential sales often require CPF used for housing, plus accrued interest, to be refunded back to CPF before cash proceeds are fully spendable. The game keeps this simplified.',
    whyItMatters: 'Sale proceeds are not the same as instant free cash, especially when CPF and loans were used heavily.',
    example: 'Selling after using CPF OA may leave less spendable cash than the headline capital gain suggests.',
  },
  {
    id: 'cpf-55',
    label: 'CPF 55',
    summary: 'Retirement Account checkpoint',
    detail: 'At 55, CPF planning shifts toward the Retirement Account. The game uses the 2026 Full Retirement Sum reference as a learning benchmark, not a personal advice calculator.',
    whyItMatters: 'Later-life property moves should preserve retirement income and housing payment runway instead of treating all CPF balances as spare buying power.',
    example: 'A 58-year-old rightsizer should compare the home purchase against CPF retirement needs before taking on a larger mortgage.',
  },
  {
    id: 'lease-buyback',
    label: 'Lease Buyback',
    summary: 'Monetising part of an HDB lease',
    detail: 'A real-world HDB retirement monetisation path where eligible seniors can sell part of the remaining flat lease back to HDB. The simulator uses it as a concept hook.',
    whyItMatters: 'It teaches that housing wealth can support retirement cashflow, but only through rules, eligibility, and tradeoffs.',
    example: 'A senior who wants to stay put may consider monetising lease value instead of selling and moving.',
  },
  {
    id: 'silver-housing-bonus',
    label: 'Silver Housing Bonus',
    summary: 'Right-sizing support concept',
    detail: 'A retirement support idea tied to right-sizing into a smaller flat and using housing proceeds to improve retirement adequacy. The game keeps it simplified.',
    whyItMatters: 'It makes the 55+ route about stability and monthly income, not just asset price appreciation.',
    example: 'A household selling a larger flat may evaluate whether right-sizing improves cashflow and retirement runway.',
  },
];

const glossaryById = new Map(ruleGlossaryEntries.map((entry) => [entry.id, entry]));

export function getRuleGlossaryEntries(termIds?: string[]): RuleGlossaryEntry[] {
  if (!termIds || termIds.length === 0) return ruleGlossaryEntries;

  return termIds
    .map((id) => glossaryById.get(id))
    .filter((entry): entry is RuleGlossaryEntry => Boolean(entry));
}

export function getRuleGlossaryEntry(termId: string): RuleGlossaryEntry | undefined {
  return glossaryById.get(termId);
}
