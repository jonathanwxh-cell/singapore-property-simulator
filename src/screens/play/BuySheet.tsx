import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useGameStore } from '@/game/useGameStore';
import { getListingCatalog } from '@/engine/listings';
import { assessDealReadiness } from '@/engine/decisionCoach';
import { getDownPaymentAmount } from '@/engine/purchase';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT } from '@/engine/constants';
import { Sheet } from '@/ui/Sheet';
import { Verdict } from '@/ui/Verdict';
import { BigButton, Btn } from '@/ui/Button';
import { Money } from '@/ui/Money';
import { useToast } from '@/ui/Toast';
import { fireConfetti } from '@/ui/confetti';
import { playKeys, playFail, playPop } from '@/ui/sound';
import PropertyImage from '@/components/PropertyImage';
import { typeMeta, districtName, districtRegion, verdictFor } from '@/game-ui/property';
import { formatCurrency, formatPercent, formatCompactCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

function downPaymentPct(isHdb: boolean) {
  return isHdb ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT : 25;
}

export function BuySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const buyProperty = useGameStore((s) => s.buyProperty);
  const toast = useToast();

  const ownedIds = useMemo(() => new Set(player.properties.map((p) => p.propertyId)), [player.properties]);
  const catalog = useMemo(
    () => getListingCatalog().filter((p) => p.isAvailable && !ownedIds.has(p.id)),
    [ownedIds],
  );

  const [idx, setIdx] = useState(0);
  const [detail, setDetail] = useState(false);
  const [bought, setBought] = useState<string | null>(null);

  const property = catalog[idx % Math.max(1, catalog.length)];

  const readiness = useMemo(() => {
    if (!property) return null;
    const mode = property.isHdb ? ('hdb-concessionary' as const) : ('bank' as const);
    return assessDealReadiness({
      player,
      property,
      downPaymentPercent: downPaymentPct(property.isHdb),
      useCpfOrdinary: true,
      financingMode: mode,
    });
  }, [player, property]);

  const next = () => { playPop(); setDetail(false); setIdx((i) => (i + 1) % catalog.length); };
  const prev = () => { playPop(); setDetail(false); setIdx((i) => (i - 1 + catalog.length) % catalog.length); };

  const doBuy = () => {
    if (!property || !readiness) return;
    const mode = property.isHdb ? ('hdb-concessionary' as const) : ('bank' as const);
    const downPayment = getDownPaymentAmount(property.price, downPaymentPct(property.isHdb));
    const res = buyProperty(property.id, downPayment, readiness.cpfApplied, mode);
    if (res.ok) {
      playKeys();
      fireConfetti({ count: 130, power: 1.15 });
      setBought(property.name);
      toast({ emoji: '🔑', tone: 'good', title: 'Keys in hand!', body: `${property.name} is yours.` });
    } else {
      playFail();
      toast({ emoji: '🚫', tone: 'bad', title: 'Deal fell through', body: res.message });
    }
  };

  if (!property || !readiness) {
    return (
      <Sheet open={open} onClose={onClose} title="The market">
        <div className="py-10 text-center text-ink-soft">No more listings to browse right now.</div>
      </Sheet>
    );
  }

  const tm = typeMeta(property.type);
  const v = verdictFor(readiness, property.rentalYield);
  const monthlyRentEst = Math.round((property.price * (property.rentalYield / 100)) / 12);

  return (
    <Sheet
      open={open}
      onClose={() => { setBought(null); onClose(); }}
      title="The market"
      subtitle={`${catalog.length} places for sale · swipe to browse`}
    >
      <AnimatePresence mode="wait">
        {bought ? (
          <motion.div
            key="bought"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="text-[64px]">🔑</div>
            <div className="font-display text-2xl font-bold text-ink">It's yours!</div>
            <p className="mx-auto mt-1 max-w-[16rem] text-sm text-ink-soft">
              You're now the proud owner of <b className="text-ink">{bought}</b>. Rent it out from “Your places” to start earning.
            </p>
            <div className="mt-6 space-y-2.5">
              <BigButton tone="coral" onClick={() => { setBought(null); if (catalog.length) setIdx((i) => i % catalog.length); }}>
                Keep browsing
              </BigButton>
              <Btn tone="ghost" full onClick={() => { setBought(null); onClose(); }}>Done</Btn>
            </div>
          </motion.div>
        ) : (
          <motion.div key={property.id + String(detail)} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Card */}
            <div className="overflow-hidden rounded-2xl border border-line-2 bg-white">
              <div className="relative h-40 w-full overflow-hidden">
                <PropertyImage src={property.image} alt={property.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <span className={cn('pl-chip absolute left-3 top-3', tm.cls)}>{tm.emoji} {tm.short}</span>
                <div className="absolute right-3 top-3"><Verdict kind={v.kind} label={v.label} /></div>
                <div className="absolute bottom-2 left-3 right-3 text-white">
                  <div className="font-display text-xl font-bold leading-tight drop-shadow">{property.name}</div>
                  <div className="text-[12px] font-semibold opacity-90">📍 {districtName(property.districtId)} · {districtRegion(property.districtId)}</div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Asking price</div>
                    <div className="text-2xl font-extrabold text-ink"><Money value={property.price} compact /></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Rental yield</div>
                    <div className="tabnums text-lg font-extrabold text-money">{formatPercent(property.rentalYield, 1)}</div>
                    <div className="text-[11px] text-ink-soft">≈ {formatCompactCurrency(monthlyRentEst)}/mo</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] text-ink-soft">
                  <span className="pl-chip bg-paper-2">🛏 {property.bedrooms} bd</span>
                  <span className="pl-chip bg-paper-2">📐 {property.size} sqft</span>
                  <span className="pl-chip bg-paper-2">🚇 {property.nearestMrt}</span>
                  {property.leaseYears < 999 && <span className="pl-chip bg-paper-2">📜 {property.leaseYears}y lease</span>}
                </div>

                {!detail ? (
                  <p className="mt-3 line-clamp-2 text-[13px] leading-snug text-ink-soft">{property.description}</p>
                ) : (
                  <DealStory readiness={readiness} />
                )}
              </div>
            </div>

            {/* Actions */}
            {!detail ? (
              <div className="mt-3 flex items-center gap-2.5">
                <button onClick={prev} className="pl-press grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line-2 bg-white text-ink-soft"><ChevronLeft /></button>
                <Btn tone="ink" className="flex-1" size="lg" onClick={() => { playPop(); setDetail(true); }} icon={<Info size={18} />}>
                  See the numbers
                </Btn>
                <button onClick={next} className="pl-press grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line-2 bg-white text-ink-soft"><ChevronRight /></button>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {readiness.verdict === 'blocked' ? (
                  <div className="rounded-2xl bg-loss-soft px-4 py-3 text-[13px] font-semibold text-loss">
                    🚫 {readiness.headline}
                  </div>
                ) : (
                  <BigButton tone="coral" onClick={doBuy} sub={`${formatCurrency(readiness.cashRequired)} cash needed now`} icon={<span>🔑</span>}>
                    Buy {property.name.split(' ').slice(0, 2).join(' ')}
                  </BigButton>
                )}
                <Btn tone="ghost" full onClick={() => setDetail(false)}>Back to listing</Btn>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

/** The cost-as-a-story panel + a "why these rules?" expander. */
function DealStory({ readiness }: { readiness: ReturnType<typeof assessDealReadiness> }) {
  const [why, setWhy] = useState(false);
  return (
    <div className="mt-3 rounded-2xl bg-paper-2 p-3.5">
      <div className="grid grid-cols-2 gap-y-2 text-[13px]">
        <span className="text-ink-soft">Cash needed now</span>
        <span className="text-right font-bold text-ink"><Money value={readiness.cashRequired} /></span>
        {readiness.cpfApplied > 0 && (<>
          <span className="text-ink-soft">CPF chips in</span>
          <span className="text-right font-bold text-ink"><Money value={readiness.cpfApplied} /></span>
        </>)}
        <span className="text-ink-soft">Monthly mortgage</span>
        <span className="text-right font-bold text-ink"><Money value={readiness.monthlyPayment} />/mo</span>
        <span className="text-ink-soft">Left over each month</span>
        <span className={cn('text-right font-bold', readiness.monthlySurplusAfterDebt >= 0 ? 'text-money' : 'text-loss')}>
          <Money value={readiness.monthlySurplusAfterDebt} />/mo
        </span>
      </div>

      {readiness.warnings.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {readiness.warnings.map((w, i) => (
            <div key={i} className="text-[12px] font-medium text-[#8a5a16]">⚠️ {w}</div>
          ))}
        </div>
      )}

      <button onClick={() => setWhy((x) => !x)} className="mt-2.5 text-[12px] font-bold text-grape underline-offset-2 hover:underline">
        {why ? 'Hide the rules' : 'Why these numbers? (the real rules)'}
      </button>
      {why && (
        <ul className="mt-1.5 space-y-1">
          {readiness.facts.map((f, i) => (
            <li key={i} className="text-[12px] leading-snug text-ink-soft">• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
