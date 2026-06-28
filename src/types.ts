export type DungeonTheme = "downtown" | "mall" | "factory";
export type RoomType = "start" | "combat" | "hazard" | "vendor" | "loot" | "boss";
export type EnemyBehavior = "swarm" | "shield" | "sniper" | "mineLayer" | "support" | "hacker" | "boss";
export type WeaponKind = "pistol" | "rifle" | "shotgun" | "beam";
export type ItemKind = "weapon" | "armor" | "gadget" | "repair" | "ammo" | "rare";

export interface DungeonDefinition {
  id: string;
  name: string;
  theme: DungeonTheme;
  danger: number;
  flavor: string;
  enemyPool: string[];
  bossId: string;
}

export interface RoomDefinition {
  id: string;
  type: RoomType;
  x: number;
  y: number;
  cleared: boolean;
  droppedChips?: RoomChipDrop[];
}

export interface RoomChipDrop {
  id: string;
  x: number;
  y: number;
  value: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  behavior: EnemyBehavior;
  hp: number;
  speed: number;
  damage: number;
  chipValue: number;
  color: number;
  accent: number;
  radius: number;
  cooldown: number;
  unlockDungeon: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  kind: WeaponKind;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileCount: number;
  spread: number;
  price: number;
  color: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  kind: ItemKind;
  price: number;
  description: string;
  effect: "heal" | "maxHp" | "armor" | "speed" | "damage" | "weapon";
  amount: number;
  weaponId?: string;
}

export interface VendorInventoryDefinition {
  dungeonId: string;
  items: string[];
}

export interface BossDefinition {
  id: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  color: number;
  accent: number;
  flavor: string;
}

export interface MetaUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  effect: "maxHp" | "damage" | "retention";
  amountPerLevel: number;
}

export interface RoomGraph {
  seed: number;
  rooms: RoomDefinition[];
}

export interface SaveState {
  retainedChips: number;
  totalRuns: number;
  bestDungeonReached: number;
  unlockedBlueprints: string[];
  discoveredEnemies: string[];
  metaUpgrades: Record<string, number>;
  muted: boolean;
}

export interface RunState {
  dungeonIndex: number;
  hp: number;
  maxHp: number;
  armor: number;
  speedBonus: number;
  damageBonus: number;
  chips: number;
  weaponId: string;
  seed: number;
  graph: RoomGraph;
  currentRoomId: string;
  purchasedItemIds: string[];
  roomsCleared: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  chipsCollected: number;
}
