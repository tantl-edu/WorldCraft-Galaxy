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
  center: { x: number; z: number };
  radius: number;
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
    "A large starter world with natural rivers, forests, desert, ocean edges, and mountains. Move your avatar, build upward, and trade for blocks from other planets.",
};

export const worldRegions: WorldRegion[] = [
  { name: "Auralis Lake Country", biome: "hills, lake, river, and starter fields", center: { x: -18, z: -14 }, radius: 16 },
  { name: "Rainforest Falls", biome: "dense trees, vines, flowers, birds, and falling water", center: { x: -18, z: 16 }, radius: 18 },
  { name: "Deadly Desert", biome: "sun-baked dunes, cactus groves, shells, and scorpion trails", center: { x: 16, z: -15 }, radius: 18 },
  { name: "Mystical Mountains", biome: "volcano ridges, quartz caves, diamonds, lava, and waterfalls", center: { x: 18, z: 18 }, radius: 18 },
  { name: "Optical Ocean", biome: "clear water, kelp beds, coral, fish, sand, and shells", center: { x: -3, z: -24 }, radius: 13 },
  { name: "Earth Moon", biome: "icy rock, star dust, craters, snow, and moon hills", center: { x: 5, z: 27 }, radius: 11 },
];

export function getWorldRegion(x: number, z: number) {
  return worldRegions.reduce((closest, region) => {
    const closestDistance = Math.hypot(x - closest.center.x, z - closest.center.z) / closest.radius;
    const regionDistance = Math.hypot(x - region.center.x, z - region.center.z) / region.radius;
    return regionDistance < closestDistance ? region : closest;
  }, worldRegions[0]);
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
  {
    id: "shells",
    name: "Shells",
    origin: "Optical Ocean",
    amount: 54,
    value: 4,
    rarity: "Useful",
    color: "#f6d8b8",
    description: "Curved ocean shells for beach paths, roofs, and decorative walls.",
    uses: ["beach towns", "roof tiles", "mosaics", "fountains"],
  },
  {
    id: "kelp",
    name: "Kelp",
    origin: "Optical Ocean",
    amount: 42,
    value: 4,
    rarity: "Useful",
    color: "#2f8b61",
    description: "Flexible ocean plant material for underwater builds and farms.",
    uses: ["aquariums", "water gardens", "sea farms", "green roofs"],
  },
  {
    id: "coral",
    name: "Coral",
    origin: "Optical Ocean",
    amount: 24,
    value: 8,
    rarity: "Rare",
    color: "#ff6f87",
    description: "Bright coral blocks used for colorful ocean cities and reef parks.",
    uses: ["reef parks", "aquariums", "color walls", "ocean towers"],
  },
  {
    id: "vines",
    name: "Vines",
    origin: "Rainforest Falls",
    amount: 48,
    value: 5,
    rarity: "Useful",
    color: "#2f9f50",
    description: "Climbing vines from wet rainforest cliffs.",
    uses: ["treehouses", "hanging bridges", "green walls", "jungle paths"],
  },
  {
    id: "flowers",
    name: "Flowers",
    origin: "Rainforest Falls",
    amount: 64,
    value: 3,
    rarity: "Common",
    color: "#ff79c6",
    description: "Bright rainforest flowers for gardens and village plazas.",
    uses: ["gardens", "parks", "plazas", "color patterns"],
  },
  {
    id: "quartz",
    name: "Quartz",
    origin: "Mystical Mountains",
    amount: 30,
    value: 7,
    rarity: "Rare",
    color: "#f1ecff",
    description: "Pale crystal from mountain caves that makes clean, bright buildings.",
    uses: ["temples", "bridges", "windows", "mountain towers"],
  },
  {
    id: "diamond",
    name: "Diamonds",
    origin: "Mystical Mountains",
    amount: 14,
    value: 13,
    rarity: "Legendary",
    color: "#7ef4ff",
    description: "Rare cave gems that power advanced galaxy builds.",
    uses: ["power cores", "beacons", "space gates", "rare decorations"],
  },
  {
    id: "lava",
    name: "Lava",
    origin: "Mystical Mountains",
    amount: 20,
    value: 9,
    rarity: "Rare",
    color: "#ff5a22",
    description: "Hot volcanic material for dramatic terrain and energy builds.",
    uses: ["volcanoes", "forge rooms", "energy canals", "warning lights"],
  },
  {
    id: "stardust",
    name: "Star Dust",
    origin: "Earth Moon",
    amount: 18,
    value: 10,
    rarity: "Legendary",
    color: "#c7c7ff",
    description: "Shimmering moon powder for galaxy travel and glowing builds.",
    uses: ["moon roads", "rocket pads", "portal frames", "space parks"],
  },
  {
    id: "ice",
    name: "Ice",
    origin: "Earth Moon",
    amount: 46,
    value: 5,
    rarity: "Useful",
    color: "#bfefff",
    description: "Cold moon ice used for skating areas, cooling systems, and bright roofs.",
    uses: ["ice paths", "snow towns", "coolers", "winter parks"],
  },
  {
    id: "snow",
    name: "Snow",
    origin: "Earth Moon",
    amount: 58,
    value: 3,
    rarity: "Common",
    color: "#eef8ff",
    description: "Soft snow for mountain caps, winter terrain, and moon villages.",
    uses: ["snow fields", "mountain caps", "winter parks", "soft roofs"],
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
  { id: "shellBlock", label: "Shell", resourceId: "shells", origin: "Optical Ocean", category: "building", unlock: "trade", color: "#f6d8b8" },
  { id: "kelpPatch", label: "Kelp", resourceId: "kelp", origin: "Optical Ocean", category: "plant", unlock: "trade", color: "#2f8b61" },
  { id: "coralBlock", label: "Coral", resourceId: "coral", origin: "Optical Ocean", category: "building", unlock: "trade", color: "#ff6f87" },
  { id: "vineWall", label: "Vines", resourceId: "vines", origin: "Rainforest Falls", category: "plant", unlock: "trade", color: "#2f9f50" },
  { id: "flowerPatch", label: "Flowers", resourceId: "flowers", origin: "Rainforest Falls", category: "plant", unlock: "trade", color: "#ff79c6" },
  { id: "quartzBlock", label: "Quartz", resourceId: "quartz", origin: "Mystical Mountains", category: "building", unlock: "trade", color: "#f1ecff" },
  { id: "diamondBeacon", label: "Diamond", resourceId: "diamond", origin: "Mystical Mountains", category: "special", unlock: "trade", color: "#7ef4ff" },
  { id: "lavaFlow", label: "Lava", resourceId: "lava", origin: "Mystical Mountains", category: "terrain", unlock: "trade", color: "#ff5a22" },
  { id: "starDust", label: "Star Dust", resourceId: "stardust", origin: "Earth Moon", category: "special", unlock: "trade", color: "#c7c7ff" },
  { id: "iceBlock", label: "Ice", resourceId: "ice", origin: "Earth Moon", category: "building", unlock: "trade", color: "#bfefff" },
  { id: "snowBlock", label: "Snow", resourceId: "snow", origin: "Earth Moon", category: "terrain", unlock: "trade", color: "#eef8ff" },
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
  {
    id: "trade-5",
    from: "Optical Ocean Reef",
    wants: "Stone",
    gives: "Shells, Kelp, and Coral",
    unlockOrigin: "Optical Ocean",
    status: "Open",
  },
  {
    id: "trade-6",
    from: "Rainforest Falls Canopy",
    wants: "Brick",
    gives: "Vines and Flowers",
    unlockOrigin: "Rainforest Falls",
    status: "Open",
  },
  {
    id: "trade-7",
    from: "Mystical Mountain Cave",
    wants: "Water",
    gives: "Quartz, Diamonds, and Lava",
    unlockOrigin: "Mystical Mountains",
    status: "Pending",
  },
  {
    id: "trade-8",
    from: "Earth Moon Base",
    wants: "Timber",
    gives: "Star Dust, Ice, and Snow",
    unlockOrigin: "Earth Moon",
    status: "Open",
  },
];
