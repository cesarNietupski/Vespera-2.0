import type {
  Save,
  WeaponId,
  MaterialId,
  InfusionId,
  RoomNode,
} from "../types";
import { skillStats } from "../data/skills";
export const MATERIALS: {
  id: MaterialId;
  name: string;
  icon: string;
  source: string;
}[] = [
  {
    id: "iron",
    name: "Ferro de memória",
    icon: "blade",
    source: "Todas as câmaras restauradas.",
  },
  {
    id: "glass",
    name: "Estilhaço de vidro",
    icon: "glass",
    source: "Câmaras restauradas; abundante nos Jardins e Arquivos.",
  },
  {
    id: "ember",
    name: "Brasa antiga",
    icon: "flame",
    source: "Forjas, elites, desafios e Vigias.",
  },
];
export const INFUSIONS: {
  id: InfusionId;
  name: string;
  icon: string;
  description: string;
  stats: Record<string, number>;
}[] = [
  {
    id: "none",
    name: "Sem infusão",
    icon: "hammer",
    description: "Remove a infusão atual sem recuperar os materiais.",
    stats: {},
  },
  {
    id: "glass",
    name: "Vidro",
    icon: "glass",
    description: "+6 pontos percentuais de chance crítica.",
    stats: { crit: 0.06 },
  },
  {
    id: "ember",
    name: "Brasa",
    icon: "flame",
    description:
      "Acertos incendeiam: 4 de dano por segundo durante 3 segundos.",
    stats: { burn: 4 },
  },
  {
    id: "tide",
    name: "Maré",
    icon: "tide",
    description: "Acertos reduzem a velocidade inimiga em 18% por 2 segundos.",
    stats: { slow: 0.18 },
  },
];
export type CraftAction = "forge" | "upgrade" | "infuse";
export interface Recipe {
  echoes: number;
  materials: Partial<Record<MaterialId, number>>;
}
export function weaponName(s: Save, id: WeaponId, base: string): string {
  return `${base}${s.weaponLevels[id] ? ` +${s.weaponLevels[id]}` : ""}`;
}
export function recipe(
  s: Save,
  id: WeaponId,
  action: CraftAction,
  infusion: InfusionId = "none",
): Recipe {
  if (action === "forge")
    return id === "hammer"
      ? { echoes: 12, materials: { iron: 6, ember: 1 } }
      : id === "bow"
        ? { echoes: 18, materials: { iron: 4, glass: 4 } }
        : { echoes: 0, materials: {} };
  if (action === "upgrade") {
    const next = s.weaponLevels[id] + 1;
    return {
      echoes: 6 * next,
      materials: {
        iron: 6 * next,
        glass: 2 * next,
        ...(next > 1 ? { ember: next - 1 } : {}),
      },
    };
  }
  return infusion === "glass"
    ? { echoes: 8, materials: { glass: 6, iron: 2 } }
    : infusion === "ember"
      ? { echoes: 8, materials: { ember: 3, iron: 2 } }
      : infusion === "tide"
        ? { echoes: 8, materials: { glass: 4, ember: 1 } }
        : { echoes: 0, materials: {} };
}
export function craftBlock(
  s: Save,
  id: WeaponId,
  action: CraftAction,
  infusion: InfusionId = "none",
): string {
  if (
    !["blade", "hammer", "bow"].includes(id) ||
    !["forge", "upgrade", "infuse"].includes(action)
  )
    return "Receita desconhecida";
  if (action === "forge" && s.unlocked.includes(id)) return "Arma já forjada";
  if (action !== "forge" && !s.unlocked.includes(id))
    return "Forje a arma primeiro";
  if (action === "upgrade" && s.weaponLevels[id] >= 3)
    return "Aprimoramento máximo +3";
  if (action === "infuse") {
    if (!INFUSIONS.some((i) => i.id === infusion))
      return "Infusão desconhecida";
    if (s.weaponLevels[id] < 1) return "Requer arma +1";
    if (s.infusions[id] === infusion) return "Infusão já aplicada";
  }
  const cost = recipe(s, id, action, infusion);
  if (s.echoes < cost.echoes) return "Ecos insuficientes";
  const missing = MATERIALS.filter(
    (m) => s.materials[m.id] < (cost.materials[m.id] ?? 0),
  );
  return missing.length ? `Falta ${missing.map((m) => m.name).join(", ")}` : "";
}
export function craftWeapon(
  s: Save,
  id: WeaponId,
  action: CraftAction,
  infusion: InfusionId = "none",
): string {
  const reason = craftBlock(s, id, action, infusion);
  if (reason) return reason;
  const cost = recipe(s, id, action, infusion);
  s.echoes -= cost.echoes;
  for (const m of MATERIALS) s.materials[m.id] -= cost.materials[m.id] ?? 0;
  if (action === "forge") s.unlocked.push(id);
  if (action === "upgrade") s.weaponLevels[id]++;
  if (action === "infuse") s.infusions[id] = infusion;
  return "";
}
export function progressionStats(
  s: Save,
  id: WeaponId,
): Record<string, number> {
  const out = skillStats(s),
    rank = s.weaponLevels[id];
  out.damage = (out.damage ?? 0) + rank * 0.12;
  out.attackSpeed = (out.attackSpeed ?? 0) + rank * 0.03;
  for (const [key, value] of Object.entries(
    INFUSIONS.find((i) => i.id === s.infusions[id])!.stats,
  ))
    out[key] = (out[key] ?? 0) + value;
  return out;
}
export function roomSalvage(node: RoomNode): Record<MaterialId, number> {
  const combat = ["combat", "elite", "challenge", "boss", "objective"].includes(
      node.kind,
    ),
    special = ["elite", "challenge", "boss"].includes(node.kind);
  return {
    iron: combat ? 3 + node.biome : 1,
    glass: node.biome === 0 || node.biome === 2 ? 2 : 1,
    ember: node.kind === "boss" ? 4 : special ? 2 : node.biome === 1 ? 1 : 0,
  };
}
export function awardRoomSalvage(
  s: Save,
  node: RoomNode,
  visited: number[],
): Record<MaterialId, number> | null {
  if (visited.includes(node.id)) return null;
  const loot = roomSalvage(node);
  for (const m of MATERIALS) s.materials[m.id] += loot[m.id];
  s.echoes += 2;
  visited.push(node.id);
  return loot;
}
