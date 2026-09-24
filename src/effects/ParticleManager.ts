import * as THREE from 'three';
import { Dimension } from '../types/game';

interface Spark {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

export class ParticleManager {
  public group: THREE.Group;
  
  // Ambient atmospheric particle systems
  private rainGeometry!: THREE.BufferGeometry;
  private rainMaterial!: THREE.PointsMaterial;
  private rainPoints!: THREE.Points;
  private rainPositions!: Float32Array;
  private rainCount = 1200;

  private ashGeometry!: THREE.BufferGeometry;
  private ashMaterial!: THREE.PointsMaterial;
  private ashPoints!: THREE.Points;
  private ashPositions!: Float32Array;
  private ashCount = 800;

  private veilGeometry!: THREE.BufferGeometry;
  private veilMaterial!: THREE.PointsMaterial;
  private veilPoints!: THREE.Points;
  private veilPositions!: Float32Array;
  private veilCount = 1000;

  // Dynamic combat sparks / impact effects
  private sparks: Spark[] = [];
  private sparkGeometry: THREE.BufferGeometry;
  private sparkMaterial: THREE.PointsMaterial;
  private sparkPoints: THREE.Points;
  private sparkPositions: Float32Array;
  private sparkColors: Float32Array;
  private maxSparks = 600;

  // Dimensional shift burst
  private burstParticles: { pos: THREE.Vector3; vel: THREE.Vector3; life: number }[] = [];
  private burstGeometry: THREE.BufferGeometry;
  private burstMaterial: THREE.PointsMaterial;
  private burstPoints: THREE.Points;
  private burstPositions: Float32Array;
  private maxBurst = 500;

  constructor() {
    this.group = new THREE.Group();

    this.initRain();
    this.initAsh();
    this.initVeilParticles();
    
    // Spark pool
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeometry.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    this.sparkMaterial = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sparkPoints = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.group.add(this.sparkPoints);

    // Burst pool
    this.burstPositions = new Float32Array(this.maxBurst * 3);
    this.burstGeometry = new THREE.BufferGeometry();
    this.burstGeometry.setAttribute('position', new THREE.BufferAttribute(this.burstPositions, 3));
    this.burstMaterial = new THREE.PointsMaterial({
      color: 0xaa55ff,
      size: 0.4,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.burstPoints = new THREE.Points(this.burstGeometry, this.burstMaterial);
    this.group.add(this.burstPoints);
  }

  private initRain() {
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 80;
      this.rainPositions[i * 3 + 1] = Math.random() * 30;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0x7799aa,
      size: 0.15,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.rainPoints = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.group.add(this.rainPoints);
  }

  private initAsh() {
    this.ashPositions = new Float32Array(this.ashCount * 3);
    for (let i = 0; i < this.ashCount; i++) {
      this.ashPositions[i * 3] = (Math.random() - 0.5) * 70;
      this.ashPositions[i * 3 + 1] = Math.random() * 20;
      this.ashPositions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    this.ashGeometry = new THREE.BufferGeometry();
    this.ashGeometry.setAttribute('position', new THREE.BufferAttribute(this.ashPositions, 3));
    this.ashMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.18,
      transparent: true,
      opacity: 0.35,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    this.ashPoints = new THREE.Points(this.ashGeometry, this.ashMaterial);
    this.group.add(this.ashPoints);
  }

  private initVeilParticles() {
    this.veilPositions = new Float32Array(this.veilCount * 3);
    for (let i = 0; i < this.veilCount; i++) {
      this.veilPositions[i * 3] = (Math.random() - 0.5) * 90;
      this.veilPositions[i * 3 + 1] = Math.random() * 25;
      this.veilPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    this.veilGeometry = new THREE.BufferGeometry();
    this.veilGeometry.setAttribute('position', new THREE.BufferAttribute(this.veilPositions, 3));
    this.veilMaterial = new THREE.PointsMaterial({
      color: 0x9944ff,
      size: 0.32,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.veilPoints = new THREE.Points(this.veilGeometry, this.veilMaterial);
    this.group.add(this.veilPoints);
  }

  public emitHitSparks(pos: THREE.Vector3, isCrit: boolean = false) {
    const count = isCrit ? 35 : 18;
    const baseColor = isCrit ? new THREE.Color(0x00ffff) : new THREE.Color(0x88bbff);

    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) break;
      const speed = 2 + Math.random() * (isCrit ? 8 : 5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 1.5,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.sparks.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.5 + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3)),
        velocity: vel,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        color: baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2),
        size: isCrit ? 0.35 : 0.22
      });
    }
  }

