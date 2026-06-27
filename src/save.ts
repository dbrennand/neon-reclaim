import { metaUpgrades } from "./data";
import type { SaveState } from "./types";

const SAVE_KEY = "neon-reclaim-save-v1";

export function defaultSave(): SaveState {
  return {
    retainedChips: 0,
    totalRuns: 0,
    bestDungeonReached: 0,
    unlockedBlueprints: ["pulse-pistol"],
    discoveredEnemies: [],
    metaUpgrades: Object.fromEntries(metaUpgrades.map((upgrade) => [upgrade.id, 0])),
    muted: false
  };
}

export function loadSave(): SaveState {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return defaultSave();
    }

    const parsed = JSON.parse(raw) as Partial<SaveState>;
    const fallback = defaultSave();
    return {
      ...fallback,
      ...parsed,
      unlockedBlueprints: parsed.unlockedBlueprints ?? fallback.unlockedBlueprints,
      discoveredEnemies: parsed.discoveredEnemies ?? fallback.discoveredEnemies,
      metaUpgrades: {
        ...fallback.metaUpgrades,
        ...(parsed.metaUpgrades ?? {})
      }
    };
  } catch {
    return defaultSave();
  }
}

export function saveGame(save: SaveState): void {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function resetSave(): SaveState {
  const save = defaultSave();
  saveGame(save);
  return save;
}
