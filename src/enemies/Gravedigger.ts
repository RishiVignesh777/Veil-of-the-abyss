import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class Gravedigger extends Enemy {
  public type = EnemyType.GRAVEDIGGER;
  public override isBoss = true;

  // Boss Model Components
  private shovelMesh: THREE.Group;
  private burialMask: THREE.Mesh;
  private torsoMesh: THREE.Mesh;
  private armLeft: THREE.Mesh;
  private armRight: THREE.Group;

  // Boss attack patterns
  public phase: number = 1;
  public attackType: 'SLAM' | 'BURROW' | 'CHARGE' | 'PROJECTILE' | 'NONE' = 'NONE';
  private attackDuration: number = 0;
  private shockwaveMeshes: THREE.Mesh[] = [];
  public shockwaveActive: boolean = false;
  public shockwaveRadius: number = 0;

  constructor(x: number, z: number) {
    super();
    this.name = 'The Gravedigger';
    this.health = 320;
    this.maxHealth = 320;
    this.damage = 25;
    this.speed = 3.8;
    this.attackRange = 4.2;
    this.aggroRange = 28;

    this.group.position.set(x, 0, z);

    const fleshMat = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.8
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x16171b,
      metalness: 0.9,
      roughness: 0.3
    });

    const maskMat = new THREE.MeshStandardMaterial({
      color: 0xc8c3b8,
      roughness: 0.4
    });

    // Massive hunched torso
    const torsoGeom = new THREE.BoxGeometry(1.8, 2.2, 1.4);
    this.torsoMesh = new THREE.Mesh(torsoGeom, fleshMat);
    this.torsoMesh.position.y = 2.0;
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);

    // Broken burial mask head
    const headGeom = new THREE.SphereGeometry(0.55, 12, 12);
    const head = new THREE.Mesh(headGeom, fleshMat);
    head.position.set(0, 3.2, 0.4);
    head.castShadow = true;
    this.group.add(head);

    this.burialMask = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.2), maskMat);
    this.burialMask.position.set(0, 3.2, 0.85);
    this.burialMask.castShadow = true;
    this.group.add(this.burialMask);

    // Left massive clawed arm
    this.armLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 2.4, 6), fleshMat);
    this.armLeft.position.set(-1.1, 2.0, 0);
    this.armLeft.castShadow = true;
    this.group.add(this.armLeft);

    // Right arm holding gigantic graveyard shovel
    this.armRight = new THREE.Group();
    this.armRight.position.set(1.1, 2.4, 0);

    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 2.4, 6), fleshMat);
    rightArmMesh.position.y = -1.0;
    rightArmMesh.castShadow = true;
    this.armRight.add(rightArmMesh);

    // Giant shovel weapon
    this.shovelMesh = new THREE.Group();
    const shovelHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.8, 8), ironMat);
    shovelHandle.castShadow = true;

    const shovelBlade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.08), ironMat);
    shovelBlade.position.y = 2.4;
    shovelBlade.castShadow = true;

    this.shovelMesh.add(shovelHandle, shovelBlade);
    this.shovelMesh.position.set(0, -1.8, 0.6);
    this.shovelMesh.rotation.x = Math.PI / 4;
    this.armRight.add(this.shovelMesh);

    this.group.add(this.armRight);

    // Giant legs
    const legGeom = new THREE.CylinderGeometry(0.3, 0.25, 1.4, 6);
    const legL = new THREE.Mesh(legGeom, fleshMat);
    legL.position.set(-0.55, 0.7, 0);
    legL.castShadow = true;

    const legR = new THREE.Mesh(legGeom, fleshMat);
    legR.position.set(0.55, 0.7, 0);
    legR.castShadow = true;

    this.group.add(legL, legR);
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerDimension: Dimension,
    _isLanternFocused: boolean
  ): { didAttack: boolean; damage: number } {
    let didAttack = false;
    let dealtDamage = 0;

    if (this.isDead) {
      this.group.position.y = Math.max(-3, this.group.position.y - delta * 1.5);
      return { didAttack: false, damage: 0 };
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Phase 2 transition at 50% health: enraged
    if (this.health < this.maxHealth * 0.5) {
      this.phase = 2;
      this.speed = 5.2;
    }

    const dist = this.group.position.distanceTo(playerPos);

    if (dist <= this.aggroRange) {
      const dir = playerPos.clone().sub(this.group.position);
      dir.y = 0;
      this.group.rotation.y = Math.atan2(dir.x, dir.z);

      if (this.attackType === 'NONE') {
        if (dist > this.attackRange) {
          dir.normalize();
          this.group.position.addScaledVector(dir, this.speed * delta);
        } else if (this.attackCooldown <= 0) {
          // Select attack
          const roll = Math.random();
          if (roll < 0.5) {
            this.attackType = 'SLAM';
            this.attackDuration = 1.0;
          } else if (roll < 0.8) {
            this.attackType = 'CHARGE';
            this.attackDuration = 1.2;
          } else {
            this.attackType = 'PROJECTILE';
            this.attackDuration = 0.8;
          }
          this.attackCooldown = 2.4;
        }
      } else {
        // Execute ongoing attack animation
        this.attackDuration -= delta;
        if (this.attackType === 'SLAM') {
          // Raise shovel high then smash down
          const progress = 1.0 - this.attackDuration / 1.0;
          if (progress < 0.6) {
            this.armRight.rotation.x = -progress * 2.5;
          } else {
            this.armRight.rotation.x = 1.5;
            if (progress > 0.7 && !this.shockwaveActive) {
              this.shockwaveActive = true;
              this.shockwaveRadius = 1.0;
              // Ground slam hits in radius
              if (dist <= 6.5) {
                // If in Waking World, full damage; if player shifted to Veil, reduced or avoided!
                const dmgMod = playerDimension === Dimension.VEIL ? 0.3 : 1.0;
                didAttack = true;
                dealtDamage = Math.round(this.damage * dmgMod);
              }
            }
          }
        } else if (this.attackType === 'CHARGE') {
          // Rapid forward bull-rush
          const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);
          this.group.position.addScaledVector(forward, 9.0 * delta);
          if (dist <= 3.0) {
            didAttack = true;
            dealtDamage = 18;
          }
        }

        if (this.attackDuration <= 0) {
          this.attackType = 'NONE';
          this.armRight.rotation.x = 0;
          this.shockwaveActive = false;
        }
      }
    }

    return { didAttack, damage: dealtDamage };
  }
}
