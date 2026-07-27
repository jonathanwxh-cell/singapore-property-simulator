import { maintenanceTemplates, repairChoices, type RepairChoiceId } from '@/data/maintenanceEvents';
import type { MaintenanceIssue, OwnedProperty, Player } from '@/game/types';
import type { ActionResult } from './results';
import { fail, ok } from './results';
import { roundMoney } from '@/lib/format';
import { clamp, normalizeOperationProperty, withOperationLog } from './operationsShared';
import { createDefaultReserve } from './reserveOperations';
import { DEFAULT_CONDITION_SCORE } from './constants';
import { appendLifeMemory } from './lifetime/memories';

export function resolveMaintenanceIssuePure(
  player: Player,
  propertyIndex: number,
  issueId: string,
  choiceId: RepairChoiceId,
): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const property = normalizeOperationProperty(player.properties[propertyIndex]);
  const issue = (property.openMaintenanceIssues ?? []).find((candidate) => candidate.id === issueId);
  const choice = repairChoices[choiceId];
  if (!issue) return fail('maintenance_not_found', 'Maintenance issue not found.');
  if (!choice) return fail('repair_choice_not_found', 'Repair option not found.');

  const cost = Math.round(issue.estimatedCost * choice.costMultiplier);
  if (player.cash < cost) return fail('insufficient_cash', 'Not enough cash to resolve this maintenance issue.');

  const reserve = player.reserve ?? createDefaultReserve();
  const reserveDraw = Math.min(reserve.allocatedCash, cost);
  const tenant = property.tenant
    ? {
        ...property.tenant,
        satisfaction: clamp(property.tenant.satisfaction + choice.satisfactionDelta - issue.satisfactionImpact * 0.1, 0, 100),
        renewalIntent: clamp(property.tenant.renewalIntent + choice.satisfactionDelta, 0, 100),
      }
    : undefined;
  const recurrenceRiskPct = clamp(issue.recurrenceRiskPct + choice.recurrenceDeltaPct, 0, 100);
  const recurrenceRoll = (
    player.turnCount * 31
    + propertyIndex * 17
    + issue.id.length * 13
  ) % 100;
  const recurs = recurrenceRoll < recurrenceRiskPct;
  const remainingIssues = (property.openMaintenanceIssues ?? []).filter((candidate) => candidate.id !== issueId);
  if (recurs) {
    remainingIssues.push({
      ...issue,
      id: `${issue.id}_recur_${player.turnCount}`,
      label: `${issue.label ?? issue.category} recurrence`,
      estimatedCost: Math.round(issue.estimatedCost * 0.65),
      recurrenceRiskPct: Math.max(0, recurrenceRiskPct - 5),
      status: 'open',
    });
  }

  const updatedProperties = [...player.properties];
  updatedProperties[propertyIndex] = {
    ...property,
    tenant,
    conditionScore: clamp((property.conditionScore ?? DEFAULT_CONDITION_SCORE) + choice.conditionDelta, 0, 100),
    openMaintenanceIssues: remainingIssues,
  };

  let updatedPlayer = withOperationLog({
    ...player,
    cash: roundMoney(player.cash - cost),
    reserve: {
      ...reserve,
      allocatedCash: roundMoney(reserve.allocatedCash - reserveDraw),
      lastCoveredCost: reserveDraw > 0 ? reserveDraw : reserve.lastCoveredCost,
    },
    properties: updatedProperties,
  }, {
    propertyId: property.propertyId,
    title: `${choice.label} completed`,
    detail: recurs
      ? `S$${cost.toLocaleString()} repair paid, but the ${recurrenceRiskPct}% recurrence risk materialised and follow-up work is still open.`
      : reserveDraw > 0
      ? `S$${cost.toLocaleString()} repair paid, with S$${reserveDraw.toLocaleString()} covered by reserve.`
    : `S$${cost.toLocaleString()} repair paid from cash.`,
    tone: choiceId === 'cheap-fix' ? 'warn' : 'good',
  });
  updatedPlayer = appendLifeMemory(updatedPlayer, {
    category: 'landlord',
    title: `${choice.label} completed`,
    detail: reserveDraw > 0
      ? `A S$${cost.toLocaleString()} repair used S$${reserveDraw.toLocaleString()} from reserve.`
      : `A S$${cost.toLocaleString()} repair was paid fully from cash.`,
    tags: ['repair-completed', issue.category, choiceId],
    scoreImpact: choiceId === 'cheap-fix' ? -2 : 4,
  });

  return ok({ player: updatedPlayer });
}

// Internal — used by propertyOperations.advancePropertyOperationsMonth.
export function createMaintenanceIssue(
  property: OwnedProperty,
  turn: number,
  propertyIndex: number,
): MaintenanceIssue {
  const template = maintenanceTemplates[(turn + propertyIndex) % maintenanceTemplates.length];
  const conditionPenalty = Math.max(0, DEFAULT_CONDITION_SCORE - (property.conditionScore ?? DEFAULT_CONDITION_SCORE)) * 18;
  return {
    id: `issue_${turn}_${propertyIndex}_${template.category}`,
    propertyId: property.propertyId,
    category: template.category,
    severity: template.severity,
    label: template.label,
    riskTag: template.riskTag,
    estimatedCost: Math.round(template.baseCost + conditionPenalty),
    satisfactionImpact: template.satisfactionImpact,
    valueImpactPct: template.valueImpactPct,
    recurrenceRiskPct: template.recurrenceRiskPct,
    status: 'open',
  };
}
