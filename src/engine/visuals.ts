import type { OwnedProperty, Player } from '@/game/types';
import type { ListingProperty } from './listings';
import { getListingCatalog } from './listings';

export type HomeMood = 'searching' | 'settled' | 'earning' | 'renovating' | 'repair-risk';

export interface LivingHomeVisualState {
  propertyId: string;
  name: string;
  image: string;
  type: string;
  statusLabel: string;
  statusDetail: string;
  conditionScore: number;
  mopRemainingMonths: number | null;
  monthlyRent: number;
  tenantSatisfaction: number | null;
  openIssueCount: number;
  activeRenovationLabel: string | null;
  reserveProtected: boolean;
  mood: HomeMood;
}

export interface LifeBoardVisualStage {
  id: 'foundation' | 'first-home' | 'home-season' | 'upgrade-window' | 'legacy';
  label: string;
  detail: string;
  status: 'past' | 'current' | 'future';
}

export interface LifeBoardVisualState {
  chapterLabel: string;
  chapterDetail: string;
  stages: LifeBoardVisualStage[];
  avatarStageIndex: number;
}

type ListingVisualSource = Pick<ListingProperty, 'id' | 'name' | 'image' | 'type' | 'isHdb'>;

export function getPrimaryLivingHomeVisual(
  player: Player,
  catalog: ListingVisualSource[] = getListingCatalog(),
): LivingHomeVisualState | null {
  const owned = player.properties[0];
  if (!owned) return null;

  const listing = catalog.find((candidate) => candidate.id === owned.propertyId);
  if (!listing) return null;

  return getLivingHomeVisualForOwnedProperty(player, owned, listing);
}

export function getLivingHomeVisualForOwnedProperty(
  player: Player,
  owned: OwnedProperty,
  listing: ListingVisualSource,
): LivingHomeVisualState {
  const monthlyRent = owned.tenant?.contractedRent ?? (owned.isRented ? owned.monthlyRental : 0);
  const tenantSatisfaction = owned.tenant?.satisfaction ?? null;
  const openIssueCount = owned.openMaintenanceIssues?.length ?? 0;
  const activeRenovationLabel = owned.activeRenovation?.label ?? null;
  const mopRemainingMonths = owned.mopRemainingMonths ?? null;
  const conditionScore = owned.conditionScore ?? 70;
  const reserveProtected = (player.reserve?.allocatedCash ?? 0) >= 5_000;

  const statusLabel = getHomeStatusLabel(owned, listing);
  const statusDetail = getHomeStatusDetail({ monthlyRent, mopRemainingMonths, tenantSatisfaction, openIssueCount, activeRenovationLabel });
  const mood = getHomeMood({ monthlyRent, openIssueCount, activeRenovationLabel });

  return {
    propertyId: owned.propertyId,
    name: listing.name,
    image: listing.image,
    type: listing.type,
    statusLabel,
    statusDetail,
    conditionScore,
    mopRemainingMonths,
    monthlyRent,
    tenantSatisfaction,
    openIssueCount,
    activeRenovationLabel,
    reserveProtected,
    mood,
  };
}

