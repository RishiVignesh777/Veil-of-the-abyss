import * as THREE from 'three';
import { GameState, Dimension, BossInfo, CombatHit } from '../types/game';
import { InputManager } from './InputManager';
import { CameraController } from './CameraController';
import { AudioManager } from '../audio/AudioManager';
import { ParticleManager } from '../effects/ParticleManager';
import { DimensionManager } from '../world/DimensionManager';
import { PuzzleManager } from '../world/Puzzles';
import { WorldManager } from '../world/WorldManager';
import { Nyra } from '../player/Nyra';
import { EnemyManager } from '../enemies/EnemyManager';
import { CombatSystem } from '../combat/CombatSystem';
import { PlayerController } from '../player/PlayerController';
import { Inventory } from '../items/Inventory';
import { SaveManager } from '../items/SaveManager';

export interface UIState {
  gameState: GameState;
  health: number;
  maxHealth: number;
  veilEnergy: number;
  maxVeilEnergy: number;
  dimension: Dimension;
  isShifting: boolean;
  shards: number;
  coins: number;
  interactionPrompt: { key: string; title: string; action: string } | null;
  notice: string | null;
  bossInfo: BossInfo | null;
  recentHits: CombatHit[];
  lanternActive: boolean;
}

export class Game {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Subsystems
  public inputManager: InputManager;
  public cameraController: CameraController;
  public audioManager: AudioManager;
  public particleManager: ParticleManager;
  public dimensionManager: DimensionManager;
  public puzzleManager: PuzzleManager;
  public worldManager: WorldManager;
  public nyra: Nyra;
  public enemyManager: EnemyManager;
  public combatSystem: CombatSystem;
  public playerController: PlayerController;
  public inventory: Inventory;

  public gameState: GameState = GameState.MENU;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private reqId: number | null = null;

