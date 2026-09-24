import * as THREE from 'three';
import { Dimension, PlayerAnimState } from '../types/game';
import { Nyra } from './Nyra';
import { InputManager } from '../core/InputManager';
import { CameraController } from '../core/CameraController';
import { CombatSystem } from '../combat/CombatSystem';
import { DimensionManager } from '../world/DimensionManager';
import { WorldManager } from '../world/WorldManager';
import { PuzzleManager, InteractiveObject } from '../world/Puzzles';
import { ParticleManager } from '../effects/ParticleManager';
import { AudioManager } from '../audio/AudioManager';
import { Inventory } from '../items/Inventory';

export class PlayerController {
  public nyra: Nyra;
  private input: InputManager;
  private cameraController: CameraController;
  private combatSystem: CombatSystem;
  private dimensionManager: DimensionManager;
  private worldManager: WorldManager;
  private puzzleManager: PuzzleManager;
  private particleManager: ParticleManager;
  private audioManager: AudioManager;
  private inventory: Inventory;

  // Movement physics params
  private walkSpeed: number = 4.2;
  private sprintSpeed: number = 7.5;
  private acceleration: number = 22.0;
  private friction: number = 12.0;
  private gravity: number = 24.0;
  private jumpForce: number = 9.2;
  private currentSpeed: number = 0;

  // Active interaction prompt
  public activeInteractive: InteractiveObject | null = null;
  public interactionNotice: string | null = null;
  private noticeTimer: number = 0;

  constructor(
    nyra: Nyra,
    input: InputManager,
    cameraController: CameraController,
    combatSystem: CombatSystem,
    dimensionManager: DimensionManager,
    worldManager: WorldManager,
    puzzleManager: PuzzleManager,
    particleManager: ParticleManager,
    audioManager: AudioManager,
    inventory: Inventory
  ) {
    this.nyra = nyra;
    this.input = input;
    this.cameraController = cameraController;
    this.combatSystem = combatSystem;
    this.dimensionManager = dimensionManager;
    this.worldManager = worldManager;
    this.puzzleManager = puzzleManager;
    this.particleManager = particleManager;
    this.audioManager = audioManager;
    this.inventory = inventory;
  }

  public update(delta: number) {
    if (this.noticeTimer > 0) {
      this.noticeTimer -= delta;
      if (this.noticeTimer <= 0) {
        this.interactionNotice = null;
      }
    }

    // Freeze controls during dimension shift distortion
    if (this.dimensionManager.isShifting) {
      this.nyra.velocity.set(0, 0, 0);
      return;
    }

    this.handleDimensionShift();
    this.handleMovement(delta);
    this.handleCombatInputs();
    this.handleInteractions();
    this.checkCollisions(delta);

    // Passive veil energy regeneration in The Veil
    if (this.dimensionManager.currentDimension === Dimension.VEIL) {
      this.nyra.restoreVeil(delta * 6);
    }

    // Update Nyra's internal animations & procedural effects
    this.nyra.update(
      delta,
      this.currentSpeed > 0.2,
      this.currentSpeed,
      this.dimensionManager.currentDimension
    );

    // Consume single-frame triggers
    this.input.consumeTriggers();
  }

  private handleDimensionShift() {
    if (this.input.state.dimensionShift && this.dimensionManager.canShift()) {
      if (this.dimensionManager.triggerShift()) {
        this.audioManager.playDimensionShift();
        this.particleManager.emitDimensionShiftBurst(
          this.nyra.group.position,
          this.dimensionManager.currentDimension === Dimension.WAKING ? Dimension.VEIL : Dimension.WAKING
        );
      }
    }
  }

