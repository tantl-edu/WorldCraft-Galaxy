export type Resource = {
  id: string;
  name: string;
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
  color: string;
};

export type TradeOffer = {
  id: string;
  from: string;
  wants: string;
  gives: string;
  status: "Open" | "Pending" | "Accepted";
};

export const starterPlanet = {
  name: "Auralis Reach",
  system: "Velora System",
  privacy: "Private build, visitors read-only",
  description:
    "A floating-island planet with warm oceans, bright clay cliffs, and mineral caves beneath glassy forests.",
};

export const resources: Resource[] = [
  {
    id: "water",
    name: "Water",
    amount: 84,
    value: 3,
    rarity: "Common",
    color: "#4aa3ff",
    description: "Clean water gathered from Auralis tide wells.",
    uses: ["farms", "canals", "habitats", "water parks"],
  },
  {
    id: "wood",
    name: "Prismwood",
    amount: 48,
    value: 5,
    rarity: "Useful",
    color: "#6ecb8f",
    description: "Flexible glowing wood from glassleaf forests.",
    uses: ["homes", "bridges", "sky docks", "starter tools"],
  },
  {
    id: "clay",
    name: "Blue-Orange Clay",
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
    amount: 12,
    value: 12,
    rarity: "Legendary",
    color: "#d6f46f",
    description: "Light gas that powers floating platforms and air travel.",
    uses: ["airships", "floating cities", "weather engines", "planet gates"],
  },
];

export const buildBlocks: BuildBlock[] = [
  { id: "waterway", label: "Canal", resourceId: "water", color: "#3d8ce8" },
  { id: "forestHome", label: "Prism Home", resourceId: "wood", color: "#58bd86" },
  { id: "slide", label: "Slide Tower", resourceId: "clay", color: "#ff7a36" },
  { id: "dock", label: "Star Dock", resourceId: "mineral", color: "#aeb8c9" },
  { id: "lift", label: "Sky Lift", resourceId: "gas", color: "#d2f25d" },
];

export const tradeOffers: TradeOffer[] = [
  {
    id: "trade-1",
    from: "Cloudmere Outpost",
    wants: "Blue-Orange Clay",
    gives: "Sky Gas",
    status: "Open",
  },
  {
    id: "trade-2",
    from: "Cindara Glasslands",
    wants: "Water",
    gives: "Star Iron",
    status: "Pending",
  },
  {
    id: "trade-3",
    from: "Viretta Canopy",
    wants: "Sky Gas",
    gives: "Prismwood",
    status: "Open",
  },
];
