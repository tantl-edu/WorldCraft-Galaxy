import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BuildBlock } from "./gameData";

type PlanetSceneProps = {
  selectedBlock: BuildBlock;
  placedBlocks: BuildBlock[];
  onPlaceBlock: (block: BuildBlock) => void;
};

const blockPositions = [
  [-3, 0.4, -2],
  [-1.8, 0.7, -1],
  [-0.4, 0.4, -2.3],
  [1.1, 0.5, -1.2],
  [2.4, 0.8, -2.1],
  [-2.6, 0.4, 0.4],
  [-1.1, 0.8, 0.8],
  [0.4, 0.4, 0.1],
  [1.8, 0.6, 0.7],
  [3, 0.4, 0],
  [-2, 0.5, 2],
  [-0.6, 0.9, 1.9],
  [0.9, 0.5, 2.2],
  [2.5, 0.8, 1.8],
];

export function PlanetScene({ selectedBlock, placedBlocks, onPlaceBlock }: PlanetSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef(selectedBlock);
  const placeRef = useRef(onPlaceBlock);

  useEffect(() => {
    selectedRef.current = selectedBlock;
    placeRef.current = onPlaceBlock;
  }, [selectedBlock, onPlaceBlock]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#10141d");

    const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(6.5, 6, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#dff6ff", "#25202b", 1.4);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight("#ffffff", 2.4);
    sun.position.set(4, 9, 5);
    sun.castShadow = true;
    scene.add(sun);

    const planet = new THREE.Group();
    scene.add(planet);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: "#253f35",
      roughness: 0.8,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.35, 5.7), groundMaterial);
    ground.receiveShadow = true;
    planet.add(ground);

    const water = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ color: "#2678c9", roughness: 0.35, metalness: 0.1 }),
    );
    water.position.set(0, 0.24, 2.15);
    planet.add(water);

    const pads = blockPositions.map(([x, y, z], index) => {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.08, 0.78),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? "#405846" : "#344f52",
          roughness: 0.7,
        }),
      );
      pad.position.set(x, y, z);
      pad.userData.index = index;
      pad.receiveShadow = true;
      planet.add(pad);
      return pad;
    });

    const blockGroup = new THREE.Group();
    planet.add(blockGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const createBlockMesh = (block: BuildBlock, index: number) => {
      const [x, y, z] = blockPositions[index % blockPositions.length];
      const height = block.id === "lift" ? 1.45 : block.id === "slide" ? 1.15 : 0.8;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.64, height, 0.64),
        new THREE.MeshStandardMaterial({ color: block.color, roughness: 0.48, metalness: 0.12 }),
      );
      mesh.position.set(x, y + height / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const refreshBlocks = () => {
      blockGroup.clear();
      placedBlocks.forEach((block, index) => blockGroup.add(createBlockMesh(block, index)));
    };
    refreshBlocks();

    const handlePointerDown = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pads)[0];
      if (hit) {
        placeRef.current(selectedRef.current);
      }
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
      planet.rotation.y += 0.0025;
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
  }, [placedBlocks]);

  return <div className="planet-scene" ref={hostRef} aria-label="Block building planet scene" />;
}