  public emitDimensionShiftBurst(origin: THREE.Vector3, dimension: Dimension) {
    const count = 180;
    const isVeil = dimension === Dimension.VEIL;
    this.burstMaterial.color.setHex(isVeil ? 0xcc66ff : 0x55ccff);

    for (let i = 0; i < count; i++) {
      if (this.burstParticles.length >= this.maxBurst) break;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.3) * Math.PI;
      const speed = 4 + Math.random() * 8;
      this.burstParticles.push({
        pos: origin.clone().add(new THREE.Vector3(0, 1.2, 0)),
        vel: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elev) * speed,
          Math.sin(elev) * speed + 2,
          Math.sin(angle) * Math.cos(elev) * speed
        ),
        life: 0
      });
    }
  }

  public emitShadowTrail(pos: THREE.Vector3) {
    if (this.sparks.length >= this.maxSparks - 6) return;
    for (let i = 0; i < 4; i++) {
      this.sparks.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 1.5, (Math.random() - 0.5) * 0.4)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 1.2, (Math.random() - 0.5) * 0.5),
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        color: new THREE.Color(0x331166),
        size: 0.25
      });
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, dimension: Dimension) {
    const isVeil = dimension === Dimension.VEIL;

    // Follow player loosely for ambient weather particles
    this.rainPoints.position.set(playerPos.x, 0, playerPos.z);
    this.ashPoints.position.set(playerPos.x, 0, playerPos.z);
    this.veilPoints.position.set(playerPos.x, 0, playerPos.z);

    // Weather visibility depending on dimension
    this.rainMaterial.opacity = isVeil ? 0.08 : 0.45;
    this.ashMaterial.opacity = isVeil ? 0.6 : 0.2;
    this.veilMaterial.opacity = isVeil ? 0.85 : 0.0;

    // Animate Rain
    if (!isVeil) {
      const rPos = this.rainGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.rainCount; i++) {
        rPos[i * 3 + 1] -= delta * 38;
        if (rPos[i * 3 + 1] < 0) {
          rPos[i * 3 + 1] = 28 + Math.random() * 5;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
    }

    // Animate Ash / Embers
    const aPos = this.ashGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.ashCount; i++) {
      aPos[i * 3 + 1] -= delta * (0.8 + Math.sin(i) * 0.3);
      aPos[i * 3] += Math.sin(performance.now() * 0.001 + i) * delta * 0.5;
      if (aPos[i * 3 + 1] < 0) {
        aPos[i * 3 + 1] = 20;
      }
    }
    this.ashGeometry.attributes.position.needsUpdate = true;

    // Animate Veil floating spores (upward gravity in Veil)
    if (isVeil) {
      const vPos = this.veilGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.veilCount; i++) {
        vPos[i * 3 + 1] += delta * (1.2 + Math.cos(i) * 0.5);
        vPos[i * 3] += Math.sin(performance.now() * 0.0015 + i) * delta * 0.8;
        vPos[i * 3 + 2] += Math.cos(performance.now() * 0.0015 + i) * delta * 0.8;
        if (vPos[i * 3 + 1] > 25) {
          vPos[i * 3 + 1] = 0;
        }
      }
      this.veilGeometry.attributes.position.needsUpdate = true;
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += delta;
      if (s.life >= s.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }
      s.position.addScaledVector(s.velocity, delta);
      s.velocity.y -= 9.8 * delta; // Gravity
    }

    // Fill buffer
    for (let i = 0; i < this.maxSparks; i++) {
      if (i < this.sparks.length) {
        const s = this.sparks[i];
        this.sparkPositions[i * 3] = s.position.x;
        this.sparkPositions[i * 3 + 1] = s.position.y;
        this.sparkPositions[i * 3 + 2] = s.position.z;

        const lifeRatio = 1 - s.life / s.maxLife;
        this.sparkColors[i * 3] = s.color.r * lifeRatio;
        this.sparkColors[i * 3 + 1] = s.color.g * lifeRatio;
        this.sparkColors[i * 3 + 2] = s.color.b * lifeRatio;
      } else {
        this.sparkPositions[i * 3 + 1] = -9999;
      }
    }
    this.sparkGeometry.attributes.position.needsUpdate = true;
    this.sparkGeometry.attributes.color.needsUpdate = true;

    // Update Dimensional burst
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const b = this.burstParticles[i];
      b.life += delta;
      if (b.life >= 0.7) {
        this.burstParticles.splice(i, 1);
        continue;
      }
      b.pos.addScaledVector(b.vel, delta);
      b.vel.multiplyScalar(0.92);
    }
    for (let i = 0; i < this.maxBurst; i++) {
      if (i < this.burstParticles.length) {
        const b = this.burstParticles[i];
        this.burstPositions[i * 3] = b.pos.x;
        this.burstPositions[i * 3 + 1] = b.pos.y;
        this.burstPositions[i * 3 + 2] = b.pos.z;
      } else {
        this.burstPositions[i * 3 + 1] = -9999;
      }
    }
    this.burstGeometry.attributes.position.needsUpdate = true;
  }
}
