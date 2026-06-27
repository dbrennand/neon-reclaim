import type {
  BossDefinition,
  DungeonDefinition,
  EnemyDefinition,
  ItemDefinition,
  MetaUpgradeDefinition,
  VendorInventoryDefinition,
  WeaponDefinition
} from "./types";

export const weapons: WeaponDefinition[] = [
  {
    id: "pulse-pistol",
    name: "Pulse Pistol",
    kind: "pistol",
    damage: 15,
    fireRate: 260,
    projectileSpeed: 500,
    projectileCount: 1,
    spread: 0,
    price: 0,
    color: 0x54d6ff
  },
  {
    id: "rail-rifle",
    name: "Rail Rifle",
    kind: "rifle",
    damage: 24,
    fireRate: 420,
    projectileSpeed: 780,
    projectileCount: 1,
    spread: 0,
    price: 55,
    color: 0xb8f7ff
  },
  {
    id: "scatter-coil",
    name: "Scatter Coil",
    kind: "shotgun",
    damage: 12,
    fireRate: 520,
    projectileSpeed: 450,
    projectileCount: 5,
    spread: 0.38,
    price: 70,
    color: 0xffe173
  },
  {
    id: "arc-lancer",
    name: "Arc Lancer",
    kind: "beam",
    damage: 34,
    fireRate: 700,
    projectileSpeed: 640,
    projectileCount: 1,
    spread: 0,
    price: 95,
    color: 0xa77cff
  }
];

export const items: ItemDefinition[] = [
  {
    id: "repair-foam",
    name: "Repair Foam",
    kind: "repair",
    price: 22,
    description: "Restore 35 HP immediately.",
    effect: "heal",
    amount: 35
  },
  {
    id: "titan-weave",
    name: "Titan Weave",
    kind: "armor",
    price: 48,
    description: "Increase armor for the current run.",
    effect: "armor",
    amount: 1
  },
  {
    id: "overclock-chip",
    name: "Overclock Chip",
    kind: "gadget",
    price: 52,
    description: "Increase weapon damage for the current run.",
    effect: "damage",
    amount: 0.18
  },
  {
    id: "servo-boots",
    name: "Servo Boots",
    kind: "rare",
    price: 44,
    description: "Move faster for the current run.",
    effect: "speed",
    amount: 36
  },
  {
    id: "rail-rifle",
    name: "Rail Rifle",
    kind: "weapon",
    price: 55,
    description: "Precise, high-speed tech rifle.",
    effect: "weapon",
    amount: 0,
    weaponId: "rail-rifle"
  },
  {
    id: "scatter-coil",
    name: "Scatter Coil",
    kind: "weapon",
    price: 70,
    description: "Close-range spread weapon.",
    effect: "weapon",
    amount: 0,
    weaponId: "scatter-coil"
  },
  {
    id: "arc-lancer",
    name: "Arc Lancer",
    kind: "weapon",
    price: 95,
    description: "Heavy prototype energy launcher.",
    effect: "weapon",
    amount: 0,
    weaponId: "arc-lancer"
  }
];

export const enemies: EnemyDefinition[] = [
  {
    id: "scrap-runner",
    name: "Scrap Runner",
    behavior: "swarm",
    hp: 28,
    speed: 108,
    damage: 9,
    chipValue: 6,
    color: 0xf05d5e,
    accent: 0xffc65d,
    radius: 15,
    cooldown: 900,
    unlockDungeon: 0
  },
  {
    id: "bulwark",
    name: "Bulwark Unit",
    behavior: "shield",
    hp: 68,
    speed: 66,
    damage: 13,
    chipValue: 11,
    color: 0x4bb3fd,
    accent: 0xe5f6ff,
    radius: 18,
    cooldown: 1200,
    unlockDungeon: 0
  },
  {
    id: "longshot",
    name: "Longshot Drone",
    behavior: "sniper",
    hp: 38,
    speed: 72,
    damage: 16,
    chipValue: 12,
    color: 0xffd166,
    accent: 0xff6b6b,
    radius: 14,
    cooldown: 1500,
    unlockDungeon: 1
  },
  {
    id: "mine-weaver",
    name: "Mine Weaver",
    behavior: "mineLayer",
    hp: 48,
    speed: 82,
    damage: 18,
    chipValue: 13,
    color: 0x8bd450,
    accent: 0xfeff8a,
    radius: 16,
    cooldown: 1800,
    unlockDungeon: 1
  },
  {
    id: "patch-priest",
    name: "Patch Priest",
    behavior: "support",
    hp: 45,
    speed: 74,
    damage: 8,
    chipValue: 15,
    color: 0xb784f7,
    accent: 0xffffff,
    radius: 16,
    cooldown: 1400,
    unlockDungeon: 2
  },
  {
    id: "signal-wraith",
    name: "Signal Wraith",
    behavior: "hacker",
    hp: 52,
    speed: 92,
    damage: 11,
    chipValue: 16,
    color: 0x00f5d4,
    accent: 0xf15bb5,
    radius: 15,
    cooldown: 1700,
    unlockDungeon: 2
  }
];

