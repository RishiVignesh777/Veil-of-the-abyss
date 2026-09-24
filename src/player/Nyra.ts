import * as THREE from 'three';
import { Dimension, PlayerAnimState } from '../types/game';

export class Nyra {
  public group: THREE.Group;
  public body: THREE.Group;
  public head: THREE.Group;
  public mask: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public cloak: THREE.Group;
  public shadowTendrils: THREE.Group;
  public floatingFragments: THREE.Group;
  public lanternGroup: THREE.Group;
  public lanternPointLight: THREE.PointLight;
  public lanternSpotLight: THREE.SpotLight;
  public weaponGroup: THREE.Group;
  public weaponBlade: THREE.Mesh;

  // Stats & State
  public health: number = 100;
  public maxHealth: number = 100;
  public veilEnergy: number = 100;
  public maxVeilEnergy: number = 100;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  public state: PlayerAnimState = PlayerAnimState.IDLE;
  public stateTime: number = 0;
  public isLanternActive: boolean = true;
  public isInvulnerable: boolean = false;
  public invulnerabilityTimer: number = 0;
  public isDead: boolean = false;

  // Cloak bones/segments for dynamic cloth simulation
  private cloakSegments: THREE.Mesh[] = [];
  private tendrils: THREE.Line[] = [];
  private fragmentMeshes: THREE.Mesh[] = [];

  // Animation cycle phase
  private walkCycle: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Nyra';

    this.body = new THREE.Group();
    this.head = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.cloak = new THREE.Group();
    this.shadowTendrils = new THREE.Group();
    this.floatingFragments = new THREE.Group();
    this.lanternGroup = new THREE.Group();
    this.weaponGroup = new THREE.Group();

    // Create lantern lights
    this.lanternPointLight = new THREE.PointLight(0x77bbff, 3.0, 16, 1.8);
    this.lanternSpotLight = new THREE.SpotLight(0x99ddff, 4.0, 24, Math.PI / 5, 0.4, 1.5);
    this.lanternSpotLight.castShadow = true;
    this.lanternSpotLight.shadow.mapSize.width = 1024;
    this.lanternSpotLight.shadow.mapSize.height = 1024;
    this.lanternSpotLight.shadow.bias = -0.001;

    // Materials
    const darkClothMat = new THREE.MeshStandardMaterial({
      color: 0x141419,
      roughness: 0.85,
      metalness: 0.1
    });

    const paleMaskMat = new THREE.MeshStandardMaterial({
      color: 0xddddda,
      roughness: 0.25,
      metalness: 0.05
    });

    const shadowArmMat = new THREE.MeshStandardMaterial({
      color: 0x07070d,
      roughness: 0.3,
      emissive: 0x221144,
      emissiveIntensity: 0.7
    });

    const glowCrackMat = new THREE.MeshBasicMaterial({
      color: 0x55ccff
    });

    // 1. Torso & Robes (Slender, tall)
    const torsoGeom = new THREE.CylinderGeometry(0.24, 0.18, 1.0, 8);
    const torsoMesh = new THREE.Mesh(torsoGeom, darkClothMat);
    torsoMesh.position.y = 1.35;
    torsoMesh.castShadow = true;
    this.body.add(torsoMesh);

    // Glowing fracture runes on chest
    const runeGeom = new THREE.BoxGeometry(0.04, 0.4, 0.02);
    const runeMesh = new THREE.Mesh(runeGeom, glowCrackMat);
    runeMesh.position.set(0, 1.4, 0.18);
    this.body.add(runeMesh);

    // 2. Head & Mask
    const headGeom = new THREE.SphereGeometry(0.18, 12, 12);
    headGeom.scale(0.85, 1.1, 0.9);
    const headMesh = new THREE.Mesh(headGeom, darkClothMat);
    headMesh.position.y = 2.05;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Pale blank porcelain mask
    const maskGeom = new THREE.SphereGeometry(0.17, 12, 12, 0, Math.PI);
    maskGeom.scale(0.88, 1.05, 0.4);
    this.mask = new THREE.Mesh(maskGeom, paleMaskMat);
    this.mask.rotation.y = -Math.PI / 2;
    this.mask.position.set(0, 2.05, 0.1);
    this.mask.castShadow = true;
    this.head.add(this.mask);

