import GuidedFocusPanel from '@/components/GuidedFocusPanel';

export default function BeginnerPrimerPanel({
  onDisableGuidance,
  onOpenLearn,
}: {
  onDisableGuidance: () => void;
  onOpenLearn: () => void;
}) {
  return (
    <GuidedFocusPanel
      eyebrow="Guided mode primer"
      title="Read this dashboard in three steps"
      summary="Start with one objective, one monthly plan, and one reason before you dive into the deeper sim panels."
      bullets={[
        'Read the top objective first. It tells you the one move that matters most this month.',
        'Pick a Life Board move next. That is the clearest place where one click can advance time.',
        'Spendable cash is what you can safely use now. Reserved cash is still yours, but earmarked for repairs and emergencies.',
      ]}
      termIds={['absd', 'cpf-oa', 'mop', 'msr', 'tdsr', 'reserve-cash']}
      actions={
        <>
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
        </>
      }
    />
  );
}