export const bosses: BossDefinition[] = [
  {
    id: "traffic-king",
    name: "Traffic King",
    hp: 260,
    damage: 15,
    speed: 62,
    color: 0xff4d6d,
    accent: 0xffd166,
    flavor: "The ruined downtown grid still obeys its signal tyrant."
  },
  {
    id: "retail-warden",
    name: "Retail Warden",
    hp: 340,
    damage: 18,
    speed: 70,
    color: 0xffa62b,
    accent: 0x4cc9f0,
    flavor: "An automated store sentinel that prices every human life at zero."
  },
  {
    id: "core-seraph",
    name: "Core Seraph",
    hp: 430,
    damage: 22,
    speed: 78,
    color: 0x9b5de5,
    accent: 0x00f5d4,
    flavor: "A cathedral-sized inference engine wearing a combat chassis."
  }
];

export const dungeons: DungeonDefinition[] = [
  {
    id: "downtown",
    name: "Ruined Downtown",
    theme: "downtown",
    danger: 1,
    flavor: "Rain hisses on broken smart roads while signal lights blink commands to nobody.",
    enemyPool: ["scrap-runner", "bulwark"],
    bossId: "traffic-king"
  },
  {
    id: "mall",
    name: "Abandoned Mall",
    theme: "mall",
    danger: 2,
    flavor: "Sale banners hang over empty escalators, watched by patrol drones and checkout scanners.",
    enemyPool: ["scrap-runner", "bulwark", "longshot", "mine-weaver"],
    bossId: "retail-warden"
  },
  {
    id: "factory",
    name: "Automated Data Core",
    theme: "factory",
    danger: 3,
    flavor: "Server heat and assembly arms feed the machine empire from below the city.",
    enemyPool: ["bulwark", "longshot", "mine-weaver", "patch-priest", "signal-wraith"],
    bossId: "core-seraph"
  }
];

export const vendorInventories: VendorInventoryDefinition[] = [
  {
    dungeonId: "downtown",
    items: ["repair-foam", "titan-weave", "rail-rifle", "servo-boots"]
  },
  {
    dungeonId: "mall",
    items: ["repair-foam", "overclock-chip", "scatter-coil", "titan-weave", "servo-boots"]
  },
  {
    dungeonId: "factory",
    items: ["repair-foam", "overclock-chip", "arc-lancer", "titan-weave", "servo-boots"]
  }
];

export const metaUpgrades: MetaUpgradeDefinition[] = [
  {
    id: "reinforced-heart",
    name: "Reinforced Heart",
    description: "Start each run with more max HP.",
    maxLevel: 5,
    baseCost: 45,
    effect: "maxHp",
    amountPerLevel: 12
  },
  {
    id: "combat-firmware",
    name: "Combat Firmware",
    description: "Increase all weapon damage slightly.",
    maxLevel: 5,
    baseCost: 55,
    effect: "damage",
    amountPerLevel: 0.06
  },
  {
    id: "salvage-cache",
    name: "Salvage Cache",
    description: "Keep more chips after a failed run.",
    maxLevel: 4,
    baseCost: 65,
    effect: "retention",
    amountPerLevel: 0.08
  }
];

export function weaponById(id: string): WeaponDefinition {
  return weapons.find((weapon) => weapon.id === id) ?? weapons[0];
}

export function itemById(id: string): ItemDefinition | undefined {
  return items.find((item) => item.id === id);
}

export function enemyById(id: string): EnemyDefinition {
  return enemies.find((enemy) => enemy.id === id) ?? enemies[0];
}

export function bossById(id: string): BossDefinition {
  return bosses.find((boss) => boss.id === id) ?? bosses[0];
}
