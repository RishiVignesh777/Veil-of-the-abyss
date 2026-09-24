export enum Dimension {
  WAKING = 'WAKING',
  VEIL = 'VEIL'
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  INVENTORY = 'INVENTORY',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum PlayerAnimState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  DASH = 'DASH',
  ATTACK = 'ATTACK',
  HEAVY_ATTACK = 'HEAVY_ATTACK',
  DODGE = 'DODGE',
  HIT = 'HIT',
  DEATH = 'DEATH',
  SHIFTING = 'SHIFTING',
  LANTERN_CAST = 'LANTERN_CAST'
}

export enum EnemyType {
  HOLLOWED = 'HOLLOWED',
  GRAVE_MOTH = 'GRAVE_MOTH',
  ROOT_STALKER = 'ROOT_STALKER',
  VEIL_KNIGHT = 'VEIL_KNIGHT',
  WATCHER = 'WATCHER',
  GRAVEDIGGER = 'GRAVEDIGGER',
  HOLLOW_SAINT = 'HOLLOW_SAINT'
}

export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  INVESTIGATE = 'INVESTIGATE',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK',
  RETREAT = 'RETREAT',
  STUNNED = 'STUNNED',
  DEAD = 'DEAD'
}

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  maxCount: number;
  description: string;
  lore: string;
  iconName: string;
  type: 'shard' | 'coin' | 'essence' | 'fuel' | 'relic';
}

export interface Upgrades {
  veilblade: {
    level: number;
    maxLevel: number;
    damageMultiplier: number;
    attackSpeedMultiplier: number;
    cost: number;
  };
  lantern: {
    level: number;
    maxLevel: number;
    lightRadius: number;
    shadowBurn: number;
    cost: number;
  };
  veilborn: {
    level: number;
    maxLevel: number;
    maxHealth: number;
    dodgeDistance: number;
    cost: number;
  };
}

export interface InteractionPrompt {
  id: string;
  title: string;
  actionText: string;
  key: string;
}

export interface BossInfo {
  id: string;
  name: string;
  title: string;
  currentHealth: number;
  maxHealth: number;
  phase: number;
}

export interface CombatHit {
  damage: number;
  isCrit: boolean;
  position: { x: number; y: number; z: number };
  timestamp: number;
}
