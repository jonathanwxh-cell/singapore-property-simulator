import { useCallback } from 'react';
import { useGameStore } from '@/game/useGameStore';
import type { SaveSlot, GameState } from '@/game/types';

const SAVE_SLOTS_KEY = 'sgpt_saves';
const AUTO_SAVE_KEY = 'sgpt_autosave';

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
        screenHistory: gameState.screenHistory,
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
        data: JSON.stringify(state),
      };

      const existingIndex = slots.findIndex(s => s.id === slotId);
      if (existingIndex >= 0) {
        slots[existingIndex] = slot;
      } else {
        slots.push(slot);
      }

      // Keep only 5 manual slots + sort
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

      const state: GameState = JSON.parse(slot.data);
      useGameStore.getState().loadGame(state);
      return true;
    } catch {
      return false;
    }
  }, [getSaveSlots]);

  const loadAutoSave = useCallback((): boolean => {
    try {
      const data = localStorage.getItem(AUTO_SAVE_KEY);
      if (!data) return false;

      const state: GameState = JSON.parse(data);
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
      const parsed = JSON.parse(jsonData);

      // Basic schema validation — reject clearly invalid data
      if (!parsed || typeof parsed !== 'object') return false;
      const requiredKeys = ['player', 'market', 'settings'];
      for (const key of requiredKeys) {
        if (!(key in parsed) || typeof parsed[key] !== 'object') return false;
      }
      if (typeof parsed.player.name !== 'string') return false;
      if (typeof parsed.player.cash !== 'number') return false;
      if (typeof parsed.player.salary !== 'number') return false;
      if (typeof parsed.market.priceIndex !== 'number') return false;
      if (!Array.isArray(parsed.player.properties)) return false;
      if (!Array.isArray(parsed.player.loans)) return false;

      const state: GameState = parsed;
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
    return localStorage.getItem(AUTO_SAVE_KEY) !== null;
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
    autoSaveKey: AUTO_SAVE_KEY,
  };
}
