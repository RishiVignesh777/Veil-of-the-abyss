import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class HollowSaint extends Enemy {
  public type = EnemyType.HOLLOW_SAINT;
  public override isBoss = true;

  private haloRing: THREE.Mesh;
  private blackHoleCore: THREE.Mesh;
  private arms: THREE.Group[] = [];
  public phase: number = 1;

  constructor(x: number, y: number, z: number) {
    super();
    this.name = 'The Hollow Saint';
    this.health = 500;
    this.maxHealth = 500;
    this.damage = 32;
    this.speed = 4.2;
    this.attackRange = 16;
    this.aggroRange = 35;

    this.group.position.set(x, y, z);

    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x08040d,
      roughness: 0.6,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    const haloMat = new THREE.MeshStandardMaterial({
      color: 0x220533,
      emissive: 0xaa22ff,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });

    // Flowing ethereal robes
    const robes = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.2, 5.0, 12, 1, true), robeMat);
    robes.position.y = 2.0;
    this.group.add(robes);

    // Glowing black hole head
    const holeGeom = new THREE.SphereGeometry(0.8, 16, 16);
    this.blackHoleCore = new THREE.Mesh(
      holeGeom,
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    this.blackHoleCore.position.y = 5.2;
    this.group.add(this.blackHoleCore);

    // Event horizon glowing rim
    const rimGeom = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
    const rim = new THREE.Mesh(rimGeom, haloMat);
    rim.position.y = 5.2;
    this.group.add(rim);

    // Giant cosmic halo ring behind body
    const haloGeom = new THREE.TorusGeometry(3.6, 0.12, 8, 36);
    this.haloRing = new THREE.Mesh(haloGeom, haloMat);
    this.haloRing.position.set(0, 4.0, -0.6);
    this.group.add(this.haloRing);

    // 6 Floating ethereal arms
    for (let i = 0; i < 6; i++) {
      const armGroup = new THREE.Group();
      const armMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.05, 2.6, 6),
        robeMat
      );
      armMesh.position.y = -1.2;
      armGroup.add(armMesh);

      const side = i % 2 === 0 ? -1 : 1;
      const heightLevel = Math.floor(i / 2);
      armGroup.position.set(side * (1.6 + heightLevel * 0.4), 3.0 + heightLevel * 1.0, 0.2);
      this.arms.push(armGroup);
      this.group.add(armGroup);
    }
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    _playerDimension: Dimension,
    isLanternFocused: boolean
  ): { didAttack: boolean; damage: number } {
    let didAttack = false;
    let dealtDamage = 0;

    if (this.isDead) {
      this.group.position.y -= delta * 3;
      return { didAttack: false, damage: 0 };
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Rotate halo ring
    this.haloRing.rotation.z += delta * 0.8;
    this.group.position.y += Math.sin(performance.now() * 0.002) * 0.015;

    // Face player smoothly
    const lookTarget = playerPos.clone();
    lookTarget.y = this.group.position.y;
    this.group.lookAt(lookTarget);

    // Animate 6 floating arms
    const time = performance.now() * 0.003;
    this.arms.forEach((arm, i) => {
      arm.rotation.z = Math.sin(time + i * 1.1) * 0.4;
      arm.rotation.x = Math.cos(time + i * 0.8) * 0.3;
    });

    const dist = this.group.position.distanceTo(playerPos);
    if (dist <= this.aggroRange && this.attackCooldown <= 0) {
      this.attackCooldown = 3.0;
      didAttack = true;
      // If lantern is focused, boss takes vulnerability, otherwise deals heavy shadow barrage
      dealtDamage = isLanternFocused ? 12 : this.damage;
    }

    return { didAttack, damage: dealtDamage };
  }
}
