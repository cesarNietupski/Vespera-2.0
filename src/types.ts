export interface Vec {
  x: number;
  y: number;
}
export type WeaponId = "blade" | "hammer" | "bow" | "dagger" | "spear" | "greatsword" | "axe" | "scythe" | "rapier" | "crossbow" | "staff" | "pistol" | "chakram";
export type WeaponSlot = "melee" | "ranged";
export type WeaponLoadout = Record<WeaponSlot, WeaponId>;
export type MaterialId = "iron" | "glass" | "ember";
export type InfusionId = "none" | "glass" | "ember" | "tide";
export type NpcId = "salvia" | "orren" | "nim" | "lume" | "caio" | "iria";
export type NpcService =
  | "skills"
  | "forge"
  | "memories"
  | "food"
  | "drink"
  | "clothes";
export type SurvivalMaterialId =
  | "grain"
  | "herb"
  | "rawWater"
  | "fiber"
  | "hide";
export type ConsumableId = "ration" | "stew" | "water" | "tea";
export type ClothingId = "none" | "cloak" | "coat";
export interface Needs {
  hunger: number;
  thirst: number;
  cold: number;
  strain: number;
}
export type School = "Vidro" | "Cinza" | "Maré" | "Eco";
export type EnemyKind =
  | "swordsman"
  | "archer"
  | "guardian"
  | "hound"
  | "summoner"
  | "automaton"
  | "wraith"
  | "elite";
export type ObjectiveKind =
  | "eliminate"
  | "purify"
  | "escort"
  | "defend"
  | "chains"
  | "collect"
  | "seal"
  | "puzzle";
export type RoomKind =
  | "combat"
  | "elite"
  | "objective"
  | "explore"
  | "event"
  | "reward"
  | "shop"
  | "secret"
  | "challenge"
  | "boss";
export interface RoomNode {
  id: number;
  biome: number;
  kind: RoomKind;
  objective: ObjectiveKind;
  next: number[];
  seed: string;
  title: string;
}
export interface Prop {
  x: number;
  y: number;
  kind: "column" | "tree" | "rubble" | "urn" | "crystal" | "flower" | "mirror" | "crate" | "barrel" | "chest" | "secret-wall";
  solid: boolean;
}
export interface Layout {
  width: number;
  height: number;
  cells: number[][];
  props: Prop[];
  spawn: Vec;
  exit: Vec;
  objectives: Vec[];
  enemies: Vec[];
  fallback: boolean;
}
export interface Run {
  seed: string;
  nodes: RoomNode[];
  current: number;
  visited: number[];
  boons: string[];
  coins: number;
  kills: number;
  started: number;
  weapon: WeaponId;
  loadout: WeaponLoadout;
  hp: number;
  charge: number;
  needs: Needs;
  phase?: PhaseState;
  checkpoint?: import("./game/checkpoint").WorldCheckpoint;
}
export type LootId = MaterialId | SurvivalMaterialId | ConsumableId | "echoes" | "coins";
export type Loot = Partial<Record<LootId, number>>;
export interface PhaseState {
  room: number;
  collected: Loot;
  atRisk: Loot;
  claimed: string[];
  relays: number[];
  explored: number[];
  secretOpened: boolean;
  keyRevealed?: boolean;
  keyFound?: boolean;
  gateOpened?: boolean;
}
export interface Settings {
  music: number;
  sfx: number;
  quality: "low" | "medium" | "high";
  shake: number;
  voice: number;
  voiceAuto: boolean;
}
export interface Save {
  version: 2;
  echoes: number;
  deaths: number;
  victories: number;
  talents: { vitality: number; power: number; grace: number };
  skills: Record<string, number>;
  materials: Record<MaterialId, number>;
  weaponLevels: Record<WeaponId, number>;
  infusions: Record<WeaponId, InfusionId>;
  equipped: WeaponId;
  loadout: WeaponLoadout;
  weaponXP: Record<WeaponId, number>;
  weaponMastery: Record<WeaponId, string[]>;
  needs: Needs;
  survivalMaterials: Record<SurvivalMaterialId, number>;
  provisions: Record<ConsumableId, number>;
  wardrobe: ClothingId[];
  clothing: ClothingId;
  unlocked: WeaponId[];
  memories: string[];
  bosses: number[];
  achievements: string[];
  endings: string[];
  history: { seed: string; result: string; rooms: number }[];
  settings: Settings;
  run: Run | null;
  recovering?: boolean;
  lastLoss?: Loot;
  location?: { area: "hub" | "expedition"; pos?: Vec; };
}
