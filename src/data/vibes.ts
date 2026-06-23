import type { Category, City } from "./attractions";

export type Vibe = "OldJapan" | "NeonFuture" | "HiddenLocal" | "NatureEscape" | "WabiSabi" | "WeirdOnly";

export interface VibeDef {
  id: Vibe;
  label: string;
  emoji: string;
  desc: string;
  categories: Category[];
  cities?: City[];
  weirdOnly?: boolean;
}

export const VIBES: VibeDef[] = [
  {
    id: "OldJapan",
    label: "Old Japan",
    emoji: "⛩️",
    desc: "Shrines, temples, geisha alleys, and sake breweries",
    categories: ["Temple & Shrine", "Market & Shopping"],
    cities: ["Kyoto", "Nara", "Hiroshima"],
  },
  {
    id: "NeonFuture",
    label: "Neon Future",
    emoji: "🌆",
    desc: "Giant screens, robot restaurants, arcades, and the skyline at night",
    categories: ["Entertainment", "Landmark", "Nightlife"],
    cities: ["Tokyo", "Osaka"],
  },
  {
    id: "HiddenLocal",
    label: "Hidden Local",
    emoji: "🪄",
    desc: "Spots that don't make the travel blogs — local markets, quiet alleys, standing bars",
    categories: ["Market & Shopping", "Nightlife"],
  },
  {
    id: "NatureEscape",
    label: "Nature Escape",
    emoji: "🌿",
    desc: "Mountains, bamboo groves, deer parks, and volcanic baths",
    categories: ["Park & Nature"],
  },
  {
    id: "WabiSabi",
    label: "Wabi-Sabi",
    emoji: "🍵",
    desc: "Zen gardens, tea ceremonies, moss temples, and weathered beauty",
    categories: ["Temple & Shrine", "Museum & Art"],
    cities: ["Kyoto", "Nara"],
  },
  {
    id: "WeirdOnly",
    label: "Weird Only",
    emoji: "👾",
    desc: "Capsule machines, maid cafes, go-karts in traffic, robot shows, the stuff that's only possible here",
    categories: ["Entertainment", "Museum & Art"],
    weirdOnly: true,
  },
];

export const WEIRD_IDS = new Set([
  "exp-gokart",
  "exp-sumo-practice",
  "teamlab",
  "teamlab-borderless",
  "akihabara",
  "odaiba",
  "robot-restaurant",
  "kanamara",
  "capsule-hotel",
  "owl-cafe",
]);
