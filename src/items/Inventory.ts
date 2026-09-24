import { InventoryItem, Upgrades } from '../types/game';

export class Inventory {
  public items: Map<string, InventoryItem> = new Map();
  public shards: number = 30; // Starting shards for gameplay experimentation
  public coins: number = 15;

  public upgrades: Upgrades = {
    veilblade: {
      level: 1,
      maxLevel: 5,
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      cost: 25
    },
    lantern: {
      level: 1,
      maxLevel: 5,
      lightRadius: 16,
      shadowBurn: 10,
      cost: 20
    },
    veilborn: {
      level: 1,
      maxLevel: 5,
      maxHealth: 100,
      dodgeDistance: 5.5,
      cost: 30
    }
  };

  constructor() {
    this.initDefaultItems();
  }

  private initDefaultItems() {
    this.addItem({
      id: 'veil_shards',
      name: 'Veil Shards',
      count: this.shards,
      maxCount: 999,
      description: 'Fractured shards of the abyss. Used to upgrade artifacts.',
      lore: 'The Hollow tears reality apart, leaving these crystallized tears of the cosmos.',
      iconName: 'Sparkles',
      type: 'shard'
    });

    this.addItem({
      id: 'ancient_coins',
      name: 'Ancient Coins',
      count: this.coins,
      maxCount: 999,
      description: 'Heirloom currency from the fallen dynasty.',
      lore: 'Inscribed with the symbol of the dual moon.',
      iconName: 'Coins',
      type: 'coin'
    });

    this.addItem({
      id: 'healing_essence',
      name: 'Healing Essence',
      count: 2,
      maxCount: 10,
      description: 'Restores 45 Health when consumed.',
      lore: 'Condensed dew collected from deep silverwood roots.',
      iconName: 'Heart',
      type: 'essence'
    });

    this.addItem({
      id: 'lantern_fuel',
      name: 'Abyssal Oil',
      count: 1,
      maxCount: 5,
      description: 'Supercharges the Grave Lantern with blinding exorcism radiance.',
      lore: 'Extract of celestial moths who perished inside the Void.',
      iconName: 'Flame',
      type: 'fuel'
    });
  }

  public addItem(item: InventoryItem) {
    if (this.items.has(item.id)) {
      const existing = this.items.get(item.id)!;
      existing.count = Math.min(existing.maxCount, existing.count + item.count);
    } else {
      this.items.set(item.id, { ...item });
    }
    if (item.id === 'veil_shards') this.shards = this.items.get('veil_shards')!.count;
    if (item.id === 'ancient_coins') this.coins = this.items.get('ancient_coins')!.count;
  }

  public addShards(amount: number) {
    this.shards += amount;
    const shardItem = this.items.get('veil_shards');
    if (shardItem) shardItem.count = this.shards;
  }

  public addCoins(amount: number) {
    this.coins += amount;
    const coinItem = this.items.get('ancient_coins');
    if (coinItem) coinItem.count = this.coins;
  }

  public useHealingEssence(): boolean {
    const item = this.items.get('healing_essence');
    if (item && item.count > 0) {
      item.count--;
      return true;
    }
    return false;
  }

  public upgradeVeilblade(): boolean {
    const up = this.upgrades.veilblade;
    if (up.level < up.maxLevel && this.shards >= up.cost) {
      this.shards -= up.cost;
      up.level++;
      up.damageMultiplier = 1.0 + (up.level - 1) * 0.35;
      up.attackSpeedMultiplier = 1.0 + (up.level - 1) * 0.15;
      up.cost = Math.floor(up.cost * 1.6);
      this.syncShardCount();
      return true;
    }
    return false;
  }

  public upgradeLantern(): boolean {
    const up = this.upgrades.lantern;
    if (up.level < up.maxLevel && this.shards >= up.cost) {
      this.shards -= up.cost;
      up.level++;
      up.lightRadius = 16 + (up.level - 1) * 4;
      up.shadowBurn = 10 + (up.level - 1) * 8;
      up.cost = Math.floor(up.cost * 1.5);
      this.syncShardCount();
      return true;
    }
    return false;
  }

  public upgradeVeilborn(): boolean {
    const up = this.upgrades.veilborn;
    if (up.level < up.maxLevel && this.shards >= up.cost) {
      this.shards -= up.cost;
      up.level++;
      up.maxHealth = 100 + (up.level - 1) * 25;
      up.dodgeDistance = 5.5 + (up.level - 1) * 0.8;
      up.cost = Math.floor(up.cost * 1.7);
      this.syncShardCount();
      return true;
    }
    return false;
  }

  private syncShardCount() {
    const s = this.items.get('veil_shards');
    if (s) s.count = this.shards;
  }
}
