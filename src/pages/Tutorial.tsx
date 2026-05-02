import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, Building2, CalendarClock, Landmark, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: Building2,
    title: 'Buy Your First Property',
    body: 'Start with an HDB or smaller OCR property. Use CPF OA for the down payment when available, but keep enough cash for stamp duties and shocks.',
  },
  {
    icon: Landmark,
    title: 'Respect Loan Rules',
    body: 'LTV limits cap how much you can borrow. HDB and EC purchases also check MSR, while every loan checks TDSR and credit score.',
  },
  {
    icon: CalendarClock,
    title: 'Advance Month by Month',
    body: 'Each turn pays salary, CPF, rent, mortgage instalments, interest changes, and possible scenario events.',
  },
  {
    icon: TrendingUp,
    title: 'Win by Building Net Worth',
    body: 'Rent properties, watch cash flow, refinance or repay when rates bite, and sell only when sale costs still leave a real gain.',
  },
];

export default function Tutorial() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase tracking-wider">Back</span>
        </button>

        <h1 className="page-title text-white mb-2">How to Play</h1>
        <p className="text-text-secondary mb-6">
          Property Tycoon is a monthly Singapore property investing sim. The loop is simple: earn, buy carefully, rent out assets, survive debt, and compound net worth.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {steps.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title}>
              <Icon size={22} className="text-cyan-glow mb-3" />
              <h2 className="section-title text-white text-base mb-2">{title}</h2>
              <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard accentColor="#00E676">
          <h2 className="section-title text-white text-base mb-3">Quick Controls</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Rule label="Properties" value="Browse and buy available homes or commercial assets." />
            <Rule label="Portfolio" value="Rent out, sell, and monitor owned properties." />
            <Rule label="Bank" value="Review CPF balances, active loans, and credit risk." />
            <Rule label="Market" value="Track price, rental, volatility, and live mortgage rates." />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-glass-border bg-white/5 p-3">
      <p className="font-rajdhani text-cyan-glow text-xs uppercase tracking-wider">{label}</p>
      <p className="text-text-secondary mt-1">{value}</p>
    </div>
  );
}
