import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class GraveMoth extends Enemy {
  public type = EnemyType.GRAVE_MOTH;
  private wingLeft: THREE.Mesh;
  private wingRight: THREE.Mesh;
  private flutterSpeed = 26;
  private hoverY = 2.4;

  constructor(x: number, z: number) {
    super();
    this.name = 'Grave Moth';
    this.health = 25;
    this.maxHealth = 25;
    this.damage = 10;
    this.speed = 5.2;
    this.attackRange = 1.8;
    this.aggroRange = 15;

    this.group.position.set(x, this.hoverY, z);
    this.patrolOrigin.set(x, this.hoverY, z);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f1f27, roughness: 0.8 });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x77bbff,
      emissive: 0x3366aa,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    // Furry moth thorax & abdomen
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 6), bodyMat);
    body.rotation.x = Math.PI / 2;
    this.group.add(body);

    // Glowing moth wings
    const wingGeom = new THREE.PlaneGeometry(0.85, 0.45);
    this.wingLeft = new THREE.Mesh(wingGeom, wingMat);
    this.wingLeft.position.set(-0.45, 0.1, 0);
    this.group.add(this.wingLeft);

    this.wingRight = new THREE.Mesh(wingGeom, wingMat);
    this.wingRight.position.set(0.45, 0.1, 0);
    this.group.add(this.wingRight);
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
      this.group.position.y = Math.max(0, this.group.position.y - delta * 4);
      return { didAttack: false, damage: 0 };
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Wing flutter animation
    const wingFlap = Math.sin(performance.now() * 0.001 * this.flutterSpeed) * 0.8;
    this.wingLeft.rotation.z = wingFlap;
    this.wingRight.rotation.z = -wingFlap;

    const targetPos = playerPos.clone().add(new THREE.Vector3(0, 1.4, 0));
    const dist = this.group.position.distanceTo(targetPos);

    if (dist <= this.aggroRange) {
      this.state = EnemyState.CHASE;
      const dir = targetPos.clone().sub(this.group.position);
      this.group.rotation.y = Math.atan2(dir.x, dir.z);

      if (dist > this.attackRange) {
        dir.normalize();
        this.group.position.addScaledVector(dir, this.speed * delta);
        // Bobbing motion
        this.group.position.y += Math.sin(performance.now() * 0.008) * 0.03;
      } else {
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.3;
          didAttack = true;
          dealtDamage = this.damage;
        }
      }
    }

    return { didAttack, damage: dealtDamage };
  }
}
