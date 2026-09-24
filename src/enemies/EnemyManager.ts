import * as THREE from 'three';
import { Dimension, BossInfo } from '../types/game';
import { Enemy } from './Enemy';
import { Hollowed } from './Hollowed';
import { GraveMoth } from './GraveMoth';
import { RootStalker } from './RootStalker';
import { VeilKnight } from './VeilKnight';
import { Watcher } from './Watcher';
import { Gravedigger } from './Gravedigger';
import { HollowSaint } from './HollowSaint';
import { ParticleManager } from '../effects/ParticleManager';
import { AudioManager } from '../audio/AudioManager';
import { Inventory } from '../items/Inventory';

export class EnemyManager {
  public scene: THREE.Scene;
  public enemies: Enemy[] = [];
  public activeBoss: Enemy | null = null;
  private particleManager: ParticleManager;
  private audioManager: AudioManager;
  private inventory: Inventory;

  constructor(scene: THREE.Scene, particleManager: ParticleManager, audioManager: AudioManager, inventory: Inventory) {
    this.scene = scene;
    this.particleManager = particleManager;
    this.audioManager = audioManager;
    this.inventory = inventory;

    this.spawnWorldEnemies();
  }

  private spawnWorldEnemies() {
    // 1. Village perimeter encounters (The Hollowed)
    const h1 = new Hollowed(-5, 12);
    const h2 = new Hollowed(7, 18);
    const h3 = new Hollowed(-10, 26);
    this.addEnemy(h1);
    this.addEnemy(h2);
    this.addEnemy(h3);

    // 2. Near chasm: Grave Moths
    const m1 = new GraveMoth(-4, 32);
    const m2 = new GraveMoth(5, 33);
    this.addEnemy(m1);
    this.addEnemy(m2);

    // 3. Past the chasm: Root Stalker lurking near cemetery gates
    const s1 = new RootStalker(-8, 48);
    this.addEnemy(s1);

    // 4. In Cemetery: First Mini-Boss "The Gravedigger"
    const gravedigger = new Gravedigger(0, 72);
    this.addEnemy(gravedigger);

    // 5. Cemetery crypt guard: Veil Knight (requires Veil shift to defeat!)
    const vk1 = new VeilKnight(12, 68);
    this.addEnemy(vk1);

    // 6. Occult Watcher high above cemetery mausoleum
    const watcher = new Watcher(0, 8, 92);
    this.addEnemy(watcher);

    // 7. Cathedral inner sanctum: The Hollow Saint
    const hollowSaint = new HollowSaint(0, 5, 138);
    this.addEnemy(hollowSaint);
  }

  public addEnemy(enemy: Enemy) {
    this.enemies.push(enemy);
    this.scene.add(enemy.group);
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerDimension: Dimension,
    isLanternFocused: boolean
  ): { playerDamageTaken: number; bossInfo: BossInfo | null } {
    let totalPlayerDmg = 0;
    let currentBossInfo: BossInfo | null = null;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isDead) continue;

      const { didAttack, damage } = enemy.update(delta, playerPos, playerDimension, isLanternFocused);

      if (didAttack && damage > 0) {
        totalPlayerDmg += damage;
        this.particleManager.emitHitSparks(playerPos, false);
        this.audioManager.playPlayerHurt();
      }

      // Check if boss is currently engaged
      if (enemy.isBoss && enemy.group.position.distanceTo(playerPos) <= enemy.aggroRange) {
        this.activeBoss = enemy;
        currentBossInfo = {
          id: enemy.name,
          name: enemy.name,
          title: enemy.isBoss ? (enemy.name === 'The Gravedigger' ? 'Scourge of the Village' : 'Avatar of the Void') : '',
          currentHealth: enemy.health,
          maxHealth: enemy.maxHealth,
          phase: (enemy as Gravedigger).phase || 1
        };
      }
    }

    return { playerDamageTaken: totalPlayerDmg, bossInfo: currentBossInfo };
  }

  public damageEnemy(
    enemy: Enemy,
    damage: number,
    dimension: Dimension
  ): { killed: boolean; damageDealt: number; shielded: boolean } {
    const result = enemy.takeDamage(damage, dimension);

    if (result.damageDealt > 0) {
      this.particleManager.emitHitSparks(enemy.group.position, damage > 30);
      this.audioManager.playHit(damage > 30);

      if (result.killed) {
        this.audioManager.playEnemyRoar();
        // Drop rewards
        const shardReward = enemy.isBoss ? 45 : Math.floor(6 + Math.random() * 8);
        const coinReward = enemy.isBoss ? 25 : Math.floor(3 + Math.random() * 5);
        this.inventory.addShards(shardReward);
        this.inventory.addCoins(coinReward);
        this.audioManager.playItemPickup();
      }
    }

    return result;
  }
}
