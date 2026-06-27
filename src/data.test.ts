import { describe, expect, it } from "vitest";
import {
  bosses,
  dungeons,
  enemies,
  itemById,
  items,
  metaUpgrades,
  vendorInventories,
  weaponById,
  weapons
} from "./data";

function expectUniqueIds(entries: { id: string }[], label: string): void {
  const ids = entries.map((entry) => entry.id);
  expect(new Set(ids).size, `${label} ids should be unique`).toBe(ids.length);
}

describe("game data", () => {
  it("uses unique ids for static content", () => {
    expectUniqueIds(weapons, "weapon");
    expectUniqueIds(items, "item");
    expectUniqueIds(enemies, "enemy");
    expectUniqueIds(bosses, "boss");
    expectUniqueIds(dungeons, "dungeon");
    expectUniqueIds(metaUpgrades, "meta upgrade");
  });

  it("keeps dungeon enemy pools and bosses resolvable", () => {
    dungeons.forEach((dungeon) => {
      dungeon.enemyPool.forEach((enemyId) => {
        expect(
          enemies.some((enemy) => enemy.id === enemyId),
          `${dungeon.id} enemy ${enemyId}`
        ).toBe(true);
      });
      expect(
        bosses.some((boss) => boss.id === dungeon.bossId),
        `${dungeon.id} boss ${dungeon.bossId}`
      ).toBe(true);
    });
  });

  it("keeps vendor inventories and weapon items resolvable", () => {
    vendorInventories.forEach((inventory) => {
      expect(
        dungeons.some((dungeon) => dungeon.id === inventory.dungeonId),
        `vendor ${inventory.dungeonId}`
      ).toBe(true);
      inventory.items.forEach((itemId) => {
        expect(itemById(itemId), `${inventory.dungeonId} item ${itemId}`).toBeDefined();
      });
    });

    items
      .filter((item) => item.effect === "weapon")
      .forEach((item) => {
        expect(item.weaponId, `${item.id} should point at a weapon`).toBeDefined();
        expect(
          weapons.some((weapon) => weapon.id === item.weaponId),
          `${item.id} weapon ${item.weaponId}`
        ).toBe(true);
      });
  });

  it("falls back to baseline definitions for unknown lookup ids", () => {
    expect(weaponById("missing-weapon")).toBe(weapons[0]);
  });
});