  // UI state listener
  public onStateChange: ((state: UIState) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 1. Renderer setup with shadow maps
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 350);
    this.camera.position.set(0, 3, 6);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x1a212e, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x8fa3bf, 1.4);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // 5. Initialize Subsystems
    this.inputManager = new InputManager();
    this.inputManager.attach(canvas);

    this.cameraController = new CameraController(this.camera);
    this.inputManager.onMouseMoveCallback = (dx, dy) => this.cameraController.handleMouseMove(dx, dy);
    this.inputManager.onMouseWheelCallback = (deltaY) => this.cameraController.handleWheel(deltaY);

    this.audioManager = new AudioManager();
    this.particleManager = new ParticleManager();
    this.scene.add(this.particleManager.group);

    this.dimensionManager = new DimensionManager(this.scene, dirLight, ambientLight);
    this.puzzleManager = new PuzzleManager();
    this.worldManager = new WorldManager(this.scene, this.dimensionManager, this.puzzleManager);

    // Provide obstacle geometry to camera collision raycaster
    this.cameraController.collisionObstacles = this.worldManager.collisionMeshes;

    this.inventory = new Inventory();

    // Nyra
    this.nyra = new Nyra();
    this.scene.add(this.nyra.group);

    // Combat & Enemies
    this.enemyManager = new EnemyManager(this.scene, this.particleManager, this.audioManager, this.inventory);
    this.combatSystem = new CombatSystem(
      this.nyra,
      this.enemyManager,
      this.particleManager,
      this.audioManager,
      this.cameraController,
      this.inventory
    );

    // Player Controller
    this.playerController = new PlayerController(
      this.nyra,
      this.inputManager,
      this.cameraController,
      this.combatSystem,
      this.dimensionManager,
      this.worldManager,
      this.puzzleManager,
      this.particleManager,
      this.audioManager,
      this.inventory
    );

    // Window resize handler
    window.addEventListener('resize', this.handleResize);

    // Check for existing save
    const save = SaveManager.load();
    if (save) {
      this.nyra.health = save.health;
      this.nyra.maxHealth = save.maxHealth;
      this.inventory.shards = save.shards;
      this.inventory.coins = save.coins;
    }
  }

  private handleResize = () => {
    if (!this.canvas) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  public stop() {
    this.isRunning = false;
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId);
      this.reqId = null;
    }
  }

  public setGameState(state: GameState) {
    this.gameState = state;
    if (state === GameState.PLAYING) {
      this.audioManager.resume();
      this.inputManager.requestPointerLock();
    } else {
      this.inputManager.exitPointerLock();
    }
    this.emitUIState(null);
  }

  public respawnAtShrine() {
    this.nyra.health = this.nyra.maxHealth;
    this.nyra.veilEnergy = this.nyra.maxVeilEnergy;
    this.nyra.isDead = false;
    this.nyra.group.position.copy(this.worldManager.checkpointPos);
    this.nyra.velocity.set(0, 0, 0);
    this.setGameState(GameState.PLAYING);
  }

  private animate = () => {
    if (!this.isRunning) return;
    this.reqId = requestAnimationFrame(this.animate);

    const now = performance.now();
    let delta = (now - this.lastTime) * 0.001;
    this.lastTime = now;
    // Cap delta to prevent large physics jumps during tab switches
    delta = Math.min(delta, 0.1);

    this.update(delta);
    this.render();
  };

  private update(delta: number) {
    // Handle Pause & Inventory toggles
    if (this.inputManager.state.pause) {
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.PAUSED);
      } else if (this.gameState === GameState.PAUSED) {
        this.setGameState(GameState.PLAYING);
      }
    }
    if (this.inputManager.state.inventory) {
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.INVENTORY);
      } else if (this.gameState === GameState.INVENTORY) {
        this.setGameState(GameState.PLAYING);
      }
    }

    if (this.gameState !== GameState.PLAYING) {
      // In menu / paused: camera gentle orbit around Nyra
      this.cameraController.yaw += delta * 0.15;
      this.cameraController.update(delta, this.nyra.group.position);
      return;
    }

    // 1. Dimension updates
    const { shiftedThisFrame } = this.dimensionManager.update(delta, this.nyra.group.position);
    if (shiftedThisFrame) {
      // Dimension shifted
    }

    // 2. Player Controller & Physics
    this.playerController.update(delta);

    // 3. Combat System
    this.combatSystem.update(delta);

    // 4. Enemies & AI
    const { playerDamageTaken, bossInfo } = this.enemyManager.update(
      delta,
      this.nyra.group.position,
      this.dimensionManager.currentDimension,
      this.nyra.isLanternActive
    );

    if (playerDamageTaken > 0) {
      this.nyra.takeDamage(playerDamageTaken);
      this.cameraController.shake(0.35);

      // Check Death
      if (this.nyra.health <= 0) {
        this.setGameState(GameState.GAME_OVER);
        return;
      }
    }

    // 5. World environment animation
    this.worldManager.update(delta, this.dimensionManager.currentDimension);

    // 6. Particles
    this.particleManager.update(delta, this.nyra.group.position, this.dimensionManager.currentDimension);

    // 7. Camera follow
    this.cameraController.update(delta, this.nyra.group.position);

    // 8. Audio ambient / combat dynamic state
    const isCombat = this.enemyManager.enemies.some(
      (e) => !e.isDead && e.group.position.distanceTo(this.nyra.group.position) < 14
    );
    this.audioManager.update(
      delta,
      isCombat,
      bossInfo !== null,
      this.dimensionManager.currentDimension === Dimension.VEIL
    );

    // Notify React UI
    this.emitUIState(bossInfo);
  }

  private emitUIState(bossInfo: BossInfo | null) {
    if (!this.onStateChange) return;

    const prompt = this.playerController.activeInteractive?.prompt
      ? {
          key: this.playerController.activeInteractive.prompt.key,
          title: this.playerController.activeInteractive.prompt.title,
          action: this.playerController.activeInteractive.prompt.actionText
        }
      : null;

    this.onStateChange({
      gameState: this.gameState,
      health: this.nyra.health,
      maxHealth: this.nyra.maxHealth,
      veilEnergy: this.nyra.veilEnergy,
      maxVeilEnergy: this.nyra.maxVeilEnergy,
      dimension: this.dimensionManager.currentDimension,
      isShifting: this.dimensionManager.isShifting,
      shards: this.inventory.shards,
      coins: this.inventory.coins,
      interactionPrompt: prompt,
      notice: this.playerController.interactionNotice,
      bossInfo,
      recentHits: this.combatSystem.recentHits,
      lanternActive: this.nyra.isLanternActive
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.inputManager.detach();
    this.renderer.dispose();
  }
}
