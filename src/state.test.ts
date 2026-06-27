import { afterEach, describe, expect, it } from "vitest";
import { dungeons } from "./data";
import { defaultSave } from "./save";
import { advanceDungeon, currentRun, endRun, startNewRun } from "./state";

describe("run state transitions", () => {
  afterEach(() => {
    endRun();
  });

  it("starts a new run with save-based permanent upgrade bonuses", () => {
    const save = defaultSave();
    save.metaUpgrades["reinforced-heart"] = 3;
    save.metaUpgrades["combat-firmware"] = 2;

    const run = startNewRun(save);

    expect(save.totalRuns).toBe(1);
    expect(currentRun).toBe(run);
    expect(run.dungeonIndex).toBe(0);
    expect(run.maxHp).toBe(136);
    expect(run.hp).toBe(run.maxHp);
    expect(run.damageBonus).toBeCloseTo(0.12);
    expect(run.weaponId).toBe("pulse-pistol");
    expect(run.currentRoomId).toBe("0,0");
    expect(run.graph.seed).toBe(run.seed);
  });

  it("advances through dungeons and ends at the final district boundary", () => {
    const save = defaultSave();
    const run = startNewRun(save);

    run.hp = 50;
    run.chips = 35;
    run.purchasedItemIds = ["repair-foam"];

    expect(advanceDungeon()).toBe(true);
    expect(run.dungeonIndex).toBe(1);
    expect(run.currentRoomId).toBe("0,0");
    expect(run.hp).toBe(85);
    expect(run.chips).toBe(35);
    expect(run.purchasedItemIds).toEqual([]);
    expect(run.graph.seed).toBe(run.seed);

    while (run.dungeonIndex < dungeons.length - 1) {
      expect(advanceDungeon()).toBe(true);
    }

    expect(advanceDungeon()).toBe(false);
    expect(run.dungeonIndex).toBe(dungeons.length);
  });

  it("does not advance when no run is active", () => {
    endRun();

    expect(advanceDungeon()).toBe(false);
  });
});
