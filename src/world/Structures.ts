import * as THREE from 'three';
import { Dimension } from '../types/game';

// Shared materials for efficient memory & drawcalls
export class MaterialsLibrary {
  public static blackStoneMat = new THREE.MeshStandardMaterial({
    color: 0x1f2026,
    roughness: 0.9,
    metalness: 0.1
  });

  public static brokenStoneMat = new THREE.MeshStandardMaterial({
    color: 0x2b2c34,
    roughness: 0.95,
    metalness: 0.05
  });

  public static darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x1c1714,
    roughness: 0.85
  });

  public static roofSlateMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.7
  });

  public static deadBarkMat = new THREE.MeshStandardMaterial({
    color: 0x131215,
    roughness: 0.95
  });

  public static veilBoneMat = new THREE.MeshStandardMaterial({
    color: 0xbdb7d6,
    emissive: 0x331b55,
    emissiveIntensity: 0.6,
    roughness: 0.4
  });

  public static veilRuneMat = new THREE.MeshStandardMaterial({
    color: 0xcc66ff,
    emissive: 0xaa33ff,
    emissiveIntensity: 1.8,
    roughness: 0.2
  });

  public static crystalMat = new THREE.MeshStandardMaterial({
    color: 0x66ddff,
    emissive: 0x2288cc,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.8
  });

  public static waterMat = new THREE.MeshStandardMaterial({
    color: 0x0a141e,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75
  });
}

