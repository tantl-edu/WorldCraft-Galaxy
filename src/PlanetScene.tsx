import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BuildBlock, PlacedBlock } from "./gameData";

type PlanetSceneProps = {
  avatarPosition: { x: number; z: number };
  cameraMode: "overhead" | "avatar";
  nickname: string;
  selectedBlock: BuildBlock;
  toolMode: "build" | "delete";
  placedBlocks: PlacedBlock[];
  onPlaceBlock: (block: BuildBlock, x: number, z: number) => void;
  onDeleteBlock: (instanceId: string) => void;
};

const WORLD_SIZE = 60;
const HALF_WORLD = WORLD_SIZE / 2;

export function PlanetScene({
  avatarPosition,
  cameraMode,
  nickname,
  selectedBlock,
  toolMode,
  placedBlocks,
  onPlaceBlock,
  onDeleteBlock,
}: PlanetSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef(selectedBlock);
  const toolRef = useRef(toolMode);
  const placeRef = useRef(onPlaceBlock);
  const deleteRef = useRef(onDeleteBlock);
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const cameraPanRef = useRef({ x: avatarPosition.x, z: avatarPosition.z });

  useEffect(() => {
    selectedRef.current = selectedBlock;
    toolRef.current = toolMode;
    placeRef.current = onPlaceBlock;
    deleteRef.current = onDeleteBlock;
  }, [selectedBlock, toolMode, onPlaceBlock, onDeleteBlock]);

  useEffect(() => {
    if (cameraMode === "overhead") {
      cameraPanRef.current = { x: avatarPosition.x, z: avatarPosition.z };
    }
  }, [avatarPosition.x, avatarPosition.z, cameraMode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#10141d");

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#e4f8ff", "#273225", 1.55);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight("#ffffff", 2.65);
    sun.position.set(9, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const world = new THREE.Group();
    scene.add(world);

    const ground = new THREE.Mesh(new THREE.BoxGeometry(WORLD_SIZE, 0.35, WORLD_SIZE), createTerrainMaterial());
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    world.add(ground);

    const grid = new THREE.GridHelper(WORLD_SIZE, WORLD_SIZE, "#78906e", "#486546");
    grid.position.y = 0.01;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.1;
    });
    world.add(grid);

    addRiver(world);
    addLake(world);
    addTerrainDetails(world);

    const blockGroup = new THREE.Group();
    world.add(blockGroup);

    const avatar = createAvatar(nickname);
    avatar.position.set(avatarPosition.x, 0.08, avatarPosition.z);
    avatar.visible = cameraMode !== "avatar";
    world.add(avatar);

    const updateOverheadCamera = () => {
      const pan = cameraPanRef.current;
      camera.position.set(pan.x + 42, 34, pan.z + 42);
      camera.lookAt(pan.x, 0, pan.z);
    };

    if (cameraMode === "avatar") {
      camera.position.set(avatarPosition.x, 1.55, avatarPosition.z + 0.2);
      const yaw = lookRef.current.yaw;
      const pitch = lookRef.current.pitch;
      camera.lookAt(
        avatarPosition.x + Math.sin(yaw) * 8,
        1.45 + pitch,
        avatarPosition.z - Math.cos(yaw) * 8,
      );
    } else {
      updateOverheadCamera();
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const refreshBlocks = () => {
      blockGroup.clear();
      placedBlocks.forEach((block) => blockGroup.add(createBlockMesh(block)));
    };
    refreshBlocks();

    const snapToGrid = (value: number) => Math.max(-HALF_WORLD + 1, Math.min(HALF_WORLD - 1, Math.round(value)));

    const clickTerrain = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (toolRef.current === "delete") {
        const blockHit = raycaster.intersectObjects(blockGroup.children, true)[0];
        const instanceId = blockHit?.object.userData.instanceId;
        if (typeof instanceId === "string") deleteRef.current(instanceId);
        return;
      }

      const groundHit = raycaster.intersectObject(ground)[0];
      if (!groundHit) return;

      placeRef.current(selectedRef.current, snapToGrid(groundHit.point.x), snapToGrid(groundHit.point.z));
    };

    let pointerAction:
      | {
          mode: "place" | "pan" | "look";
          startX: number;
          startY: number;
          lastX: number;
          lastY: number;
          dragged: boolean;
        }
      | null = null;
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    let isLooking = false;
    let lastPointer = { x: 0, y: 0 };

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      pointerAction = {
        mode: "place",
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        dragged: false,
      };
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerAction?.mode === "place" && cameraMode === "overhead") {
        const totalDx = event.clientX - pointerAction.startX;
        const totalDy = event.clientY - pointerAction.startY;
        if (Math.hypot(totalDx, totalDy) > 6) {
          pointerAction.mode = "pan";
          pointerAction.dragged = true;
        }
      }

      if (pointerAction?.mode === "pan") {
        const dx = event.clientX - pointerAction.lastX;
        const dy = event.clientY - pointerAction.lastY;
        pointerAction.lastX = event.clientX;
        pointerAction.lastY = event.clientY;
        const nextX = Math.max(-HALF_WORLD + 6, Math.min(HALF_WORLD - 6, cameraPanRef.current.x - dx * 0.06));
        const nextZ = Math.max(-HALF_WORLD + 6, Math.min(HALF_WORLD - 6, cameraPanRef.current.z - dy * 0.06));
        cameraPanRef.current = { x: nextX, z: nextZ };
        updateOverheadCamera();
        return;
      }

      if (!isLooking || cameraMode !== "avatar") return;
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      lookRef.current.yaw += dx * 0.008;
      lookRef.current.pitch = Math.max(-3, Math.min(3, lookRef.current.pitch - dy * 0.015));
      camera.lookAt(
        avatarPosition.x + Math.sin(lookRef.current.yaw) * 8,
        1.45 + lookRef.current.pitch,
        avatarPosition.z - Math.cos(lookRef.current.yaw) * 8,
      );
    };

    const handleLookStart = (event: PointerEvent) => {
      if (cameraMode !== "avatar" || event.button !== 2) return;
      event.preventDefault();
      pointerAction = {
        mode: "look",
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        dragged: true,
      };
      isLooking = true;
      lastPointer = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pointerAction?.mode === "place" && !pointerAction.dragged && event.button === 0) {
        clickTerrain(event);
      }
      pointerAction = null;
      isLooking = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const preventContextMenu = (event: MouseEvent) => event.preventDefault();

    renderer.domElement.addEventListener("pointerdown", handleLookStart);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerUp);
    renderer.domElement.addEventListener("contextmenu", preventContextMenu);

    const handleResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      avatar.rotation.y += 0.006;
      if (cameraMode === "overhead") updateOverheadCamera();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerdown", handleLookStart);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerUp);
      renderer.domElement.removeEventListener("contextmenu", preventContextMenu);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [avatarPosition, cameraMode, nickname, placedBlocks]);

  return <div className="planet-scene" ref={hostRef} aria-label="Large block-building terrain scene" />;
}

