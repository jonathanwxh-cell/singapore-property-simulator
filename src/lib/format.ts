export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, options: { decimals?: number } = {}): string {
  const decimals = options.decimals ?? 0;
  return 'S$' + roundMoney(value).toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1000000) {
    return sign + 'S$' + (abs / 1000000).toFixed(abs >= 10000000 ? 0 : 2) + 'M';
  }

  if (abs >= 1000) {
    return sign + 'S$' + (abs / 1000).toFixed(abs >= 100000 ? 0 : 1) + 'K';
  }

  return sign + 'S$' + abs.toFixed(0);
}

export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '0%';
  return Number(value.toFixed(decimals)).toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

export function formatRate(value: number, decimals = 1): string {
  return formatPercent(value, decimals) + ' p.a.';
}
