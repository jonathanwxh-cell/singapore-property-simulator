import GlassCard from '@/components/GlassCard';
import { lifeActions } from '@/data/lifeActions';
import { useGameStore } from '@/game/useGameStore';
import { canTakeSecondaryAction } from '@/engine/life';
import { getListingCatalog } from '@/engine/listings';
import { getDownPaymentAmount, validatePurchase } from '@/engine/purchase';
import { selectAffordabilityReport, selectMonthlyNetCashflow, selectPotentialHousingGrant } from '@/engine/selectors';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { formatCurrency } from '@/lib/format';
import { BatteryCharging, BriefcaseBusiness, Flame, House, Sparkles } from 'lucide-react';

const arrangementOptions = [
  { value: 'with-parents', label: 'Live with Parents', hint: 'Lower cash burn, more shared obligations.' },
  { value: 'renting-room', label: 'Rent a Room', hint: 'Moderate independence cost.' },
  { value: 'renting-flat', label: 'Rent a Flat', hint: 'Highest monthly cash pressure.' },
] as const;

export default function Life() {
  const {
    player,
    setPrimaryLifeAction,
    setSecondaryLifeAction,
    setLivingArrangement,
    nextTurn,
    currentScenario,
  } = useGameStore();

  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const canTakeSecondAction = canTakeSecondaryAction(player.life);
  const selectedPrimaryActionId = player.life.selectedPrimaryActionId ?? 'focus-at-work';
  const cheapestListing = [...getListingCatalog()].sort((a, b) => a.price - b.price)[0];
  const defaultDownPayment = getDownPaymentAmount(cheapestListing.price, 25);
  const purchaseValidation = validatePurchase(player, cheapestListing, defaultDownPayment);
  const grantSupport = cheapestListing.isHdb ? selectPotentialHousingGrant(player) : 0;
  const affordability = selectAffordabilityReport(
    player,
    purchaseValidation.totalUpfront,
    monthlySurplus,
    grantSupport,
  );

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title text-white">Life Planning</h1>
          <p className="text-text-secondary mt-1 font-rajdhani">
            Shape the month before the market shapes you. Build income, manage stress, and plan your first move into property.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <LifeStatCard icon={BatteryCharging} label="Energy" value={`${player.life.energy}/100`} color="#00F0FF" />
          <LifeStatCard icon={Flame} label="Stress" value={`${player.life.stress}/100`} color="#FF1744" />
          <LifeStatCard icon={Sparkles} label="Reputation" value={`${player.life.reputation}/100`} color="#FFD740" />
          <LifeStatCard icon={BriefcaseBusiness} label="Momentum" value={`${player.life.careerMomentum}`} color="#7C4DFF" />
          <LifeStatCard icon={House} label="Household Load" value={formatCurrency(player.life.householdLoad)} color="#00E676" />
        </div>

        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <GlassCard accentColor="#00F0FF">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="section-title text-white mb-1">Living Arrangement</h3>
                  <p className="text-text-secondary text-sm">Your housing setup changes monthly pressure before you even touch a mortgage.</p>
                </div>
                <select
                  value={player.life.livingArrangement}
                  onChange={(event) => setLivingArrangement(event.target.value as typeof arrangementOptions[number]['value'])}
                  className="bg-void-navy border border-glass-border rounded-input px-4 py-2.5 text-sm text-white focus:border-cyan-glow focus:outline-none"
                >
                  {arrangementOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-4">
                {arrangementOptions.map((option) => {
                  const selected = option.value === player.life.livingArrangement;
                  return (
                    <div
                      key={option.value}
                      className={`rounded-lg border px-4 py-3 ${selected ? 'border-cyan-glow/60 bg-cyan-glow/10' : 'border-glass-border bg-white/5'}`}
                    >
                      <p className={`font-rajdhani font-semibold ${selected ? 'text-cyan-glow' : 'text-white'}`}>{option.label}</p>
                      <p className="text-text-secondary text-xs mt-1">{option.hint}</p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard accentColor="#FFD740">
              <h3 className="section-title text-white mb-2">Primary Action</h3>
              <p className="text-text-secondary text-sm mb-4">Pick the main way you want to spend this month. If you skip planning, the game defaults to Focus at Work.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {lifeActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setPrimaryLifeAction(action.id)}
                    className={`text-left rounded-xl border px-4 py-4 transition-all ${
                      selectedPrimaryActionId === action.id
                        ? 'border-cyan-glow/60 bg-cyan-glow/10'
                        : 'border-glass-border bg-white/5 hover:border-cyan-glow/40 hover:bg-cyan-glow/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`font-rajdhani font-semibold ${selectedPrimaryActionId === action.id ? 'text-cyan-glow' : 'text-white'}`}>{action.label}</p>
                      <span className="text-[10px] font-mono uppercase" style={{ color: action.accent }}>{action.category}</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-2 leading-relaxed">{action.description}</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard accentColor="#7C4DFF">
              <h3 className="section-title text-white mb-2">Secondary Action</h3>
              {canTakeSecondAction ? (
                <>
                  <p className="text-text-secondary text-sm mb-4">Energy and stress are healthy enough for one extra push this month.</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {lifeActions.map((action) => (
                      <button
                        key={`secondary-${action.id}`}
                        onClick={() => setSecondaryLifeAction(player.life.selectedSecondaryActionId === action.id ? null : action.id)}
                        className={`text-left rounded-xl border px-4 py-4 transition-all ${
                          player.life.selectedSecondaryActionId === action.id
                            ? 'border-purple-glow/60 bg-purple-glow/10'
                            : 'border-glass-border bg-white/5 hover:border-purple-glow/40 hover:bg-purple-glow/5'
                        }`}
                      >
                        <p className={`font-rajdhani font-semibold ${player.life.selectedSecondaryActionId === action.id ? 'text-purple-glow' : 'text-white'}`}>{action.label}</p>
                        <p className="text-text-secondary text-xs mt-2 leading-relaxed">{action.description}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-glass-border bg-white/5 px-4 py-4">
                  <p className="text-white font-rajdhani font-semibold">Not available this month</p>
                  <p className="text-text-secondary text-sm mt-1">
                    Secondary actions unlock once energy reaches at least 70 and stress stays at or below 30.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard accentColor="#00E676">
              <h3 className="section-title text-white mb-4">Monthly Snapshot</h3>
              <div className="space-y-3">
                <SnapshotRow label="Current monthly surplus" value={formatCurrency(monthlySurplus)} positive={monthlySurplus >= 0} />
                <SnapshotRow label="Primary action" value={lifeActions.find((action) => action.id === selectedPrimaryActionId)?.label ?? 'Focus at Work'} />
                <SnapshotRow label="Secondary action" value={player.life.selectedSecondaryActionId ? lifeActions.find((action) => action.id === player.life.selectedSecondaryActionId)?.label ?? 'None' : 'None'} />
                <SnapshotRow label="Training progress" value={player.life.trainingTrackId ? `${player.life.trainingMonthsRemaining} month(s) remaining` : 'No active course'} />
              </div>
            </GlassCard>

            <GlassCard accentColor="#FF9100">
              <h3 className="section-title text-white mb-4">Scheme Progress</h3>
              <div className="space-y-4">
                <ProgressLine label="SkillsFuture-style momentum" value={player.life.schemeProgress.skillsFuture} max={100} />
                <ProgressLine label="First-home grant planning" value={player.life.schemeProgress.firstTimerGrant} max={50} />
                <ProgressLine label="Household support relief" value={player.life.schemeProgress.householdSupport} max={100} />
                <p className="text-text-secondary text-xs">
                  Current potential first-home support: {formatCurrency(grantSupport)}
                </p>
              </div>
            </GlassCard>

            <GlassCard accentColor="#FFD740">
              <h3 className="section-title text-white mb-4">Closest Property Path</h3>
              <p className="text-white font-rajdhani font-semibold">{cheapestListing.name}</p>
              <p className="text-text-secondary text-sm mt-1">
                Target upfront: {formatCurrency(purchaseValidation.totalUpfront)} | Cash shortfall: {formatCurrency(affordability.shortfall)}
              </p>
              <p className="text-text-secondary text-sm mt-3">
                {affordability.monthsAtCurrentPace === null
                  ? 'Your monthly surplus is too tight right now to project a realistic buying timeline.'
                  : affordability.monthsAtCurrentPace === 0
                    ? 'You can already fund the upfront cost for this listing.'
                    : `At your current pace, this listing is about ${affordability.monthsAtCurrentPace} months away.`}
              </p>
              <p className="text-text-dim text-xs mt-3">
                Best accelerators: Side Gig for cash, Property Hustle for referrals, and Plan Schemes for first-home support.
              </p>
            </GlassCard>

            <GlassCard accentColor="#2979FF">
              <h3 className="section-title text-white mb-4">Last Month</h3>
              {player.life.lastMonthSummary ? (
                <div className="space-y-3">
                  <SnapshotRow label="Primary action" value={lifeActions.find((action) => action.id === player.life.lastMonthSummary?.primaryActionId)?.label ?? player.life.lastMonthSummary.primaryActionId} />
                  <SnapshotRow label="Cash delta" value={formatCurrency(player.life.lastMonthSummary.cashDelta)} positive={player.life.lastMonthSummary.cashDelta >= 0} />
                  <SnapshotRow label="Stress delta" value={`${player.life.lastMonthSummary.stressDelta >= 0 ? '+' : ''}${player.life.lastMonthSummary.stressDelta}`} positive={player.life.lastMonthSummary.stressDelta <= 0} />
                  <div className="space-y-2 pt-1">
                    {player.life.lastMonthSummary.notes.map((note) => (
                      <p key={note} className="text-text-secondary text-xs leading-relaxed">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No life-month summary yet. Advance a month after planning to see how the new loop resolves.</p>
              )}
            </GlassCard>

            <button
              onClick={nextTurn}
              disabled={Boolean(currentScenario)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Advance Month
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LifeStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} style={{ color }} />
        <span className="label-text text-text-dim text-[10px]">{label}</span>
      </div>
      <p className="font-mono text-xl font-bold text-white">{value}</p>
    </GlassCard>
  );
}

function SnapshotRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className={`font-mono text-sm ${positive === undefined ? 'text-white' : positive ? 'text-success' : 'text-warning'}`}>{value}</span>
    </div>
  );
}

function ProgressLine({ label, value, max }: { label: string; value: number; max: number }) {
  const safeValue = Math.max(0, Math.min(max, value));
  const percent = (safeValue / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-white">{safeValue}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-cyan-glow" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