  private handleMovement(delta: number) {
    const inputState = this.input.state;

    // Movement direction relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraController.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraController.yaw);

    const moveDir = new THREE.Vector3();
    if (inputState.forward) moveDir.add(forward);
    if (inputState.backward) moveDir.sub(forward);
    if (inputState.right) moveDir.add(right);
    if (inputState.left) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;

    // Target velocity on ground
    if (isMoving) {
      moveDir.normalize();
      const targetSpeed = inputState.sprint ? this.sprintSpeed : this.walkSpeed;
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, this.acceleration * delta);

      // Rotate player smoothly toward movement vector
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let angleDiff = targetAngle - this.nyra.group.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.nyra.group.rotation.y += angleDiff * Math.min(1.0, 14 * delta);

      // Play footstep sounds
      if (this.nyra.isGrounded) {
        this.audioManager.playFootstep();
      }
    } else {
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, this.friction * delta);
    }

    // Apply horizontal velocity if not mid-dodge
    if (this.nyra.state !== PlayerAnimState.DODGE) {
      if (isMoving) {
        this.nyra.velocity.x = moveDir.x * this.currentSpeed;
        this.nyra.velocity.z = moveDir.z * this.currentSpeed;
      } else {
        this.nyra.velocity.x = THREE.MathUtils.lerp(this.nyra.velocity.x, 0, this.friction * delta);
        this.nyra.velocity.z = THREE.MathUtils.lerp(this.nyra.velocity.z, 0, this.friction * delta);
      }
    }

    // Jump
    if (inputState.jump && this.nyra.isGrounded && this.nyra.state !== PlayerAnimState.DODGE) {
      this.nyra.velocity.y = this.jumpForce;
      this.nyra.isGrounded = false;
      this.nyra.state = PlayerAnimState.JUMP;
    }

    // Gravity
    if (!this.nyra.isGrounded) {
      this.nyra.velocity.y -= this.gravity * delta;
    }

    // Move player position by velocity
    this.nyra.group.position.addScaledVector(this.nyra.velocity, delta);

    // Ground plane check (simple height check at y = 0)
    // Note: Over the chasm (z: 37 to 44), falling occurs unless bridge is active in Veil!
    const pos = this.nyra.group.position;
    const isOverChasm = pos.z >= 37 && pos.z <= 44;
    const bridgeCrossable = this.dimensionManager.currentDimension === Dimension.VEIL && Math.abs(pos.x) <= 3.8;

    if (isOverChasm && !bridgeCrossable) {
      // Falling into the abyss!
      if (pos.y < -12) {
        // Respawn at shrine
        this.nyra.takeDamage(30);
        this.nyra.group.position.copy(this.worldManager.checkpointPos);
        this.nyra.velocity.set(0, 0, 0);
        this.interactionNotice = 'The Abyss claims you! Banished to the Shrine.';
        this.noticeTimer = 3.0;
      }
    } else {
      if (pos.y <= 0) {
        pos.y = 0;
        this.nyra.velocity.y = 0;
        this.nyra.isGrounded = true;
      }
    }
  }

  private handleCombatInputs() {
    const dim = this.dimensionManager.currentDimension;

    // Dodge
    if (this.input.state.dodge) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraController.yaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraController.yaw);
      const moveDir = new THREE.Vector3();
      if (this.input.state.forward) moveDir.add(forward);
      if (this.input.state.backward) moveDir.sub(forward);
      if (this.input.state.right) moveDir.add(right);
      if (this.input.state.left) moveDir.sub(right);

      this.combatSystem.executeDodge(moveDir);
    }

    // Attacks
    if (this.input.state.attack) {
      this.combatSystem.executeLightAttack(dim);
    } else if (this.input.state.heavyAttack) {
      this.combatSystem.executeHeavyAttack(dim);
    }

    // Grave Lantern Toggle / Focus
    if (this.input.state.lantern) {
      this.nyra.setLanternActive(true);
    }
  }

  private handleInteractions() {
    this.activeInteractive = this.puzzleManager.checkNearestInteractive(
      this.nyra.group.position,
      this.dimensionManager.currentDimension
    );

    if (this.input.state.interact && this.activeInteractive) {
      const res = this.activeInteractive.onInteract();
      if (res.message) {
        this.interactionNotice = res.message;
        this.noticeTimer = 4.0;
      }
      if (res.success) {
        if (res.stateChange === 'SHRINE_ATTUNED') {
          this.audioManager.playShrineActivate();
          this.nyra.heal(this.nyra.maxHealth);
          this.nyra.restoreVeil(this.nyra.maxVeilEnergy);
        } else if (res.stateChange === 'GATE_OPEN') {
          this.audioManager.playItemPickup();
        }
      }
    }
  }

  private checkCollisions(_delta: number) {
    // Keep player in bounds: -100 to 100 on X, -40 to 160 on Z
    const pos = this.nyra.group.position;
    pos.x = Math.max(-80, Math.min(80, pos.x));
    pos.z = Math.max(-30, Math.min(150, pos.z));
  }
}
