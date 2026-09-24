import * as THREE from 'three';
import { Dimension, EnemyState, EnemyType } from '../types/game';

export abstract class Enemy {
  public group: THREE.Group;
  public abstract type: EnemyType;
  public name: string = 'Creature';
  public state: EnemyState = EnemyState.IDLE;
  public health: number = 50;
  public maxHealth: number = 50;
  public damage: number = 15;
  public speed: number = 3.5;
  public isBoss: boolean = false;
  public isDead: boolean = false;
  public isVeilOnly: boolean = false; // If true, only vulnerable or present in Veil

  public attackRange: number = 2.2;
  public aggroRange: number = 14.0;
  public attackCooldown: number = 0;
  public readonly maxAttackCooldown: number = 1.6;
  public hitTimer: number = 0;

  protected stateTimer: number = 0;
  protected patrolOrigin: THREE.Vector3 = new THREE.Vector3();
  protected patrolTarget: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();
  }

  public takeDamage(amount: number, fromDimension: Dimension): { damageDealt: number; killed: boolean; shielded: boolean } {
    if (this.isDead) return { damageDealt: 0, killed: false, shielded: false };

    // Veil Knight and certain spectral enemies are impervious outside their dimension
    if (this.isVeilOnly && fromDimension !== Dimension.VEIL) {
      return { damageDealt: 0, killed: false, shielded: true };
    }

    this.health = Math.max(0, this.health - amount);
    this.hitTimer = 0.25; // Hit flash
    this.state = EnemyState.INVESTIGATE;

    if (this.health <= 0) {
      this.isDead = true;
      this.state = EnemyState.DEAD;
      return { damageDealt: amount, killed: true, shielded: false };
    }

    return { damageDealt: amount, killed: false, shielded: false };
  }

  public abstract update(
    delta: number,
    playerPos: THREE.Vector3,
    playerDimension: Dimension,
    isLanternFocused: boolean
  ): { didAttack: boolean; damage: number };

  public cleanup() {
    // Traverse meshes and dispose geometries
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