function addRiver(world: THREE.Group) {
  const riverMaterial = new THREE.MeshStandardMaterial({ color: "#2f86d7", roughness: 0.35, metalness: 0.08 });
  const river = new THREE.Group();
  [
    [-18, 0.03, -24, 9, 0.08, 2.5],
    [-13, 0.04, -16, 10, 0.08, 2.4],
    [-7, 0.05, -8, 11, 0.08, 2.3],
    [0, 0.06, 0, 11, 0.08, 2.2],
    [8, 0.07, 8, 10, 0.08, 2.1],
    [16, 0.08, 17, 9, 0.08, 2],
  ].forEach(([x, y, z, width, height, depth]) => {
    const segment = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), riverMaterial);
    segment.position.set(x, y, z);
    segment.rotation.y = -0.45;
    river.add(segment);
  });
  world.add(river);

  const falls = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.7, 0.26), riverMaterial);
  falls.position.set(16, 1.25, 13.4);
  falls.rotation.z = 0.12;
  world.add(falls);
}

function addLake(world: THREE.Group) {
  const lakeMaterial = new THREE.MeshStandardMaterial({ color: "#2f86d7", roughness: 0.28, metalness: 0.1 });
  const lake = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.5, 0.1, 32), lakeMaterial);
  lake.position.set(-19, 0.08, -18);
  lake.scale.set(1.25, 1, 0.72);
  lake.receiveShadow = true;
  world.add(lake);

  const beachMaterial = new THREE.MeshStandardMaterial({ color: "#d4b36f", roughness: 0.95 });
  const beach = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.6, 0.08, 32), beachMaterial);
  beach.position.set(-19, 0.025, -18);
  beach.scale.set(1.3, 1, 0.78);
  beach.receiveShadow = true;
  world.add(beach);
}

