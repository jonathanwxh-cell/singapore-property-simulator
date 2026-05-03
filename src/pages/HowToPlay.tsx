import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Landmark, Sparkles, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/GlassCard';

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

        <div className="mb-8">
          <h1 className="page-title text-white mb-2">How to Play</h1>
          <p className="text-text-secondary max-w-2xl">
            Build a Singapore property empire by balancing cashflow, leverage, CPF, and timing. Every month can bring better grants, harsher rates, or a market swing you can exploit.
          </p>
        </div>

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
            <p>3. Browse the cheapest HDB and entry-level listings first. Use CPF OA where it is allowed to reduce cash strain.</p>
            <p>4. Check the monthly market headline before buying. Rising rates can punish leverage, while supply squeezes can reward patience.</p>
            <p>5. Once you own property, manage rent, loans, and timing rather than mindlessly advancing turns.</p>
          </div>
        </GlassCard>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/newgame')} className="btn-primary flex items-center justify-center gap-2">
            Start New Game
            <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/leaderboard')} className="btn-secondary">
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
