import { saveSchema } from '@/data/saveSchema';
import { SAVE_VERSION } from '@/engine/constants';
import type { Difficulty, GameState, SaveProfile, SaveSlot } from './types';

// Storage keys are intentionally prefixed `sgpt_*` (Singapore Property Tycoon —
// the project's original working name). The visible brand has since shifted to
// "PropSim Singapore", but renaming the keys would orphan every existing
// player's saves. The legacy prefix is preserved for save compatibility.
export const SAVE_SLOTS_KEY = 'sgpt_saves';
export const AUTO_SAVE_KEY = 'sgpt_autosave';
export const PLAYER_PROFILES_KEY = 'sgpt_profiles';
export const ACTIVE_PROFILE_KEY = 'sgpt_active_profile';
export const DEFAULT_PROFILE_ID = 'guest';
export const PROFILE_TRANSFER_KIND = 'propsim-profile-transfer';
export const PROFILE_TRANSFER_VERSION = 1;

const PROFILE_SAVE_SLOTS_PREFIX = 'sgpt_saves_profile_';
const PROFILE_AUTO_SAVE_PREFIX = 'sgpt_autosave_profile_';
const profileColors = ['#00F0FF', '#00E676', '#FFD740', '#FF6B9D', '#7C4DFF', '#FF8A00'];

interface ProfileTransferBundle {
  kind: typeof PROFILE_TRANSFER_KIND;
  version: typeof PROFILE_TRANSFER_VERSION;
  exportedAt: string;
  profile: SaveProfile;
  autoSave: string | null;
  slots: SaveSlot[];
}

export interface ProfileImportResult {
  ok: boolean;
  profile: SaveProfile;
  importedSlots: number;
  importedAutoSave: boolean;
  message?: string;
}

// Routes where the auto-save should NOT be hydrated, even if `isGameActive`
// is false:
//   - '/' is the title screen — hydrating here flashes the dashboard before the user starts.
//   - '/how-to-play' is a tutorial reachable before a game exists.
//   - '/newgame' is the explicit "start fresh" flow — auto-hydration would clobber it.
//   - '/saveload' / '/leaderboard' show save data UI; hydration there is unwanted.
//
// All other routes (game screens) auto-hydrate. New game routes are
// auto-hydrated by default — the safer default than the previous allow-list,
// which silently dropped auto-save on any newly added screen.
const NO_AUTO_HYDRATE_ROUTES = new Set([
  '/',
  '/how-to-play',
  '/newgame',
  '/saveload',
  '/leaderboard',
]);

export function serializeGameState(state: GameState): string {
  return JSON.stringify({ ...state, version: SAVE_VERSION });
}

export function parseStoredGameState(rawData: string | null): GameState | null {
  if (!rawData) return null;

  try {
    const parsed = saveSchema.safeParse(JSON.parse(rawData));
    if (!parsed.success) return null;

    const state = { ...parsed.data };
    delete (state as { version?: number }).version;
    return state as unknown as GameState;
  } catch {
    return null;
  }
}

export function writeAutoSave(state: GameState, profileId = getActiveProfileId()): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(getProfileAutoSaveKey(profileId), serializeGameState(state));
  touchProfile(profileId);
}

export function hasValidAutoSave(profileId = getActiveProfileId()): boolean {
  return readAutoSave(profileId) !== null;
}

export function shouldHydrateAutoSaveForPath(pathname: string): boolean {
  if (NO_AUTO_HYDRATE_ROUTES.has(pathname)) return false;
  // Allow nested paths under denied routes too (e.g. /how-to-play/intro).
  for (const denied of NO_AUTO_HYDRATE_ROUTES) {
    if (denied !== '/' && pathname.startsWith(`${denied}/`)) return false;
  }
  return true;
}

export function getDefaultProfile(): SaveProfile {
  const now = new Date().toISOString();
  return {
    id: DEFAULT_PROFILE_ID,
    name: 'Guest Player',
    color: profileColors[0],
    createdAt: now,
    lastPlayedAt: now,
  };
}

export function getPlayerProfiles(): SaveProfile[] {
  if (typeof localStorage === 'undefined') return [getDefaultProfile()];

  const profiles = readProfiles();
  const hasDefault = profiles.some((profile) => profile.id === DEFAULT_PROFILE_ID);
  const normalized = hasDefault ? profiles : [getDefaultProfile(), ...profiles];
  const sorted = normalized.sort((a, b) => {
    if (a.id === DEFAULT_PROFILE_ID) return -1;
    if (b.id === DEFAULT_PROFILE_ID) return 1;
    return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
  });

  writeProfiles(sorted);
  return sorted;
}

