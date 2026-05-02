import type { MarketNewsItem, MarketState } from '@/game/types';
import type { Rng } from './rng';

type MarketNewsTemplate = {
  category: MarketNewsItem['category'];
  tone: MarketNewsItem['tone'];
  headline: string;
  detail: string;
  priceRange: [number, number];
  rentalRange: [number, number];
  rateRange: [number, number];
};

const marketNewsTemplates: MarketNewsTemplate[] = [
  {
    category: 'Rates',
    tone: 'bearish',
    headline: 'Banks reprice mortgages higher after hawkish policy signals',
    detail: 'Higher monthly instalments cool buyer urgency and weigh on headline property prices.',
    priceRange: [-2.8, -1.1],
    rentalRange: [0.1, 1.2],
    rateRange: [0.2, 0.55],
  },
  {
    category: 'Rates',
    tone: 'bullish',
    headline: 'Mortgage competition intensifies as lenders cut promotional rates',
    detail: 'Cheaper borrowing improves affordability and sparks fresh viewings across suburban projects.',
    priceRange: [1.1, 2.7],
    rentalRange: [-0.2, 0.8],
    rateRange: [-0.45, -0.15],
  },
  {
    category: 'Demand',
    tone: 'bullish',
    headline: 'Strong upgrader demand lifts mass-market transaction momentum',
    detail: 'HDB upgraders and dual-income households step back into the market after a quiet spell.',
    priceRange: [1.3, 3.4],
    rentalRange: [0.4, 1.4],
    rateRange: [-0.08, 0.08],
  },
  {
    category: 'Demand',
    tone: 'bearish',
    headline: 'Buyers pause as valuation gaps widen across several estates',
    detail: 'Offers are coming in slower as households wait for sellers to lower expectations.',
    priceRange: [-2.5, -0.9],
    rentalRange: [-0.6, 0.5],
    rateRange: [-0.08, 0.08],
  },
  {
    category: 'Supply',
    tone: 'bearish',
    headline: 'Wave of new launches gives buyers more negotiating power',
    detail: 'A fuller pipeline increases competition between developers and softens resale urgency.',
    priceRange: [-2.0, -0.6],
    rentalRange: [-1.2, -0.2],
    rateRange: [-0.05, 0.05],
  },
  {
    category: 'Supply',
    tone: 'bullish',
    headline: 'Tight resale supply keeps well-located units in demand',
    detail: 'Serious buyers are competing for a small pool of move-in-ready homes near MRT stations.',
    priceRange: [0.9, 2.2],
    rentalRange: [0.4, 1.1],
    rateRange: [-0.05, 0.05],
  },
  {
    category: 'Policy',
    tone: 'bearish',
    headline: 'Fresh cooling talk prompts a cautious month for investors',
    detail: 'Policy uncertainty slows speculative demand and trims aggressive bidding behavior.',
    priceRange: [-1.9, -0.7],
    rentalRange: [-0.3, 0.6],
    rateRange: [0, 0.1],
  },
  {
    category: 'Policy',
    tone: 'bullish',
    headline: 'Supportive first-home measures improve buyer confidence',
    detail: 'Entry-level households re-enter the market as grants and financing support widen access.',
    priceRange: [0.8, 2.4],
    rentalRange: [0, 0.9],
    rateRange: [-0.05, 0.02],
  },
  {
    category: 'Infrastructure',
    tone: 'bullish',
    headline: 'Transport upgrade plans boost sentiment around fringe districts',
    detail: 'Transit improvements tend to re-rate nearby estates before construction is even complete.',
    priceRange: [0.7, 2.1],
    rentalRange: [0.3, 1.0],
    rateRange: [-0.03, 0.03],
  },
  {
    category: 'Macro',
    tone: 'neutral',
    headline: 'Mixed macro data keeps property buyers selective this month',
    detail: 'Households are still active, but demand is concentrated in value-for-money listings.',
    priceRange: [-0.6, 0.8],
    rentalRange: [-0.4, 0.6],
    rateRange: [-0.08, 0.08],
  },
];

function pickTemplate(rng: Rng): MarketNewsTemplate {
  const index = Math.floor(rng.next() * marketNewsTemplates.length);
  return marketNewsTemplates[Math.min(index, marketNewsTemplates.length - 1)];
}

function rangeValue(rng: Rng, [min, max]: [number, number]): number {
  return min + (max - min) * rng.next();
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function classifyEvent(priceChangePct: number): MarketState['lastEvent'] {
  if (priceChangePct >= 1.5) return 'boom';
  if (priceChangePct <= -1.5) return 'crash';
  return 'stable';
}

export function generateMarketNews(args: {
  rng: Rng;
  turn: number;
  month: number;
  year: number;
  volatility: number;
}): {
  priceChangePct: number;
  rentalChangePct: number;
  rateChangePct: number;
  lastEvent: MarketState['lastEvent'];
  newsItem: MarketNewsItem;
} {
  const { rng, turn, month, year, volatility } = args;
  const template = pickTemplate(rng);
  const volMultiplier = 0.8 + volatility * 1.6;

  const priceChangePct = round(rangeValue(rng, template.priceRange) * volMultiplier);
  const rentalChangePct = round(rangeValue(rng, template.rentalRange) * Math.max(0.75, volatility * 1.2 + 0.5));
  const rateChangePct = round(rangeValue(rng, template.rateRange));
  const lastEvent = classifyEvent(priceChangePct);

  return {
    priceChangePct,
    rentalChangePct,
    rateChangePct,
    lastEvent,
    newsItem: {
      id: `market-${year}-${month}-${turn}`,
      turn,
      month,
      year,
      headline: template.headline,
      detail: template.detail,
      category: template.category,
      tone: template.tone,
      priceChangePct,
      rentalChangePct,
      rateChangePct,
    },
  };
}