function addTerrainDetails(world: THREE.Group) {
  const mountainMaterial = new THREE.MeshStandardMaterial({ color: "#7f8287", roughness: 0.9 });
  const snowMaterial = new THREE.MeshStandardMaterial({ color: "#dfe8ef", roughness: 0.65 });
  const sandMaterial = new THREE.MeshStandardMaterial({ color: "#caa766", roughness: 0.95 });
  const forestMaterial = new THREE.MeshStandardMaterial({ color: "#286f44", roughness: 0.82 });
  const lavaMaterial = new THREE.MeshStandardMaterial({ color: "#ff5a22", emissive: "#8f2108", emissiveIntensity: 0.45, roughness: 0.62 });

  [
    [18, 12, 5.5],
    [23, 17, 4.6],
    [13, 19, 3.8],
    [20, 24, 3.2],
  ].forEach(([x, z, height]) => {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(3.1, height, 9), mountainMaterial);
    mountain.position.set(x, height / 2, z);
    mountain.castShadow = true;
    world.add(mountain);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.05, height * 0.28, 9), snowMaterial);
    cap.position.set(x, height * 0.84, z);
    world.add(cap);
  });

  [
    [-8, -21, 2.2, 5.8, 3.1],
    [-2, -18, 1.7, 4.7, 2.8],
    [-13, -9, 1.4, 4.1, 2.7],
    [5, 23, 1.9, 5.2, 3.4],
  ].forEach(([x, z, height, sx, sz]) => {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), new THREE.MeshStandardMaterial({ color: "#507849", roughness: 0.92 }));
    hill.scale.set(sx, height, sz);
    hill.position.set(x, height * 0.1, z);
    hill.castShadow = true;
    hill.receiveShadow = true;
    world.add(hill);
  });

  const desert = new THREE.Mesh(new THREE.CircleGeometry(1, 72), sandMaterial);
  desert.rotation.x = -Math.PI / 2;
  desert.scale.set(14, 8.5, 1);
  desert.position.set(16, 0.035, -15);
  desert.receiveShadow = true;
  world.add(desert);

  const moonPatch = new THREE.Mesh(
    new THREE.CircleGeometry(1, 56),
    new THREE.MeshStandardMaterial({ color: "#b8bec4", roughness: 0.94 }),
  );
  moonPatch.rotation.x = -Math.PI / 2;
  moonPatch.scale.set(7.5, 5, 1);
  moonPatch.position.set(4, 0.04, 25);
  world.add(moonPatch);

  const lava = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.11, 8), lavaMaterial);
  lava.position.set(20, 0.12, 17);
  lava.rotation.y = -0.34;
  world.add(lava);

  const cave = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.22, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: "#2b2d31", roughness: 0.9 }));
  cave.position.set(15.6, 0.85, 15.2);
  cave.rotation.set(0, 0, Math.PI);
  world.add(cave);

  [
    [-22, 9],
    [-19, 16],
    [-15, 22],
    [-11, 13],
    [-7, 20],
    [-24, 24],
    [-4, 9],
    [-24, -7],
    [-21, -5],
    [-17, -6],
    [-15, -2],
    [-10, 1],
    [3, 15],
    [7, 18],
    [10, 21],
  ].forEach(([x, z]) => {
    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 6), forestMaterial);
    tree.position.set(x, 0.9, z);
    tree.castShadow = true;
    world.add(tree);
  });

  addSketchFlourishes(world);
}

