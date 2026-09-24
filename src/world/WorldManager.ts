import * as THREE from 'three';
import { Dimension } from '../types/game';
import { Structures, MaterialsLibrary } from './Structures';
import { DimensionManager } from './DimensionManager';
import { PuzzleManager, InteractiveObject } from './Puzzles';

export class WorldManager {
  public scene: THREE.Scene;
  public dimensionManager: DimensionManager;
  public puzzleManager: PuzzleManager;
  
  public colliders: THREE.Box3[] = [];
  public collisionMeshes: THREE.Object3D[] = [];

  // Pointers to dynamic world features
  public villageGateMesh: THREE.Group | null = null;
  public puzzleCrystalMesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public checkpointPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(scene: THREE.Scene, dimensionManager: DimensionManager, puzzleManager: PuzzleManager) {
    this.scene = scene;
    this.dimensionManager = dimensionManager;
    this.puzzleManager = puzzleManager;

    this.buildWorld();
  }

  private buildWorld() {
    this.buildTerrain();
    this.buildDyingVillage();
    this.buildVoidBridgePuzzle();
    this.buildCemeteryArena();
    this.buildBlackwood();
    this.buildSunkenCathedral();
  }

  private buildTerrain() {
    // Ground planes with slight elevation and dark soil/stone texturing
    const groundGeom = new THREE.PlaneGeometry(260, 260, 32, 32);
    // Displace vertices subtly for uneven dark fantasy ground
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const height = Math.sin(vx * 0.05) * Math.cos(vy * 0.05) * 0.45;
      pos.setZ(i, height);
    }
    groundGeom.computeVertexNormals();

