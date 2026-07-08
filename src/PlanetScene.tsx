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

  useEffect(() => {
    selectedRef.current = selectedBlock;
    toolRef.current = toolMode;
    placeRef.current = onPlaceBlock;
    deleteRef.current = onDeleteBlock;
  }, [selectedBlock, toolMode, onPlaceBlock, onDeleteBlock]);

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
      material.opacity = 0.22;
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
      camera.position.set(42, 34, 42);
      camera.lookAt(0, 0, 0);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const refreshBlocks = () => {
      blockGroup.clear();
      placedBlocks.forEach((block) => blockGroup.add(createBlockMesh(block)));
    };
    refreshBlocks();

    const snapToGrid = (value: number) => Math.max(-HALF_WORLD + 1, Math.min(HALF_WORLD - 1, Math.round(value)));

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
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

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    let isLooking = false;
    let lastPointer = { x: 0, y: 0 };

    const handlePointerMove = (event: PointerEvent) => {
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
      isLooking = true;
      lastPointer = { x: event.clientX, y: event.clientY };
    };

    const handleLookEnd = () => {
      isLooking = false;
    };

    const preventContextMenu = (event: MouseEvent) => event.preventDefault();

    renderer.domElement.addEventListener("pointerdown", handleLookStart);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handleLookEnd);
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
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerdown", handleLookStart);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handleLookEnd);
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

  const desert = new THREE.Mesh(new THREE.BoxGeometry(25, 0.09, 25), sandMaterial);
  desert.position.set(15, 0.02, -16);
  desert.receiveShadow = true;
  world.add(desert);

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

  const meadowMaterial = new THREE.MeshStandardMaterial({ color: "#4f7a43", roughness: 0.9 });
  const meadow = new THREE.Mesh(new THREE.BoxGeometry(24, 0.08, 22), meadowMaterial);
  meadow.position.set(-16, 0.025, -16);
  meadow.receiveShadow = true;
  world.add(meadow);
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

  const height = block.id === "brickBlock" || block.id === "glassBlock" || block.id === "woodBlock" ? 0.9 : 0.62;
  const cube = mark(new THREE.Mesh(new THREE.BoxGeometry(0.9, height, 0.9), material));
  cube.position.y = height / 2;
  group.add(cube);
  return group;
}

function createTerrainMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#3f6840";
    context.fillRect(0, 0, 512, 512);
    context.fillStyle = "#4f7a43";
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = "#2f6a46";
    context.fillRect(0, 256, 256, 256);
    context.fillStyle = "#caa766";
    context.fillRect(256, 0, 256, 256);
    context.fillStyle = "#6f7779";
    context.fillRect(256, 256, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 });
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
