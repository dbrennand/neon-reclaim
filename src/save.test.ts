import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { metaUpgrades } from "./data";
import { defaultSave, loadSave, resetSave, saveGame } from "./save";
import type { SaveState } from "./types";

function createLocalStorageMock(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    })
  };
}

describe("save helpers", () => {
  let localStorage: Storage;

  beforeEach(() => {
    localStorage = createLocalStorageMock();
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates defaults for all permanent upgrade tracks", () => {
    const save = defaultSave();

    expect(save.retainedChips).toBe(0);
    expect(save.totalRuns).toBe(0);
    expect(save.unlockedBlueprints).toEqual(["pulse-pistol"]);
    expect(save.discoveredEnemies).toEqual([]);
    expect(save.muted).toBe(false);
    expect(save.metaUpgrades).toEqual(Object.fromEntries(metaUpgrades.map((upgrade) => [upgrade.id, 0])));
  });

  it("loads defaults when no save exists or stored JSON is invalid", () => {
    expect(loadSave()).toEqual(defaultSave());

    localStorage.setItem("neon-reclaim-save-v1", "{invalid");

    expect(loadSave()).toEqual(defaultSave());
  });

  it("migrates partial saves without dropping known upgrade defaults", () => {
    localStorage.setItem(
      "neon-reclaim-save-v1",
      JSON.stringify({
        retainedChips: 90,
        totalRuns: 4,
        metaUpgrades: {
          "combat-firmware": 2
        }
      } satisfies Partial<SaveState>)
    );

    expect(loadSave()).toEqual({
      ...defaultSave(),
      retainedChips: 90,
      totalRuns: 4,
      metaUpgrades: {
        ...defaultSave().metaUpgrades,
        "combat-firmware": 2
      }
    });
  });

  it("persists and resets saves through localStorage", () => {
    const save = {
      ...defaultSave(),
      retainedChips: 120,
      muted: true
    };

    saveGame(save);

    expect(loadSave()).toEqual(save);
    expect(resetSave()).toEqual(defaultSave());
    expect(loadSave()).toEqual(defaultSave());
  });
});
