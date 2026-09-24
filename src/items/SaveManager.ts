import { Inventory } from './Inventory';
import { Nyra } from '../player/Nyra';

export interface SaveData {
  health: number;
  maxHealth: number;
  shards: number;
  coins: number;
  checkpoint: { x: number; y: number; z: number };
  defeatedBosses: string[];
  unlockedGates: string[];
  upgrades: {
    veilblade: number;
    lantern: number;
    veilborn: number;
  };
}

const SAVE_KEY = 'veil_of_the_abyss_save_v1';

export class SaveManager {
  public static save(
    nyra: Nyra,
    inventory: Inventory,
    checkpoint: { x: number; y: number; z: number },
    defeatedBosses: string[],
    unlockedGates: string[]
  ): boolean {
    try {
      const data: SaveData = {
        health: nyra.health,
        maxHealth: nyra.maxHealth,
        shards: inventory.shards,
        coins: inventory.coins,
        checkpoint,
        defeatedBosses,
        unlockedGates,
        upgrades: {
          veilblade: inventory.upgrades.veilblade.level,
          lantern: inventory.upgrades.lantern.level,
          veilborn: inventory.upgrades.veilborn.level
        }
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  public static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  public static clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }
}
