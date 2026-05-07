import { FastForward } from 'lucide-react';
import GlassCard from '@/components/GlassCard';

export default function MopCountdownPanel({
  propertyName,
  monthsRemaining,
  onOpenProperty,
  onPlanLife,
  onBlitz,
}: {
  propertyName: string;
  monthsRemaining: number;
  onOpenProperty: () => void;
  onPlanLife: () => void;
  onBlitz: () => void;
}) {
  const elapsedMonths = Math.max(0, 60 - monthsRemaining);
  const progressPct = Math.min(100, Math.round((elapsedMonths / 60) * 100));

  return (
    <GlassCard accentColor="#FFD740">
      <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-warning">MOP Countdown</p>
          <h3 className="section-title text-white">{propertyName}: {monthsRemaining} months left</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            The HDB path should not feel like dead time. Use room rental, life-income moves, or blitz quiet months until the next decision point appears.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-warning" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[32rem]">
          <button type="button" onClick={onOpenProperty} className="btn-primary py-3 text-sm">
            Start Room Rental
          </button>
          <button type="button" onClick={onPlanLife} className="btn-secondary py-3 text-sm">
            Plan Side Income
          </button>
          <button type="button" onClick={onBlitz} className="btn-secondary py-3 text-sm">
            <span className="inline-flex items-center justify-center gap-2">
              <FastForward size={15} />
              Blitz 3 Months
            </span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
