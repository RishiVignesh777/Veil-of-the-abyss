import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class Hollowed extends Enemy {
  public type = EnemyType.HOLLOWED;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private head: THREE.Mesh;
  private legLeft: THREE.Mesh;
  private legRight: THREE.Mesh;
  private walkPhase: number = 0;

  constructor(x: number, z: number) {
    super();
    this.name = 'The Hollowed';
    this.health = 45;
    this.maxHealth = 45;
    this.damage = 16;
    this.speed = 3.6;
    this.attackRange = 2.4;
    this.aggroRange = 16;

    this.group.position.set(x, 0, z);
    this.patrolOrigin.set(x, 0, z);
    this.patrolTarget.set(x + (Math.random() - 0.5) * 6, 0, z + (Math.random() - 0.5) * 6);

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111216,
      roughness: 0.85
    });

    // Tall, gaunt torso
    const torsoGeom = new THREE.CylinderGeometry(0.2, 0.15, 1.4, 6);
    this.torso = new THREE.Mesh(torsoGeom, darkMat);
    this.torso.position.y = 1.5;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Faceless elongated head
    const headGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.45, 6);
    this.head = new THREE.Mesh(headGeom, darkMat);
    this.head.position.y = 2.4;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Unnaturally long arms
    const armGeom = new THREE.CylinderGeometry(0.045, 0.035, 1.35, 5);
    this.leftArm = new THREE.Mesh(armGeom, darkMat);
    this.leftArm.position.set(-0.35, 1.6, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, darkMat);
    this.rightArm.position.set(0.35, 1.6, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // Thin spindly legs
    const legGeom = new THREE.CylinderGeometry(0.06, 0.04, 1.1, 5);
    this.legLeft = new THREE.Mesh(legGeom, darkMat);
    this.legLeft.position.set(-0.16, 0.55, 0);
    this.legLeft.castShadow = true;
    this.group.add(this.legLeft);

    this.legRight = new THREE.Mesh(legGeom, darkMat);
    this.legRight.position.set(0.16, 0.55, 0);
    this.legRight.castShadow = true;
    this.group.add(this.legRight);
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    _playerDimension: Dimension,
    _isLanternFocused: boolean
  ): { didAttack: boolean; damage: number } {
    let didAttack = false;
    let dealtDamage = 0;

    if (this.isDead) {
      this.group.position.y = Math.max(-1.5, this.group.position.y - delta * 2);
      this.torso.rotation.x = Math.PI / 2;
      return { didAttack: false, damage: 0 };
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    if (this.hitTimer > 0) {
      this.hitTimer -= delta;
    }

    const distToPlayer = this.group.position.distanceTo(playerPos);

    // AI state machine
    if (distToPlayer <= this.aggroRange) {
      this.state = EnemyState.CHASE;
    }

    if (this.state === EnemyState.CHASE) {
      // Look at player
      const dir = playerPos.clone().sub(this.group.position);
      dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        this.group.rotation.y = Math.atan2(dir.x, dir.z);
      }

      if (distToPlayer > this.attackRange) {
        // Move towards player
        dir.normalize();
        this.group.position.addScaledVector(dir, this.speed * delta);
        this.walkPhase += delta * 9;
      } else {
        // In attack range
        if (this.attackCooldown <= 0) {
          this.state = EnemyState.ATTACK;
          this.attackCooldown = this.maxAttackCooldown;
          this.stateTimer = 0;
          didAttack = true;
          dealtDamage = this.damage;
        }
      }
    } else {
      // Idle / Patrol twitching
      this.walkPhase += delta * 2;
    }

    // Unnatural jerking animation
    const armSwing = Math.sin(this.walkPhase) * 0.8;
    this.leftArm.rotation.x = armSwing + (this.state === EnemyState.ATTACK ? -1.2 : 0);
    this.rightArm.rotation.x = -armSwing + (this.state === EnemyState.ATTACK ? -1.2 : 0);
    this.head.rotation.z = Math.sin(this.walkPhase * 1.5) * 0.2;
    this.legLeft.rotation.x = -armSwing * 0.7;
    this.legRight.rotation.x = armSwing * 0.7;

    return { didAttack, damage: dealtDamage };
  }
}