    // Glowing eyes behind mask
    const eyeGeom = new THREE.SphereGeometry(0.025, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x88eeff });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.06, 2.08, 0.18);
    rightEye.position.set(0.06, 2.08, 0.18);
    this.head.add(leftEye, rightEye);

    // 3. Shadow Tendrils (hair-like shadow strands)
    for (let i = 0; i < 9; i++) {
      const points: THREE.Vector3[] = [];
      const len = 0.8 + Math.random() * 0.5;
      const angle = (i / 9) * Math.PI + Math.PI * 0.5;
      for (let j = 0; j < 5; j++) {
        points.push(new THREE.Vector3(
          Math.cos(angle) * 0.15,
          2.1 - (j / 4) * len,
          Math.sin(angle) * 0.15 - (j / 4) * 0.3
        ));
      }
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x110822, linewidth: 2 });
      const tendril = new THREE.Line(lineGeom, lineMat);
      this.tendrils.push(tendril);
      this.shadowTendrils.add(tendril);
    }
    this.head.add(this.shadowTendrils);

    // 4. Arms
    // Left Arm (Normal dark clothed, carries the Grave Lantern)
    const armGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.75, 6);
    const leftArmMesh = new THREE.Mesh(armGeom, darkClothMat);
    leftArmMesh.position.y = -0.35;
    leftArmMesh.castShadow = true;
    this.leftArm.position.set(-0.35, 1.7, 0);
    this.leftArm.add(leftArmMesh);

    // Right Arm (Transformed into ethereal shadow with glowing claws, wields Veilblade)
    const rightArmMesh = new THREE.Mesh(armGeom, shadowArmMat);
    rightArmMesh.position.y = -0.35;
    rightArmMesh.castShadow = true;
    this.rightArm.position.set(0.35, 1.7, 0);
    this.rightArm.add(rightArmMesh);

    // 5. Legs
    const legGeom = new THREE.CylinderGeometry(0.08, 0.06, 0.95, 6);
    const leftLegMesh = new THREE.Mesh(legGeom, darkClothMat);
    leftLegMesh.position.y = -0.475;
    leftLegMesh.castShadow = true;
    this.leftLeg.position.set(-0.16, 0.95, 0);
    this.leftLeg.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(legGeom, darkClothMat);
    rightLegMesh.position.y = -0.475;
    rightLegMesh.castShadow = true;
    this.rightLeg.position.set(0.16, 0.95, 0);
    this.rightLeg.add(rightLegMesh);

    // 6. Asymmetrical Cloak
    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c12,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    for (let c = 0; c < 5; c++) {
      const cGeom = new THREE.PlaneGeometry(0.55 - c * 0.05, 0.28);
      const cMesh = new THREE.Mesh(cGeom, cloakMat);
      cMesh.position.set(0.05, 1.5 - c * 0.24, -0.15 - c * 0.04);
      cMesh.castShadow = true;
      this.cloakSegments.push(cMesh);
      this.cloak.add(cMesh);
    }

    // 7. Floating Void Fragments
    const fragGeom = new THREE.DodecahedronGeometry(0.045);
    const fragMat = new THREE.MeshStandardMaterial({
      color: 0x181028,
      emissive: 0x442266,
      emissiveIntensity: 0.8
    });
    for (let f = 0; f < 6; f++) {
      const frag = new THREE.Mesh(fragGeom, fragMat);
      this.fragmentMeshes.push(frag);
      this.floatingFragments.add(frag);
    }

    // 8. The Grave Lantern (attached to left hand)
    this.createLantern();
    this.leftArm.add(this.lanternGroup);
    this.lanternGroup.position.set(0, -0.75, 0.25);

    // 9. The Veilblade (attached to right hand)
    this.weaponBlade = this.createVeilblade();
    this.rightArm.add(this.weaponGroup);
    this.weaponGroup.position.set(0, -0.72, 0.15);
    this.weaponGroup.rotation.x = Math.PI / 2;

    // Assemble root group
    this.body.add(this.head);
    this.body.add(this.leftArm);
    this.body.add(this.rightArm);
    this.body.add(this.leftLeg);
    this.body.add(this.rightLeg);
    this.body.add(this.cloak);
    this.body.add(this.floatingFragments);

    this.group.add(this.body);
  }

  private createLantern() {
    // Ornate cage & supernatural candle
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a30,
      metalness: 0.8,
      roughness: 0.3
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x99ddff,
      emissive: 0x77bbff,
      emissiveIntensity: 2.5
    });

    const topCap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.12, 6), metalMat);
    topCap.position.y = 0.18;

    const baseCap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.08, 6), metalMat);
    baseCap.position.y = -0.16;

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), coreMat);
    core.position.y = 0;

    // Bars
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), metalMat);
      const angle = (i / 4) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * 0.09, 0, Math.sin(angle) * 0.09);
      this.lanternGroup.add(bar);
    }

    this.lanternGroup.add(topCap, baseCap, core);

    // Attach lights
    this.lanternPointLight.position.set(0, 0, 0);
    this.lanternGroup.add(this.lanternPointLight);

    // Spot light pointing forward
    this.lanternSpotLight.position.set(0, 0, 0.2);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, -0.5, 5);
    this.lanternGroup.add(targetObj);
    this.lanternSpotLight.target = targetObj;
    this.lanternGroup.add(this.lanternSpotLight);
  }

  private createVeilblade(): THREE.Mesh {
    // Jagged obsidian blade with glowing runes and floating crystalline shards
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x08080c,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x224466,
      emissiveIntensity: 0.6
    });

    const edgeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x55ddff
    });

    // Hilt & Guard
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6),
      new THREE.MeshStandardMaterial({ color: 0x1f1f25, metalness: 0.9 })
    );
    hilt.position.y = -0.2;
    this.weaponGroup.add(hilt);

    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x2b2b35, metalness: 0.8 })
    );
    guard.position.y = 0;
    this.weaponGroup.add(guard);

    // Main jagged blade
    const bladeGeom = new THREE.BoxGeometry(0.08, 1.25, 0.02);
    const blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.position.y = 0.65;
    blade.castShadow = true;
    this.weaponGroup.add(blade);

    // Broken glowing edge ribbon
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.2, 0.03), edgeGlowMat);
    edge.position.set(0.04, 0.65, 0);
    this.weaponGroup.add(edge);

    // Floating blade fragments
    for (let s = 0; s < 3; s++) {
      const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.035), edgeGlowMat);
      shard.position.set(0.08 + Math.random() * 0.04, 0.4 + s * 0.35, (Math.random() - 0.5) * 0.05);
      this.weaponGroup.add(shard);
    }

    return blade;
  }

  public setLanternActive(active: boolean) {
    this.isLanternActive = active;
    this.lanternPointLight.intensity = active ? 3.0 : 0.4;
    this.lanternSpotLight.intensity = active ? 4.5 : 0.0;
  }

  public update(delta: number, isMoving: boolean, moveSpeed: number, dimension: Dimension) {
    this.stateTime += delta;

    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= delta;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Adapt visual aura based on current dimension
    const isVeil = dimension === Dimension.VEIL;
    this.lanternPointLight.color.setHex(isVeil ? 0xcc77ff : 0x77bbff);
    this.lanternSpotLight.color.setHex(isVeil ? 0xdd99ff : 0x99ddff);

    // Subtle flicker on lantern
    const flicker = 1.0 + Math.sin(performance.now() * 0.008) * 0.12;
    if (this.isLanternActive) {
      this.lanternPointLight.intensity = 3.0 * flicker;
    }

    // Floating fragment orbital animation
    const time = performance.now() * 0.002;
    this.fragmentMeshes.forEach((frag, idx) => {
      const angle = time + (idx * Math.PI * 2) / this.fragmentMeshes.length;
      const radius = 0.5 + Math.sin(time * 2 + idx) * 0.1;
      frag.position.set(
        Math.cos(angle) * radius,
        1.4 + Math.sin(angle * 1.5) * 0.3,
        Math.sin(angle) * radius
      );
      frag.rotation.x += delta * 2;
      frag.rotation.y += delta * 1.5;
    });

    // Shadow tendrils movement
    this.tendrils.forEach((tendril, idx) => {
      const posAttr = tendril.geometry.attributes.position;
      for (let p = 1; p < 5; p++) {
        const wave = Math.sin(time * 3 + p * 0.8 + idx) * 0.04 * (p / 4);
        posAttr.setX(p, posAttr.getX(p) + wave * 0.15);
      }
      posAttr.needsUpdate = true;
    });

    // Cloak physics interpolation
    const speedRatio = Math.min(moveSpeed / 6, 1.2);
    this.cloakSegments.forEach((segment, idx) => {
      const lag = (idx + 1) * 0.08;
      const sway = Math.sin(time * 6 + idx * 0.5) * 0.06 * speedRatio;
      segment.rotation.x = speedRatio * 0.45 * (idx * 0.25) + sway;
      segment.position.z = -0.15 - idx * 0.04 - speedRatio * lag * 0.3;
    });

    // Animation states handling
    this.updateAnimation(delta, isMoving, moveSpeed);
  }

  private updateAnimation(delta: number, isMoving: boolean, moveSpeed: number) {
    if (this.state === PlayerAnimState.ATTACK || this.state === PlayerAnimState.HEAVY_ATTACK) {
      // Weapon slash animation
      const attackProgress = Math.min(this.stateTime / (this.state === PlayerAnimState.HEAVY_ATTACK ? 0.6 : 0.35), 1.0);
      const slashAngle = Math.sin(attackProgress * Math.PI) * 2.2;
      this.rightArm.rotation.x = -Math.PI / 3 + slashAngle;
      this.rightArm.rotation.y = -slashAngle * 0.8;
      this.rightArm.rotation.z = Math.PI / 4;

      // Reset arm if finished
      if (attackProgress >= 1.0) {
        this.state = isMoving ? (moveSpeed > 5 ? PlayerAnimState.RUN : PlayerAnimState.WALK) : PlayerAnimState.IDLE;
        this.rightArm.rotation.set(0, 0, 0);
      }
      return;
    }

    if (this.state === PlayerAnimState.DODGE) {
      // Fast evasive glide
      this.body.rotation.y = Math.sin(this.stateTime * 18) * 0.4;
      this.body.position.y = -0.2;
      if (this.stateTime > 0.35) {
        this.state = PlayerAnimState.IDLE;
        this.body.position.y = 0;
        this.body.rotation.y = 0;
      }
      return;
    }

    // Walking / Running procedural gait
    if (isMoving) {
      const freq = moveSpeed > 5 ? 12 : 7;
      this.walkCycle += delta * freq;

      const legSwing = Math.sin(this.walkCycle) * (moveSpeed > 5 ? 0.75 : 0.45);
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      // Arm swing opposite to legs
      this.leftArm.rotation.x = -legSwing * 0.6;
      this.rightArm.rotation.x = legSwing * 0.6;

      // Subtle hip bounce
      this.body.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.08;
    } else {
      // Breathing / Idle stance
      const breath = Math.sin(performance.now() * 0.0025) * 0.03;
      this.body.position.y = breath;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = Math.sin(performance.now() * 0.002) * 0.08;
      this.rightArm.rotation.x = -Math.sin(performance.now() * 0.002) * 0.08;
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.health <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 0.5; // Brief i-frames
    if (this.health <= 0) {
      this.isDead = true;
      this.state = PlayerAnimState.DEATH;
    } else {
      this.state = PlayerAnimState.HIT;
    }
    this.stateTime = 0;
    return true;
  }

  public heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public restoreVeil(amount: number) {
    this.veilEnergy = Math.min(this.maxVeilEnergy, this.veilEnergy + amount);
  }
}
