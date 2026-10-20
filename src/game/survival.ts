import type {
  Needs,
  Save,
  ClothingId,
  ConsumableId,
  SurvivalMaterialId,
  NpcService,
  RoomNode,
} from "../types";
export const freshNeeds = (): Needs => ({
  hunger: 0,
  thirst: 0,
  cold: 0,
  strain: 0,
});
const clamp = (n: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));
export const SURVIVAL_MATERIALS: {
  id: SurvivalMaterialId;
  name: string;
  icon: string;
}[] = [
  { id: "grain", name: "Grãos", icon: "food" },
  { id: "herb", name: "Ervas", icon: "leaf" },
  { id: "rawWater", name: "Água bruta", icon: "water" },
  { id: "fiber", name: "Fibras", icon: "thread" },
  { id: "hide", name: "Couro", icon: "coat" },
];
export const CONSUMABLES: {
  id: ConsumableId;
  name: string;
  icon: string;
  description: string;
  restore: Partial<Needs>;
}[] = [
  {
    id: "ration",
    name: "Ração de viagem",
    icon: "food",
    description: "Reduz a fome em 40.",
    restore: { hunger: 40 },
  },
  {
    id: "stew",
    name: "Ensopado do Farol",
    icon: "pot",
    description: "Reduz fome em 65, sede em 15 e frio em 15.",
    restore: { hunger: 65, thirst: 15, cold: 15 },
  },
  {
    id: "water",
    name: "Água potável",
    icon: "water",
    description: "Reduz a sede em 45.",
    restore: { thirst: 45 },
  },
  {
    id: "tea",
    name: "Chá de brasa",
    icon: "cup",
    description: "Reduz sede em 30 e frio em 35.",
    restore: { thirst: 30, cold: 35 },
  },
];
export const CLOTHING: {
  id: ClothingId;
  name: string;
  insulation: number;
  description: string;
}[] = [
  {
    id: "none",
    name: "Traje de viagem",
    insulation: 0,
    description: "Sem isolamento adicional.",
  },
  {
    id: "cloak",
    name: "Manto de fibras",
    insulation: 0.45,
    description: "Reduz o acúmulo de frio em 45%.",
  },
  {
    id: "coat",
    name: "Casaco forrado",
    insulation: 0.75,
    description: "Reduz o acúmulo de frio em 75%.",
  },
];
export interface SurvivalRecipe {
  id: ConsumableId | Exclude<ClothingId, "none">;
  service: NpcService;
  cost: Partial<Record<SurvivalMaterialId, number>>;
}
export const SURVIVAL_RECIPES: SurvivalRecipe[] = [
  { id: "ration", service: "food", cost: { grain: 2, herb: 1 } },
  { id: "stew", service: "food", cost: { grain: 3, herb: 2, rawWater: 1 } },
  { id: "water", service: "drink", cost: { rawWater: 2 } },
  { id: "tea", service: "drink", cost: { rawWater: 2, herb: 2 } },
  { id: "cloak", service: "clothes", cost: { fiber: 6, hide: 1 } },
  { id: "coat", service: "clothes", cost: { fiber: 12, hide: 4 } },
];
export function survivalEffects(n: Needs) {
  return {
    damage: n.hunger >= 85 ? 0.75 : n.hunger >= 60 ? 0.88 : 1,
    speed: Math.max(
      0.65,
      1 -
        (n.thirst >= 85 ? 0.2 : n.thirst >= 60 ? 0.1 : 0) -
        (n.cold >= 70 ? 0.12 : 0),
    ),
    attackRate: n.cold >= 90 ? 0.85 : 1,
  };
}
// Needs advance only while the caller is simulating active play. No offline decay.
export function tickNeeds(
  n: Needs,
  dt: number,
  biome: number,
  clothing: ClothingId,
  hub = false,
  nearFire = false,
): number {
  const seconds = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  if (hub) {
    n.cold = clamp(n.cold - seconds * 2);
    n.strain = 0;
    return 0;
  }
  n.hunger = clamp(n.hunger + seconds * 0.09);
  n.thirst = clamp(n.thirst + seconds * (biome === 1 ? 0.19 : 0.14));
  const temperature = [0.035, -0.18, 0.13, 0.21][biome] ?? 0.035,
    insulation = CLOTHING.find((c) => c.id === clothing)?.insulation ?? 0;
  n.cold = clamp(
    n.cold +
      seconds *
        (nearFire
          ? -1.4
          : temperature > 0
            ? temperature * (1 - insulation)
            : temperature),
  );
  const strain =
    (n.hunger >= 100 ? 0.25 : 0) +
    (n.thirst >= 100 ? 0.5 : 0) +
    (n.cold >= 100 ? 0.5 : 0);
  if (!strain) {
    n.strain = 0;
    return 0;
  }
  n.strain += seconds;
  const pulses = Math.floor(n.strain / 5);
  n.strain -= pulses * 5;
  return pulses * strain * 5;
}
export function consumableBlock(s: Save, n: Needs, id: ConsumableId): string {
  const item = CONSUMABLES.find((i) => i.id === id);
  if (!item) return "Provisão desconhecida";
  if (s.provisions[id] < 1) return "Você não possui esta provisão";
  if (!Object.keys(item.restore).some((k) => n[k as keyof Needs] >= 5))
    return "Você ainda não precisa desta provisão";
  return "";
}
export function consumeProvision(s: Save, n: Needs, id: ConsumableId): string {
  const reason = consumableBlock(s, n, id);
  if (reason) return reason;
  const item = CONSUMABLES.find((i) => i.id === id)!;
  s.provisions[id]--;
  for (const [key, value] of Object.entries(item.restore))
    n[key as keyof Needs] = clamp(n[key as keyof Needs] - value);
  n.strain = 0;
  s.needs = { ...n };
  return "";
}
export function survivalCraftBlock(s: Save, id: string): string {
  const r = SURVIVAL_RECIPES.find((r) => r.id === id);
  if (!r) return "Receita desconhecida";
  if ((id === "cloak" || id === "coat") && s.wardrobe.includes(id))
    return "Vestimenta já confeccionada";
  if (id === "coat" && !s.wardrobe.includes("cloak"))
    return "Confeccione o manto primeiro";
  const missing = SURVIVAL_MATERIALS.filter(
    (m) => s.survivalMaterials[m.id] < (r.cost[m.id] ?? 0),
  );
  return missing.length
    ? `Faltam ${missing.map((m) => m.name).join(", ")}`
    : "";
}
export function craftSurvival(s: Save, id: string): string {
  const reason = survivalCraftBlock(s, id);
  if (reason) return reason;
  const r = SURVIVAL_RECIPES.find((r) => r.id === id)!;
  for (const m of SURVIVAL_MATERIALS)
    s.survivalMaterials[m.id] -= r.cost[m.id] ?? 0;
  if (id === "cloak" || id === "coat") {
    s.wardrobe.push(id);
    s.clothing = id;
  } else s.provisions[id as ConsumableId]++;
  return "";
}
export function survivalLoot(
  node: RoomNode,
): Record<SurvivalMaterialId, number> {
  return {
    grain: node.biome === 0 ? 3 : 2,
    herb: node.biome === 2 ? 2 : 1,
    rawWater: node.biome === 1 ? 1 : 3,
    fiber: 2,
    hide: ["boss", "elite", "challenge"].includes(node.kind)
      ? 2
      : node.id % 3 === 0
        ? 1
        : 0,
  };
}
export function grantSurvivalLoot(s: Save, node: RoomNode): void {
  const loot = survivalLoot(node);
  for (const m of SURVIVAL_MATERIALS) s.survivalMaterials[m.id] += loot[m.id];
}
