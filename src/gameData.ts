export type Resource = {
  id: string;
  name: string;
  origin: string;
  amount: number;
  value: number;
  rarity: "Common" | "Useful" | "Rare" | "Legendary";
  color: string;
  description: string;
  uses: string[];
};

export type BuildBlock = {
  id: string;
  label: string;
  resourceId: string;
  origin: string;
  category: "terrain" | "plant" | "building" | "special";
  unlock: "local" | "trade";
  color: string;
};

export type PlacedBlock = BuildBlock & {
  instanceId: string;
  x: number;
  y: number;
  z: number;
};

export type WorldRegion = {
  name: string;
  biome: string;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
};

export type TradeOffer = {
  id: string;
  from: string;
  wants: string;
  gives: string;
  unlockOrigin: string;
  status: "Open" | "Pending" | "Accepted";
};

export const starterPlanet = {
  name: "Auralis Reach",
  system: "Velora System",
  privacy: "Private build, visitors read-only",
  description:
    "A large starter world with named regions, rivers, forests, desert, and mountains. Move your avatar, build upward, and trade for blocks from other planets.",
};

export const worldRegions: WorldRegion[] = [
  { name: "Auralis Meadowlands", biome: "grass country", xMin: -30, xMax: 0, zMin: -30, zMax: 0 },
  { name: "Viretta Forest Belt", biome: "forest country", xMin: -30, xMax: 0, zMin: 0, zMax: 30 },
  { name: "Cindara Dunes", biome: "desert country", xMin: 0, xMax: 30, zMin: -30, zMax: 0 },
  { name: "Lunara Highlands", biome: "mountain country", xMin: 0, xMax: 30, zMin: 0, zMax: 30 },
];

export function getWorldRegion(x: number, z: number) {
  return (
    worldRegions.find((region) => x >= region.xMin && x < region.xMax && z >= region.zMin && z < region.zMax) ??
    worldRegions[0]
  );
}

export const resources: Resource[] = [
  {
    id: "water",
    name: "Water",
    origin: "Auralis Reach",
    amount: 84,
    value: 3,
    rarity: "Common",
    color: "#4aa3ff",
    description: "Clean water gathered from Auralis tide wells.",
    uses: ["farms", "canals", "habitats", "water parks"],
  },
  {
    id: "wood",
    name: "Timber",
    origin: "Auralis Reach",
    amount: 90,
    value: 3,
    rarity: "Common",
    color: "#8a5a31",
    description: "Local wood from starter-world groves.",
    uses: ["homes", "bridges", "tools", "roof frames"],
  },
  {
    id: "grass",
    name: "Grass Block",
    origin: "Auralis Reach",
    amount: 120,
    value: 1,
    rarity: "Common",
    color: "#4f8d46",
    description: "Basic terrain block for shaping fields and hills.",
    uses: ["lawns", "parks", "hills", "gardens"],
  },
  {
    id: "dirt",
    name: "Dirt",
    origin: "Auralis Reach",
    amount: 130,
    value: 1,
    rarity: "Common",
    color: "#7b5638",
    description: "Basic earth for shaping land and stacking natural terrain.",
    uses: ["hills", "paths", "farms", "foundations"],
  },
  {
    id: "sand",
    name: "Sand",
    origin: "Auralis Reach",
    amount: 88,
    value: 2,
    rarity: "Common",
    color: "#d4b36f",
    description: "Starter sand from lake beaches and dry regions.",
    uses: ["beaches", "desert towns", "glass prep", "paths"],
  },
  {
    id: "stone",
    name: "Stone",
    origin: "Auralis Reach",
    amount: 96,
    value: 3,
    rarity: "Common",
    color: "#8f9692",
    description: "Reliable local rock for walls, steps, and mountain builds.",
    uses: ["walls", "roads", "bridges", "towers"],
  },
  {
    id: "clay",
    name: "Blue-Orange Clay",
    origin: "Cindara Dunes",
    amount: 32,
    value: 7,
    rarity: "Rare",
    color: "#ff8b3d",
    description: "A colorful clay that bends into smooth, playful shapes.",
    uses: ["water slides", "park sculptures", "curved towers", "decorative blocks"],
  },
  {
    id: "mineral",
    name: "Star Iron",
    origin: "Lunara Quarry",
    amount: 18,
    value: 9,
    rarity: "Rare",
    color: "#bfc8d8",
    description: "Strong mineral ore used for advanced buildings and ships.",
    uses: ["launch pads", "machines", "rails", "space elevators"],
  },
  {
    id: "gas",
    name: "Sky Gas",
    origin: "Cloudmere Stormbelt",
    amount: 12,
    value: 12,
    rarity: "Legendary",
    color: "#d6f46f",
    description: "Light gas that powers floating platforms and air travel.",
    uses: ["airships", "floating cities", "weather engines", "planet gates"],
  },
  {
    id: "brick",
    name: "Brick",
    origin: "Auralis Reach",
    amount: 72,
    value: 4,
    rarity: "Common",
    color: "#bf5942",
    description: "Reliable city-building blocks made from fired local clay.",
    uses: ["houses", "shops", "roads", "town centers"],
  },
  {
    id: "cactus",
    name: "Cactus Fiber",
    origin: "Cindara Dunes",
    amount: 40,
    value: 4,
    rarity: "Common",
    color: "#4fa35d",
    description: "Tough desert plant material used for gardens and survival tools.",
    uses: ["desert farms", "park plants", "fences", "cloth"],
  },
  {
    id: "glow",
    name: "Glow Crystal",
    origin: "Lunara Highlands",
    amount: 24,
    value: 8,
    rarity: "Rare",
    color: "#79f7d3",
    description: "Bright crystal for signs, paths, night cities, and portal markers.",
    uses: ["street lights", "portal gates", "glowing roads", "city signs"],
  },
];

