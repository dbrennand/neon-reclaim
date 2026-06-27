import { dungeons, metaUpgrades } from "./data";
import { generateDungeon, makeSeed } from "./dungeon";
import type { RunState, SaveState } from "./types";

export let currentRun: RunState | null = null;
export let currentSave: SaveState | null = null;

export function setCurrentSave(save: SaveState): void {
  currentSave = save;
}

export function startNewRun(save: SaveState): RunState {
  const maxHpUpgrade = metaUpgrades.find((upgrade) => upgrade.effect === "maxHp");
  const damageUpgrade = metaUpgrades.find((upgrade) => upgrade.effect === "damage");
  const maxHpLevel = maxHpUpgrade ? (save.metaUpgrades[maxHpUpgrade.id] ?? 0) : 0;
  const damageLevel = damageUpgrade ? (save.metaUpgrades[damageUpgrade.id] ?? 0) : 0;
  const seed = makeSeed();
  const maxHp = 100 + maxHpLevel * 12;
  currentRun = {
    dungeonIndex: 0,
    hp: maxHp,
    maxHp,
    armor: 0,
    speedBonus: 0,
    damageBonus: damageLevel * 0.06,
    chips: 0,
    weaponId: "pulse-pistol",
    seed,
    graph: generateDungeon(seed, 0),
    currentRoomId: "0,0",
    purchasedItemIds: [],
    roomsCleared: 0,
    enemiesDefeated: 0,
    bossesDefeated: 0,
    chipsCollected: 0
  };
  save.totalRuns += 1;
  currentSave = save;
  return currentRun;
}

export function advanceDungeon(): boolean {
  if (!currentRun) {
    return false;
  }

  currentRun.dungeonIndex += 1;
  if (currentRun.dungeonIndex >= dungeons.length) {
    return false;
  }

  currentRun.seed += 31;
  currentRun.graph = generateDungeon(currentRun.seed, currentRun.dungeonIndex);
  currentRun.currentRoomId = "0,0";
  currentRun.hp = Math.min(currentRun.maxHp, currentRun.hp + 35);
  currentRun.purchasedItemIds = [];
  return true;
}

export function endRun(): void {
  currentRun = null;
}
