import GlassCard from '@/components/GlassCard';

export default function BeginnerAdvancedGate({
  onShow,
  onLearn,
}: {
  onShow: () => void;
  onLearn: () => void;
}) {
  return (
    <GlassCard accentColor="#7C4DFF">
      <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-text-dim">Beginner focus mode</p>
          <h3 className="section-title text-white">Advanced sim panels are tucked away for the first few turns</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Start with the command objective, monthly intent, and Buy/Life tabs. Career review, eligibility, cashflow detail, route analytics, glossary, and mini portfolio are still one tap away.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:min-w-[20rem] md:grid-cols-1">
          <button type="button" onClick={onShow} className="btn-secondary min-h-11 px-4 py-3 text-sm">
            Open advanced sim panels
          </button>
          <button type="button" onClick={onLearn} className="rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-3 font-rajdhani text-sm font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/20">
            Learn the rules first
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
