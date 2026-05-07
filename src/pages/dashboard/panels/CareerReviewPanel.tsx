import GlassCard from '@/components/GlassCard';
import type { CareerReviewHistoryEntry } from '@/game/types';
import { CareerMetric } from '../DashboardComponents';
import { formatCareerOutcome, formatSignedCurrency } from '../dashboardFormatters';

export default function CareerReviewPanel({
  latestCareerReview,
  nextJobSwitchIn,
}: {
  latestCareerReview: CareerReviewHistoryEntry | null;
  nextJobSwitchIn: number;
}) {
  return (
    <GlassCard accentColor="#FFD740">
      <div className="grid gap-4 md:grid-cols-[220px,1fr]">
        <img
          src="/career-review-key-art.png"
          alt="Career Review"
          className="h-44 w-full rounded-xl object-cover opacity-90"
        />
        <div>
          <h3 className="section-title mb-2 text-white">Career Review</h3>
          {latestCareerReview ? (
            <>
              <p className="font-medium text-white">{formatCareerOutcome(latestCareerReview.outcome)}</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your latest annual review has already rolled into salary and buying power.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <CareerMetric label="Salary Delta" value={formatSignedCurrency(latestCareerReview.salaryDelta)} tone={latestCareerReview.salaryDelta >= 0 ? 'good' : 'blocked'} />
                <CareerMetric label="Bonus" value={latestCareerReview.bonus > 0 ? `S$${latestCareerReview.bonus.toLocaleString()}` : 'None'} tone={latestCareerReview.bonus > 0 ? 'good' : 'warn'} />
                <CareerMetric label="Review Turn" value={String(latestCareerReview.turn)} tone="warn" />
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-white">First annual review pending</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your first formal review arrives on turn 12. Salary growth and job-switch choices then become part of the housing climb.
              </p>
            </>
          )}
          <p className="mt-4 text-xs text-text-dim">
            Next job-switch window in <span className="font-mono text-white">{nextJobSwitchIn}</span> turns.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
