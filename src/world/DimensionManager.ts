import * as THREE from 'three';
import { Dimension } from '../types/game';

export class DimensionManager {
  public currentDimension: Dimension = Dimension.WAKING;
  public isShifting: boolean = false;
  public shiftCooldown: number = 0;
  public readonly cooldownDuration: number = 1.0;
  public shiftProgress: number = 0;

  // Scene environmental references
  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Registered objects that react to dimension
  public wakingObjects: THREE.Object3D[] = [];
  public veilObjects: THREE.Object3D[] = [];
  public interactiveStatueHeads: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, dirLight: THREE.DirectionalLight, ambientLight: THREE.AmbientLight) {
    this.scene = scene;
    this.dirLight = dirLight;
    this.ambientLight = ambientLight;
    this.applyDimensionEnvironment(false);
  }

  public registerWakingObject(obj: THREE.Object3D) {
    this.wakingObjects.push(obj);
    obj.visible = this.currentDimension === Dimension.WAKING;
  }

  public registerVeilObject(obj: THREE.Object3D) {
    this.veilObjects.push(obj);
    obj.visible = this.currentDimension === Dimension.VEIL;
  }

  public registerStatueHead(head: THREE.Mesh) {
    this.interactiveStatueHeads.push(head);
  }

  public canShift(): boolean {
    return this.shiftCooldown <= 0 && !this.isShifting;
  }

  public triggerShift(): boolean {
    if (!this.canShift()) return false;
    this.isShifting = true;
    this.shiftCooldown = this.cooldownDuration;
    this.shiftProgress = 0;
    return true;
  }

  public update(delta: number, playerPos: THREE.Vector3): { shiftedThisFrame: boolean } {
    let shiftedThisFrame = false;

    if (this.shiftCooldown > 0) {
      this.shiftCooldown -= delta;
    }

    if (this.isShifting) {
      this.shiftProgress += delta;
      // Mid-point of shift is where the actual dimension swap takes place
      if (this.shiftProgress >= 0.25 && !shiftedThisFrame) {
        this.currentDimension = this.currentDimension === Dimension.WAKING ? Dimension.VEIL : Dimension.WAKING;
        this.applyDimensionEnvironment(true);
        shiftedThisFrame = true;
      }
      if (this.shiftProgress >= 0.5) {
        this.isShifting = false;
        this.shiftProgress = 0;
      }
    }

    // Interactive statues: in The Veil, statue heads smoothly turn to watch the player!
    if (this.currentDimension === Dimension.VEIL) {
      this.interactiveStatueHeads.forEach((head) => {
        const worldPos = new THREE.Vector3();
        head.getWorldPosition(worldPos);
        const lookDir = playerPos.clone().sub(worldPos);
        lookDir.y = 0;
        if (lookDir.lengthSq() > 0.01) {
          const targetRotY = Math.atan2(lookDir.x, lookDir.z);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetRotY, delta * 3.5);
        }
      });
    }

    return { shiftedThisFrame };
  }

  private applyDimensionEnvironment(animate: boolean) {
    const isVeil = this.currentDimension === Dimension.VEIL;

    // Toggle object groups
    this.wakingObjects.forEach((obj) => {
      obj.visible = !isVeil;
    });
    this.veilObjects.forEach((obj) => {
      obj.visible = isVeil;
    });

    if (isVeil) {
      // Veil: Abyssal violet-black atmosphere
      this.scene.fog = new THREE.FogExp2(0x130722, 0.026);
      this.dirLight.color.setHex(0x9d55dd);
      this.dirLight.intensity = 1.1;
      this.ambientLight.color.setHex(0x35194f);
      this.ambientLight.intensity = 0.8;
      this.scene.background = new THREE.Color(0x0a0414);
    } else {
      // Waking World: Cold moonlight blue-gray
      this.scene.fog = new THREE.FogExp2(0x0b0e14, 0.024);
      this.dirLight.color.setHex(0x8fa3bf);
      this.dirLight.intensity = 1.4;
      this.ambientLight.color.setHex(0x1a212e);
      this.ambientLight.intensity = 0.5;
      this.scene.background = new THREE.Color(0x06080c);
    }
  }
}
