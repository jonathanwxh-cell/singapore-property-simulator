export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function roundMoneyPrecise(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, options: { decimals?: number } = {}): string {
  const decimals = options.decimals ?? 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return 'S$' + rounded.toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(Math.round(value));
  const sign = value < 0 ? '-' : '';

  if (abs >= 1000000) {
    const m = abs / 1000000;
    return sign + 'S$' + (m >= 10 ? m.toFixed(1) : m.toFixed(2)) + 'M';
  }

  if (abs >= 1000) {
    const k = abs / 1000;
    return sign + 'S$' + (k >= 100 ? k.toFixed(0) : k.toFixed(1)) + 'K';
  }

  return sign + 'S$' + abs.toLocaleString('en-SG');
}

export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '0%';
  const rounded = Number(value.toFixed(decimals));
  return rounded.toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

export function formatRate(value: number, decimals = 1): string {
  return formatPercent(value, decimals) + ' p.a.';
}
