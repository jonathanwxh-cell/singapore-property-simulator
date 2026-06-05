import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { getListingCatalog } from '@/engine/listings';
import { assessDealReadiness } from '@/engine/decisionCoach';
import { selectPotentialHousingGrant } from '@/engine/selectors';
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
import { typeMeta, districtName, verdictFor } from '@/game-ui/property';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

const pct = (isHdb: boolean) => (isHdb ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT : 25);
type SortKey = 'match' | 'yield' | 'price' | 'cash';

export function BuySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const buyProperty = useGameStore((s) => s.buyProperty);
  const toast = useToast();

  const ownedIds = useMemo(() => new Set(player.properties.map((p) => p.propertyId)), [player.properties]);

  const rows = useMemo(() => {
    return getListingCatalog()
      .filter((p) => p.isAvailable && !ownedIds.has(p.id))
      .map((p) => {
        const mode = p.isHdb ? ('hdb-concessionary' as const) : ('bank' as const);
        const readiness = assessDealReadiness({ player, property: p, downPaymentPercent: pct(p.isHdb), useCpfOrdinary: true, financingMode: mode });
        return { p, readiness, v: verdictFor(readiness, p.rentalYield) };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, ownedIds]);

  const [sort, setSort] = useState<SortKey>('match');
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const score = { steal: 0, comfortable: 1, stretch: 2, blocked: 3 };
    let list = rows;
    if (affordableOnly) list = list.filter((r) => r.readiness.verdict !== 'blocked');
    const arr = [...list];
    arr.sort((a, b) => {
      if (sort === 'yield') return b.p.rentalYield - a.p.rentalYield;
      if (sort === 'price') return a.p.price - b.p.price;
      if (sort === 'cash') return a.readiness.cashRequired - b.readiness.cashRequired;
      return score[a.v.kind] - score[b.v.kind] || a.readiness.cashRequired - b.readiness.cashRequired;
    });
    return arr.slice(0, 40);
  }, [rows, sort, affordableOnly]);

  const doBuy = (propertyId: string) => {
    const row = rows.find((r) => r.p.id === propertyId);
    if (!row) return;
    const mode = row.p.isHdb ? ('hdb-concessionary' as const) : ('bank' as const);
    const downPayment = getDownPaymentAmount(row.p.price, pct(row.p.isHdb));
    const res = buyProperty(row.p.id, downPayment, row.readiness.cpfApplied, mode);
    if (res.ok) {
      playKeys();
      fireConfetti({ count: 130, power: 1.15 });
      setBought(row.p.name);
      toast({ emoji: '🔑', tone: 'good', title: 'Keys in hand!', body: `${row.p.name} is yours.` });
    } else {
      playFail();
      toast({ emoji: '🚫', tone: 'bad', title: 'Deal fell through', body: res.message });
    }
  };

  const SortChip = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => { playPop(); setSort(k); }}
      aria-pressed={sort === k}
      className={cn('pl-press rounded-full px-3 py-1.5 text-[12px] font-bold', sort === k ? 'bg-ink text-white' : 'bg-paper-2 text-ink-soft')}
    >
      {label}
    </button>
  );

  return (
    <Sheet
      open={open}
      onClose={() => { setBought(null); setExpanded(null); onClose(); }}
      title="The market"
      subtitle={bought ? undefined : `${rows.length} places for sale`}
    >
      <AnimatePresence mode="wait">
        {bought ? (
          <motion.div key="bought" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <div className="text-[64px]">🔑</div>
            <div className="font-display text-2xl font-bold text-ink">It's yours!</div>
            <p className="mx-auto mt-1 max-w-[16rem] text-sm text-ink-soft">You now own <b className="text-ink">{bought}</b>. Rent it out from “Your places” to start earning.</p>
            <div className="mt-6 space-y-2.5">
              <BigButton tone="coral" onClick={() => setBought(null)}>Keep browsing</BigButton>
              <Btn tone="ghost" full onClick={() => { setBought(null); onClose(); }}>Done</Btn>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Sort / filter controls */}
            <div className="sticky top-0 z-10 -mx-1 mb-2 flex flex-wrap items-center gap-1.5 bg-paper/95 px-1 py-1 backdrop-blur">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Sort</span>
              <SortChip k="match" label="Best fit" />
              <SortChip k="yield" label="Yield" />
              <SortChip k="price" label="Cheapest" />
              <SortChip k="cash" label="Least cash" />
              <button
                onClick={() => { playPop(); setAffordableOnly((x) => !x); }}
                aria-pressed={affordableOnly}
                className={cn('pl-press ml-auto rounded-full px-3 py-1.5 text-[12px] font-bold', affordableOnly ? 'bg-money text-white' : 'bg-paper-2 text-ink-soft')}
              >
                {affordableOnly ? '✓ Can afford' : 'Can afford'}
              </button>
            </div>

            <div className="space-y-2.5">
              {sorted.map((row) => {
                const { p, readiness, v } = row;
                const tm = typeMeta(p.type);
                const isOpen = expanded === p.id;
                const blocked = readiness.verdict === 'blocked';
                return (
                  <div key={p.id} className="overflow-hidden rounded-2xl border border-line-2 bg-white">
                    <div className="flex gap-3 p-2.5">
                      <PropertyImage src={p.image} alt={p.name} className="h-[64px] w-[64px] shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-jakarta text-[14px] font-bold text-ink">{p.name}</div>
                            <div className="truncate text-[11.5px] text-ink-soft">📍 {districtName(p.districtId)}</div>
                          </div>
                          <Verdict kind={v.kind} label={v.label} />
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="tabnums text-[13px] font-extrabold text-ink"><Money value={p.price} compact /></span>
                          <span className="tabnums text-[12px] font-bold text-money">{formatPercent(p.rentalYield, 1)} yield</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t border-line px-2.5 py-2">
                      <span className={cn('pl-chip !px-2 !py-0.5 text-[10.5px]', tm.cls)}>{tm.short}</span>
                      {!blocked && <span className="text-[12px] font-semibold text-ink-soft">Cash now <b className="text-ink"><Money value={readiness.cashRequired} compact /></b></span>}
                      <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => { playPop(); setExpanded(isOpen ? null : p.id); }} className="pl-press text-[12px] font-bold text-grape">
                          {isOpen ? 'Hide' : 'Details'}
                        </button>
                        {!blocked && <Btn tone="coral" size="sm" onClick={() => doBuy(p.id)}>Buy</Btn>}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-line px-3 py-3">
                        {blocked && <div className="mb-2 rounded-xl bg-loss-soft px-3 py-2 text-[12.5px] font-semibold text-loss">🚫 {readiness.headline}</div>}
                        <DealStory readiness={readiness} property={p} grant={p.isHdb ? selectPotentialHousingGrant(player) : 0} />
                        {!blocked && (
                          <div className="mt-3">
                            <BigButton tone="coral" onClick={() => doBuy(p.id)} sub={`${formatCurrency(readiness.cashRequired)} cash needed now`} icon={<span>🔑</span>}>
                              Buy {p.name.split(' ').slice(0, 2).join(' ')}
                            </BigButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {rows.length > 40 && <div className="py-2 text-center text-[12px] text-ink-faint">Showing the top 40 — use sort to find more.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

const JARGON: Record<string, string> = {
  CPF: 'CPF: forced savings from your salary. Your Ordinary Account can help pay for a home and earns interest you keep.',
  ABSD: "ABSD: extra stamp-duty tax on your 2nd, 3rd+ property — much higher for foreigners. It's what stops endless flipping.",
  TDSR: "TDSR: the bank caps ALL your debt repayments at 55% of income. Borrow past it and the bank says no.",
  MOP: 'MOP: you must live in a new HDB flat ~5 years before you can rent the whole unit or sell it.',
};

function DealStory({ readiness, property, grant }: { readiness: ReturnType<typeof assessDealReadiness>; property: { bedrooms: number; size: number; nearestMrt: string }; grant: number }) {
  const [why, setWhy] = useState(false);
  const toast = useToast();
  const explain = (term: string) => { playPop(); toast({ emoji: '📖', tone: 'neutral', title: term, body: JARGON[term] }); };
  return (
    <div className="rounded-2xl bg-paper-2 p-3.5">
      <div className="mb-2 flex flex-wrap gap-1.5 text-[11.5px] text-ink-soft">
        <span className="pl-chip bg-white">🛏 {property.bedrooms} bd</span>
        <span className="pl-chip bg-white">📐 {property.size} sqft</span>
        <span className="pl-chip bg-white">🚇 {property.nearestMrt}</span>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-[13px]">
        <span className="text-ink-soft">Cash needed now</span><span className="text-right font-bold text-ink"><Money value={readiness.cashRequired} /></span>
        {readiness.cpfApplied > 0 && (<><span className="text-ink-soft">CPF chips in</span><span className="text-right font-bold text-ink"><Money value={readiness.cpfApplied} /></span></>)}
        {grant > 0 && (<><span className="text-money">🎁 First-timer grant</span><span className="text-right font-bold text-money">up to <Money value={grant} /></span></>)}
        <span className="text-ink-soft">Monthly mortgage</span><span className="text-right font-bold text-ink"><Money value={readiness.monthlyPayment} />/mo</span>
        <span className="text-ink-soft">Left over each month</span>
        <span className={cn('text-right font-bold', readiness.monthlySurplusAfterDebt >= 0 ? 'text-money' : 'text-loss')}><Money value={readiness.monthlySurplusAfterDebt} />/mo</span>
      </div>
      {readiness.warnings.length > 0 && (
        <div className="mt-2 space-y-1">{readiness.warnings.map((w, i) => <div key={i} className="text-[12px] font-medium text-[#8a5a16]">⚠️ {w}</div>)}</div>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-ink-faint">Tap to learn:</span>
        {Object.keys(JARGON).map((t) => (
          <button key={t} onClick={() => explain(t)} className="pl-press rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-grape">{t}</button>
        ))}
      </div>
      <button onClick={() => setWhy((x) => !x)} className="mt-2 text-[12px] font-bold text-grape">{why ? 'Hide the rules' : 'Why these numbers? (the real rules)'}</button>
      {why && <ul className="mt-1.5 space-y-1">{readiness.facts.map((f, i) => <li key={i} className="text-[12px] leading-snug text-ink-soft">• {f}</li>)}</ul>}
    </div>
  );
}
