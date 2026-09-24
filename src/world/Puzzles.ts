import * as THREE from 'three';
import { Dimension, InteractionPrompt } from '../types/game';

export interface InteractiveObject {
  id: string;
  mesh: THREE.Object3D;
  prompt: InteractionPrompt;
  dimensionRequirement?: Dimension;
  distance: number;
  onInteract: () => { message: string; success: boolean; stateChange?: string };
}

export class PuzzleManager {
  public interactives: InteractiveObject[] = [];
  public crystalActive: boolean = false;
  public gateOpen: boolean = false;
  public shrineUsed: boolean = false;

  public register(obj: InteractiveObject) {
    this.interactives.push(obj);
  }

  public checkNearestInteractive(playerPos: THREE.Vector3, currentDimension: Dimension): InteractiveObject | null {
    let nearest: InteractiveObject | null = null;
    let minDistance = 999;

    for (const item of this.interactives) {
      if (item.dimensionRequirement && item.dimensionRequirement !== currentDimension) {
        continue;
      }

      const worldPos = new THREE.Vector3();
      item.mesh.getWorldPosition(worldPos);
      const dist = playerPos.distanceTo(worldPos);

      if (dist <= item.distance && dist < minDistance) {
        minDistance = dist;
        nearest = item;
      }
    }

    return nearest;
  }
}
