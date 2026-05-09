interface LifeGoalPanelProps {
  routeLabel: string;
  routeTagline: string;
}

export default function LifeGoalPanel({ routeLabel, routeTagline }: LifeGoalPanelProps) {
  return (
    <section className="rounded-2xl border border-cyan-glow/20 bg-cyan-glow/10 p-4 shadow-[0_20px_60px_rgba(0,240,255,0.08)]">
      <p className="label-text text-[10px] text-cyan-glow">Your Singapore life</p>
      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title text-white">{routeLabel}</h2>
          <p className="mt-1 text-sm text-text-secondary">{routeTagline}</p>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-text-dim">
          This run is still powered by CPF, MOP, taxes, loans, and market cycles. The new goal is to discover what kind of life those choices create.
        </p>
      </div>
    </section>
  );
}
