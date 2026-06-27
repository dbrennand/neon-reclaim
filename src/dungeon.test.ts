import { describe, expect, it } from "vitest";
import { dungeons } from "./data";
import { generateDungeon, getAdjacentRooms } from "./dungeon";

describe("generateDungeon", () => {
  it("creates reachable start, vendor, combat, loot, hazard, and boss rooms across many seeds", () => {
    for (let dungeonIndex = 0; dungeonIndex < dungeons.length; dungeonIndex += 1) {
      for (let seed = 1; seed <= 75; seed += 1) {
        const graph = generateDungeon(seed * 997, dungeonIndex);
        const start = graph.rooms.find((room) => room.type === "start");
        const vendor = graph.rooms.find((room) => room.type === "vendor");
        const boss = graph.rooms.find((room) => room.type === "boss");

        expect(start).toBeDefined();
        expect(vendor).toBeDefined();
        expect(boss).toBeDefined();
        expect(graph.rooms.some((room) => room.type === "combat")).toBe(true);
        expect(graph.rooms.some((room) => room.type === "hazard")).toBe(true);
        expect(graph.rooms.some((room) => room.type === "loot")).toBe(true);

        const visited = new Set<string>();
        const queue = [start!];
        while (queue.length > 0) {
          const room = queue.shift()!;
          if (visited.has(room.id)) {
            continue;
          }
          visited.add(room.id);
          getAdjacentRooms(graph, room).forEach((next) => queue.push(next));
        }

        expect(visited.size).toBe(graph.rooms.length);
        expect(visited.has(vendor!.id)).toBe(true);
        expect(visited.has(boss!.id)).toBe(true);
      }
    }
  });
});