    const groundMesh = new THREE.Mesh(
      groundGeom,
      new THREE.MeshStandardMaterial({
        color: 0x14161a,
        roughness: 0.95,
        metalness: 0.05
      })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Stone pathway cutting through the village towards the chasm
    const pathGeom = new THREE.PlaneGeometry(6, 90);
    const pathMesh = new THREE.Mesh(
      pathGeom,
      new THREE.MeshStandardMaterial({
        color: 0x1c1e24,
        roughness: 0.9
      })
    );
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, 10);
    pathMesh.receiveShadow = true;
    this.scene.add(pathMesh);
  }

  private buildDyingVillage() {
    // Starting Veil Shrine (Checkpoint)
    const shrineData = Structures.createShrine();
    shrineData.group.position.set(0, 0, -4);
    this.scene.add(shrineData.group);
    this.collisionMeshes.push(shrineData.group);

    // Register shrine interaction
    this.puzzleManager.register({
      id: 'veil_shrine_village',
      mesh: shrineData.crystal,
      distance: 3.5,
      prompt: {
        id: 'veil_shrine_village',
        title: 'Veil Shrine',
        actionText: 'Commune & Attune Checkpoint',
        key: 'E'
      },
      onInteract: () => {
        this.checkpointPos.set(0, 0, -1);
        return {
          message: 'The shrine resonates with cold warmth. Health & Veil restored.',
          success: true,
          stateChange: 'SHRINE_ATTUNED'
        };
      }
    });

    // Village Houses (left and right flanks)
    const houseConfigs = [
      { x: -14, z: 6, rot: 0.15 },
      { x: -16, z: 22, rot: -0.2 },
      { x: 14, z: 8, rot: -0.1 },
      { x: 17, z: 24, rot: 0.3 }
    ];

    houseConfigs.forEach((cfg) => {
      const house = Structures.createHouse(7, 9, 5);
      house.position.set(cfg.x, 0, cfg.z);
      house.rotation.y = cfg.rot;
      this.scene.add(house);
      this.collisionMeshes.push(house);

      // Add hanging wall torch
      const torch = Structures.createTorch();
      torch.group.position.set(cfg.x + (cfg.x > 0 ? -3.8 : 3.8), 2.2, cfg.z);
      torch.group.rotation.y = cfg.x > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(torch.group);
    });

    // Abandoned Well in village center
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 1.2, 8),
      MaterialsLibrary.blackStoneMat
    );
    well.position.set(-6, 0.6, 16);
    well.castShadow = true;
    this.scene.add(well);
    this.collisionMeshes.push(well);

    // Stone walls & perimeter ruins
    const wall1 = Structures.createStoneWall(16, 3.5, 1);
    wall1.position.set(-22, 0, 15);
    wall1.rotation.y = Math.PI / 2;
    this.scene.add(wall1);
    this.collisionMeshes.push(wall1);

    const wall2 = Structures.createStoneWall(16, 3.5, 1);
    wall2.position.set(22, 0, 15);
    wall2.rotation.y = Math.PI / 2;
    this.scene.add(wall2);
    this.collisionMeshes.push(wall2);

    // Ancient Sentinels (Statues) that look at player in The Veil
    const statue1 = Structures.createStatue();
    statue1.position.set(-8, 0, -12);
    statue1.rotation.y = Math.PI * 0.75;
    this.scene.add(statue1);
    this.collisionMeshes.push(statue1);
    const head1 = statue1.getObjectByName('StatueHead') as THREE.Mesh;
    if (head1) this.dimensionManager.registerStatueHead(head1);

    const statue2 = Structures.createStatue();
    statue2.position.set(8, 0, -12);
    statue2.rotation.y = Math.PI * 1.25;
    this.scene.add(statue2);
    this.collisionMeshes.push(statue2);
    const head2 = statue2.getObjectByName('StatueHead') as THREE.Mesh;
    if (head2) this.dimensionManager.registerStatueHead(head2);

    // Dead trees around village
    [
      { x: -10, z: -6 },
      { x: 11, z: -5 },
      { x: -18, z: 34 },
      { x: 19, z: 35 }
    ].forEach((tp) => {
      const tree = Structures.createTree(7.5);
      tree.position.set(tp.x, 0, tp.z);
      this.scene.add(tree);
      this.collisionMeshes.push(tree);
    });
  }

  private buildVoidBridgePuzzle() {
    // The Abyssal Chasm (fissure across z = 38 to 44)
    const chasmGeom = new THREE.BoxGeometry(70, 14, 8);
    const chasmMesh = new THREE.Mesh(
      chasmGeom,
      new THREE.MeshStandardMaterial({
        color: 0x020204,
        roughness: 1.0
      })
    );
    chasmMesh.position.set(0, -7, 41);
    this.scene.add(chasmMesh);

    // Waking World Bridge: Broken in the middle, dangerous gap
    const wakingBridge = Structures.createBridgeSection(false);
    wakingBridge.position.set(0, 0, 41);
    this.scene.add(wakingBridge);
    this.dimensionManager.registerWakingObject(wakingBridge);

    // The Veil Bridge: Connected floating bone steps, crosses the abyss safely!
    const veilBridge = Structures.createBridgeSection(true);
    veilBridge.position.set(0, 0, 41);
    this.scene.add(veilBridge);
    this.dimensionManager.registerVeilObject(veilBridge);

    // Add collision surfaces for the veil bridge
    this.collisionMeshes.push(veilBridge);

    // Broken archway before bridge
    const arch = Structures.createGothicArch(5, 6);
    arch.position.set(0, 0, 36);
    this.scene.add(arch);
    this.collisionMeshes.push(arch);
  }

  private buildCemeteryArena() {
    // Arena past the chasm (z: 52 to 95)
    // Ancestral Gate
    this.villageGateMesh = new THREE.Group();
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 1.2), MaterialsLibrary.blackStoneMat);
    leftPillar.position.set(-2.5, 2.75, 52);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 1.2), MaterialsLibrary.blackStoneMat);
    rightPillar.position.set(2.5, 2.75, 52);

    // Iron gate bars
    const gateBars = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 4.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.9 })
    );
    gateBars.position.set(0, 2.1, 52);
    gateBars.name = 'GateBars';
    this.villageGateMesh.add(leftPillar, rightPillar, gateBars);
    this.scene.add(this.villageGateMesh);
    this.collisionMeshes.push(this.villageGateMesh);

    // Sun-Moon Mechanism Crystal (Puzzle item in village)
    const crystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), MaterialsLibrary.crystalMat);
    crystalMesh.position.set(6, 1.8, 30);
    this.scene.add(crystalMesh);
    this.puzzleCrystalMesh = crystalMesh;

    // Register Light puzzle interaction
    this.puzzleManager.register({
      id: 'cemetery_gate_crystal',
      mesh: crystalMesh,
      distance: 3.5,
      prompt: {
        id: 'cemetery_gate_crystal',
        title: 'Ancient Radiant Crystal',
        actionText: 'Focus Grave Lantern Light (RMB)',
        key: 'E'
      },
      onInteract: () => {
        if (!this.puzzleManager.crystalActive) {
          this.puzzleManager.crystalActive = true;
          this.puzzleManager.gateOpen = true;
          if (this.villageGateMesh) {
            const bars = this.villageGateMesh.getObjectByName('GateBars');
            if (bars) bars.position.y += 4.5; // Lift gate open
          }
          return {
            message: 'Supernatural light floods the runes! The Cemetery Gate grinds open.',
            success: true,
            stateChange: 'GATE_OPEN'
          };
        }
        return { message: 'The crystal is already blazing with celestial light.', success: false };
      }
    });

    // Graves and tombs inside cemetery
    for (let i = 0; i < 16; i++) {
      const grave = Structures.createGrave();
      const gx = -16 + (i % 4) * 10 + (Math.random() - 0.5) * 2;
      const gz = 60 + Math.floor(i / 4) * 8 + (Math.random() - 0.5) * 2;
      grave.position.set(gx, 0, gz);
      this.scene.add(grave);
      this.collisionMeshes.push(grave);
    }

    // Mausoleum at back of cemetery
    const mausoleum = Structures.createHouse(8, 10, 6);
    mausoleum.position.set(0, 0, 94);
    this.scene.add(mausoleum);
    this.collisionMeshes.push(mausoleum);
  }

  private buildBlackwood() {
    // Dense corrupted forest surrounding outer bounds
    for (let t = 0; t < 28; t++) {
      const angle = (t / 28) * Math.PI * 2;
      const dist = 55 + (t % 3) * 12;
      const tree = Structures.createTree(9 + Math.random() * 4);
      tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist + 40);
      this.scene.add(tree);
      this.collisionMeshes.push(tree);
    }
  }

  private buildSunkenCathedral() {
    // Sunken Cathedral hall deep past the cemetery (z: 110 to 150)
    const cathedralArch1 = Structures.createGothicArch(10, 12);
    cathedralArch1.position.set(0, 0, 114);
    this.scene.add(cathedralArch1);
    this.collisionMeshes.push(cathedralArch1);

    const cathedralArch2 = Structures.createGothicArch(10, 12);
    cathedralArch2.position.set(0, 0, 130);
    this.scene.add(cathedralArch2);
    this.collisionMeshes.push(cathedralArch2);

    // Dark reflective water surface
    const waterGeom = new THREE.PlaneGeometry(45, 45, 16, 16);
    this.waterMesh = new THREE.Mesh(waterGeom, MaterialsLibrary.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(0, 0.15, 125);
    this.scene.add(this.waterMesh);

    // Massive cathedral bell tower
    const bellTower = Structures.createTower(4.5, 24);
    bellTower.position.set(-18, 0, 135);
    this.scene.add(bellTower);
    this.collisionMeshes.push(bellTower);
  }

  public update(delta: number, currentDimension: Dimension) {
    // Animate water ripple
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      const time = performance.now() * 0.002;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        pos.setZ(i, Math.sin(u * 0.3 + time) * Math.cos(v * 0.3 + time) * 0.08);
      }
      pos.needsUpdate = true;
    }

    // Animate puzzle crystal
    if (this.puzzleCrystalMesh) {
      this.puzzleCrystalMesh.rotation.y += delta * 1.2;
      this.puzzleCrystalMesh.position.y = 1.8 + Math.sin(performance.now() * 0.003) * 0.15;
    }
  }
}