function addSketchFlourishes(world: THREE.Group) {
  const cactusMaterial = new THREE.MeshStandardMaterial({ color: "#3f8f52", roughness: 0.86 });
  const flowerMaterial = new THREE.MeshStandardMaterial({ color: "#ff79c6", roughness: 0.65 });
  const coralMaterial = new THREE.MeshStandardMaterial({ color: "#ff6f87", roughness: 0.58 });
  const kelpMaterial = new THREE.MeshStandardMaterial({ color: "#2f8b61", roughness: 0.78 });
  const crystalMaterial = new THREE.MeshStandardMaterial({ color: "#f1ecff", roughness: 0.38, metalness: 0.08 });
  const shellMaterial = new THREE.MeshStandardMaterial({ color: "#f6d8b8", roughness: 0.72 });

  [
    [13, -18],
    [18, -12],
    [22, -18],
    [8, -10],
  ].forEach(([x, z]) => {
    const cactus = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.35, 0.35), cactusMaterial);
    trunk.position.y = 0.68;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.24, 0.24), cactusMaterial);
    arm.position.set(0.32, 0.95, 0);
    cactus.add(trunk, arm);
    cactus.position.set(x, 0.05, z);
    world.add(cactus);
  });

  [
    [-24, 13],
    [-20, 20],
    [-17, 11],
    [-11, 17],
    [-7, 13],
    [-23, 24],
  ].forEach(([x, z], index) => {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), flowerMaterial);
    flower.position.set(x, 0.32, z);
    flower.scale.set(1, 0.55, 1);
    world.add(flower);

    if (index % 2 === 0) {
      const vine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), kelpMaterial);
      vine.position.set(x + 0.7, 0.8, z - 0.4);
      vine.rotation.z = 0.25;
      world.add(vine);
    }
  });

  [
    [-24, -18],
    [-21, -15],
    [-16, -22],
  ].forEach(([x, z]) => {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 6, 0, Math.PI), shellMaterial);
    shell.position.set(x, 0.18, z);
    shell.scale.set(1, 0.35, 0.8);
    world.add(shell);
  });

  [
    [-12, -21],
    [-9, -18],
    [-6, -23],
  ].forEach(([x, z]) => {
    const kelp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.2, 5), kelpMaterial);
    kelp.position.set(x, 0.62, z);
    kelp.rotation.z = 0.18;
    world.add(kelp);

    const coral = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.72, 7), coralMaterial);
    coral.position.set(x + 0.55, 0.38, z + 0.35);
    world.add(coral);
  });

  [
    [15, 19],
    [21, 13],
    [23, 21],
  ].forEach(([x, z]) => {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), crystalMaterial);
    crystal.position.set(x, 0.55, z);
    crystal.castShadow = true;
    world.add(crystal);
  });
}

function createBlockMesh(block: PlacedBlock) {
  const group = new THREE.Group();
  group.position.set(block.x, 0.08 + block.y * 0.9, block.z);
  group.userData.instanceId = block.instanceId;

  const material = new THREE.MeshStandardMaterial({ color: block.color, roughness: 0.55, metalness: 0.1 });
  const mark = (mesh: THREE.Object3D) => {
    mesh.userData.instanceId = block.instanceId;
    return mesh;
  };

  if (block.id === "waterway") {
    const water = mark(new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 1), material));
    water.position.y = 0.04;
    group.add(water);
    return group;
  }

  if (block.id === "cactus") {
    const trunk = mark(new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.25, 0.35), material));
    trunk.position.y = 0.62;
    const armA = mark(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.25), material));
    armA.position.set(0.3, 0.9, 0);
    const armB = mark(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.58, 0.25), material));
    armB.position.set(0.62, 1.1, 0);
    group.add(trunk, armA, armB);
    return group;
  }

  if (block.id === "pine") {
    const trunk = mark(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 0.28), new THREE.MeshStandardMaterial({ color: "#7b512f" })));
    trunk.position.y = 0.37;
    const leaves = mark(new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.3, 7), material));
    leaves.position.y = 1.2;
    group.add(trunk, leaves);
    return group;
  }

  if (block.id === "kelpPatch" || block.id === "vineWall") {
    const stemA = mark(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.15, 0.16), material));
    stemA.position.set(-0.18, 0.58, 0);
    stemA.rotation.z = 0.18;
    const stemB = mark(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.16), material));
    stemB.position.set(0.18, 0.5, 0.05);
    stemB.rotation.z = -0.18;
    group.add(stemA, stemB);
    return group;
  }

  if (block.id === "flowerPatch") {
    [-0.25, 0, 0.25].forEach((x, index) => {
      const stem = mark(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), new THREE.MeshStandardMaterial({ color: "#3f9f6b" })));
      stem.position.set(x, 0.21, 0);
      const bloom = mark(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), material));
      bloom.position.set(x, 0.48, index === 1 ? 0.16 : -0.06);
      group.add(stem, bloom);
    });
    return group;
  }

  if (block.id === "diamondBeacon" || block.id === "starDust") {
    const gem = mark(new THREE.Mesh(new THREE.OctahedronGeometry(0.48), material));
    gem.position.y = 0.72;
    const base = mark(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.26, 8), new THREE.MeshStandardMaterial({ color: "#303846", roughness: 0.55 })));
    base.position.y = 0.13;
    group.add(base, gem);
    return group;
  }

  if (block.id === "lavaFlow") {
    const lava = mark(new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 1), new THREE.MeshStandardMaterial({ color: block.color, emissive: "#8f2108", emissiveIntensity: 0.5 })));
    lava.position.y = 0.05;
    group.add(lava);
    return group;
  }

  if (block.id === "forestHome") {
    const base = mark(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.95), material));
    base.position.y = 0.37;
    const roof = mark(new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.62, 4), new THREE.MeshStandardMaterial({ color: "#c8793f", roughness: 0.65 })));
    roof.position.y = 1.05;
    roof.rotation.y = Math.PI / 4;
    group.add(base, roof);
    return group;
  }

  if (block.id === "slide") {
    const tower = mark(new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.65, 0.7), material));
    tower.position.y = 0.82;
    const slide = mark(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 1.6), new THREE.MeshStandardMaterial({ color: "#4aa3ff", roughness: 0.42 })));
    slide.position.set(0, 0.72, 0.85);
    slide.rotation.x = -0.55;
    group.add(tower, slide);
    return group;
  }

  if (block.id === "dock") {
    const platform = mark(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 1.2), material));
    platform.position.y = 0.25;
    const beacon = mark(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 10), new THREE.MeshStandardMaterial({ color: "#e9edf5", metalness: 0.25 })));
    beacon.position.y = 0.95;
    group.add(platform, beacon);
    return group;
  }

  if (block.id === "lift") {
    const columnA = mark(new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 0.22), material));
    columnA.position.set(-0.3, 1.05, -0.2);
    const columnB = columnA.clone();
    columnB.userData.instanceId = block.instanceId;
    columnB.position.set(0.3, 1.05, -0.2);
    const cabin = mark(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.45, 0.7), new THREE.MeshStandardMaterial({ color: "#edf7ff", roughness: 0.35 })));
    cabin.position.set(0, 1.45, 0.22);
    group.add(columnA, columnB, cabin);
    return group;
  }

  const height =
    block.id === "brickBlock" ||
    block.id === "glassBlock" ||
    block.id === "woodBlock" ||
    block.id === "quartzBlock" ||
    block.id === "coralBlock" ||
    block.id === "shellBlock" ||
    block.id === "iceBlock"
      ? 0.9
      : 0.62;
  const cube = mark(new THREE.Mesh(new THREE.BoxGeometry(0.9, height, 0.9), material));
  cube.position.y = height / 2;
  group.add(cube);
  return group;
}

function createTerrainMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#456f42";
    context.fillRect(0, 0, canvas.width, canvas.height);
    paintBlob(context, 220, 250, 260, 170, "#5b874b", 0.75);
    paintBlob(context, 265, 760, 270, 190, "#2f6f47", 0.8);
    paintBlob(context, 710, 270, 260, 170, "#caa766", 0.82);
    paintBlob(context, 735, 730, 260, 220, "#717a7d", 0.72);
    paintBlob(context, 505, 160, 175, 95, "#d1bd78", 0.65);
    paintBlob(context, 490, 855, 150, 95, "#aeb4ba", 0.55);

    for (let i = 0; i < 90; i += 1) {
      const x = (Math.sin(i * 17.21) * 0.5 + 0.5) * canvas.width;
      const y = (Math.cos(i * 9.73) * 0.5 + 0.5) * canvas.height;
      const radiusX = 18 + ((i * 13) % 62);
      const radiusY = 12 + ((i * 19) % 48);
      const color = i % 5 === 0 ? "#618a4e" : i % 5 === 1 ? "#3f7847" : i % 5 === 2 ? "#567247" : i % 5 === 3 ? "#6f7779" : "#d0b673";
      paintBlob(context, x, y, radiusX, radiusY, color, 0.15);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 });
}

function paintBlob(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color: string,
  alpha: number,
) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.beginPath();
  for (let i = 0; i <= 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    const wobble = 0.78 + 0.22 * Math.sin(i * 2.3 + x * 0.01);
    const px = x + Math.cos(angle) * radiusX * wobble;
    const py = y + Math.sin(angle) * radiusY * (0.82 + 0.18 * Math.cos(i * 1.7 + y * 0.01));
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function createAvatar(nickname: string) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.72, 4, 12),
    new THREE.MeshStandardMaterial({ color: "#ffcc6d", roughness: 0.55 }),
  );
  body.position.y = 0.72;
  body.castShadow = true;

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.16, 0.06),
    new THREE.MeshStandardMaterial({ color: "#2b3c58", roughness: 0.32 }),
  );
  visor.position.set(0, 1.04, 0.29);

  const label = makeLabelSprite(nickname);
  label.position.set(0, 1.75, 0);

  group.add(body, visor, label);
  return group;
}

function makeLabelSprite(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 80;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "rgba(12, 16, 24, 0.82)";
    context.roundRect(12, 12, 232, 48, 12);
    context.fill();
    context.fillStyle = "#ffffff";
    context.font = "700 26px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(text, 128, 45);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(2.8, 0.88, 1);
  return sprite;
}
