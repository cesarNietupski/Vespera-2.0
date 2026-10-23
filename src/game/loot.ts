import type { Loot, LootId, PhaseState, Run, Save } from "../types";
import { MATERIALS } from "./crafting";
import { CONSUMABLES, SURVIVAL_MATERIALS } from "./survival";

export const LOOT_ITEMS = [
  ...MATERIALS, ...SURVIVAL_MATERIALS, ...CONSUMABLES,
  { id: "echoes", name: "Ecos", icon: "echo" },
  { id: "coins", name: "Óbolos", icon: "coin" },
] as { id: LootId; name: string; icon: string }[];
export function cleanLoot(raw: unknown): Loot {
  const data = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return Object.fromEntries(LOOT_ITEMS.flatMap(({ id }) => typeof data[id] === "number" && Number.isFinite(data[id]) && Number(data[id]) > 0 ? [[id, Math.min(999999, Math.floor(Number(data[id])))]] : []));
}
export function phaseState(run: Run): PhaseState {
  if (!run.phase || run.phase.room !== run.current)
    run.phase = { room: run.current, collected: {}, atRisk: {}, claimed: [], relays: [], explored: [], secretOpened: false };
  const legacyComplete = run.visited.includes(run.current);
  run.phase.keyFound ??= legacyComplete;
  run.phase.keyRevealed ??= run.phase.keyFound;
  run.phase.gateOpened ??= legacyComplete;
  return run.phase;
}
export function parsePhase(raw: unknown, room: number): PhaseState | undefined {
  if (!raw || typeof raw !== "object") return;
  const p = raw as PhaseState;
  if (p.room !== room) return;
  const indices = (a: unknown, max: number) => Array.isArray(a) ? [...new Set(a.filter((n) => Number.isInteger(n) && n >= 0 && n < max))].slice(0, max) : [];
  const collected = cleanLoot(p.collected), risk = cleanLoot(p.atRisk);
  const atRisk = Object.fromEntries(Object.entries(risk).map(([id, value]) => [id, Math.min(value!, collected[id as LootId] ?? 0)]));
  return { room, collected, atRisk, claimed: Array.isArray(p.claimed) ? [...new Set(p.claimed.filter((s) => typeof s === "string" && s.length < 90))].slice(0, 300) : [], relays: indices(p.relays, 5), explored: indices(p.explored, 1800), secretOpened: p.secretOpened === true,
    ...(typeof p.keyFound === "boolean" ? { keyFound: p.keyFound, keyRevealed: p.keyRevealed === true || p.keyFound, gateOpened: p.gateOpened === true && p.keyFound } : {}) };
}
function balance(save: Save, run: Run, id: LootId): number {
  if (id === "echoes") return save.echoes;
  if (id === "coins") return run.coins;
  if (id in save.materials) return save.materials[id as keyof Save["materials"]];
  if (id in save.survivalMaterials) return save.survivalMaterials[id as keyof Save["survivalMaterials"]];
  return save.provisions[id as keyof Save["provisions"]];
}
function add(save: Save, run: Run, id: LootId, amount: number): void {
  if (id === "echoes") save.echoes += amount;
  else if (id === "coins") run.coins += amount;
  else if (id in save.materials) save.materials[id as keyof Save["materials"]] += amount;
  else if (id in save.survivalMaterials) save.survivalMaterials[id as keyof Save["survivalMaterials"]] += amount;
  else save.provisions[id as keyof Save["provisions"]] += amount;
}
export function grantLoot(save: Save, run: Run, packet: Loot, claim?: string): Loot {
  const phase = phaseState(run);
  if (claim && phase.claimed.includes(claim)) return {};
  const loot = cleanLoot(packet);
  if (claim) phase.claimed.push(claim);
  for (const [id, n] of Object.entries(loot) as [LootId, number][]) {
    add(save, run, id, n);
    phase.collected[id] = (phase.collected[id] ?? 0) + n;
    phase.atRisk[id] = (phase.atRisk[id] ?? 0) + n;
  }
  return loot;
}
export function losePhaseLoot(save: Save, run: Run): Loot {
  const phase = phaseState(run), lost: Loot = {};
  for (const [id, n] of Object.entries(phase.atRisk) as [LootId, number][]) {
    if (id === "coins") continue; // Óbolos já terminam junto da expedição.
    const amount = Math.min(balance(save, run, id), Math.ceil(n * 0.3));
    if (amount > 0) { add(save, run, id, -amount); lost[id] = amount; }
  }
  phase.atRisk = {};
  return lost;
}
export function spendPhaseLoot(run: Run, id: LootId, amount = 1): void {
  const phase = phaseState(run);
  if (Number.isFinite(amount) && amount > 0 && phase.atRisk[id])
    phase.atRisk[id] = Math.max(0, phase.atRisk[id]! - amount);
}
