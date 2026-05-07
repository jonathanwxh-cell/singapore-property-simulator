import GlassCard from '@/components/GlassCard';
import EligibilityBadge from '@/components/EligibilityBadge';
import { EC_MAX_MONTHLY_INCOME, type EligibilityFlags } from '@/engine/eligibility';
import type { Player } from '@/game/types';
import { formatBuyerProfile } from '../dashboardFormatters';

export default function EligibilitySummaryPanel({
  eligibilityFlags,
  player,
}: {
  eligibilityFlags: EligibilityFlags;
  player: Player;
}) {
  return (
    <GlassCard accentColor="#FF9100">
      <h3 className="section-title mb-2 text-white">Eligibility Summary</h3>
      <div className="flex flex-wrap gap-2">
        {eligibilityFlags.firstTimer && <EligibilityBadge label="First-Timer" tone="good" />}
        {eligibilityFlags.homeowner && <EligibilityBadge label="Homeowner" tone="warn" />}
        {eligibilityFlags.upgrader && <EligibilityBadge label="Upgrader" tone="warn" />}
        {eligibilityFlags.ecEligible && <EligibilityBadge label="EC Eligible" tone="good" />}
        {!eligibilityFlags.ecEligible && player.salary > EC_MAX_MONTHLY_INCOME && (
          <EligibilityBadge label="EC Ceiling Exceeded" tone="blocked" />
        )}
        {player.ownedPrivateHome && <EligibilityBadge label="Private-Home Owner" tone="warn" />}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <p className="text-text-secondary">
          Buyer profile: <span className="font-mono text-white">{formatBuyerProfile(player.buyerProfile)}</span>
        </p>
        <p className="text-text-secondary">
          Monthly salary: <span className="font-mono text-white">S${player.salary.toLocaleString()}</span>
        </p>
        <p className="text-text-secondary">
          EC ceiling: <span className="font-mono text-white">S${EC_MAX_MONTHLY_INCOME.toLocaleString()}</span>
        </p>
        <p className="text-text-secondary">
          {eligibilityFlags.firstTimer
            ? 'You are still on your first-home rung, so HDB and early support listings should feel the cleanest to pursue.'
            : eligibilityFlags.homeowner
              ? 'You have crossed into the upgrader stage. Private condos and larger moves should start feeling more intentional now.'
              : 'You have first-home history but no current residential holding, which keeps the run flexible for a reset or bigger next move.'}
        </p>
      </div>
    </GlassCard>
  );
}

