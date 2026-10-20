import type { Save } from "../types";

export type SkillBranch = "vigor" | "steel" | "flow";
export interface SkillNode {
  id: string;
  branch: SkillBranch;
  tier: number;
  name: string;
  description: string;
  icon: string;
  max: number;
  cost: number;
  step: number;
  requires: [string, number][];
  stats: Record<string, number>;
}
export const SKILL_BRANCHES = [
  {
    id: "vigor" as const,
    name: "Luz que resiste",
    icon: "heart",
    description: "Vida, proteção e recuperação.",
  },
  {
    id: "steel" as const,
    name: "Memória do aço",
    icon: "blade",
    description: "Precisão, golpes carregados e poder.",
  },
  {
    id: "flow" as const,
    name: "Entre os instantes",
    icon: "dash",
    description: "Mobilidade, energia e habilidades.",
  },
];
export const SKILLS: SkillNode[] = [
  {
    id: "vitality",
    branch: "vigor",
    tier: 0,
    name: "Coração da Aurora",
    description: "+15 de vida máxima por nível.",
    icon: "heart",
    max: 5,
    cost: 12,
    step: 10,
    requires: [],
    stats: { hp: 15 },
  },
  {
    id: "shell",
    branch: "vigor",
    tier: 1,
    name: "Pele de bronze",
    description: "−4% de dano recebido por nível.",
    icon: "glass",
    max: 3,
    cost: 14,
    step: 8,
    requires: [["vitality", 1]],
    stats: { armor: 0.04 },
  },
  {
    id: "siphon",
    branch: "vigor",
    tier: 1,
    name: "Centelha voraz",
    description: "Recupere 1 de vida por eliminação, por nível.",
    icon: "flame",
    max: 2,
    cost: 16,
    step: 10,
    requires: [["vitality", 1]],
    stats: { killHeal: 1 },
  },
  {
    id: "resolve",
    branch: "vigor",
    tier: 2,
    name: "Última muralha",
    description: "+10 de vida e −3% de dano recebido por nível.",
    icon: "sun",
    max: 2,
    cost: 24,
    step: 12,
    requires: [["shell", 2]],
    stats: { hp: 10, armor: 0.03 },
  },
  {
    id: "sanctuary",
    branch: "vigor",
    tier: 2,
    name: "Fonte interior",
    description: "Recupere 1 de vida a cada 5 segundos durante a travessia.",
    icon: "tide",
    max: 1,
    cost: 32,
    step: 0,
    requires: [["siphon", 2]],
    stats: { regen: 0.2 },
  },
  {
    id: "dawnheart",
    branch: "vigor",
    tier: 3,
    name: "Sol indelével",
    description: "+30 de vida máxima e +10 de vida ao restaurar uma câmara.",
    icon: "star",
    max: 1,
    cost: 50,
    step: 0,
    requires: [
      ["resolve", 2],
      ["sanctuary", 1],
    ],
    stats: { hp: 30, heal: 10 },
  },
  {
    id: "power",
    branch: "steel",
    tier: 0,
    name: "Memória do aço",
    description: "+8% de dano por nível.",
    icon: "blade",
    max: 5,
    cost: 12,
    step: 10,
    requires: [],
    stats: { damage: 0.08 },
  },
  {
    id: "precision",
    branch: "steel",
    tier: 1,
    name: "Olhar de vidro",
    description: "+3 pontos percentuais de chance crítica por nível.",
    icon: "glass",
    max: 3,
    cost: 14,
    step: 8,
    requires: [["power", 1]],
    stats: { crit: 0.03 },
  },
  {
    id: "charged",
    branch: "steel",
    tier: 1,
    name: "Peso da lembrança",
    description: "+15% de dano dos golpes carregados por nível.",
    icon: "hammer",
    max: 2,
    cost: 16,
    step: 10,
    requires: [["power", 1]],
    stats: { charged: 0.15 },
  },
  {
    id: "execution",
    branch: "steel",
    tier: 2,
    name: "Fio do crepúsculo",
    description:
      "+10% de dano contra inimigos abaixo de 35% de vida, por nível.",
    icon: "skull",
    max: 2,
    cost: 24,
    step: 12,
    requires: [["precision", 2]],
    stats: { execution: 0.1 },
  },
  {
    id: "momentum",
    branch: "steel",
    tier: 2,
    name: "Ritmo da forja",
    description: "+5% de velocidade de ataque por nível.",
    icon: "gear",
    max: 2,
    cost: 24,
    step: 12,
    requires: [["charged", 2]],
    stats: { attackSpeed: 0.05 },
  },
  {
    id: "sunstrike",
    branch: "steel",
    tier: 3,
    name: "Assinatura do sol",
    description: "+25% de dano do especial e +15% de dano crítico.",
    icon: "sun",
    max: 1,
    cost: 50,
    step: 0,
    requires: [
      ["execution", 2],
      ["momentum", 2],
    ],
    stats: { special: 0.25, critDamage: 0.15 },
  },
  {
    id: "grace",
    branch: "flow",
    tier: 0,
    name: "Passo entre horas",
    description: "−4% no tempo entre esquivas por nível.",
    icon: "dash",
    max: 5,
    cost: 12,
    step: 10,
    requires: [],
    stats: { dash: 0.04 },
  },
  {
    id: "stride",
    branch: "flow",
    tier: 1,
    name: "Vento do Farol",
    description: "+4% de velocidade de movimento por nível.",
    icon: "arrow",
    max: 3,
    cost: 14,
    step: 8,
    requires: [["grace", 1]],
    stats: { speed: 0.04 },
  },
  {
    id: "well",
    branch: "flow",
    tier: 1,
    name: "Reservatório de Ecos",
    description: "+15% de energia Aurora por eliminação, por nível.",
    icon: "echo",
    max: 2,
    cost: 16,
    step: 10,
    requires: [["grace", 1]],
    stats: { charge: 0.15 },
  },
  {
    id: "rift",
    branch: "flow",
    tier: 2,
    name: "Horas emprestadas",
    description: "−6% no tempo de recarga do especial por nível.",
    icon: "gear",
    max: 2,
    cost: 24,
    step: 12,
    requires: [["stride", 2]],
    stats: { cooldown: 0.06 },
  },
  {
    id: "shelter",
    branch: "flow",
    tier: 2,
    name: "Abrigo do instante",
    description: "+0,04s de invulnerabilidade após esquivar por nível.",
    icon: "glass",
    max: 2,
    cost: 24,
    step: 12,
    requires: [["well", 2]],
    stats: { iframes: 0.04 },
  },
  {
    id: "timeless",
    branch: "flow",
    tier: 3,
    name: "Antes do primeiro raio",
    description: "Comece cada nova expedição com 25% de energia Aurora.",
    icon: "star",
    max: 1,
    cost: 50,
    step: 0,
    requires: [
      ["rift", 2],
      ["shelter", 2],
    ],
    stats: { startingCharge: 25 },
  },
];
const roots = new Set(["vitality", "power", "grace"]);
export function skillRank(s: Save, id: string): number {
  return roots.has(id)
    ? s.talents[id as keyof Save["talents"]]
    : (s.skills[id] ?? 0);
}
export function skillCost(s: Save, node: SkillNode): number {
  return node.cost + node.step * skillRank(s, node.id);
}
export function skillBlock(s: Save, node: SkillNode): string {
  if (skillRank(s, node.id) >= node.max) return "Habilidade maximizada";
  const missing = node.requires.filter(([id, rank]) => skillRank(s, id) < rank);
  if (missing.length)
    return `Requer ${missing.map(([id, rank]) => `${SKILLS.find((n) => n.id === id)!.name} ${rank}`).join(" e ")}`;
  if (s.echoes < skillCost(s, node)) return "Ecos insuficientes";
  return "";
}
export function learnSkill(s: Save, id: string): string {
  const node = SKILLS.find((n) => n.id === id);
  if (!node) return "Habilidade desconhecida";
  const reason = skillBlock(s, node);
  if (reason) return reason;
  s.echoes -= skillCost(s, node);
  if (roots.has(id)) s.talents[id as keyof Save["talents"]]++;
  else s.skills[id] = skillRank(s, id) + 1;
  return "";
}
export function skillRefund(s: Save): number {
  return SKILLS.reduce((total, n) => {
    const r = skillRank(s, n.id);
    return total + r * n.cost + (n.step * r * (r - 1)) / 2;
  }, 0);
}
export function resetSkills(s: Save): number {
  const refund = skillRefund(s);
  s.echoes += refund;
  s.talents = { vitality: 0, power: 0, grace: 0 };
  s.skills = {};
  return refund;
}
export function skillStats(s: Save): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of SKILLS)
    for (const [key, value] of Object.entries(n.stats))
      out[key] = (out[key] ?? 0) + value * skillRank(s, n.id);
  return out;
}
