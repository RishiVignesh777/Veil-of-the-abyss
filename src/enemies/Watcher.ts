import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class Watcher extends Enemy {
  public type = EnemyType.WATCHER;
  private eyeMesh: THREE.Mesh;
  private pupilMesh: THREE.Mesh;
  private tendrilsGroup: THREE.Group;

  constructor(x: number, y: number, z: number) {
    super();
    this.name = 'The Watcher';
    this.health = 80;
    this.maxHealth = 80;
    this.damage = 12; // Gaze drain per tick
    this.speed = 0; // Stationary
    this.attackRange = 22;
    this.aggroRange = 25;

    this.group.position.set(x, y, z);

    // Occult eye sphere
    const eyeGeom = new THREE.SphereGeometry(1.2, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x992200,
      emissive: 0x660000,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });
    this.eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
    this.group.add(this.eyeMesh);

    // Giant slit pupil
    const pupilGeom = new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.pupilMesh = new THREE.Mesh(pupilGeom, pupilMat);
    this.pupilMesh.position.z = 1.1;
    this.pupilMesh.rotation.z = Math.PI / 2;
    this.group.add(this.pupilMesh);

    // Floating tendrils
    this.tendrilsGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tendril = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 2.5, 4),
        new THREE.MeshStandardMaterial({ color: 0x140a18 })
      );
      tendril.position.set(Math.cos(angle) * 1.3, -1.2, Math.sin(angle) * 1.3);
      this.tendrilsGroup.add(tendril);
    }
    this.group.add(this.tendrilsGroup);
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

    // Eye rotates to track player continuously
    const eyePos = this.group.position.clone();
    const lookDir = playerPos.clone().sub(eyePos);
    this.group.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);

    // Animate hovering & tendril writhe
    this.group.position.y += Math.sin(performance.now() * 0.002) * 0.008;
    this.tendrilsGroup.rotation.y += delta * 0.5;

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const dist = eyePos.distanceTo(playerPos);
    if (dist <= this.attackRange && !isLanternFocused) {
      // If lantern is NOT focused to blind it, the watcher's gaze damages the player!
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1.2;
        didAttack = true;
        dealtDamage = this.damage;
      }
    }

    return { didAttack, damage: dealtDamage };
  }
}