export class Structures {
  public static createStoneWall(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geom, MaterialsLibrary.blackStoneMat);
    wall.position.y = height / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    return group;
  }

  public static createBrokenWall(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    const segments = Math.max(3, Math.floor(width / 1.5));
    const segWidth = width / segments;

    for (let i = 0; i < segments; i++) {
      const segH = height * (0.35 + Math.random() * 0.65);
      const geom = new THREE.BoxGeometry(segWidth * 0.96, segH, depth);
      const mesh = new THREE.Mesh(geom, MaterialsLibrary.brokenStoneMat);
      mesh.position.set(
        -width / 2 + (i + 0.5) * segWidth,
        segH / 2,
        (Math.random() - 0.5) * 0.1
      );
      mesh.rotation.y = (Math.random() - 0.5) * 0.08;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }

  public static createGothicArch(width: number = 4, height: number = 6): THREE.Group {
    const group = new THREE.Group();
    const pillarGeom = new THREE.CylinderGeometry(0.35, 0.45, height, 8);
    const leftPillar = new THREE.Mesh(pillarGeom, MaterialsLibrary.blackStoneMat);
    leftPillar.position.set(-width / 2, height / 2, 0);
    leftPillar.castShadow = true;

    const rightPillar = new THREE.Mesh(pillarGeom, MaterialsLibrary.blackStoneMat);
    rightPillar.position.set(width / 2, height / 2, 0);
    rightPillar.castShadow = true;

    // Curved peak arch
    const archCurve = new THREE.TorusGeometry(width / 2, 0.3, 8, 12, Math.PI);
    const archMesh = new THREE.Mesh(archCurve, MaterialsLibrary.blackStoneMat);
    archMesh.position.set(0, height - 0.3, 0);
    archMesh.rotation.z = Math.PI;
    archMesh.castShadow = true;

    // Keystones
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), MaterialsLibrary.brokenStoneMat);
    keystone.position.set(0, height + width / 2 - 0.3, 0);
    keystone.castShadow = true;

    group.add(leftPillar, rightPillar, archMesh, keystone);
    return group;
  }

  public static createTower(radius: number = 3, height: number = 16): THREE.Group {
    const group = new THREE.Group();
    const baseGeom = new THREE.CylinderGeometry(radius * 0.88, radius, height, 10);
    const towerMesh = new THREE.Mesh(baseGeom, MaterialsLibrary.blackStoneMat);
    towerMesh.position.y = height / 2;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    // Battlements
    const battlementsCount = 8;
    for (let b = 0; b < battlementsCount; b++) {
      const angle = (b / battlementsCount) * Math.PI * 2;
      const batMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), MaterialsLibrary.blackStoneMat);
      batMesh.position.set(
        Math.cos(angle) * (radius * 0.9),
        height + 0.6,
        Math.sin(angle) * (radius * 0.9)
      );
      batMesh.rotation.y = -angle;
      batMesh.castShadow = true;
      group.add(batMesh);
    }
    return group;
  }

  public static createHouse(width: number = 6, length: number = 8, height: number = 5): THREE.Group {
    const group = new THREE.Group();

    // Stone foundation
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.3, 1.2, length + 0.3),
      MaterialsLibrary.blackStoneMat
    );
    foundation.position.y = 0.6;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    group.add(foundation);

    // Timber walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(width, height - 1.2, length),
      MaterialsLibrary.darkWoodMat
    );
    walls.position.y = 1.2 + (height - 1.2) / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Peaked gothic roof
    const roofGeom = new THREE.ConeGeometry(Math.max(width, length) * 0.75, 3.2, 4);
    const roofMesh = new THREE.Mesh(roofGeom, MaterialsLibrary.roofSlateMat);
    roofMesh.position.y = height + 1.5;
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Chimney
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 4.2, 0.8),
      MaterialsLibrary.blackStoneMat
    );
    chimney.position.set(width * 0.3, height + 1.5, length * 0.25);
    chimney.castShadow = true;
    group.add(chimney);

    return group;
  }

  public static createTree(height: number = 8): THREE.Group {
    const group = new THREE.Group();
    // Twisted trunk
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.7, height, 7);
    const trunk = new THREE.Mesh(trunkGeom, MaterialsLibrary.deadBarkMat);
    trunk.position.y = height / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.rotation.x = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    group.add(trunk);

    // Gnarly branches
    const branchCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < branchCount; i++) {
      const bLen = 2.5 + Math.random() * 2;
      const bGeom = new THREE.CylinderGeometry(0.08, 0.2, bLen, 5);
      const branch = new THREE.Mesh(bGeom, MaterialsLibrary.deadBarkMat);
      const angle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const hOffset = height * (0.6 + (i / branchCount) * 0.35);

      branch.position.set(0, hOffset, 0);
      branch.rotation.y = angle;
      branch.rotation.z = Math.PI / 3 + (Math.random() - 0.5) * 0.2;
      branch.castShadow = true;
      group.add(branch);
    }

    return group;
  }

  public static createGrave(): THREE.Group {
    const group = new THREE.Group();
    // Headstone
    const stoneGeom = new THREE.BoxGeometry(0.65, 1.2, 0.2);
    const headstone = new THREE.Mesh(stoneGeom, MaterialsLibrary.brokenStoneMat);
    headstone.position.y = 0.6;
    headstone.rotation.y = (Math.random() - 0.5) * 0.3;
    headstone.rotation.z = (Math.random() - 0.5) * 0.15;
    headstone.castShadow = true;
    group.add(headstone);

    // Grave mound
    const mound = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.2, 1.8),
      MaterialsLibrary.blackStoneMat
    );
    mound.position.set(0, 0.1, 0.8);
    mound.receiveShadow = true;
    group.add(mound);

    return group;
  }

  public static createStatue(): THREE.Group {
    const group = new THREE.Group();
    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.4, 1.6),
      MaterialsLibrary.blackStoneMat
    );
    pedestal.position.y = 0.7;
    pedestal.castShadow = true;
    group.add(pedestal);

    // Mysterious robed figure silhouette
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.7, 3.2, 8),
      MaterialsLibrary.brokenStoneMat
    );
    body.position.y = 1.4 + 1.6;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 8, 8),
      MaterialsLibrary.brokenStoneMat
    );
    head.position.y = 4.7;
    head.castShadow = true;
    head.name = 'StatueHead';
    group.add(head);

    return group;
  }

  public static createTorch(): { group: THREE.Group; light: THREE.PointLight } {
    const group = new THREE.Group();
    const sconce = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.04, 0.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x333339, metalness: 0.8 })
    );
    sconce.rotation.z = Math.PI / 6;
    sconce.position.set(0.15, 0.4, 0);
    group.add(sconce);

    const flameMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12),
      new THREE.MeshBasicMaterial({ color: 0xffaa44 })
    );
    flameMesh.position.set(0.3, 0.7, 0);
    group.add(flameMesh);

    const light = new THREE.PointLight(0xff8833, 1.8, 10, 1.6);
    light.position.set(0.35, 0.75, 0);
    group.add(light);

    return { group, light };
  }

  public static createShrine(): { group: THREE.Group; crystal: THREE.Mesh; light: THREE.PointLight } {
    const group = new THREE.Group();
    group.name = 'VeilShrine';

    // Black monolith base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.0, 0.6, 8),
      MaterialsLibrary.blackStoneMat
    );
    base.position.y = 0.3;
    base.receiveShadow = true;
    group.add(base);

    // Three surrounding obsidian spires
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 3.5, 4),
        MaterialsLibrary.blackStoneMat
      );
      spire.position.set(Math.cos(angle) * 1.2, 1.75, Math.sin(angle) * 1.2);
      spire.rotation.y = angle;
      spire.castShadow = true;
      group.add(spire);
    }

    // Floating pulsating central crystal
    const crystalGeom = new THREE.OctahedronGeometry(0.45);
    const crystal = new THREE.Mesh(crystalGeom, MaterialsLibrary.crystalMat);
    crystal.position.set(0, 2.2, 0);
    crystal.castShadow = true;
    group.add(crystal);

    // Radiant shrine light
    const light = new THREE.PointLight(0x44bbff, 2.5, 14);
    light.position.set(0, 2.4, 0);
    group.add(light);

    return { group, crystal, light };
  }

  public static createBridgeSection(isVeil: boolean): THREE.Group {
    const group = new THREE.Group();
    if (!isVeil) {
      // Broken gap bridge for Waking World
      const leftPart = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4.5), MaterialsLibrary.brokenStoneMat);
      leftPart.position.set(-3.5, 0.3, 0);
      leftPart.castShadow = true;
      leftPart.receiveShadow = true;

      const rightPart = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4.5), MaterialsLibrary.brokenStoneMat);
      rightPart.position.set(3.5, 0.3, 0);
      rightPart.castShadow = true;
      rightPart.receiveShadow = true;

      group.add(leftPart, rightPart);
    } else {
      // Intact floating bone & stone platform bridge in The Veil
      for (let p = -4; p <= 4; p += 1.8) {
        const platform = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.45, 4.2),
          MaterialsLibrary.veilBoneMat
        );
        platform.position.set(p, 0.3 + Math.sin(p) * 0.2, 0);
        platform.castShadow = true;
        platform.receiveShadow = true;
        group.add(platform);
      }
    }
    return group;
  }
}