export function getActiveProfileId(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_PROFILE_ID;

  const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
  const profiles = getPlayerProfiles();
  if (stored && profiles.some((profile) => profile.id === stored)) return stored;

  localStorage.setItem(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE_ID);
  return DEFAULT_PROFILE_ID;
}

export function setActiveProfileId(profileId: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (!getPlayerProfiles().some((profile) => profile.id === profileId)) return false;

  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  touchProfile(profileId);
  return true;
}

export function createPlayerProfile(name: string): SaveProfile | null {
  if (typeof localStorage === 'undefined') return null;

  const profiles = getPlayerProfiles();
  const profileName = normalizeProfileName(name);
  const now = new Date().toISOString();
  const profile: SaveProfile = {
    id: createUniqueProfileId(profileName, profiles),
    name: profileName,
    color: profileColors[profiles.length % profileColors.length],
    createdAt: now,
    lastPlayedAt: now,
  };

  writeProfiles([...profiles, profile]);
  setActiveProfileId(profile.id);
  return profile;
}

export function renamePlayerProfile(profileId: string, name: string): SaveProfile | null {
  if (typeof localStorage === 'undefined') return null;

  const profiles = getPlayerProfiles();
  const profile = profiles.find((candidate) => candidate.id === profileId);
  if (!profile) return null;

  const updated = { ...profile, name: normalizeProfileName(name), lastPlayedAt: new Date().toISOString() };
  writeProfiles(profiles.map((candidate) => (candidate.id === profileId ? updated : candidate)));
  return updated;
}

export function deletePlayerProfile(profileId: string): boolean {
  if (typeof localStorage === 'undefined' || profileId === DEFAULT_PROFILE_ID) return false;

  const profiles = getPlayerProfiles();
  if (!profiles.some((profile) => profile.id === profileId)) return false;

  writeProfiles(profiles.filter((profile) => profile.id !== profileId));
  localStorage.removeItem(getProfileSaveSlotsKey(profileId));
  localStorage.removeItem(getProfileAutoSaveKey(profileId));
  if (getActiveProfileId() === profileId) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE_ID);
  }
  return true;
}

export function getProfileSaveSlotsKey(profileId = getActiveProfileId()): string {
  return profileId === DEFAULT_PROFILE_ID ? SAVE_SLOTS_KEY : `${PROFILE_SAVE_SLOTS_PREFIX}${profileId}`;
}

export function getProfileAutoSaveKey(profileId = getActiveProfileId()): string {
  return profileId === DEFAULT_PROFILE_ID ? AUTO_SAVE_KEY : `${PROFILE_AUTO_SAVE_PREFIX}${profileId}`;
}

export function readAutoSave(profileId?: string): GameState | null {
  if (typeof localStorage === 'undefined') return null;
  return parseStoredGameState(localStorage.getItem(getProfileAutoSaveKey(profileId ?? getActiveProfileId())));
}

export function readSaveSlots(profileId = getActiveProfileId()): SaveSlot[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(getProfileSaveSlotsKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSaveSlot);
  } catch {
    return [];
  }
}

export function writeSaveSlots(slots: SaveSlot[], profileId = getActiveProfileId()): void {
  if (typeof localStorage === 'undefined') return;

  const manualSlots = slots
    .filter(isValidSaveSlot)
    .filter((slot) => slot.id > 0)
    .sort((a, b) => a.id - b.id);
  localStorage.setItem(getProfileSaveSlotsKey(profileId), JSON.stringify(manualSlots));
  touchProfile(profileId);
}

export function exportProfileBundle(profileId = getActiveProfileId()): string {
  const profiles = getPlayerProfiles();
  const profile = profiles.find((candidate) => candidate.id === profileId) ?? getDefaultProfile();
  const bundle: ProfileTransferBundle = {
    kind: PROFILE_TRANSFER_KIND,
    version: PROFILE_TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
    autoSave: typeof localStorage === 'undefined' ? null : localStorage.getItem(getProfileAutoSaveKey(profileId)),
    slots: readSaveSlots(profileId),
  };

  return JSON.stringify(bundle);
}

