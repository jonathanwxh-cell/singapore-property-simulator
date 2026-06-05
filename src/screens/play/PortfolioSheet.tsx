import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { properties as catalog } from '@/data/properties';
import { Sheet } from '@/ui/Sheet';
import { Btn } from '@/ui/Button';
import { Money, Delta } from '@/ui/Money';
import { useToast } from '@/ui/Toast';
import { playCoin, playFail } from '@/ui/sound';
import PropertyImage from '@/components/PropertyImage';
import { typeMeta, districtName } from '@/game-ui/property';
import { selectMonthlyRentalIncome } from '@/engine/selectors';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PortfolioSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const toggleRental = useGameStore((s) => s.toggleRental);
  const sellProperty = useGameStore((s) => s.sellProperty);
  const toast = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmSell, setConfirmSell] = useState<number | null>(null);

  const totalValue = useMemo(() => player.properties.reduce((s, p) => s + p.currentValue, 0), [player.properties]);
  const monthlyRent = selectMonthlyRentalIncome(player);

  const sell = (i: number) => {
    const res = sellProperty(i);
    if (res.ok) { playCoin(); toast({ emoji: '💰', tone: 'good', title: 'Sold!', body: 'The sale proceeds landed in your cash.' }); }
    else { playFail(); toast({ emoji: '🚫', tone: 'bad', title: 'Could not sell', body: res.message }); }
    setConfirmSell(null);
    setExpanded(null);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Your places" subtitle={player.properties.length ? `${player.properties.length} owned` : undefined}>
      {player.properties.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-5xl">🏚️</div>
          <p className="mx-auto mt-3 max-w-[16rem] text-sm text-ink-soft">You don't own anything yet. Browse the market and grab your first place — it's the biggest leap of all.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2.5">
            <div className="pl-card p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Portfolio value</div>
              <div className="text-xl font-extrabold text-ink"><Money value={totalValue} compact /></div>
            </div>
            <div className="pl-card p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Rent / month</div>
              <div className="text-xl font-extrabold text-money"><Money value={monthlyRent} /></div>
            </div>
          </div>

          <div className="space-y-2.5">
            {player.properties.map((owned, i) => {
              const listing = catalog.find((p) => p.id === owned.propertyId);
              if (!listing) return null;
              const tm = typeMeta(listing.type);
              const gain = owned.currentValue - owned.purchasePrice;
              const isOpen = expanded === i;
              const mopActive = listing.isHdb && (owned.mopRemainingMonths ?? 0) > 0;
              return (
                <div key={i} className="overflow-hidden rounded-2xl border border-line-2 bg-white">
                  <button onClick={() => { setExpanded(isOpen ? null : i); setConfirmSell(null); }} className="pl-press flex w-full items-center gap-3 p-2.5 text-left">
                    <PropertyImage src={listing.image} alt={listing.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('pl-chip !px-2 !py-0.5 text-[10.5px]', tm.cls)}>{tm.short}</span>
                        {owned.isRented ? <span className="pl-chip !px-2 !py-0.5 bg-money-soft text-money text-[10.5px]">🏠 Rented</span>
                          : mopActive ? <span className="pl-chip !px-2 !py-0.5 bg-gold-soft text-[#B9791E] text-[10.5px]">⏳ MOP</span>
                          : <span className="pl-chip !px-2 !py-0.5 bg-paper-2 text-ink-soft text-[10.5px]">Vacant</span>}
                      </div>
                      <div className="mt-0.5 truncate font-jakarta text-[14px] font-bold text-ink">{listing.name}</div>
                      <div className="text-[11.5px] text-ink-soft">📍 {districtName(listing.districtId)}</div>
                    </div>
                    <div className="text-right">
                      <div className="tabnums font-extrabold text-ink"><Money value={owned.currentValue} compact /></div>
                      <div className="text-[11px]"><Delta value={gain} /></div>
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-line px-3 py-3">
                      <div className="mb-3 grid grid-cols-2 gap-y-1 text-[12.5px]">
                        <span className="text-ink-soft">Bought for</span>
                        <span className="text-right font-semibold text-ink"><Money value={owned.purchasePrice} compact /></span>
                        <span className="text-ink-soft">Yield</span>
                        <span className="text-right font-semibold text-ink">{formatPercent(listing.rentalYield, 1)}</span>
                        {owned.isRented && (<>
                          <span className="text-ink-soft">Rent collected</span>
                          <span className="text-right font-semibold text-money"><Money value={owned.tenant?.contractedRent ?? owned.monthlyRental} />/mo</span>
                        </>)}
                      </div>

                      {confirmSell === i ? (
                        <div className="rounded-xl bg-loss-soft p-3">
                          <div className="text-[13px] font-semibold text-ink">Sell {listing.name} for about <Money value={owned.currentValue} compact />?</div>
                          <div className="mt-2 flex gap-2">
                            <Btn tone="ghost" className="flex-1" onClick={() => setConfirmSell(null)}>Keep it</Btn>
                            <Btn tone="ink" className="flex-1" onClick={() => sell(i)}>Yes, sell</Btn>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {!mopActive && (
                            <Btn tone={owned.isRented ? 'soft' : 'money'} className="flex-1" onClick={() => toggleRental(i)}>
                              {owned.isRented ? 'Stop renting' : '🏠 Rent it out'}
                            </Btn>
                          )}
                          {mopActive && (
                            <div className="flex-1 rounded-xl bg-gold-soft px-3 py-2 text-center text-[12px] font-semibold text-[#8a5a16]">
                              Whole-unit rental locked for {owned.mopRemainingMonths}mo (MOP)
                            </div>
                          )}
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
