import * as THREE from 'three';
import { Dimension, PlayerAnimState, CombatHit } from '../types/game';
import { Nyra } from '../player/Nyra';
import { EnemyManager } from '../enemies/EnemyManager';
import { ParticleManager } from '../effects/ParticleManager';
import { AudioManager } from '../audio/AudioManager';
import { CameraController } from '../core/CameraController';
import { Inventory } from '../items/Inventory';

export class CombatSystem {
  private nyra: Nyra;
  private enemyManager: EnemyManager;
  private particleManager: ParticleManager;
  private audioManager: AudioManager;
  private cameraController: CameraController;
  private inventory: Inventory;

  public comboStep: number = 0;
  public comboTimer: number = 0;
  public attackCooldown: number = 0;
  public dodgeCooldown: number = 0;
  public readonly maxDodgeCooldown: number = 0.8;
  public recentHits: CombatHit[] = [];

  constructor(
    nyra: Nyra,
    enemyManager: EnemyManager,
    particleManager: ParticleManager,
    audioManager: AudioManager,
    cameraController: CameraController,
    inventory: Inventory
  ) {
    this.nyra = nyra;
    this.enemyManager = enemyManager;
    this.particleManager = particleManager;
    this.audioManager = audioManager;
    this.cameraController = cameraController;
    this.inventory = inventory;
  }

  public update(delta: number) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboStep = 0;
      }
    }
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;

    // Filter recent hits for HUD popup damage numbers
    const now = performance.now();
    this.recentHits = this.recentHits.filter((hit) => now - hit.timestamp < 1200);
  }

  public executeLightAttack(currentDimension: Dimension): boolean {
    if (this.attackCooldown > 0 || this.nyra.state === PlayerAnimState.DODGE) return false;

    this.comboStep = (this.comboStep % 3) + 1;
    this.comboTimer = 1.0;
    this.attackCooldown = 0.32 / this.inventory.upgrades.veilblade.attackSpeedMultiplier;

    this.nyra.state = PlayerAnimState.ATTACK;
    this.nyra.stateTime = 0;

    this.audioManager.playSwordSwing(false);
    this.particleManager.emitShadowTrail(this.nyra.group.position);

    // Compute base attack damage
    const baseDamage = 22 * this.inventory.upgrades.veilblade.damageMultiplier;
    const comboMod = this.comboStep === 3 ? 1.5 : 1.0;
    const finalDamage = Math.round(baseDamage * comboMod);

    this.performAttackHitCheck(finalDamage, 3.2, 1.2, currentDimension, this.comboStep === 3);
    return true;
  }

  public executeHeavyAttack(currentDimension: Dimension): boolean {
    if (this.attackCooldown > 0 || this.nyra.state === PlayerAnimState.DODGE) return false;

    this.attackCooldown = 0.75 / this.inventory.upgrades.veilblade.attackSpeedMultiplier;
    this.nyra.state = PlayerAnimState.HEAVY_ATTACK;
    this.nyra.stateTime = 0;

    this.audioManager.playSwordSwing(true);
    this.cameraController.shake(0.35);

    const baseDamage = 48 * this.inventory.upgrades.veilblade.damageMultiplier;
    const finalDamage = Math.round(baseDamage);

    this.performAttackHitCheck(finalDamage, 4.2, 2.0, currentDimension, true);
    return true;
  }

  public executeDodge(moveDir: THREE.Vector3): boolean {
    if (this.dodgeCooldown > 0 || this.nyra.state === PlayerAnimState.DODGE) return false;

    this.dodgeCooldown = this.maxDodgeCooldown;
    this.nyra.state = PlayerAnimState.DODGE;
    this.nyra.stateTime = 0;
    this.nyra.isInvulnerable = true;
    this.nyra.invulnerabilityTimer = 0.35; // 0.35s I-frames

    // Dodge impulse
    const dodgeDist = this.inventory.upgrades.veilborn.dodgeDistance;
    const impulse = moveDir.lengthSq() > 0.01 ? moveDir.clone().normalize() : new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.nyra.group.rotation.y);
    this.nyra.velocity.copy(impulse.multiplyScalar(dodgeDist * 3.2));

    this.audioManager.playDodge();
    this.particleManager.emitShadowTrail(this.nyra.group.position);
    return true;
  }

  private performAttackHitCheck(
    damage: number,
    range: number,
    spreadAngle: number,
    dimension: Dimension,
    isCrit: boolean
  ) {
    const playerPos = this.nyra.group.position;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.nyra.group.rotation.y);

    let hitAny = false;

    for (const enemy of this.enemyManager.enemies) {
      if (enemy.isDead) continue;

      const enemyPos = enemy.group.position;
      const toEnemy = enemyPos.clone().sub(playerPos);
      toEnemy.y = 0;
      const dist = toEnemy.length();

      if (dist <= range) {
        toEnemy.normalize();
        const angle = forward.angleTo(toEnemy);

        if (angle <= spreadAngle / 2) {
          const res = this.enemyManager.damageEnemy(enemy, damage, dimension);
          if (res.damageDealt > 0) {
            hitAny = true;
            this.cameraController.shake(isCrit ? 0.4 : 0.2);

            // Record combat hit for UI floating text
            this.recentHits.push({
              damage: res.damageDealt,
              isCrit,
              position: { x: enemyPos.x, y: enemyPos.y + 1.5, z: enemyPos.z },
              timestamp: performance.now()
            });

            // Knockback
            const knockback = forward.clone().multiplyScalar(isCrit ? 3.5 : 1.8);
            enemy.group.position.add(knockback);
          }
        }
      }
    }

    if (hitAny) {
      this.particleManager.emitHitSparks(playerPos.clone().add(forward.multiplyScalar(1.5)), isCrit);
    }
  }
}