export function importProfileBundle(rawData: string): ProfileImportResult {
  const fallbackProfile = getDefaultProfile();

  try {
    if (typeof localStorage === 'undefined') {
      return {
        ok: false,
        profile: fallbackProfile,
        importedSlots: 0,
        importedAutoSave: false,
        message: 'Storage is unavailable in this browser.',
      };
    }

    const bundle = parseProfileTransferBundle(rawData);
    if (!bundle) {
      return {
        ok: false,
        profile: fallbackProfile,
        importedSlots: 0,
        importedAutoSave: false,
        message: 'Transfer bundle is invalid or from an unsupported version.',
      };
    }

    const importedProfile = createImportedProfile(bundle.profile);
    const autoSaveState = parseStoredGameState(bundle.autoSave);
    if (autoSaveState) {
      localStorage.setItem(getProfileAutoSaveKey(importedProfile.id), serializeGameState(autoSaveState));
    }

    const slots = bundle.slots.filter(isValidSaveSlot);
    writeSaveSlots(slots, importedProfile.id);
    setActiveProfileId(importedProfile.id);

    return {
      ok: true,
      profile: importedProfile,
      importedSlots: slots.length,
      importedAutoSave: autoSaveState !== null,
    };
  } catch {
    return {
      ok: false,
      profile: fallbackProfile,
      importedSlots: 0,
      importedAutoSave: false,
      message: 'Transfer import failed.',
    };
  }
}

function readProfiles(): SaveProfile[] {
  try {
    const raw = localStorage.getItem(PLAYER_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidProfile);
  } catch {
    return [];
  }
}

function writeProfiles(profiles: SaveProfile[]): void {
  localStorage.setItem(PLAYER_PROFILES_KEY, JSON.stringify(profiles.filter(isValidProfile)));
}

function isValidProfile(value: unknown): value is SaveProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<SaveProfile>;
  return typeof profile.id === 'string'
    && profile.id.length > 0
    && typeof profile.name === 'string'
    && profile.name.length > 0
    && typeof profile.color === 'string'
    && typeof profile.createdAt === 'string'
    && typeof profile.lastPlayedAt === 'string';
}

function normalizeProfileName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed.slice(0, 40) : 'Player';
}

function createUniqueProfileId(name: string, profiles: SaveProfile[]): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'player';
  const existingIds = new Set(profiles.map((profile) => profile.id));
  let candidate = `profile-${slug}`;
  let counter = 2;

  while (existingIds.has(candidate)) {
    candidate = `profile-${slug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function touchProfile(profileId: string): void {
  if (typeof localStorage === 'undefined') return;

  const profiles = getPlayerProfiles();
  const profile = profiles.find((candidate) => candidate.id === profileId);
  if (!profile) return;

  const updated = { ...profile, lastPlayedAt: new Date().toISOString() };
  writeProfiles(profiles.map((candidate) => (candidate.id === profileId ? updated : candidate)));
}

function isValidSaveSlot(value: unknown): value is SaveSlot {
  if (!value || typeof value !== 'object') return false;
  const slot = value as Partial<SaveSlot>;
  return typeof slot.id === 'number'
    && typeof slot.name === 'string'
    && typeof slot.date === 'string'
    && typeof slot.playerName === 'string'
    && typeof slot.netWorth === 'number'
    && typeof slot.turnCount === 'number'
    && typeof slot.year === 'number'
    && typeof slot.month === 'number'
    && isDifficulty(slot.difficulty)
    && typeof slot.data === 'string'
    && parseStoredGameState(slot.data) !== null;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'normal' || value === 'hard' || value === 'tycoon';
}

function parseProfileTransferBundle(rawData: string): ProfileTransferBundle | null {
  try {
    const parsed = JSON.parse(rawData.trim());
    if (!parsed || typeof parsed !== 'object') return null;
    const bundle = parsed as Partial<ProfileTransferBundle>;
    if (bundle.kind !== PROFILE_TRANSFER_KIND || bundle.version !== PROFILE_TRANSFER_VERSION) return null;
    if (!bundle.profile || !isValidProfile(bundle.profile)) return null;
    if (bundle.autoSave !== null && typeof bundle.autoSave !== 'string') return null;
    if (!Array.isArray(bundle.slots)) return null;
    return {
      kind: PROFILE_TRANSFER_KIND,
      version: PROFILE_TRANSFER_VERSION,
      exportedAt: typeof bundle.exportedAt === 'string' ? bundle.exportedAt : new Date().toISOString(),
      profile: bundle.profile,
      autoSave: bundle.autoSave ?? null,
      slots: bundle.slots.filter(isValidSaveSlot),
    };
  } catch {
    return null;
  }
}

function createImportedProfile(source: SaveProfile): SaveProfile {
  const profiles = getPlayerProfiles();
  const baseName = `${normalizeProfileName(source.name)} Import`;
  const now = new Date().toISOString();
  const profile: SaveProfile = {
    id: createUniqueProfileId(baseName, profiles),
    name: baseName,
    color: source.color || profileColors[profiles.length % profileColors.length],
    createdAt: now,
    lastPlayedAt: now,
  };

  writeProfiles([...profiles, profile]);
  return profile;
}
