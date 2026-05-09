import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Building2, Compass, Landmark, Sparkles, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';
import PageSceneHero, { HeroAction } from '@/components/visuals/PageSceneHero';

const sections = [
  {
    title: 'Win Condition',
    icon: TrendingUp,
    body: 'Grow your net worth to the difficulty target before repeated insolvency ends the run. Cash, CPF, property equity, and realized profits all matter.',
  },
  {
    title: 'Your First Good Move',
    icon: Building2,
    body: 'Use the early turns to build buying power. Starter scenarios, your salary, and CPF OA can all help you cross the line into your first property much faster.',
  },
  {
    title: 'Guided Life Arc',
    icon: Compass,
    body: 'Choose a route like BTO Upgrader, Single 35 Resale Buyer, Heartland Landlord, or FIRE Homeowner. Routes guide your next moves and replay goals, but they do not block valid sandbox choices.',
  },
  {
    title: 'Buying Property',
    icon: Landmark,
    body: 'Every purchase has a down payment, stamp duty, loan checks, and monthly carrying cost. Residential homes can use CPF OA toward eligible upfront costs.',
  },
  {
    title: 'Scenarios and Market News',
    icon: Sparkles,
    body: 'Scenarios create real decisions, while the market feed explains each month’s move through rates, demand, supply, policy, and infrastructure headlines.',
  },
];

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-deep-space px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase tracking-wider">Back to Menu</span>
        </button>

        <PageSceneHero
          variant="learn"
          eyebrow="How to play"
          title="Play the board, then read the rules"
          subtitle="Build a Singapore property life by balancing cashflow, leverage, CPF, and timing. Every month can bring better grants, harsher rates, or a market swing you can exploit."
          className="mb-8"
          stats={[
            { label: 'Loop', value: 'Earn Buy Own', tone: 'good' },
            { label: 'Rules', value: 'Explained', tone: 'neutral' },
            { label: 'First Run', value: 'Guided', tone: 'good' },
          ]}
          actions={<HeroAction onClick={() => navigate('/newgame')}>Start new game</HeroAction>}
        />

        <GlassCard accentColor="#FFD740" className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center">
                  <BookOpen size={18} className="text-warning" />
                </div>
                <h2 className="section-title text-white">Who This Game Is For</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
                No prior property knowledge is required. The game is built for casual tycoon players, Singapore property beginners, and curious players who want CPF/HDB-style realism explained as playable choices.
              </p>
            </div>
            <button onClick={() => navigate('/learn')} className="btn-secondary shrink-0">
              Open Learn Hub
            </button>
          </div>
        </GlassCard>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {sections.map(({ title, icon: Icon, body }) => (
            <GlassCard key={title}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center">
                  <Icon size={18} className="text-cyan-glow" />
                </div>
                <h2 className="section-title text-white">{title}</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard accentColor="#00E676" className="mb-6">
          <h2 className="section-title text-white mb-3">Quickstart</h2>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>1. Start a new run and choose a career that matches your appetite for growth versus stability.</p>
            <p>2. Watch for the early first-home scenario and decide whether to boost cash, grants, or credit strength.</p>
            <p>3. Browse the cheapest HDB and entry-level listings first. Use <GlossaryTerm termId="cpf-oa" /> where it is allowed to reduce cash strain.</p>
            <p>4. Check the monthly market headline before buying. Rising rates can punish leverage, while supply squeezes can reward patience.</p>
            <p>5. Once you own property, manage rent, loans, and timing rather than mindlessly advancing turns.</p>
          </div>
        </GlassCard>

        <GlassCard accentColor="#00F0FF" className="mb-6">
          <h2 className="section-title text-white mb-3">Terms You Will See Early</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Singapore property rules have acronyms, but you can treat them like game mechanics. <GlossaryTerm termId="absd" /> and <GlossaryTerm termId="bsd" /> affect upfront cash. <GlossaryTerm termId="mop" /> affects what you can do after buying. <GlossaryTerm termId="tdsr" /> and <GlossaryTerm termId="msr" /> explain why banks may reject an over-stretched deal.
          </p>
        </GlassCard>

        <GlassCard accentColor="#FFD740" className="mb-6">
          <h2 className="section-title text-white mb-3">Realism Note</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Property names, tenant names, listing copy, yields, and floor plans are fictional game data. The sim keeps real Singapore-style geography, policies, and affordability pressure for learning, but it is not affiliated with HDB, URA, CPF Board, MAS, developers, agencies, or listing platforms.
          </p>
        </GlassCard>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/newgame')} className="btn-primary flex items-center justify-center gap-2">
            Start New Game
            <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/leaderboard')} className="btn-secondary">
            View Leaderboard
          </button>
          <button onClick={() => navigate('/learn')} className="btn-secondary">
            Learn the Rules
          </button>
        </div>
      </div>
    </div>
  );
}
