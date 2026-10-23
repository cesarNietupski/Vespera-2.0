import type { Save, WeaponId } from "../types";
import { WEAPONS, isWeapon } from "./weapons";
export interface MasteryNode { id: string; name: string; description: string; xp: number; iron: number; requires: string[]; branch: string; stats: Record<string, number>; }
const SIGNATURE: Record<WeaponId, [string, Record<string, number>]> = {
  blade: ["+15% de dano e +15% de dano carregado.", { damage: .15, charged: .15 }],
  hammer: ["+25% de área e +20% de dano especial.", { area: .25, special: .2 }],
  bow: ["+1 alvo perfurado por flecha e +6 pontos de chance crítica.", { pierce: 1, crit: .06 }],
  dagger: ["+30% de dano crítico e +5% de velocidade de movimento.", { critDamage: .3, speed: .05 }],
  spear: ["+25% de área e +20% de dano contra alvos feridos.", { area: .25, execution: .2 }],
  greatsword: ["+40% de dano especial e +20% de dano carregado.", { special: .4, charged: .2 }],
  axe: ["+40% de dano contra alvos com menos de 35% da vida.", { execution: .4 }],
  scythe: ["Recupera mais 3 de vida por inimigo derrotado.", { killHeal: 3 }],
  rapier: ["+10 pontos de chance crítica e +20% de dano crítico.", { crit: .1, critDamage: .2 }],
  crossbow: ["Virotes atravessam mais 2 inimigos.", { pierce: 2 }],
  staff: ["Orbes desaceleram mais 20% e o especial recarrega 8% mais rápido.", { slow: .2, cooldown: .08 }],
  pistol: ["+12% de velocidade de ataque e +15% de dano crítico.", { attackSpeed: .12, critDamage: .15 }],
  chakram: ["Discos atravessam mais 2 inimigos e ganham +20% de dano carregado.", { pierce: 2, charged: .2 }],
};
export function masteryTree(id: WeaponId): MasteryNode[] {
  const w = WEAPONS[id], ranged = w.slot === "ranged", [signatureDescription, signatureStats] = SIGNATURE[id];
  return [
    { id: "grip", name: `Domínio de ${w.name}`, description: "+5% de dano com esta arma.", xp: 30, iron: 2, requires: [], branch: "Fundamento", stats: { damage: .05 } },
    { id: "edge", name: ranged ? "Mira treinada" : "Gume treinado", description: "+6 pontos de chance crítica.", xp: 80, iron: 4, requires: ["grip"], branch: "Técnica", stats: { crit: .06 } },
    { id: "rhythm", name: "Ritmo da memória", description: "+8% de velocidade de ataque.", xp: 170, iron: 7, requires: ["edge"], branch: "Técnica", stats: { attackSpeed: .08 } },
    { id: "signature", name: w.perk, description: signatureDescription, xp: 320, iron: 10, requires: ["rhythm"], branch: "Técnica", stats: signatureStats },
    { id: "focus", name: "Foco da centelha", description: "+20% de dano carregado.", xp: 80, iron: 4, requires: ["grip"], branch: "Disciplina", stats: { charged: .2 } },
    { id: "flow", name: "Fluxo do juramento", description: "Especial recarrega 10% mais rápido.", xp: 170, iron: 7, requires: ["focus"], branch: "Disciplina", stats: { cooldown: .1 } },
    { id: "legacy", name: `Legado: ${w.subtitle}`, description: "+20% de dano especial e +10% de dano contra inimigos feridos.", xp: 320, iron: 10, requires: ["flow"], branch: "Disciplina", stats: { special: .2, execution: .1 } },
  ];
}
export const UPGRADE_XP = [0, 60, 180, 360];
export function masteryBlock(save: Save, id: WeaponId, nodeId: string): string {
  if (!isWeapon(id)) return "Arma desconhecida";
  const node = masteryTree(id).find(n => n.id === nodeId);
  if (!node) return "Técnica desconhecida";
  if (!save.unlocked.includes(id)) return "Forje esta arma primeiro";
  const learned = save.weaponMastery[id] ?? [];
  if (learned.includes(nodeId)) return "Técnica aprendida";
  if (node.requires.some(n => !learned.includes(n))) return "Aprenda a técnica anterior";
  if (save.weaponXP[id] < node.xp) return `Requer ${node.xp} XP com ${WEAPONS[id].name} (${save.weaponXP[id]}/${node.xp})`;
  if (save.materials.iron < node.iron) return "Ferro de memória insuficiente";
  return "";
}
export function learnMastery(save: Save, id: WeaponId, nodeId: string): string {
  const reason = masteryBlock(save, id, nodeId); if (reason) return reason;
  const node = masteryTree(id).find(n => n.id === nodeId)!;
  save.materials.iron -= node.iron;
  save.weaponMastery[id].push(nodeId);
  return "";
}
export function masteryStats(save: Save, id: WeaponId): Record<string, number> {
  const stats = { ...WEAPONS[id].stats };
  for (const n of masteryTree(id)) if (save.weaponMastery[id]?.includes(n.id))
    for (const [key, value] of Object.entries(n.stats)) stats[key] = (stats[key] ?? 0) + value;
  return stats;
}
// Lifetime mastery is permanent: each defeated enemy pays XP once per phase.
export function awardWeaponXP(save: Save, id: WeaponId, amount: number): void {
  if (!isWeapon(id) || !Number.isFinite(amount) || amount <= 0) return;
  save.weaponXP[id] = Math.min(999999, save.weaponXP[id] + Math.floor(amount));
}
