import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BuildBlock, PlacedBlock } from "./gameData";

type PlanetSceneProps = {
  nickname: string;
  selectedBlock: BuildBlock;
  toolMode: "build" | "delete";
  placedBlocks: PlacedBlock[];
  onPlaceBlock: (block: BuildBlock, x: number, z: number) => void;
  onDeleteBlock: (instanceId: string) => void;
};

const WORLD_SIZE = 28;
const HALF_WORLD = WORLD_SIZE / 2;

export function PlanetScene({
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

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 120);
    camera.position.set(19, 18, 20);
    camera.lookAt(0, 0, 0);

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

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(WORLD_SIZE, 0.35, WORLD_SIZE),
      new THREE.MeshStandardMaterial({ color: "#395f3c", roughness: 0.86 }),
    );
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    world.add(ground);

    const grid = new THREE.GridHelper(WORLD_SIZE, WORLD_SIZE, "#6e8765", "#486546");
    grid.position.y = 0.01;
    world.add(grid);

    addRiver(world);
    addTerrainDetails(world);

    const blockGroup = new THREE.Group();
    world.add(blockGroup);

    const avatar = createAvatar(nickname);
    avatar.position.set(-10, 0.08, 8);
    world.add(avatar);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const refreshBlocks = () => {
      blockGroup.clear();
      placedBlocks.forEach((block) => blockGroup.add(createBlockMesh(block)));
    };
    refreshBlocks();

    const snapToGrid = (value: number) => Math.max(-HALF_WORLD + 0.5, Math.min(HALF_WORLD - 0.5, Math.round(value)));

    const handlePointerDown = (event: PointerEvent) => {
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
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [nickname, placedBlocks]);

  return <div className="planet-scene" ref={hostRef} aria-label="Large block-building terrain scene" />;
}

function addRiver(world: THREE.Group) {
  const riverMaterial = new THREE.MeshStandardMaterial({ color: "#2f86d7", roughness: 0.35, metalness: 0.08 });
  const river = new THREE.Group();
  [
    [-8, 0.03, -10, 4.8, 0.08, 2.1],
    [-5, 0.04, -6, 5.2, 0.08, 2],
    [-2, 0.05, -2.2, 5.8, 0.08, 1.85],
    [1.8, 0.06, 1.1, 6, 0.08, 1.8],
    [5.7, 0.07, 4.6, 5, 0.08, 1.7],
    [9, 0.08, 8.2, 4.2, 0.08, 1.6],
  ].forEach(([x, y, z, width, height, depth]) => {
    const segment = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), riverMaterial);
    segment.position.set(x, y, z);
    segment.rotation.y = -0.45;
    river.add(segment);
  });
  world.add(river);
}

function addTerrainDetails(world: THREE.Group) {
  const mountainMaterial = new THREE.MeshStandardMaterial({ color: "#7f8287", roughness: 0.9 });
  const snowMaterial = new THREE.MeshStandardMaterial({ color: "#dfe8ef", roughness: 0.65 });
  const sandMaterial = new THREE.MeshStandardMaterial({ color: "#caa766", roughness: 0.95 });
  const forestMaterial = new THREE.MeshStandardMaterial({ color: "#286f44", roughness: 0.82 });

  [
    [9, -8, 2.5],
    [11, -5, 1.9],
    [7, -5, 1.6],
  ].forEach(([x, z, height]) => {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(1.45, height, 4), mountainMaterial);
    mountain.position.set(x, height / 2, z);
    mountain.rotation.y = Math.PI / 4;
    mountain.castShadow = true;
    world.add(mountain);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, height * 0.32, 4), snowMaterial);
    cap.position.set(x, height * 0.84, z);
    cap.rotation.y = Math.PI / 4;
    world.add(cap);
  });

  const desert = new THREE.Mesh(new THREE.BoxGeometry(7, 0.09, 6), sandMaterial);
  desert.position.set(8.6, 0.02, -6);
  desert.receiveShadow = true;
  world.add(desert);

  [
    [-10, 6],
    [-8, 7],
    [-6, 6],
    [-9, 4],
    [-5, 4.7],
  ].forEach(([x, z]) => {
    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 6), forestMaterial);
    tree.position.set(x, 0.9, z);
    tree.castShadow = true;
    world.add(tree);
  });
}

function createBlockMesh(block: PlacedBlock) {
  const group = new THREE.Group();
  group.position.set(block.x, 0.08, block.z);
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

  const height = block.id === "brickBlock" ? 0.72 : 0.62;
  const cube = mark(new THREE.Mesh(new THREE.BoxGeometry(0.9, height, 0.9), material));
  cube.position.y = height / 2;
  group.add(cube);
  return group;
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