export function getLifeBoardVisualState(player: Player): LifeBoardVisualState {
  const ownsHome = player.properties.length > 0;
  const activeMopMonths = getActiveMopMonths(player);
  const multiProperty = player.properties.length > 1;

  if (!ownsHome) {
    return {
      chapterLabel: 'First-home search',
      chapterDetail: 'Build runway, learn the rules, and find a home that passes cash and loan safety.',
      avatarStageIndex: 1,
      stages: [
        stage('foundation', 'Foundation', 'Salary, CPF, and cash runway', 'past'),
        stage('first-home', 'First Home', 'Search, compare, and buy safely', 'current'),
        stage('home-season', 'Home Season', 'Operate the home during MOP', 'future'),
        stage('upgrade-window', 'Upgrade Window', 'Prepare the next move', 'future'),
        stage('legacy', 'Ending', 'Collect your run identity', 'future'),
      ],
    };
  }

  if (activeMopMonths > 0) {
    return {
      chapterLabel: 'Home season',
      chapterDetail: `${activeMopMonths} MOP month(s) left. Make the wait productive with room rental, reserves, repairs, and upgrades.`,
      avatarStageIndex: 2,
      stages: [
        stage('foundation', 'Foundation', 'Runway built', 'past'),
        stage('first-home', 'First Home', 'Keys collected', 'past'),
        stage('home-season', 'Home Season', `${activeMopMonths} MOP months left`, 'current'),
        stage('upgrade-window', 'Upgrade Window', 'Prepare the next move', 'future'),
        stage('legacy', 'Ending', 'Collect your run identity', 'future'),
      ],
    };
  }

  return {
    chapterLabel: multiProperty ? 'Portfolio chapter' : 'Upgrade window',
    chapterDetail: multiProperty
      ? 'Your run has become an operating portfolio. Tenant quality, leverage, and reserves decide the ending.'
      : 'MOP is over. The next move is no longer blocked by waiting, but it still needs cash, tax, and loan safety.',
    avatarStageIndex: multiProperty ? 4 : 3,
    stages: [
      stage('foundation', 'Foundation', 'Runway built', 'past'),
      stage('first-home', 'First Home', 'Keys collected', 'past'),
      stage('home-season', 'Home Season', 'MOP cleared', 'past'),
      stage('upgrade-window', 'Upgrade Window', multiProperty ? 'Next asset engine' : 'Next-home decision', multiProperty ? 'past' : 'current'),
      stage('legacy', 'Ending', 'What life did you build?', multiProperty ? 'current' : 'future'),
    ],
  };
}

function stage(
  id: LifeBoardVisualStage['id'],
  label: string,
  detail: string,
  status: LifeBoardVisualStage['status'],
): LifeBoardVisualStage {
  return { id, label, detail, status };
}

function getActiveMopMonths(player: Player): number {
  return player.properties.reduce((max, property) => Math.max(max, property.mopRemainingMonths ?? 0), 0);
}

function getHomeStatusLabel(owned: OwnedProperty, listing: ListingVisualSource): string {
  if (owned.tenant?.rentalMode === 'room-rental') return 'Room tenant active';
  if (owned.tenant) return 'Whole-unit lease active';
  if (owned.isRented) return 'Rental active';
  if (listing.isHdb && (owned.mopRemainingMonths ?? 0) > 0) return 'Owner-occupied during MOP';
  return 'Ready for next decision';
}

function getHomeStatusDetail({
  monthlyRent,
  mopRemainingMonths,
  tenantSatisfaction,
  openIssueCount,
  activeRenovationLabel,
}: {
  monthlyRent: number;
  mopRemainingMonths: number | null;
  tenantSatisfaction: number | null;
  openIssueCount: number;
  activeRenovationLabel: string | null;
}): string {
  if (openIssueCount > 0) return `${openIssueCount} repair issue(s) need attention before the home feels stable.`;
  if (activeRenovationLabel) return `${activeRenovationLabel} is changing rent/value potential.`;
  if (monthlyRent > 0 && tenantSatisfaction !== null) return `Earning S$${monthlyRent.toLocaleString()}/mo with ${tenantSatisfaction}/100 tenant happiness.`;
  if (mopRemainingMonths && mopRemainingMonths > 0) return `${mopRemainingMonths} month(s) of MOP remain. Use the home season well.`;
  return 'No active tenant or repair pressure. This home is ready for the next plan.';
}

function getHomeMood({
  monthlyRent,
  openIssueCount,
  activeRenovationLabel,
}: {
  monthlyRent: number;
  openIssueCount: number;
  activeRenovationLabel: string | null;
}): HomeMood {
  if (openIssueCount > 0) return 'repair-risk';
  if (activeRenovationLabel) return 'renovating';
  if (monthlyRent > 0) return 'earning';
  return 'settled';
}