export const buildBlocks: BuildBlock[] = [
  { id: "grassBlock", label: "Grass", resourceId: "grass", origin: "Auralis Reach", category: "terrain", unlock: "local", color: "#4f8d46" },
  { id: "dirtBlock", label: "Dirt", resourceId: "dirt", origin: "Auralis Reach", category: "terrain", unlock: "local", color: "#7b5638" },
  { id: "sandBlock", label: "Sand", resourceId: "sand", origin: "Auralis Reach", category: "terrain", unlock: "local", color: "#d4b36f" },
  { id: "stoneBlock", label: "Stone", resourceId: "stone", origin: "Auralis Reach", category: "building", unlock: "local", color: "#8f9692" },
  { id: "waterway", label: "Water", resourceId: "water", origin: "Auralis Reach", category: "terrain", unlock: "local", color: "#3d8ce8" },
  { id: "woodBlock", label: "Wood", resourceId: "wood", origin: "Auralis Reach", category: "building", unlock: "local", color: "#8a5a31" },
  { id: "brickBlock", label: "Brick", resourceId: "brick", origin: "Auralis Reach", category: "building", unlock: "local", color: "#bf5942" },
  { id: "pine", label: "Tree", resourceId: "wood", origin: "Auralis Reach", category: "plant", unlock: "local", color: "#3f9f6b" },
  { id: "glassBlock", label: "Glass", resourceId: "glow", origin: "Lunara Highlands", category: "building", unlock: "trade", color: "#79d9f7" },
  { id: "glowPath", label: "Glow Path", resourceId: "glow", origin: "Lunara Highlands", category: "terrain", unlock: "trade", color: "#79f7d3" },
  { id: "cactus", label: "Cactus", resourceId: "cactus", origin: "Cindara Dunes", category: "plant", unlock: "trade", color: "#4fa35d" },
  { id: "slide", label: "Slide Tower", resourceId: "clay", origin: "Cindara Dunes", category: "special", unlock: "trade", color: "#ff7a36" },
  { id: "dock", label: "Star Dock", resourceId: "mineral", origin: "Lunara Quarry", category: "special", unlock: "trade", color: "#aeb8c9" },
  { id: "lift", label: "Sky Lift", resourceId: "gas", origin: "Cloudmere Stormbelt", category: "special", unlock: "trade", color: "#d2f25d" },
];

export const tradeOffers: TradeOffer[] = [
  {
    id: "trade-1",
    from: "Cloudmere Outpost",
    wants: "Blue-Orange Clay",
    gives: "Sky Gas",
    unlockOrigin: "Cloudmere Stormbelt",
    status: "Open",
  },
  {
    id: "trade-2",
    from: "Cindara Glasslands",
    wants: "Water",
    gives: "Star Iron",
    unlockOrigin: "Cindara Dunes",
    status: "Pending",
  },
  {
    id: "trade-3",
    from: "Viretta Canopy",
    wants: "Sky Gas",
    gives: "Prismwood",
    unlockOrigin: "Viretta Canopy",
    status: "Open",
  },
  {
    id: "trade-4",
    from: "Lunara Quarry",
    wants: "Prismwood",
    gives: "Star Iron",
    unlockOrigin: "Lunara Highlands",
    status: "Open",
  },
];
