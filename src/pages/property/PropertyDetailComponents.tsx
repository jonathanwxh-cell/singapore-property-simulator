// Pure presentational components used by PropertyDetail.tsx. No data
// fetching, no derived game state — these accept already-computed values
// as props. Helpers without JSX live in propertyDetailFormatters.ts.
import type React from 'react';
import { formatCurrency } from '@/lib/format';
import type { TenantLeaseDecisionId } from '@/game/types';
import type { TenantLeaseOption } from '@/engine/propertyOperations';
import {
  formatSignedCurrency,
  formatSignedNumber,
  leaseOptionToneClass,
} from './propertyDetailFormatters';

export function LeaseOptionButton({
  option,
  onSelect,
}: {
  option: TenantLeaseOption;
  onSelect: (decisionId: TenantLeaseDecisionId) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`text-left rounded-xl border p-3 transition-colors hover:border-cyan-glow/60 ${leaseOptionToneClass(option.tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-semibold text-sm">{option.label}</p>
          <p className="text-text-secondary text-xs mt-1 leading-relaxed">{option.detail}</p>
        </div>
        <span className="font-mono text-[11px] text-cyan-glow shrink-0">
          {option.projectedRent > 0 ? formatCurrency(option.projectedRent) : 'Vacate'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <OperationMetric label="Rent" value={formatSignedCurrency(option.rentDelta)} />
        <OperationMetric label="Happy" value={formatSignedNumber(option.satisfactionDelta)} />
        <OperationMetric label="Vacancy" value={formatSignedNumber(option.vacancyRiskDelta)} />
      </div>
    </button>
  );
}

export function OperationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <p className="label-text text-text-dim text-[9px]">{label}</p>
      <p className="font-mono text-white text-xs mt-0.5">{value}</p>
    </div>
  );
}

export function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-white/5">
      <Icon size={18} className="text-cyan-glow mx-auto mb-1" />
      <p className="label-text text-text-dim text-[10px] mb-0.5">{label}</p>
      <p className="font-mono text-white text-sm">{value}</p>
    </div>
  );
}
