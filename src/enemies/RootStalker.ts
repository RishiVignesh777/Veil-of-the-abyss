import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';
import { Enemy } from './Enemy';

export class RootStalker extends Enemy {
  public type = EnemyType.ROOT_STALKER;
  private legs: THREE.Mesh[] = [];
  private runCycle: number = 0;

  constructor(x: number, z: number) {
    super();
    this.name = 'Root Stalker';
    this.health = 65;
    this.maxHealth = 65;
    this.damage = 22;
    this.speed = 5.8;
    this.attackRange = 2.6;
    this.aggroRange = 17;

    this.group.position.set(x, 0, z);

    const rootMat = new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.95 });
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x221728, emissive: 0x441155, emissiveIntensity: 0.5 });

    // Elongated quadruped body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 1.8), rootMat);
    body.position.y = 0.75;
    body.castShadow = true;
    this.group.add(body);

    // Spines on back
    for (let i = 0; i < 4; i++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 4), spineMat);
      spine.position.set(0, 1.15, -0.6 + i * 0.4);
      spine.rotation.x = -Math.PI / 4;
      this.group.add(spine);
    }

    // Corrupted skull head
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 5), rootMat);
    head.position.set(0, 0.85, 1.05);
    head.rotation.x = Math.PI / 2;
    head.castShadow = true;
    this.group.add(head);

    // 4 Jointed root legs
    const legOffsets = [
      { x: -0.45, z: 0.6 },
      { x: 0.45, z: 0.6 },
      { x: -0.45, z: -0.6 },
      { x: 0.45, z: -0.6 }
    ];

    legOffsets.forEach((pos) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.85, 4), rootMat);
      leg.position.set(pos.x, 0.4, pos.z);
      leg.castShadow = true;
      this.legs.push(leg);
      this.group.add(leg);
    });
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
      this.group.position.y = Math.max(-1.0, this.group.position.y - delta * 2);
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
        this.runCycle += delta * 14;
      } else {
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.8;
          didAttack = true;
          dealtDamage = this.damage;
        }
      }
    }

    // Quadruped run animation
    this.legs.forEach((leg, i) => {
      const offset = (i % 2 === 0) ? 0 : Math.PI;
      leg.rotation.x = Math.sin(this.runCycle + offset) * 0.65;
    });

    return { didAttack, damage: dealtDamage };
  }
}
