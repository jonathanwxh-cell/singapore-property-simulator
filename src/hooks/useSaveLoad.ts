import { useCallback } from 'react';
import { useGameStore } from '@/game/useGameStore';
import type { SaveSlot, GameState } from '@/game/types';
import {
  AUTO_SAVE_KEY,
  SAVE_SLOTS_KEY,
  hasValidAutoSave,
  parseStoredGameState,
  readAutoSave,
  serializeGameState,
} from '@/game/savePersistence';

export function useSaveLoad() {
  const gameState = useGameStore();

  const getSaveSlots = useCallback((): SaveSlot[] => {
    try {
      const data = localStorage.getItem(SAVE_SLOTS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }, []);

  const saveGame = useCallback((slotId: number, name: string): boolean => {
    try {
      const slots = getSaveSlots();
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

      const manualSlots = slots.filter(s => s.id > 0).sort((a, b) => a.id - b.id);
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(manualSlots));
      return true;
    } catch {
      return false;
    }
  }, [gameState, getSaveSlots]);

  const loadGame = useCallback((slotId: number): boolean => {
    try {
      const slots = getSaveSlots();
      const slot = slots.find(s => s.id === slotId);
      if (!slot) return false;

      const state = parseStoredGameState(slot.data);
      if (!state) return false;

      useGameStore.getState().loadGame(state);
      return true;
    } catch {
      return false;
    }
  }, [getSaveSlots]);

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
      const slots = getSaveSlots();
      const filtered = slots.filter(s => s.id !== slotId);
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }, [getSaveSlots]);

  const exportSave = useCallback((slotId: number): string | null => {
    try {
      const slots = getSaveSlots();
      const slot = slots.find(s => s.id === slotId);
      if (!slot) return null;
      return slot.data;
    } catch {
      return null;
    }
  }, [getSaveSlots]);

  const importSave = useCallback((jsonData: string, slotId: number): boolean => {
    try {
      const state = parseStoredGameState(jsonData);
      if (!state) return false;

      const slots = getSaveSlots();
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

      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
      return true;
    } catch {
      return false;
    }
  }, [getSaveSlots]);

  const hasAutoSave = useCallback((): boolean => {
    return hasValidAutoSave();
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

  return { getSaveSlots, saveGame, loadGame, loadAutoSave, deleteSave, exportSave, importSave, hasAutoSave, downloadSaveFile, autoSaveKey: AUTO_SAVE_KEY };
}
