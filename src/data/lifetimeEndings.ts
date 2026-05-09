import type { EndingId, LifeMemoryCategory } from '@/game/types';

export interface LifetimeEndingDefinition {
  id: EndingId;
  label: string;
  tone: 'warm' | 'comic' | 'bittersweet' | 'cautionary' | 'prestige';
  summary: string;
  spoilerSafeHint: string;
  primaryCategories: LifeMemoryCategory[];
}

export const lifetimeEndings: LifetimeEndingDefinition[] = [
  {
    id: 'heartland-hero',
    label: 'Heartland Hero',
    tone: 'warm',
    summary: 'You built a rooted Singapore life around one practical home, steady obligations, and community stability.',
    spoilerSafeHint: 'Own modestly, stay stable, and let community matter more than status.',
    primaryCategories: ['home', 'family', 'culture'],
  },
  {
    id: 'property-tycoon',
    label: 'Property Tycoon',
    tone: 'prestige',
    summary: 'You kept climbing the property ladder until the portfolio became the story.',
    spoilerSafeHint: 'Build a large property portfolio and survive the taxes, debt, and operating drag.',
    primaryCategories: ['home', 'landlord', 'money'],
  },
  {
    id: 'cash-king',
    label: 'Cash King',
    tone: 'comic',
    summary: 'You avoided the property chase and ended with liquidity, optionality, and a very smug bank balance.',
    spoilerSafeHint: 'Stay liquid and prove that not buying can also be a strategy.',
    primaryCategories: ['money', 'career'],
  },
  {
    id: 'quiet-achiever',
    label: 'Quiet Achiever',
    tone: 'warm',
    summary: 'No fireworks, no flexing, just a stable life that worked better than it looked on paper.',
    spoilerSafeHint: 'Keep stress low, debt manageable, and life stable.',
    primaryCategories: ['family', 'home', 'milestone'],
  },
  {
    id: 'negative-equity',
    label: 'Negative Equity',
    tone: 'cautionary',
    summary: 'The market turned, leverage bit back, and the dream home became a balance-sheet lesson.',
    spoilerSafeHint: 'High leverage and poor timing can become a long shadow.',
    primaryCategories: ['setback', 'market', 'money'],
  },
  {
    id: 'fire-at-45',
    label: 'FIRE at 45',
    tone: 'prestige',
    summary: 'You turned income discipline, low drag, and compounding into early freedom.',
    spoilerSafeHint: 'Build wealth fast while keeping stress and debt under control.',
    primaryCategories: ['career', 'money', 'milestone'],
  },
  {
    id: 'sandwich-generation',
    label: 'Sandwich Generation',
    tone: 'bittersweet',
    summary: 'Parents, household load, and long-term duty shaped nearly every major financial choice.',
    spoilerSafeHint: 'Family support can become the main story.',
    primaryCategories: ['family', 'money', 'setback'],
  },
  {
    id: 'kiasu-king',
    label: 'Kiasu King / Queen',
    tone: 'comic',
    summary: 'You optimized the life plan so hard that even the spreadsheet looked tired.',
    spoilerSafeHint: 'Chase prestige, school-zone pressure, and maximum optimization.',
    primaryCategories: ['family', 'career', 'culture'],
  },
  {
    id: 'retire-in-jb',
    label: 'Retire in JB',
    tone: 'bittersweet',
    summary: 'Singapore got expensive, so the good life moved across the Causeway.',
    spoilerSafeHint: 'A late-life route for players priced out or choosing lower-cost retirement.',
    primaryCategories: ['money', 'family', 'milestone'],
  },
  {
    id: 'en-bloc-millionaire',
    label: 'En Bloc Millionaire',
    tone: 'prestige',
    summary: 'One collective-sale windfall changed the whole life plan.',
    spoilerSafeHint: 'Sometimes the biggest upside comes from where you happened to hold.',
    primaryCategories: ['market', 'home', 'money'],
  },
  {
    id: 'kena-scam',
    label: 'Kena Scam',
    tone: 'cautionary',
    summary: 'The lesson arrived dressed as opportunity, and it was expensive.',
    spoilerSafeHint: 'Risk appetite without safeguards can become the ending.',
    primaryCategories: ['setback', 'money'],
  },
  {
    id: 'migration-story',
    label: 'Migration Story',
    tone: 'bittersweet',
    summary: 'The Singapore plan stopped being the whole plan.',
    spoilerSafeHint: 'Some lives resolve by leaving, not by winning the local ladder.',
    primaryCategories: ['career', 'family', 'milestone'],
  },
  {
    id: 'paper-general',
    label: 'Paper General',
    tone: 'prestige',
    summary: 'Credential, career ladder, and institutional stability became the main asset class.',
    spoilerSafeHint: 'A stable elite career can be its own property strategy.',
    primaryCategories: ['career', 'money'],
  },
  {
    id: 'ah-beng-made-good',
    label: 'Ah Beng Made Good',
    tone: 'warm',
    summary: 'A rough start turned into a stubbornly successful Singapore comeback story.',
    spoilerSafeHint: 'Recover from weak starting conditions and build something durable.',
    primaryCategories: ['career', 'money', 'milestone'],
  },
];

export const lifetimeEndingsById = Object.fromEntries(
  lifetimeEndings.map((ending) => [ending.id, ending]),
) as Record<EndingId, LifetimeEndingDefinition>;
