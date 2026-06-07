import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useGameStore } from '@/game/useGameStore';
import { properties as catalog } from '@/data/properties';
import { getTenantLeaseOptions } from '@/engine/propertyOperations';
import { getRenovationTemplatesForType, getRenovationQuote } from '@/data/renovations';
import { Sheet } from '@/ui/Sheet';
import { Btn } from '@/ui/Button';
import { Money, Delta } from '@/ui/Money';
import { useToast } from '@/ui/toastContext';
import { playCoin, playFail, playChime } from '@/ui/sound';
import { fireConfetti } from '@/ui/confetti';
import PropertyImage from '@/components/PropertyImage';
import { typeMeta, districtName } from '@/game-ui/property';
import { selectMonthlyRentalIncome } from '@/engine/selectors';
import { formatPercent, formatCompactCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PortfolioSheet({ open, onClose, focusIndex }: { open: boolean; onClose: () => void; focusIndex?: number }) {
  const player = useGameStore((s) => s.player);
  const toggleRental = useGameStore((s) => s.toggleRental);
  const sellProperty = useGameStore((s) => s.sellProperty);
  const startRenovation = useGameStore((s) => s.startRenovation);
  const resolveMaintenanceIssue = useGameStore((s) => s.resolveMaintenanceIssue);
  const applyTenantLeaseDecision = useGameStore((s) => s.applyTenantLeaseDecision);
  const toast = useToast();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmSell, setConfirmSell] = useState<number | null>(null);
  const [renoOpen, setRenoOpen] = useState<number | null>(null);

  useEffect(() => {
    // Focused opens come from the hub action list; sync internal sheet UI to it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && typeof focusIndex === 'number') { setExpanded(focusIndex); setRenoOpen(null); setConfirmSell(null); }
  }, [open, focusIndex]);

  const totalValue = useMemo(() => player.properties.reduce((s, p) => s + p.currentValue, 0), [player.properties]);
  const monthlyRent = selectMonthlyRentalIncome(player);

  const sell = (i: number) => {
    const res = sellProperty(i);
    if (res.ok) { playCoin(); toast({ emoji: '💰', tone: 'good', title: 'Sold!', body: 'The sale proceeds landed in your cash.' }); }
    else { playFail(); toast({ emoji: '🚫', tone: 'bad', title: 'Could not sell', body: res.message }); }
    setConfirmSell(null);
  };

  const renovate = (i: number, templateId: string) => {
    const res = startRenovation(i, templateId, 'standard');
    if (res.ok) { playChime(); fireConfetti({ count: 50, y: 0.5 }); toast({ emoji: '🛠️', tone: 'good', title: 'Renovation started', body: 'Higher rent & value once it wraps.' }); setRenoOpen(null); }
    else { playFail(); toast({ emoji: '🚫', tone: 'bad', title: 'Could not start', body: res.message }); }
  };

  const lease = (i: number, decisionId: 'renew' | 'raise-rent' | 'reset-market' | 'end-lease', label: string) => {
    const res = applyTenantLeaseDecision(i, decisionId);
    if (res.ok) { playChime(); toast({ emoji: '📝', tone: 'good', title: label, body: 'Lease updated.' }); }
    else { playFail(); toast({ emoji: '🚫', tone: 'bad', title: 'Could not update lease', body: res.message }); }
  };

  const fixIssue = (i: number, issueId: string) => {
    const res = resolveMaintenanceIssue(i, issueId, 'proper-repair');
    if (res.ok) { playCoin(); toast({ emoji: '🔧', tone: 'good', title: 'Repaired', body: 'Fixed properly — fewer future headaches.' }); }
    else { playFail(); toast({ emoji: '🚫', tone: 'bad', title: 'Could not repair', body: res.message }); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Your places" subtitle={player.properties.length ? `${player.properties.length} owned` : undefined}>
      {player.properties.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-5xl">🏚️</div>
          <p className="mx-auto mt-3 max-w-[16rem] text-sm text-ink-soft">You don't own anything yet. Browse the market and grab your first place.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2.5">
            <div className="pl-card p-3"><div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Portfolio value</div><div className="text-xl font-extrabold text-ink"><Money value={totalValue} compact /></div></div>
            <div className="pl-card p-3"><div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Rent / month</div><div className="text-xl font-extrabold text-money"><Money value={monthlyRent} /></div></div>
          </div>

          <div className="mb-2 text-center text-[12px] font-semibold text-ink-soft">👇 Tap a place to rent it out, renovate, or sell</div>
          <div className="space-y-2.5">
            {player.properties.map((owned, i) => {
              const listing = catalog.find((p) => p.id === owned.propertyId);
              if (!listing) return null;
              const tm = typeMeta(listing.type);
              const gain = owned.currentValue - owned.purchasePrice;
              const isOpen = expanded === i;
              const mopActive = listing.isHdb && (owned.mopRemainingMonths ?? 0) > 0;
              const issues = owned.openMaintenanceIssues ?? [];
              const leaseExpiring = typeof owned.tenant?.leaseEndTurn === 'number' && owned.tenant.leaseEndTurn - player.turnCount <= 2;
              const leaseOptions = leaseExpiring ? getTenantLeaseOptions(owned, player.turnCount) : [];
              const renoTemplates = getRenovationTemplatesForType(listing.type).filter((t) => !(owned.completedRenovations ?? []).includes(t.category));
              const baselineRent = owned.tenant?.contractedRent ?? owned.monthlyRental ?? Math.round((listing.price * listing.rentalYield / 100) / 12);

              return (
                <div key={i} className="overflow-hidden rounded-2xl border border-line-2 bg-white">
                  <button onClick={() => { setExpanded(isOpen ? null : i); setConfirmSell(null); setRenoOpen(null); }} className="pl-press flex w-full items-center gap-3 p-2.5 text-left">
                    <PropertyImage src={listing.image} alt={listing.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn('pl-chip !px-2 !py-0.5 text-[10.5px]', tm.cls)}>{tm.short}</span>
                        {owned.activeRenovation ? <span className="pl-chip !px-2 !py-0.5 bg-grape/15 text-grape text-[10.5px]">🛠️ Renovating</span>
                          : owned.isRented ? <span className="pl-chip !px-2 !py-0.5 bg-money-soft text-money text-[10.5px]">🏠 Rented</span>
                          : mopActive ? <span className="pl-chip !px-2 !py-0.5 bg-gold-soft text-[#B9791E] text-[10.5px]">⏳ MOP</span>
                          : <span className="pl-chip !px-2 !py-0.5 bg-paper-2 text-ink-soft text-[10.5px]">Vacant</span>}
                        {issues.length > 0 && <span className="pl-chip !px-2 !py-0.5 bg-loss-soft text-loss text-[10.5px]">🔧 {issues.length}</span>}
                      </div>
                      <div className="mt-0.5 truncate font-jakarta text-[14px] font-bold text-ink">{listing.name}</div>
                      <div className="text-[11.5px] text-ink-soft">📍 {districtName(listing.districtId)}</div>
                      {mopActive
                        ? <div className="mt-0.5 text-[11px] font-semibold text-[#B9791E]">🔒 Renting locked during MOP · tap to renovate</div>
                        : owned.activeRenovation
                          ? null
                          : !owned.isRented
                            ? <div className="mt-0.5 text-[11px] font-semibold text-money">💤 Vacant · tap to rent it out</div>
                            : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <div className="tabnums font-extrabold text-ink"><Money value={owned.currentValue} compact /></div>
                        <div className="text-[11px]"><Delta value={gain} /></div>
                      </div>
                      <ChevronDown size={18} className={cn('shrink-0 text-ink-faint transition-transform', isOpen && 'rotate-180')} />
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-line px-3 py-3">
                      <div className="mb-3 grid grid-cols-2 gap-y-1 text-[12.5px]">
                        <span className="text-ink-soft">Bought for</span><span className="text-right font-semibold text-ink"><Money value={owned.purchasePrice} compact /></span>
                        <span className="text-ink-soft">Yield</span><span className="text-right font-semibold text-ink">{formatPercent(listing.rentalYield, 1)}</span>
                        {owned.isRented && (<><span className="text-ink-soft">Rent collected</span><span className="text-right font-semibold text-money"><Money value={baselineRent} />/mo</span></>)}
                      </div>

                      {/* Active renovation status */}
                      {owned.activeRenovation && (
                        <div className="mb-2 rounded-xl bg-grape/10 px-3 py-2 text-[12.5px] font-semibold text-grape">
                          🛠️ {owned.activeRenovation.label} — {owned.activeRenovation.remainingMonths}mo left
                        </div>
                      )}

                      {/* Maintenance issues */}
                      {issues.map((issue) => (
                        <div key={issue.id} className="mb-2 rounded-xl bg-loss-soft p-2.5">
                          <div className="text-[12.5px] font-bold text-ink">🔧 {issue.label ?? 'Repair needed'}</div>
                          <div className="mb-1.5 text-[11.5px] text-ink-soft">Drags rent & value until fixed.</div>
                          <Btn tone="ink" size="sm" full onClick={() => fixIssue(i, issue.id)}>Repair properly · {formatCompactCurrency(issue.estimatedCost)}</Btn>
                        </div>
                      ))}

                      {/* Lease decision */}
                      {leaseExpiring && leaseOptions.length > 0 && (
                        <div className="mb-2 rounded-xl border border-gold/40 bg-gold-soft p-2.5">
                          <div className="mb-1.5 text-[12.5px] font-bold text-[#8a5a16]">📝 Tenant's lease is ending — your call:</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {leaseOptions.map((opt) => (
                              <Btn key={opt.id} tone="soft" size="sm" onClick={() => lease(i, opt.id, opt.label)}>{opt.label}</Btn>
                            ))}
                          </div>
                        </div>
                      )}

                      {confirmSell === i ? (
                        <div className="rounded-xl bg-loss-soft p-3">
                          <div className="text-[13px] font-semibold text-ink">Sell {listing.name} for about <Money value={owned.currentValue} compact />?</div>
                          <div className="mt-2 flex gap-2"><Btn tone="ghost" className="flex-1" onClick={() => setConfirmSell(null)}>Keep it</Btn><Btn tone="ink" className="flex-1" onClick={() => sell(i)}>Yes, sell</Btn></div>
                        </div>
                      ) : renoOpen === i ? (
                        <div className="rounded-xl border border-grape/30 bg-grape/5 p-2.5">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[12.5px] font-bold text-grape">🛠️ Pick an upgrade</span>
                            <button onClick={() => setRenoOpen(null)} className="text-[12px] font-bold text-ink-soft">Cancel</button>
                          </div>
                          <div className="space-y-1.5">
                            {renoTemplates.slice(0, 3).map((t) => {
                              const q = getRenovationQuote(t, 'standard', baselineRent);
                              return (
                                <button key={t.id} onClick={() => renovate(i, t.id)} className="pl-press flex w-full items-center justify-between rounded-xl border border-line-2 bg-white px-3 py-2 text-left">
                                  <div className="min-w-0">
                                    <div className="truncate text-[12.5px] font-bold text-ink">{t.label}</div>
                                    <div className="text-[11px] text-money">+{t.rentUpliftPct}% rent · +{t.resaleUpliftPct}% value</div>
                                  </div>
                                  <span className="tabnums ml-2 shrink-0 text-[12px] font-bold text-ink">{formatCompactCurrency(q.cost)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {!mopActive && (
                            <Btn tone={owned.isRented ? 'soft' : 'money'} className="flex-1" onClick={() => toggleRental(i)}>{owned.isRented ? 'Stop renting' : '🔑 Rent it out'}</Btn>
                          )}
                          {mopActive && (
                            <div className="flex-1 rounded-xl bg-gold-soft px-3 py-2 text-center text-[12px] font-semibold text-[#8a5a16]">You live here · rental locked {owned.mopRemainingMonths}mo — but you can renovate</div>
                          )}
                          {!owned.activeRenovation && renoTemplates.length > 0 && <Btn tone="soft" onClick={() => setRenoOpen(i)}>🛠️ Renovate</Btn>}
                          <Btn tone="ghost" onClick={() => setConfirmSell(i)}>Sell</Btn>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}
