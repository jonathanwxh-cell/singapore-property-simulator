import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';

export default function BeginnerPrimerPanel({
  onDisableGuidance,
  onOpenLearn,
}: {
  onDisableGuidance: () => void;
  onOpenLearn: () => void;
}) {
  return (
    <GlassCard accentColor="#00F0FF">
      <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-cyan-glow">Guided mode primer</p>
          <h3 className="section-title text-white">Quick Singapore glossary before your first 3 moves</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Tap these terms once to get one-line definitions and why they matter.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <GlossaryTerm termId="absd" />
            <GlossaryTerm termId="cpf-oa" />
            <GlossaryTerm termId="mop" />
            <GlossaryTerm termId="msr" />
            <GlossaryTerm termId="tdsr" />
            <GlossaryTerm termId="reserve-cash" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenLearn}
            className="btn-secondary px-4 py-3 text-xs sm:min-w-48"
          >
            Learn in depth
          </button>
          <button
            type="button"
            onClick={onDisableGuidance}
            className="rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-3 font-rajdhani text-xs font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/20"
          >
            Turn off guided mode
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
