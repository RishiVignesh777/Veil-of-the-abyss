import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class VeilKnight extends Enemy {
  public type = EnemyType.VEIL_KNIGHT;
  public override isVeilOnly = true;
  private swordMesh: THREE.Mesh;
  private armorMat: THREE.MeshStandardMaterial;

  constructor(x: number, z: number) {
    super();
    this.name = 'Veil Knight';
    this.health = 90;
    this.maxHealth = 90;
    this.damage = 28;
    this.speed = 3.2;
    this.attackRange = 3.0;
    this.aggroRange = 18;

    this.group.position.set(x, 0, z);

    this.armorMat = new THREE.MeshStandardMaterial({
      color: 0x110a18,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x441166,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.95
    });

    // Bulky smoke plate armor
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 0.5), this.armorMat);
    chest.position.y = 1.7;
    chest.castShadow = true;
    this.group.add(chest);

    // Horned Greathelm
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.45, 6), this.armorMat);
    helm.position.y = 2.5;
    helm.castShadow = true;
    this.group.add(helm);

    // Shoulders
    const pauldronGeom = new THREE.BoxGeometry(0.35, 0.35, 0.45);
    const leftP = new THREE.Mesh(pauldronGeom, this.armorMat);
    leftP.position.set(-0.6, 2.1, 0);
    const rightP = new THREE.Mesh(pauldronGeom, this.armorMat);
    rightP.position.set(0.6, 2.1, 0);
    this.group.add(leftP, rightP);

    // Giant Ethereal Greatsword
    const swordGeom = new THREE.BoxGeometry(0.14, 2.4, 0.05);
    const swordMat = new THREE.MeshStandardMaterial({
      color: 0x220533,
      emissive: 0x9922ff,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });
    this.swordMesh = new THREE.Mesh(swordGeom, swordMat);
    this.swordMesh.position.set(0.65, 1.4, 0.4);
    this.swordMesh.rotation.x = Math.PI / 4;
    this.group.add(this.swordMesh);
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerDimension: Dimension,
    _isLanternFocused: boolean
  ): { didAttack: boolean; damage: number } {
    let didAttack = false;
    let dealtDamage = 0;

    // In Waking World, Veil Knight is ghostly and transparent
    if (playerDimension === Dimension.WAKING) {
      this.armorMat.opacity = 0.25;
      this.armorMat.emissiveIntensity = 0.2;
    } else {
      this.armorMat.opacity = 0.95;
      this.armorMat.emissiveIntensity = 0.8;
    }

    if (this.isDead) {
      this.group.position.y = Math.max(-2, this.group.position.y - delta * 2);
      return { didAttack: false, damage: 0 };
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const dist = this.group.position.distanceTo(playerPos);
    if (dist <= this.aggroRange) {
      this.state = EnemyState.CHASE;
      const dir = playerPos.clone().sub(this.group.position);
      dir.y = 0;
      this.group.rotation.y = Math.atan2(dir.x, dir.z);

      if (dist > this.attackRange) {
        dir.normalize();
        this.group.position.addScaledVector(dir, this.speed * delta);
      } else {
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 2.0;
          didAttack = true;
          dealtDamage = this.damage;
          // Heavy swing animation
          this.swordMesh.rotation.x = -Math.PI / 3;
        }
      }
    }

    this.swordMesh.rotation.x = THREE.MathUtils.lerp(this.swordMesh.rotation.x, Math.PI / 4, delta * 4);

    return { didAttack, damage: dealtDamage };
  }
}
