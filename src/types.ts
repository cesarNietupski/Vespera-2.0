export interface Vec {
  x: number;
  y: number;
}
export type WeaponId = "blade" | "hammer" | "bow";
export type MaterialId = "iron" | "glass" | "ember";
export type InfusionId = "none" | "glass" | "ember" | "tide";
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
  kind: "column" | "tree" | "rubble" | "urn" | "crystal" | "flower" | "mirror";
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
  hp: number;
  charge: number;
}
export interface Settings {
  music: number;
  sfx: number;
  quality: "low" | "medium" | "high";
  shake: number;
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
  unlocked: WeaponId[];
  memories: string[];
  bosses: number[];
  achievements: string[];
  endings: string[];
  history: { seed: string; result: string; rooms: number }[];
  settings: Settings;
  run: Run | null;
}
