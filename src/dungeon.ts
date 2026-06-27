import type { RoomDefinition, RoomGraph, RoomType } from "./types";

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)];
  }
}

export function makeSeed(): number {
  return Math.floor(Date.now() % 2147483647);
}

export function generateDungeon(seed: number, dungeonIndex: number): RoomGraph {
  const rng = new Rng(seed + dungeonIndex * 997);
  const rooms: RoomDefinition[] = [];
  const occupied = new Set<string>();
  let x = 0;
  let y = 0;

  const addRoom = (type: RoomType, rx: number, ry: number): RoomDefinition => {
    const id = `${rx},${ry}`;
    const room = { id, type, x: rx, y: ry, cleared: type === "start" || type === "vendor" };
    rooms.push(room);
    occupied.add(id);
    return room;
  };

  addRoom("start", x, y);

  const pathLength = 6 + dungeonIndex;
  for (let i = 1; i <= pathLength; i += 1) {
    const options = [
      { x: x + 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ].filter((option) => !occupied.has(`${option.x},${option.y}`));
    const next = options.length > 0 ? rng.pick(options) : { x: x + 1, y };
    x = next.x;
    y = next.y;
    const type: RoomType = i === pathLength ? "boss" : i === 2 ? "vendor" : i === 4 ? "hazard" : "combat";
    addRoom(type, x, y);
  }

  const branchCandidates = rooms.filter((room) => room.type === "combat" || room.type === "hazard");
  for (let i = 0; i < 2 + dungeonIndex; i += 1) {
    const anchor = rng.pick(branchCandidates);
    const directions = [
      { x: anchor.x + 1, y: anchor.y },
      { x: anchor.x - 1, y: anchor.y },
      { x: anchor.x, y: anchor.y + 1 },
      { x: anchor.x, y: anchor.y - 1 }
    ].filter((option) => !occupied.has(`${option.x},${option.y}`));

    if (directions.length > 0) {
      const branch = rng.pick(directions);
      addRoom(i % 2 === 0 ? "loot" : "combat", branch.x, branch.y);
    }
  }

  return { seed, rooms };
}

export function getAdjacentRooms(graph: RoomGraph, room: RoomDefinition): RoomDefinition[] {
  return graph.rooms.filter((candidate) => {
    const distance = Math.abs(candidate.x - room.x) + Math.abs(candidate.y - room.y);
    return distance === 1;
  });
}
