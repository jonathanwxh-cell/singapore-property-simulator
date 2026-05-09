import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Banknote, BookOpen, Building2, CheckCircle2, Route, Sparkles, Users } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import { useGameStore } from '@/game/useGameStore';

const beginnerSteps = [
  {
    title: 'Earn and save first',
    body: 'Your salary, CPF contributions, career choices, and side income build the base. Early turns are about buying power, not rushing.',
    icon: Banknote,
  },
  {
    title: 'Buy only when the full cash picture works',
    body: 'The game checks down payment, BSD, ABSD, CPF OA usage, loan limits, and emergency reserves before a deal feels safe.',
    icon: Building2,
  },
  {
    title: 'Operate what you own',
    body: 'After buying, the run becomes about tenants, maintenance, renovations, reserves, and timing the next move.',
    icon: Users,
  },
  {
    title: 'Replay through different life arcs',
    body: 'A BTO upgrader, PR private climber, single buyer, foreign investor, and 55+ rightsizer all teach different Singapore tradeoffs.',
    icon: Route,
  },
];

const commonMistakes = [
  'Spending all cash on the down payment and forgetting stamp duties.',
  'Treating CPF OA as free money instead of part of your long-term net worth.',
  'Buying during MOP and expecting to rent the whole HDB immediately.',
  'Ignoring TDSR until the bank rejects a bigger property.',
  'Skipping reserves before renovations, vacancies, or maintenance events.',
];

const mechanicsReference = [
  {
    label: 'Buying power',
    formula: 'Cash required = down payment + BSD + ABSD + resale levy - CPF OA applied',
    note: 'Grants are modelled as CPF OA support, not instant cash.',
  },
  {
    label: 'Debt safety',
    formula: 'TDSR = all monthly debt / bank-assessed monthly income',
    note: 'Self-employed routes use a simplified income haircut before loan checks.',
  },
  {
    label: 'HDB/EC guardrail',
    formula: 'MSR = HDB or EC mortgage payment / monthly income',
    note: 'The simplified cap teaches why a cheap-looking flat can still fail monthly safety.',
  },
  {
    label: 'Ownership loop',
    formula: 'Monthly surplus = take-home pay + rent - loans - upkeep - household load',
    note: 'Repairs, vacancy, renovation, and reserve choices are the landlord game after buying.',
  },
  {
    label: '55+ stability',
    formula: 'Retirement runway = cashflow + CPF context - housing debt and repair risk',
    note: 'Senior routes focus on CPF 55, right-sizing, lease monetisation concepts, and lower fragility.',
  },
];

