import { useCallback } from 'react';
import { useGameStore } from '@/game/useGameStore';
import type { SaveProfile, SaveSlot, GameState } from '@/game/types';
import {
  AUTO_SAVE_KEY,
  createPlayerProfile,
  deletePlayerProfile,
  exportProfileBundle,
  getActiveProfileId,
  getPlayerProfiles,
  hasValidAutoSave,
  importProfileBundle,
  parseStoredGameState,
  readSaveSlots,
  readAutoSave,
  serializeGameState,
  setActiveProfileId,
  writeSaveSlots,
} from '@/game/savePersistence';

export function useSaveLoad() {
  const gameState = useGameStore();

  const getSaveSlots = useCallback((): SaveSlot[] => {
    return readSaveSlots();
  }, []);

  const getProfiles = useCallback((): SaveProfile[] => getPlayerProfiles(), []);

  const getActiveProfile = useCallback((): SaveProfile => {
    const activeProfileId = getActiveProfileId();
    return getPlayerProfiles().find((profile) => profile.id === activeProfileId) ?? getPlayerProfiles()[0];
  }, []);

  const createProfile = useCallback((name: string): SaveProfile | null => createPlayerProfile(name), []);

  const deleteProfile = useCallback((profileId: string): boolean => deletePlayerProfile(profileId), []);

  const switchProfile = useCallback((profileId: string): boolean => {
    const switched = setActiveProfileId(profileId);
    if (!switched) return false;

    const state = readAutoSave(profileId);
    if (state) {
      useGameStore.getState().loadGame(state);
    }
    return true;
  }, []);

  const saveGame = useCallback((slotId: number, name: string): boolean => {
    try {
      const slots = readSaveSlots();
      const state: GameState = {
        player: gameState.player,
        market: gameState.market,
        settings: gameState.settings,
        isGameActive: gameState.isGameActive,
        currentScenario: gameState.currentScenario,
        rngSeed: gameState.rngSeed,
        rngState: gameState.rngState,
      };
      const slot: SaveSlot = {
        id: slotId,
        name,
        date: new Date().toISOString(),
        playerName: state.player.name,
        netWorth: state.player.totalNetWorth,
        turnCount: state.player.turnCount,
        year: state.player.year,
        month: state.player.month,
        difficulty: state.player.difficulty,
        data: serializeGameState(state),
      };

      const existingIndex = slots.findIndex(s => s.id === slotId);
      if (existingIndex >= 0) {
        slots[existingIndex] = slot;
      } else {
        slots.push(slot);
      }

      writeSaveSlots(slots);
      return true;
    } catch {
      return false;
    }
  }, [gameState]);

  const loadGame = useCallback((slotId: number): boolean => {
    try {
      const slots = readSaveSlots();
      const slot = slots.find(s => s.id === slotId);
      if (!slot) return false;

      const state = parseStoredGameState(slot.data);
      if (!state) return false;

      useGameStore.getState().loadGame(state);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadAutoSave = useCallback((): boolean => {
    try {
      const state = readAutoSave();
      if (!state) return false;

      useGameStore.getState().loadGame(state);
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteSave = useCallback((slotId: number): boolean => {
    try {
      const slots = readSaveSlots();
      const filtered = slots.filter(s => s.id !== slotId);
      writeSaveSlots(filtered);
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportSave = useCallback((slotId: number): string | null => {
    try {
      const slots = readSaveSlots();
      const slot = slots.find(s => s.id === slotId);
      if (!slot) return null;
      return slot.data;
    } catch {
      return null;
    }
  }, []);

  const importSave = useCallback((jsonData: string, slotId: number): boolean => {
    try {
      const state = parseStoredGameState(jsonData);
      if (!state) return false;

      const slots = readSaveSlots();
      const slot: SaveSlot = {
        id: slotId,
        name: `Import ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        playerName: state.player.name,
        netWorth: state.player.totalNetWorth,
        turnCount: state.player.turnCount,
        year: state.player.year,
        month: state.player.month,
        difficulty: state.player.difficulty,
        data: jsonData,
      };

      const existingIndex = slots.findIndex(s => s.id === slotId);
      if (existingIndex >= 0) {
        slots[existingIndex] = slot;
      } else {
        slots.push(slot);
      }

      writeSaveSlots(slots);
      return true;
    } catch {
      return false;
    }
  }, []);

  const hasAutoSave = useCallback((): boolean => {
    return hasValidAutoSave();
  }, []);

  const exportCurrentProfileBundle = useCallback((profileId?: string): string => {
    return exportProfileBundle(profileId);
  }, []);

  const importProfileBundleData = useCallback((jsonData: string) => {
    return importProfileBundle(jsonData);
  }, []);

  const downloadSaveFile = useCallback((slotId: number) => {
    const data = exportSave(slotId);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sgpt_save_${slotId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportSave]);

  const downloadProfileBundle = useCallback((profileId?: string) => {
    const data = exportCurrentProfileBundle(profileId);
    const profile = profileId
      ? getPlayerProfiles().find((candidate) => candidate.id === profileId)
      : getActiveProfile();
    const safeName = (profile?.name ?? 'profile').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propsim_${safeName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportCurrentProfileBundle, getActiveProfile]);

  return {
    getSaveSlots,
    saveGame,
    loadGame,
    loadAutoSave,
    deleteSave,
    exportSave,
    importSave,
    hasAutoSave,
    downloadSaveFile,
    getProfiles,
    getActiveProfile,
    createProfile,
    deleteProfile,
    switchProfile,
    exportCurrentProfileBundle,
    importProfileBundleData,
    downloadProfileBundle,
    autoSaveKey: AUTO_SAVE_KEY,
  };
}
