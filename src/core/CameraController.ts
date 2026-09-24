import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public target: THREE.Vector3 = new THREE.Vector3();
  
  public distance: number = 6.0;
  public minDistance: number = 3.5;
  public maxDistance: number = 8.5;
  public height: number = 2.6;
  public lookAtOffset: THREE.Vector3 = new THREE.Vector3(0, 1.6, 0);

  // Angles in radians
  public yaw: number = 0;
  public pitch: number = 0.25;
  public minPitch: number = -0.55;
  public maxPitch: number = 1.15;

  public sensitivity: number = 0.0022;
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  public collisionObstacles: THREE.Object3D[] = [];

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentCameraPos.copy(camera.position);
  }

  public handleMouseMove(movementX: number, movementY: number) {
    this.yaw -= movementX * this.sensitivity;
    this.pitch += movementY * this.sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  public handleWheel(deltaY: number) {
    this.distance += deltaY * 0.004;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // Smooth target follow
    this.target.lerp(playerPos, 1 - Math.exp(-14 * delta));
    const focusPoint = this.target.clone().add(this.lookAtOffset);

    // Calculate ideal spherical camera offset
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    let desiredDist = this.distance;

    const offsetDir = new THREE.Vector3(
      sinYaw * cosPitch,
      sinPitch,
      cosYaw * cosPitch
    ).normalize();

    // Camera collision detection against world obstacles
    if (this.collisionObstacles.length > 0) {
      this.raycaster.set(focusPoint, offsetDir);
      this.raycaster.far = this.distance + 0.2;
      const intersects = this.raycaster.intersectObjects(this.collisionObstacles, true);
      if (intersects.length > 0) {
        // Pull camera closer to prevent clipping into walls
        const hit = intersects[0];
        if (hit.distance > 1.0) {
          desiredDist = Math.max(1.2, hit.distance - 0.35);
        }
      }
    }

    const idealPosition = focusPoint.clone().addScaledVector(offsetDir, desiredDist);
    // Smooth camera movement
    this.currentCameraPos.lerp(idealPosition, 1 - Math.exp(-18 * delta));
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(focusPoint);
  }

  public shake(intensity: number = 0.25) {
    this.camera.position.x += (Math.random() - 0.5) * intensity;
    this.camera.position.y += (Math.random() - 0.5) * intensity;
  }
}