export default function Learn() {
  const navigate = useNavigate();
  const location = useLocation();
  const isGameActive = useGameStore((state) => state.isGameActive);
  const newGame = useGameStore((state) => state.newGame);
  const returnState = location.state as { returnTo?: string; returnLabel?: string } | null;

  const startBeginnerRun = () => {
    newGame(
      'Rookie Investor',
      'graduate',
      'normal',
      { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
      'bto-upgrader',
      { guidedMode: true },
    );
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space px-4 pb-10 pt-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <GlassCard accentColor="#00F0FF" className="overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="label-text mb-2 text-[10px] text-cyan-glow">Casual Player Guide</p>
                <h1 className="page-title mb-3 text-white">Learn Singapore Property Without Prereqs</h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                  You do not need to know property law, CPF, or investing jargon before playing. This hub translates the sim into game decisions: why a buy is blocked, why cash disappears, and what to try next.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {returnState?.returnTo && (
                    <button
                      type="button"
                      onClick={() => navigate(returnState.returnTo ?? '/newgame')}
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      {returnState.returnLabel ?? 'Back'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={isGameActive ? () => navigate('/dashboard') : startBeginnerRun}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    {isGameActive ? 'Back to This Month' : 'Start Beginner Run'}
                    <ArrowRight size={16} />
                  </button>
                  {!isGameActive && (
                    <button type="button" onClick={() => navigate('/newgame')} className="btn-secondary">
                      Customize Setup
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-glow/25 bg-cyan-glow/10 p-4">
                <Sparkles size={22} className="mb-2 text-cyan-glow" />
                <p className="font-rajdhani text-sm font-bold uppercase tracking-[0.14em] text-white">Best first run</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  Choose Couple / Family, Singapore Citizen, BTO-to-Condo Upgrader, and Normal difficulty.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard accentColor="#FFD740">
            <p className="label-text mb-2 text-[10px] text-warning">Who this game is for</p>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Casual tycoon players who like money puzzles.</p>
              <p>Singaporeans who want CPF/HDB concepts explained gently.</p>
              <p>Curious non-experts who want realism without spreadsheet homework.</p>
            </div>
          </GlassCard>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {beginnerSteps.map(({ title, body, icon: Icon }) => (
            <GlassCard key={title}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow">
                <Icon size={18} />
              </div>
              <h2 className="section-title mb-2 text-white">{title}</h2>
              <p className="text-xs leading-relaxed text-text-secondary">{body}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <GlassCard accentColor="#00E676">
            <div className="mb-4 flex items-start gap-3">
              <BookOpen size={20} className="mt-1 text-success" />
              <div>
                <p className="label-text mb-1 text-[10px] text-success">Singapore rules in game language</p>
                <h2 className="section-title text-white">The three checks that surprise new players</h2>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
              <p>
                <GlossaryTerm termId="absd" /> and <GlossaryTerm termId="bsd" /> are upfront cash costs. If a property says you are short, the blocker may be duties rather than salary.
              </p>
              <p>
                <GlossaryTerm termId="cpf-oa" /> can help with eligible residential purchases, but it does not protect you from bad monthly cashflow.
              </p>
              <p>
                <GlossaryTerm termId="mop" />, <GlossaryTerm termId="msr" />, and <GlossaryTerm termId="tdsr" /> are guardrails. They make the Singapore route feel different from a generic property game.
              </p>
            </div>
          </GlassCard>

          <GlassCard accentColor="#FF1744">
            <div className="mb-4 flex items-start gap-3">
              <AlertTriangle size={20} className="mt-1 text-danger" />
              <div>
                <p className="label-text mb-1 text-[10px] text-danger">When a buy fails</p>
                <h2 className="section-title text-white">Read the failure as a hint</h2>
              </div>
            </div>
            <div className="space-y-3">
              {commonMistakes.map((mistake) => (
                <div key={mistake} className="flex gap-2 rounded-xl border border-glass-border bg-white/[0.03] p-3">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-warning" />
                  <p className="text-xs leading-relaxed text-text-secondary">{mistake}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <RuleGlossaryPanel title="Tap These Terms Anywhere You See Them" compact />

        <GlassCard accentColor="#7C4DFF" className="mt-6">
          <div className="mb-4">
            <p className="label-text mb-1 text-[10px] text-text-dim">Mechanics reference</p>
            <h2 className="section-title text-white">How the Simulator Thinks</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              These are simplified formulas for learning. They are realistic enough to teach tradeoffs, but not personal financial advice.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {mechanicsReference.map((item) => (
              <div key={item.label} className="rounded-xl border border-glass-border bg-white/[0.03] p-4">
                <p className="font-rajdhani text-sm font-semibold uppercase tracking-[0.12em] text-white">{item.label}</p>
                <p className="mt-2 rounded-lg border border-cyan-glow/20 bg-cyan-glow/10 p-2 font-mono text-[11px] leading-relaxed text-cyan-glow">
                  {item.formula}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{item.note}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={isGameActive ? () => navigate('/dashboard') : startBeginnerRun}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isGameActive ? 'Back to This Month' : 'Start Beginner Run'}
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={() => navigate('/market')} className="btn-secondary">
            Study Market News
          </button>
        </div>
      </div>
    </div>
  );
}
