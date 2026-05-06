import { properties, getPropertyCategory, type Property } from '@/data/properties';
import { normalizeBuyerProfile, type BuyerProfile, type RunRouteId } from '@/game/types';

export const HDB_STARTER_FALLBACK_ID = 'hdb-bto-0';

export function resolveStarterPropertyForProfile(profile?: Partial<BuyerProfile> | null): Property {
  const normalizedProfile = normalizeBuyerProfile(profile);
  const isSingleUnder35 = normalizedProfile.householdProfile === 'single-under-35';

  if (isSingleUnder35) {
    const privateStarter = properties.find((property) => getPropertyCategory(property.type) === 'private-residential' || property.type === 'Commercial Shop' || property.type === 'Commercial Office');
    if (privateStarter) {
      return privateStarter;
    }
  }

  return (
    properties.find((property) => property.id === HDB_STARTER_FALLBACK_ID)
    ?? properties.find((property) => property.isHdb)
    ?? properties[0]
  );
}

export function resolveStarterRouteForProfile(profile?: Partial<BuyerProfile> | null): RunRouteId {
  const normalizedProfile = normalizeBuyerProfile(profile);
  const isUnder35Solo = normalizedProfile.householdProfile === 'single-under-35';
  const isSpr = normalizedProfile.residencyStatus === 'spr';
  const isForeigner = normalizedProfile.residencyStatus === 'foreigner';
  const isDomesticPartners = normalizedProfile.householdProfile === 'domestic-partners';
  const isSingle = normalizedProfile.householdProfile === 'single-35-plus';

  if (isForeigner || normalizedProfile.householdProfile === 'foreigner-investor') return 'foreign-investor';
  if (isUnder35Solo || isSpr) return 'pr-private-climber';
  if (isDomesticPartners) return 'fire-homeowner';
  if (isSingle) return 'single-resale';
  return 'bto-upgrader';
}

export function resolveStarterPropertyRoute(profile?: Partial<BuyerProfile> | null): string {
  return `/property/${resolveStarterPropertyForProfile(profile).id}`;
}
