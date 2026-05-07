import type { LucideIcon } from 'lucide-react';
import {
  Landmark,
  Newspaper,
  Save,
  Settings,
  Trophy,
  TrendingUp,
} from 'lucide-react';

export interface MobileMoreItem {
  label: string;
  path: string;
  icon: LucideIcon;
  detail: string;
  sectionId: 'plan-learn' | 'progress-setup';
  eyebrow: string;
}

export interface MobileMoreSection {
  id: 'plan-learn' | 'progress-setup';
  title: string;
  summary: string;
  items: MobileMoreItem[];
}

export const mobileMoreItems: MobileMoreItem[] = [
  { label: 'Market', path: '/market', icon: Newspaper, detail: 'District moves and timing', sectionId: 'plan-learn', eyebrow: 'Plan' },
  { label: 'Bank', path: '/bank', icon: Landmark, detail: 'Loans and affordability', sectionId: 'plan-learn', eyebrow: 'Finance' },
  { label: 'Scenarios', path: '/scenarios', icon: TrendingUp, detail: 'Current choice beats', sectionId: 'plan-learn', eyebrow: 'Story' },
  { label: 'Save', path: '/saveload', icon: Save, detail: 'Profiles and transfer saves', sectionId: 'progress-setup', eyebrow: 'Progress' },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy, detail: 'Replay score and ranking', sectionId: 'progress-setup', eyebrow: 'Score' },
  { label: 'Settings', path: '/settings', icon: Settings, detail: 'Comfort and display', sectionId: 'progress-setup', eyebrow: 'Setup' },
];

const mobileMoreSectionMeta: Omit<MobileMoreSection, 'items'>[] = [
  {
    id: 'plan-learn',
    title: 'Plan & Learn',
    summary: 'Use these when you want market timing, loan clarity, or the current scenario context before advancing the month.',
  },
  {
    id: 'progress-setup',
    title: 'Progress & Setup',
    summary: 'Use these for profiles, comfort tweaks, and replay tracking rather than your immediate monthly move.',
  },
];

export function getMobileMoreSections(): MobileMoreSection[] {
  return mobileMoreSectionMeta.map((section) => ({
    ...section,
    items: mobileMoreItems.filter((item) => item.sectionId === section.id),
  }));
}

export function isMobileMorePath(pathname: string): boolean {
  return mobileMoreItems.some((item) => item.path === pathname);
}
